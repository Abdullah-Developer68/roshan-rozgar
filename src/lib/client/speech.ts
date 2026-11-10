"use client";
/**
 * Browser speech I/O.
 *  - Speech-to-text: Web Speech API (Chrome/Edge/Safari; supports ur-PK). Free and unlimited,
 *    which matters because our LLM quota is small.
 *  - Text-to-speech: speechSynthesis. Prefers an Urdu voice; if the device has none, falls back
 *    to a Hindi voice reading a Devanagari rendering (spoken Urdu and Hindi are mutually intelligible).
 */

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function createRecognizer(): Rec | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function sttSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function recorderSupported(): boolean {
  return typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
}

export function pickRecorderMime(): string {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const m of options) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

/* ----------------------------- TTS ----------------------------- */

let voicesCache: SpeechSynthesisVoice[] = [];
function voices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) voicesCache = v;
  return voicesCache;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => voices();
}

export function ttsVoiceFor(lang: "ur" | "hi" | "en"): SpeechSynthesisVoice | null {
  const list = voices();
  return list.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

// Approximate Urdu -> Devanagari letter map (no short vowels in Urdu script, so this is rough,
// but good enough for a Hindi voice to be understood when no Urdu voice exists).
const U2D: Record<string, string> = {
  "ا": "ा", "آ": "आ", "ب": "ब", "پ": "प", "ت": "त", "ٹ": "ट", "ث": "स", "ج": "ज", "چ": "च", "ح": "ह",
  "خ": "ख़", "د": "द", "ڈ": "ड", "ذ": "ज़", "ر": "र", "ڑ": "ड़", "ز": "ज़", "ژ": "झ", "س": "स", "ش": "श",
  "ص": "स", "ض": "ज़", "ط": "त", "ظ": "ज़", "ع": "अ", "غ": "ग़", "ف": "फ़", "ق": "क़", "ک": "क", "گ": "ग",
  "ل": "ल", "م": "म", "ن": "न", "ں": "ं", "و": "ो", "ہ": "ह", "ھ": "्ह", "ء": "", "ی": "ी", "ے": "े",
  "ئ": "ई", "ۓ": "ए", "ۃ": "ा", "۔": "।", "،": ",", "؟": "?",
};
export function urduToDevanagari(text: string): string {
  return text
    .split(/(\s+)/)
    .map((word) => {
      let out = "";
      [...word].forEach((ch, i) => {
        const m = U2D[ch];
        if (m === undefined) return void (out += ch);
        // Word-initial vowel carriers.
        if (i === 0 && ch === "ا") return void (out += "अ");
        if (i === 0 && ch === "و") return void (out += "व");
        if (i === 0 && ch === "ی") return void (out += "य");
        out += m;
      });
      return out;
    })
    .join("");
}

let speakingToken = 0;

/** Speak Urdu text. `hi` lets callers pass a hand-written Devanagari version for better audio. */
export function speakUrdu(ur: string, hi?: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const urVoice = ttsVoiceFor("ur");
  const hiVoice = urVoice ? null : ttsVoiceFor("hi");
  if (!urVoice && !hiVoice) return false;
  const u = new SpeechSynthesisUtterance(urVoice ? ur : hi ?? urduToDevanagari(ur));
  u.voice = urVoice ?? hiVoice;
  u.lang = (urVoice ?? hiVoice)!.lang;
  u.rate = 0.9;
  const token = ++speakingToken;
  u.onend = () => token === speakingToken && onEnd?.();
  u.onerror = () => token === speakingToken && onEnd?.();
  synth.speak(u);
  return true;
}

export function speakEnglish(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = ttsVoiceFor("en");
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-US";
  const token = ++speakingToken;
  u.onend = () => token === speakingToken && onEnd?.();
  u.onerror = () => token === speakingToken && onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  speakingToken++;
}
