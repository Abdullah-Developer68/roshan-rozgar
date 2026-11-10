import { Star } from "lucide-react";

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${value >= i - 0.25 ? "fill-sun text-sun" : value >= i - 0.75 ? "fill-sun/50 text-sun" : "text-zinc-300"}`}
        />
      ))}
    </span>
  );
}
