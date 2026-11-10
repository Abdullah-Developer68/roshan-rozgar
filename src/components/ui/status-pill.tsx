import type { Availability } from "@/lib/types";

const MAP: Record<Availability, { en: string; ur: string; cls: string; dot: string }> = {
  available: { en: "Available now", ur: "ابھی فارغ", cls: "bg-emerald-50 text-emerald-800", dot: "bg-ok" },
  busy: { en: "On a job", ur: "کام پر", cls: "bg-orange-50 text-orange-800", dot: "bg-busy" },
  offline: { en: "Offline", ur: "آف لائن", cls: "bg-zinc-100 text-zinc-600", dot: "bg-off" },
};

export function StatusPill({ value, urdu = false }: { value: Availability; urdu?: boolean }) {
  const m = MAP[value];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      <span className={`size-2 rounded-full ${m.dot} ${value === "available" ? "animate-pulse" : ""}`} />
      {urdu ? <span className="urdu text-sm leading-none" lang="ur">{m.ur}</span> : m.en}
    </span>
  );
}
