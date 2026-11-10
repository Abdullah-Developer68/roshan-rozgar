import { Sparkles, Wand2 } from "lucide-react";

/** Honest provenance label: was this produced by the AI model, or the rule-based fallback? */
export function AiBadge({ source, className = "" }: { source: string | null | undefined; className?: string }) {
  if (!source) return null;
  if (source === "ai")
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 ${className}`}>
        <Sparkles className="size-3" /> AI
      </span>
    );
  if (source === "seed")
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 ${className}`} title="Generated from seeded demo reviews">
        Seeded
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ${className}`} title="AI unavailable — rule-based fallback">
      <Wand2 className="size-3" /> Basic (AI offline)
    </span>
  );
}
