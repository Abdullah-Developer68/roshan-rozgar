"use client";
import { Minus, Plus } from "lucide-react";

/** Big +/- price control: lets a worker set a price without typing. */
export function PriceStepper({
  value,
  onChange,
  step = 100,
  min = 100,
  dark = false,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  dark?: boolean;
}) {
  const btn = `flex size-14 items-center justify-center rounded-lg text-2xl font-bold active:scale-95 transition ${
    dark ? "bg-white/15 text-white" : "bg-brand/10 text-brand"
  }`;
  return (
    <div className="flex items-center justify-between gap-3" dir="ltr">
      <button type="button" aria-label="Decrease price" className={btn} onClick={() => onChange(Math.max(min, value - step))}>
        <Minus className="size-7" />
      </button>
      <div className="flex flex-col items-center">
        <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-muted-foreground"}`}>Rs</span>
        <span className="text-4xl font-black tabular-nums">{value.toLocaleString("en-PK")}</span>
      </div>
      <button type="button" aria-label="Increase price" className={btn} onClick={() => onChange(value + step)}>
        <Plus className="size-7" />
      </button>
    </div>
  );
}
