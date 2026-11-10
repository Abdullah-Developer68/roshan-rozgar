"use client";
import { useT } from "@/lib/i18n";
import { TRADES, type TradeId } from "@/lib/trades";
import { TradeIcon } from "@/components/ui/icons";

export function TradePill({ trade }: { trade: TradeId }) {
  const { pick } = useT();
  const tr = TRADES[trade];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tr.chip}`}>
      <TradeIcon trade={trade} className="size-3.5" />
      {pick(tr.en, tr.ur)}
    </span>
  );
}
