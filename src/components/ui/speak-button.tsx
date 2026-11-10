"use client";
import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { speakEnglish, speakUrdu, stopSpeaking } from "@/lib/client/speech";
import { toast } from "@/stores/toast-store";

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
  const dim = size === "lg" ? "size-14" : size === "sm" ? "size-8" : "size-11";
  const icon = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";
  if (!ur && !en) return null;
  return (
    <button
      type="button"
      aria-label={label ?? "Listen"}
      onClick={(e) => {
        e.stopPropagation();
        if (on) {
          stopSpeaking();
          setOn(false);
          return;
        }
        const ok = ur ? speakUrdu(ur, hi, () => setOn(false)) : speakEnglish(en!);
        if (!ok) toast.info("This device has no Urdu voice installed", "اس فون میں اردو آواز موجود نہیں");
        else {
          setOn(true);
          if (!ur) setTimeout(() => setOn(false), 4000);
        }
      }}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full ${on ? "bg-sun text-white" : "bg-sun-soft text-amber-700"} ring-1 ring-amber-200 transition active:scale-95 ${className}`}
    >
      <Volume2 className={`${icon} ${on ? "animate-pulse" : ""}`} />
    </button>
  );
}

/** Speak a prompt once when a worker screen appears (after the user's first tap, browsers allow it). */
export function useAutoSpeak(ur: string, hi?: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => speakUrdu(ur, hi), 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [ur, hi, enabled]);
}
