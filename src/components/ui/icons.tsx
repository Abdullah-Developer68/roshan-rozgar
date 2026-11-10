import {
  AirVent,
  Banknote,
  BrickWall,
  Car,
  CircleCheck,
  Clock,
  Droplets,
  Flame,
  Hammer,
  Handshake,
  MessageCircle,
  PaintRoller,
  Sparkles,
  TriangleAlert,
  Turtle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { TradeId } from "@/lib/trades";

/** One line icon per trade — used in chips, cards, map pins and pickers. */
export const TRADE_ICONS: Record<TradeId, LucideIcon> = {
  electrician: Zap,
  plumber: Droplets,
  ac_technician: AirVent,
  carpenter: Hammer,
  mechanic: Car,
  painter: PaintRoller,
  mason: BrickWall,
  welder: Flame,
};

export function TradeIcon({ trade, className = "size-4", strokeWidth = 1.75 }: { trade: TradeId; className?: string; strokeWidth?: number }) {
  const Icon = TRADE_ICONS[trade];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** Icons for the structured review tags (ids live in lib/validation REVIEW_TAGS). */
export const REVIEW_TAG_ICONS: Record<string, LucideIcon> = {
  "On time": Clock,
  "Fair price": Banknote,
  "Fixed it first time": CircleCheck,
  "Clean work": Sparkles,
  Polite: Handshake,
  "Explained the problem": MessageCircle,
  Late: Turtle,
  Overcharged: TriangleAlert,
};
