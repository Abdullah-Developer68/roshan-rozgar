"use client";
import { Sparkles, Wand2 } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Honest provenance label: was this produced by the AI model, or the rule-based fallback? */
export function AiBadge({ source, className = "" }: { source: string | null | undefined; className?: string }) {
  const { t } = useT();
  if (!source) return null;
  const base = `inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold font-sans leading-4 ${className}`;
  if (source === "ai")
    return (
      <span className={`${base} bg-violet-100 text-violet-800`} dir="ltr">
        <Sparkles className="size-3" /> AI
      </span>
    );
  if (source === "seed")
    return (
      <span className={`${base} bg-zinc-100 text-zinc-600`} title={t("aiSeedTitle")}>
        {t("aiSeed")}
      </span>
    );
  return (
    <span className={`${base} bg-amber-100 text-amber-800`} title={t("aiFallbackTitle")}>
      <Wand2 className="size-3" /> {t("aiFallback")}
    </span>
  );
}
