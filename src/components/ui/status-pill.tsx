"use client";
import { useT, type MsgKey } from "@/lib/i18n";
import type { Availability } from "@/lib/types";

const MAP: Record<Availability, { key: MsgKey; cls: string; dot: string }> = {
  available: { key: "statusAvailable", cls: "bg-emerald-50 text-emerald-800", dot: "bg-ok" },
  busy: { key: "statusBusy", cls: "bg-orange-50 text-orange-800", dot: "bg-busy" },
  offline: { key: "statusOffline", cls: "bg-zinc-100 text-zinc-600", dot: "bg-off" },
};

export function StatusPill({ value }: { value: Availability }) {
  const { t } = useT();
  const m = MAP[value];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      <span className={`size-2 rounded-full ${m.dot} ${value === "available" ? "animate-pulse" : ""}`} />
      {t(m.key)}
    </span>
  );
}
