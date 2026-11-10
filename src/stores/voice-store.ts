"use client";
import { create } from "zustand";
import { api, uploadMedia } from "@/lib/client/api";
import { createRecognizer, pickRecorderMime, recorderSupported, sttSupported, stopSpeaking } from "@/lib/client/speech";
import { decodeTo16kMono, encodeWav, rms } from "@/lib/client/audio";
import { preloadWhisper, transcribeOnDevice } from "@/lib/client/whisper";

export type VoiceResult = {
  text: string;
  blob: Blob | null;
  /** Set when the audio was already uploaded (server-side transcription path). */
  mediaId: string | null;
  transcribedBy: "browser" | "on-device" | "server" | null;
};

type StartOpts = {
  ownerId: string;
  lang: string;
  /** Kept for API compatibility: audio is now always captured so it can be transcribed on-device. */
  record: boolean;
  onDone: (r: VoiceResult) => void;
};

type VoiceState = {
  /** Preferred recognition language: Urdu (also understands Urdu-English mix) or English. */
  sttLang: "ur-PK" | "en-US";
  setSttLang: (l: "ur-PK" | "en-US") => void;
  ownerId: string | null;
  status: "idle" | "listening" | "processing";
  /** What "processing" is doing right now, for the UI. */
  phase: "transcribing-device" | "transcribing-server" | null;
  interim: string;
  finalText: string;
  error: string | null;
  startedAt: number | null;
  start: (opts: StartOpts) => Promise<void>;
  stop: () => void;
  cancel: () => void;
};

/*
 * Pipeline:
 *  1. Always record the microphone (MediaRecorder).
 *  2. Browser speech recognition (Web Speech API) runs alongside for live captions — but many
 *     Chromium builds (Brave, Chromium, Edge/Opera on Linux…) expose the API and then return
 *     nothing or a "network" error. We detect that and remember it for the session.
 *  3. If the browser produced no text: transcribe the recording ON-DEVICE with Whisper (Web Worker).
 *  4. Last resort: upload a WAV and transcribe on the server (needs OpenRouter audio credit).
 */

const BROKEN_KEY = "rr-browser-stt-broken";
function browserSttBroken(): boolean {
  try {
    return sessionStorage.getItem(BROKEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markBrowserSttBroken() {
  try {
    sessionStorage.setItem(BROKEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

// Imperative handles live outside React state.
let rec: ReturnType<typeof createRecognizer> = null;
let recorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: Blob[] = [];
let keepAlive = false;
let session: StartOpts | null = null;
let recEnded: Promise<void> = Promise.resolve();
let recorderStopped: Promise<Blob | null> = Promise.resolve(null);
let finals = "";
let gotAnyResult = false;

function cleanupStream() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

async function transcribeRecording(blob: Blob, lang: "ur-PK" | "en-US"): Promise<{ text: string; by: VoiceResult["transcribedBy"]; mediaId: string | null }> {
  const set = useVoiceStore.setState;
  let pcm: Float32Array | null = null;
  try {
    pcm = await decodeTo16kMono(blob);
  } catch {
    pcm = null;
  }
  if (pcm && (pcm.length < 16000 * 0.4 || rms(pcm) < 0.004)) {
    throw new Error("Didn't hear anything — please speak closer to the phone");
  }
  // On-device Whisper.
  if (pcm) {
    try {
      set({ phase: "transcribing-device" });
      const text = await transcribeOnDevice(pcm.slice(), lang);
      if (text) return { text, by: "on-device", mediaId: null };
    } catch (e) {
      console.warn("[stt] on-device transcription failed", e);
    }
  }
  // Server fallback (WAV is accepted by the audio model; requires OpenRouter credit).
  set({ phase: "transcribing-server" });
  const upload = pcm ? encodeWav(pcm) : blob;
  const up = await uploadMedia(upload, pcm ? "voice.wav" : "voice.webm");
  const t = await api<{ transcript: string }>("/api/ai/transcribe", { method: "POST", json: { mediaId: up.id } });
  return { text: t.transcript, by: "server", mediaId: null };
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  sttLang: "ur-PK",
  setSttLang: (sttLang) => set({ sttLang }),
  ownerId: null,
  status: "idle",
  phase: null,
  interim: "",
  finalText: "",
  error: null,
  startedAt: null,

  start: async (opts) => {
    if (get().status !== "idle") get().cancel();
    stopSpeaking();
    session = opts;
    finals = "";
    chunks = [];
    gotAnyResult = false;
    set({ ownerId: opts.ownerId, status: "listening", phase: null, interim: "", finalText: "", error: null, startedAt: Date.now() });

    const useBrowserStt = sttSupported() && !browserSttBroken();
    // Start fetching the on-device model now so it's ready (or closer) when the user stops talking.
    if (!useBrowserStt) preloadWhisper();

    if (!recorderSupported() && !useBrowserStt) {
      set({ status: "idle", ownerId: null, error: "Voice input is not supported in this browser" });
      return;
    }

    // 1) Always capture audio.
    if (recorderSupported()) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
        const mimeType = pickRecorderMime();
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorderStopped = new Promise((resolve) => {
          recorder!.onstop = () => {
            cleanupStream();
            resolve(chunks.length ? new Blob(chunks, { type: recorder?.mimeType || "audio/webm" }) : null);
          };
        });
        recorder.start(250);
      } catch {
        set({ status: "idle", ownerId: null, error: "Microphone permission denied" });
        session = null;
        return;
      }
    } else {
      recorderStopped = Promise.resolve(null);
    }

    // 2) Live captions from the browser, when it works.
    recEnded = Promise.resolve();
    if (useBrowserStt) {
      rec = createRecognizer();
      if (rec) {
        rec.lang = opts.lang;
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        keepAlive = true;
        let resolveEnd: () => void = () => {};
        recEnded = new Promise((r) => (resolveEnd = r));
        rec.onresult = (e) => {
          gotAnyResult = true;
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finals += `${r[0].transcript} `;
            else interim += r[0].transcript;
          }
          set({ finalText: finals.trim(), interim });
        };
        rec.onerror = (e) => {
          // These mean the engine itself is unusable here — use on-device Whisper from now on.
          if (["network", "service-not-allowed", "language-not-supported", "audio-capture", "not-allowed"].includes(e.error)) {
            keepAlive = false;
            if (e.error !== "not-allowed") markBrowserSttBroken();
            preloadWhisper();
          }
        };
        rec.onend = () => {
          // Chrome ends recognition after a pause even in continuous mode: restart while still recording.
          if (keepAlive && rec) {
            try {
              rec.start();
              return;
            } catch {
              /* fallthrough */
            }
          }
          resolveEnd();
        };
        try {
          rec.start();
        } catch {
          markBrowserSttBroken();
          preloadWhisper();
          resolveEnd();
        }
      }
    }
  },

  stop: () => {
    const s = session;
    if (!s || get().status !== "listening") return;
    set({ status: "processing" });
    keepAlive = false;
    try {
      rec?.stop();
    } catch {
      /* ignore */
    }
    if (recorder && recorder.state !== "inactive") recorder.stop();
    const usedBrowserStt = !!rec;

    void (async () => {
      const [, blob] = await Promise.all([
        Promise.race([recEnded, new Promise((r) => setTimeout(r, 2500))]),
        recorderStopped,
      ]);
      let text = `${finals} ${get().interim}`.trim();
      let mediaId: string | null = null;
      let transcribedBy: VoiceResult["transcribedBy"] = text ? "browser" : null;

      // The browser listened to a real recording but returned nothing: its engine doesn't work here.
      if (!text && usedBrowserStt && !gotAnyResult && blob && blob.size > 8000) markBrowserSttBroken();

      if (!text && blob) {
        try {
          const r = await transcribeRecording(blob, get().sttLang);
          text = r.text;
          transcribedBy = r.by;
          mediaId = r.mediaId;
        } catch (e) {
          set({ error: e instanceof Error ? e.message : "Could not understand the recording" });
        }
      }
      rec = null;
      recorder = null;
      session = null;
      set({ status: "idle", phase: null, ownerId: null, finalText: text, interim: "", startedAt: null });
      s.onDone({ text, blob, mediaId, transcribedBy });
    })();
  },

  cancel: () => {
    keepAlive = false;
    try {
      rec?.abort();
    } catch {
      /* ignore */
    }
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => cleanupStream();
      recorder.stop();
    }
    cleanupStream();
    rec = null;
    recorder = null;
    session = null;
    set({ status: "idle", phase: null, ownerId: null, interim: "", startedAt: null });
  },
}));
