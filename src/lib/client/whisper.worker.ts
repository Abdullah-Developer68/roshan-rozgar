/// <reference lib="webworker" />
/**
 * On-device speech-to-text with OpenAI Whisper (ONNX, via transformers.js).
 * Runs in a Web Worker so the UI stays responsive; the model is downloaded once and
 * cached by the browser. No API key, no server round-trip, works in every modern browser.
 */
import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

type InMsg =
  | { type: "load"; model: string }
  | { type: "transcribe"; id: number; model: string; audio: Float32Array; language: string };

let loading: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function load(model: string) {
  if (!loading) {
    loading = pipeline("automatic-speech-recognition", model, {
      dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
      device: "wasm",
      progress_callback: (p) => {
        if (p.status === "progress_total") self.postMessage({ type: "progress", progress: p.progress, loaded: p.loaded, total: p.total });
      },
    }) as Promise<AutomaticSpeechRecognitionPipeline>;
    loading
      .then(() => self.postMessage({ type: "ready" }))
      .catch((e) => {
        loading = null;
        self.postMessage({ type: "error", error: e instanceof Error ? e.message : String(e) });
      });
  }
  return loading;
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  if (msg.type === "load") {
    void load(msg.model).catch(() => {});
    return;
  }
  try {
    const asr = await load(msg.model);
    const out = await asr(msg.audio, {
      language: msg.language,
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    const text = Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text;
    self.postMessage({ type: "result", id: msg.id, text: text.trim() });
  } catch (err) {
    self.postMessage({ type: "result", id: msg.id, error: err instanceof Error ? err.message : String(err) });
  }
};
