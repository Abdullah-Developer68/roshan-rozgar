"use client";
import { useT } from "@/lib/i18n";
import { TRADES, type TradeId } from "@/lib/trades";

export function TradePill({ trade }: { trade: TradeId }) {
  const { pick } = useT();
  const tr = TRADES[trade];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tr.chip}`}>
      <span aria-hidden>{tr.emoji}</span>
      {pick(tr.en, tr.ur)}
    </span>
  );
}
