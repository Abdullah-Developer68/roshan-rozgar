export const TRADE_IDS = [
  "electrician",
  "plumber",
  "ac_technician",
  "carpenter",
  "mechanic",
  "painter",
  "mason",
  "welder",
] as const;

export type TradeId = (typeof TRADE_IDS)[number];

export type Trade = {
  id: TradeId;
  en: string;
  ur: string;
  /** Devanagari reading of the Urdu word, used only for text-to-speech fallback voices. */
  hi: string;
  emoji: string;
  /** Tailwind classes for the trade's colour chip. */
  chip: string;
  /** Typical visit/job price band in PKR, used as a prior when no job history exists. */
  priceBand: [number, number];
  /** Keywords (English, Roman Urdu, Urdu) for the non-AI fallback classifier. */
  keywords: string[];
};

export const TRADES: Record<TradeId, Trade> = {
  electrician: {
    id: "electrician",
    en: "Electrician",
    ur: "الیکٹریشن",
    hi: "बिजली वाला",
    emoji: "⚡",
    chip: "bg-yellow-100 text-yellow-900",
    priceBand: [500, 3000],
    keywords: [
      "electric", "electrician", "wiring", "wire", "switch", "socket", "fan", "light", "bulb",
      "ups", "inverter", "breaker", "short circuit", "spark", "meter", "bijli", "bijlee", "pankha",
      "batti", "current", "taar", "بجلی", "پنکھا", "پنکھے", "وائرنگ", "سوئچ", "یو پی ایس", "تار", "بلب", "الیکٹریشن",
    ],
  },
  plumber: {
    id: "plumber",
    en: "Plumber",
    ur: "پلمبر",
    hi: "प्लंबर",
    emoji: "🚰",
    chip: "bg-sky-100 text-sky-900",
    priceBand: [500, 4000],
    keywords: [
      "plumb", "pipe", "leak", "tap", "faucet", "drain", "blocked", "toilet", "flush", "geyser",
      "water tank", "motor", "pani", "nalka", "nali", "tanki", "leakage", "commode", "پانی", "نلکا",
      "پائپ", "لیک", "ٹینکی", "گیزر", "فلش", "نالی", "پلمبر",
    ],
  },
  ac_technician: {
    id: "ac_technician",
    en: "AC Technician",
    ur: "اے سی مکینک",
    hi: "ए सी मिस्त्री",
    emoji: "❄️",
    chip: "bg-cyan-100 text-cyan-900",
    priceBand: [1500, 6000],
    keywords: [
      "ac", "a.c", "air condition", "split", "inverter ac", "cooling", "gas", "compressor",
      "thanda", "thanda nahi", "fridge", "refrigerator", "اے سی", "ٹھنڈا", "گیس", "کمپریسر", "فریج",
    ],
  },
  carpenter: {
    id: "carpenter",
    en: "Carpenter",
    ur: "ترکھان",
    hi: "तरखान",
    emoji: "🪚",
    chip: "bg-amber-100 text-amber-900",
    priceBand: [800, 5000],
    keywords: [
      "carpenter", "wood", "door", "lock", "hinge", "cupboard", "wardrobe", "drawer", "furniture",
      "bed", "table", "chair", "darwaza", "almari", "lakri", "tarkhan", "mistri", "دروازہ", "الماری",
      "لکڑی", "فرنیچر", "تالا", "ترکھان", "کنڈی",
    ],
  },
  mechanic: {
    id: "mechanic",
    en: "Mechanic",
    ur: "مکینک",
    hi: "मिस्त्री",
    emoji: "🔧",
    chip: "bg-zinc-200 text-zinc-900",
    priceBand: [500, 5000],
    keywords: [
      "car", "bike", "motorcycle", "engine", "battery", "tyre", "tire", "puncture", "brake",
      "oil change", "start nahi", "gaari", "gari", "gaddi", "mechanic", "گاڑی", "موٹر سائیکل",
      "بائیک", "انجن", "بیٹری", "ٹائر", "پنکچر", "مکینک",
    ],
  },
  painter: {
    id: "painter",
    en: "Painter",
    ur: "پینٹر",
    hi: "पेंटर",
    emoji: "🎨",
    chip: "bg-pink-100 text-pink-900",
    priceBand: [1500, 15000],
    keywords: [
      "paint", "painter", "wall", "colour", "color", "polish", "seepage", "deewar", "rang", "rung",
      "رنگ", "پینٹ", "دیوار", "پالش", "سیلن",
    ],
  },
  mason: {
    id: "mason",
    en: "Mason",
    ur: "راج مستری",
    hi: "राज मिस्त्री",
    emoji: "🧱",
    chip: "bg-orange-100 text-orange-900",
    priceBand: [1500, 8000],
    keywords: [
      "mason", "brick", "cement", "plaster", "tile", "tiles", "marble", "crack", "floor",
      "construction", "raj", "mistri", "eent", "سیمنٹ", "اینٹ", "پلستر", "ٹائل", "فرش", "دراڑ", "مستری",
    ],
  },
  welder: {
    id: "welder",
    en: "Welder",
    ur: "ویلڈر",
    hi: "वेल्डर",
    emoji: "🔥",
    chip: "bg-red-100 text-red-900",
    priceBand: [800, 6000],
    keywords: [
      "weld", "welder", "grill", "gate", "iron", "steel", "railing", "jangla", "lohay", "loha",
      "ویلڈنگ", "گرل", "گیٹ", "لوہا", "جنگلا",
    ],
  },
};

export const TRADE_LIST = TRADE_IDS.map((id) => TRADES[id]);

export function isTradeId(v: unknown): v is TradeId {
  return typeof v === "string" && (TRADE_IDS as readonly string[]).includes(v);
}

/** Deterministic keyword classifier used when the AI call is unavailable. */
export function classifyTradeByKeywords(text: string): { trade: TradeId | null; hits: number } {
  const t = ` ${text.toLowerCase()} `;
  let best: TradeId | null = null;
  let bestHits = 0;
  for (const trade of TRADE_LIST) {
    let hits = 0;
    for (const k of trade.keywords) {
      const isAscii = /^[\x00-\x7f]+$/.test(k);
      if (isAscii) {
        const re = new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
        if (re.test(t)) hits++;
      } else if (t.includes(k)) {
        hits++;
      }
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = trade.id;
    }
  }
  return { trade: best, hits: bestHits };
}
