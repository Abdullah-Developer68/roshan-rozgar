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
        <img src={photoUrl} alt={name} className="size-full rounded-lg object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-lg bg-muted font-sans text-lg font-semibold tracking-tight text-foreground">
          {initials || "?"}
        </span>
      )}
      {trade && (
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-card text-sm shadow border border-border">
          {TRADES[trade].emoji}
        </span>
      )}
    </span>
  );
}
