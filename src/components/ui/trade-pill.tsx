import { TRADES, type TradeId } from "@/lib/trades";

export function TradePill({ trade, urdu = false }: { trade: TradeId; urdu?: boolean }) {
  const t = TRADES[trade];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.chip}`}>
      <span aria-hidden>{t.emoji}</span>
      {urdu ? <span className="urdu text-sm leading-none" lang="ur">{t.ur}</span> : t.en}
    </span>
  );
}
