"use client";
import { useSttModelStore } from "@/stores/stt-model-store";

/** Whisper size: base (~77 MB, default) or small (~250 MB, more accurate Urdu). */
const MODEL = process.env.NEXT_PUBLIC_WHISPER_MODEL ?? "onnx-community/whisper-base";

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as
      | { type: "progress"; progress: number; total: number }
      | { type: "ready" }
      | { type: "error"; error: string }
      | { type: "result"; id: number; text?: string; error?: string };
    const st = useSttModelStore.getState();
    if (m.type === "progress") st.set({ status: "loading", progress: Math.round(m.progress), totalMb: m.total ? Math.round(m.total / 1e6) : null });
    else if (m.type === "ready") st.set({ status: "ready", progress: 100, error: null });
    else if (m.type === "error") st.set({ status: "error", error: m.error });
    else if (m.type === "result") {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (!p) return;
      if (m.error) p.reject(new Error(m.error));
      else p.resolve(m.text ?? "");
    }
  };
  worker.onerror = (e) => {
    useSttModelStore.getState().set({ status: "error", error: e.message || "Speech model failed to start" });
    for (const p of pending.values()) p.reject(new Error("Speech worker crashed"));
    pending.clear();
    worker = null;
  };
  return worker;
}

/** Start downloading/compiling the model in the background (call when the user taps the mic). */
export function preloadWhisper() {
  if (typeof window === "undefined") return;
  const st = useSttModelStore.getState();
  if (st.status === "loading" || st.status === "ready") return;
  st.set({ status: "loading", progress: 0, error: null });
  getWorker().postMessage({ type: "load", model: MODEL });
}

export function transcribeOnDevice(audio: Float32Array, lang: "ur-PK" | "en-US"): Promise<string> {
  const id = nextId++;
  const w = getWorker();
  if (useSttModelStore.getState().status === "idle") useSttModelStore.getState().set({ status: "loading", progress: 0 });
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ type: "transcribe", id, model: MODEL, audio, language: lang === "ur-PK" ? "urdu" : "english" }, [audio.buffer]);
  });
}
