"use client";
import { Languages } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLangStore } from "@/stores/lang-store";

/** English ⇄ اردو switch. Remembered per browser. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, t } = useT();
  const setLang = useLangStore((s) => s.setLang);
  return (
    <div
      role="group"
      aria-label={t("language")}
      dir="ltr"
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white p-0.5 ring-1 ring-line ${className}`}
    >
      <Languages className="mx-1 size-4 text-muted" aria-hidden />
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
          className={`h-8 rounded-full px-3 text-sm font-bold transition ${lang === v ? "bg-brand text-white" : "text-muted"}`}
        >
          <span className={v === "ur" ? "font-urdu leading-none" : "font-sans"}>{label}</span>
        </button>
      ))}
    </div>
  );
}
