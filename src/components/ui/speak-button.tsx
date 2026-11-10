"use client";
import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { speakEnglish, speakUrdu, stopSpeaking } from "@/lib/client/speech";
import { toast } from "@/stores/toast-store";
import { useT } from "@/lib/i18n";

/** Reads text aloud: the core accessibility affordance for workers who don't read comfortably. */
export function SpeakButton({
  ur,
  hi,
  en,
  className = "",
  size = "md",
  label,
}: {
  ur?: string | null;
  hi?: string;
  en?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const [on, setOn] = useState(false);
  const { isUr, t } = useT();
  // Speak the language the user chose; fall back to whichever text exists.
  const speakUr = !!ur && (isUr || !en);
  const dim = size === "lg" ? "size-14" : size === "sm" ? "size-8" : "size-11";
  const icon = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";
  if (!ur && !en) return null;
  return (
    <button
      type="button"
      aria-label={label ?? t("listen")}
      onClick={(e) => {
        e.stopPropagation();
        if (on) {
          stopSpeaking();
          setOn(false);
          return;
        }
        const ok = speakUr ? speakUrdu(ur!, hi, () => setOn(false)) : speakEnglish(en!, () => setOn(false));
        if (!ok) toast.info("This device has no voice for this language", "اس فون میں اردو آواز موجود نہیں");
        else setOn(true);
      }}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full ${on ? "bg-sun text-white" : "bg-sun-soft text-foreground"} ring-1 ring-border transition active:scale-95 ${className}`}
    >
      <Volume2 className={`${icon} ${on ? "animate-pulse" : ""}`} />
    </button>
  );
}

/** Speak a prompt once when a worker screen appears (after the user's first tap, browsers allow it). */
export function useAutoSpeak(phrase: { ur: string; hi?: string; en: string }, enabled = true) {
  const { isUr } = useT();
  const { ur, hi, en } = phrase;
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => (isUr ? speakUrdu(ur, hi) : speakEnglish(en)), 400);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [ur, hi, en, enabled, isUr]);
}
