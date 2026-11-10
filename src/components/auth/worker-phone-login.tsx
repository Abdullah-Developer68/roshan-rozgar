"use client";
import { Check, Delete, MessageSquareText } from "lucide-react";
import { useEffect } from "react";
import { useLoginStore } from "@/stores/login-store";
import { SpeakButton, useAutoSpeak } from "@/components/ui/speak-button";
import { Spinner } from "@/components/ui/spinner";
import { SimulatedSms } from "@/components/auth/simulated-sms";
import { P } from "@/lib/phrases";

/** Numeric keypad sign-in for workers: digits only, no reading required. */
export function WorkerPhoneLogin() {
  const digits = useLoginStore((s) => s.digits);
  const step = useLoginStore((s) => s.step);
  const code = useLoginStore((s) => s.code);
  const busy = useLoginStore((s) => s.busy);
  const error = useLoginStore((s) => s.error);
  const pressDigit = useLoginStore((s) => s.pressDigit);
  const backspace = useLoginStore((s) => s.backspace);
  const sendCode = useLoginStore((s) => s.sendCode);
  const verify = useLoginStore((s) => s.verify);
  const reset = useLoginStore((s) => s.reset);

  useEffect(() => reset, [reset]);
  useAutoSpeak(step === "phone" ? P.welcome.ur : P.code.ur, step === "phone" ? P.welcome.hi : P.code.hi);

  const formatted = digits.replace(/^(\d{4})(\d{0,7}).*/, (_, a, b) => (b ? `${a} ${b}` : a));
  const ready = /^03\d{9}$/.test(digits);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-start justify-between gap-3" dir="rtl">
        <h1 className="urdu text-2xl font-bold" lang="ur">
          {step === "phone" ? "اپنا موبائل نمبر" : "کوڈ آ گیا"}
        </h1>
        <SpeakButton ur={step === "phone" ? P.welcome.ur : P.code.ur} hi={step === "phone" ? P.welcome.hi : P.code.hi} size="lg" />
      </div>

      {step === "phone" ? (
        <>
          <div className="flex h-20 items-center justify-center rounded-3xl bg-white text-4xl font-black tracking-wider tabular-nums shadow-sm ring-1 ring-line" dir="ltr">
            {formatted || <span className="text-zinc-300">03XX XXXXXXX</span>}
          </div>
          <div className="grid grid-cols-3 gap-3" dir="ltr">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} onClick={() => pressDigit(d)} className="h-16 rounded-2xl bg-white text-3xl font-bold shadow-sm ring-1 ring-line active:scale-95 active:bg-zinc-50">
                {d}
              </button>
            ))}
            <button onClick={backspace} aria-label="Delete" className="flex h-16 items-center justify-center rounded-2xl bg-zinc-100 active:scale-95">
              <Delete className="size-8" />
            </button>
            <button onClick={() => pressDigit("0")} className="h-16 rounded-2xl bg-white text-3xl font-bold shadow-sm ring-1 ring-line active:scale-95">
              0
            </button>
            <button
              onClick={() => void sendCode()}
              disabled={!ready || busy}
              aria-label="Send code"
              className="flex h-16 items-center justify-center rounded-2xl bg-ok text-white shadow active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              {busy ? <Spinner className="size-8" /> : <Check className="size-9" strokeWidth={3} />}
            </button>
          </div>
        </>
      ) : (
        <>
          <SimulatedSms />
          <div className="flex justify-center gap-2" dir="ltr">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="flex h-16 w-12 items-center justify-center rounded-2xl bg-white text-3xl font-black shadow-sm ring-1 ring-line">
                {code[i] ?? ""}
              </span>
            ))}
          </div>
          <button
            onClick={() => void verify()}
            disabled={code.length !== 6 || busy}
            className="flex h-20 items-center justify-center gap-3 rounded-3xl bg-ok text-white shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? <Spinner className="size-8" /> : <Check className="size-10" strokeWidth={3} />}
            <span className="urdu text-2xl font-bold" lang="ur">ٹھیک ہے</span>
          </button>
          <button onClick={reset} className="flex items-center justify-center gap-2 text-sm text-muted">
            <MessageSquareText className="size-4" /> <span className="urdu" lang="ur">نمبر بدلیں</span>
          </button>
        </>
      )}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-center text-sm text-red-800">{error}</p>}
    </div>
  );
}
