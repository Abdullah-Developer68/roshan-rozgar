"use client";
import { create } from "zustand";
import { api, uploadMedia } from "@/lib/client/api";
import { createRecognizer, pickRecorderMime, recorderSupported, sttSupported, stopSpeaking } from "@/lib/client/speech";

export type VoiceResult = {
  text: string;
  blob: Blob | null;
  /** Set when the audio was already uploaded (server-side transcription path). */
  mediaId: string | null;
  transcribedBy: "browser" | "ai" | null;
};

type StartOpts = {
  ownerId: string;
  lang: string;
  /** Also capture the audio (voice notes, voice intro). */
  record: boolean;
  onDone: (r: VoiceResult) => void;
};

type VoiceState = {
  /** Preferred recognition language: Urdu (also understands Urdu-English mix) or English. */
  sttLang: "ur-PK" | "en-US";
  setSttLang: (l: "ur-PK" | "en-US") => void;
  ownerId: string | null;
  status: "idle" | "listening" | "processing";
  interim: string;
  finalText: string;
  error: string | null;
  startedAt: number | null;
  start: (opts: StartOpts) => Promise<void>;
  stop: () => void;
  cancel: () => void;
};

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

function cleanupStream() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  sttLang: "ur-PK",
  setSttLang: (sttLang) => set({ sttLang }),
  ownerId: null,
  status: "idle",
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
    set({ ownerId: opts.ownerId, status: "listening", interim: "", finalText: "", error: null, startedAt: Date.now() });

    const canStt = sttSupported();
    const canRecord = recorderSupported();
    if (!canStt && !canRecord) {
      set({ status: "idle", ownerId: null, error: "Voice input is not supported in this browser" });
      return;
    }

    // Audio capture: always when STT is missing (we'll transcribe on the server), or when asked.
    if (canRecord && (opts.record || !canStt)) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
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
        set({ error: "Microphone permission denied" });
        if (!canStt) {
          set({ status: "idle", ownerId: null });
          return;
        }
      }
    } else {
      recorderStopped = Promise.resolve(null);
    }

    if (canStt) {
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
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finals += `${r[0].transcript} `;
            else interim += r[0].transcript;
          }
          set({ finalText: finals.trim(), interim });
        };
        rec.onerror = (e) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            keepAlive = false;
            set({ error: "Microphone permission denied" });
          } else if (e.error === "audio-capture" || e.error === "network") {
            // Typically the mic is shared with the recorder (Android) or STT is offline.
            // We still have the audio and can transcribe it on the server.
            keepAlive = false;
          }
        };
        rec.onend = () => {
          // Chrome ends recognition after a pause even in continuous mode: restart while the user is still talking.
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
          resolveEnd();
        }
      }
    } else {
      recEnded = Promise.resolve();
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

    void (async () => {
      const [, blob] = await Promise.all([
        Promise.race([recEnded, new Promise((r) => setTimeout(r, 2500))]),
        recorderStopped,
      ]);
      let text = `${finals} ${get().interim}`.trim();
      let mediaId: string | null = null;
      let transcribedBy: VoiceResult["transcribedBy"] = text ? "browser" : null;

      // No browser transcript (unsupported or failed) -> server-side speech-to-text.
      if (!text && blob && blob.size > 2000) {
        try {
          const up = await uploadMedia(blob, `voice.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
          mediaId = up.id;
          const t = await api<{ transcript: string }>("/api/ai/transcribe", { method: "POST", json: { mediaId } });
          text = t.transcript;
          transcribedBy = "ai";
        } catch (e) {
          set({ error: e instanceof Error ? e.message : "Could not understand the recording" });
        }
      }
      rec = null;
      recorder = null;
      session = null;
      set({ status: "idle", ownerId: null, finalText: text, interim: "", startedAt: null });
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
    set({ status: "idle", ownerId: null, interim: "", startedAt: null });
  },
}));
