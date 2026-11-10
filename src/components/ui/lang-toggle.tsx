"use client";
import { Languages } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";
import { spring } from "@/components/ui/motion";
import { useT } from "@/lib/i18n";
import { useLangStore } from "@/stores/lang-store";

/** English ⇄ اردو switch. Remembered per browser. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, t } = useT();
  const setLang = useLangStore((s) => s.setLang);
  const pillId = useId();
  return (
    <div
      role="group"
      aria-label={t("language")}
      dir="ltr"
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 ${className}`}
    >
      <Languages className="mx-1 size-3.5 text-muted-foreground" aria-hidden />
      {(
        [
          ["en", "EN"],
          ["ur", "اردو"],
        ] as const
      ).map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={lang === v}
          onClick={() => setLang(v)}
          className={`relative h-7 rounded-md px-2.5 text-[12px] font-medium transition-colors ${lang === v ? "text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          {lang === v && <motion.span layoutId={`lang-pill-${pillId}`} transition={spring} className="absolute inset-0 rounded-md bg-foreground" />}
          <span className={`relative font-sans leading-none ${v === "ur" ? "text-[13px]" : ""}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}
