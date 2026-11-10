import { TRADES, type TradeId } from "@/lib/trades";

export function Avatar({
  name,
  photoUrl,
  trade,
  size = "size-14",
}: {
  name: string;
  photoUrl: string | null;
  trade?: TradeId;
  size?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`relative inline-flex shrink-0 ${size}`}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="size-full rounded-2xl object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
          {initials || "?"}
        </span>
      )}
      {trade && (
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white text-sm shadow ring-1 ring-black/5">
          {TRADES[trade].emoji}
        </span>
      )}
    </span>
  );
}
