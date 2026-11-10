export type Area = {
  id: string;
  en: string;
  ur: string;
  city: "Islamabad" | "Rawalpindi";
  lat: number;
  lng: number;
  /** Extra spellings people say out loud (Roman Urdu / Urdu) for matching. */
  aliases: string[];
};

// Approximate sector/neighbourhood centroids. Good enough for distance ranking in a demo.
export const AREAS: Area[] = [
  { id: "isb-f6", en: "F-6", ur: "ایف سکس", city: "Islamabad", lat: 33.7294, lng: 73.076, aliases: ["f6", "f 6", "f-6", "f six", "ایف 6", "ایف چھ"] },
  { id: "isb-f7", en: "F-7", ur: "ایف سیون", city: "Islamabad", lat: 33.7215, lng: 73.052, aliases: ["f7", "f 7", "f-7", "f seven", "ایف 7", "ایف سات", "jinnah super"] },
  { id: "isb-f8", en: "F-8", ur: "ایف ایٹ", city: "Islamabad", lat: 33.71, lng: 73.037, aliases: ["f8", "f 8", "f-8", "f eight", "ایف 8", "ایف آٹھ"] },
  { id: "isb-f10", en: "F-10", ur: "ایف ٹین", city: "Islamabad", lat: 33.695, lng: 73.013, aliases: ["f10", "f 10", "f-10", "f ten", "ایف 10", "ایف دس"] },
  { id: "isb-f11", en: "F-11", ur: "ایف الیون", city: "Islamabad", lat: 33.684, lng: 72.988, aliases: ["f11", "f 11", "f-11", "f eleven", "ایف 11", "ایف گیارہ"] },
  { id: "isb-g6", en: "G-6", ur: "جی سکس", city: "Islamabad", lat: 33.713, lng: 73.088, aliases: ["g6", "g 6", "g-6", "g six", "جی 6", "جی چھ", "aabpara", "آبپارہ"] },
  { id: "isb-g7", en: "G-7", ur: "جی سیون", city: "Islamabad", lat: 33.703, lng: 73.07, aliases: ["g7", "g 7", "g-7", "g seven", "جی 7", "جی سات", "sitara market"] },
  { id: "isb-g8", en: "G-8", ur: "جی ایٹ", city: "Islamabad", lat: 33.693, lng: 73.052, aliases: ["g8", "g 8", "g-8", "g eight", "جی 8", "جی آٹھ"] },
  { id: "isb-g9", en: "G-9", ur: "جی نائن", city: "Islamabad", lat: 33.688, lng: 73.033, aliases: ["g9", "g 9", "g-9", "g nine", "جی 9", "جی نو", "karachi company", "کراچی کمپنی"] },
  { id: "isb-g10", en: "G-10", ur: "جی ٹین", city: "Islamabad", lat: 33.677, lng: 73.015, aliases: ["g10", "g 10", "g-10", "g ten", "جی 10", "جی دس"] },
  { id: "isb-g11", en: "G-11", ur: "جی الیون", city: "Islamabad", lat: 33.668, lng: 72.997, aliases: ["g11", "g 11", "g-11", "g eleven", "جی 11", "جی گیارہ"] },
  { id: "isb-g13", en: "G-13", ur: "جی تھرٹین", city: "Islamabad", lat: 33.651, lng: 72.963, aliases: ["g13", "g 13", "g-13", "g thirteen", "جی 13", "جی تیرہ"] },
  { id: "isb-i8", en: "I-8", ur: "آئی ایٹ", city: "Islamabad", lat: 33.667, lng: 73.075, aliases: ["i8", "i 8", "i-8", "i eight", "آئی 8", "آئی آٹھ"] },
  { id: "isb-i9", en: "I-9", ur: "آئی نائن", city: "Islamabad", lat: 33.656, lng: 73.055, aliases: ["i9", "i 9", "i-9", "i nine", "آئی 9", "آئی نو"] },
  { id: "isb-i10", en: "I-10", ur: "آئی ٹین", city: "Islamabad", lat: 33.646, lng: 73.038, aliases: ["i10", "i 10", "i-10", "i ten", "آئی 10", "آئی دس"] },
  { id: "isb-e11", en: "E-11", ur: "ای الیون", city: "Islamabad", lat: 33.699, lng: 72.975, aliases: ["e11", "e 11", "e-11", "e eleven", "ای 11", "ای گیارہ"] },
  { id: "isb-bahria", en: "Bahria Town", ur: "بحریہ ٹاؤن", city: "Islamabad", lat: 33.5235, lng: 73.099, aliases: ["bahria", "behria", "بحریہ"] },
  { id: "isb-dha2", en: "DHA Phase 2", ur: "ڈی ایچ اے فیز 2", city: "Islamabad", lat: 33.529, lng: 73.158, aliases: ["dha", "defence", "ڈی ایچ اے", "ڈیفنس"] },
  { id: "isb-pwd", en: "PWD", ur: "پی ڈبلیو ڈی", city: "Islamabad", lat: 33.57, lng: 73.145, aliases: ["pwd", "p w d", "پی ڈبلیو ڈی"] },
  { id: "rwp-saddar", en: "Saddar", ur: "صدر", city: "Rawalpindi", lat: 33.596, lng: 73.048, aliases: ["saddar", "sadar", "صدر"] },
  { id: "rwp-satellite", en: "Satellite Town", ur: "سیٹلائٹ ٹاؤن", city: "Rawalpindi", lat: 33.638, lng: 73.07, aliases: ["satellite", "setelite", "سیٹلائٹ"] },
  { id: "rwp-6th-road", en: "6th Road", ur: "سکستھ روڈ", city: "Rawalpindi", lat: 33.64, lng: 73.077, aliases: ["6th road", "sixth road", "chhata road", "سکستھ روڈ", "چھٹا روڈ"] },
  { id: "rwp-committee", en: "Committee Chowk", ur: "کمیٹی چوک", city: "Rawalpindi", lat: 33.615, lng: 73.065, aliases: ["committee", "kameti", "کمیٹی"] },
  { id: "rwp-raja-bazar", en: "Raja Bazar", ur: "راجہ بازار", city: "Rawalpindi", lat: 33.623, lng: 73.064, aliases: ["raja bazar", "raja bazaar", "راجہ بازار"] },
  { id: "rwp-chaklala", en: "Chaklala Scheme 3", ur: "چکلالہ اسکیم 3", city: "Rawalpindi", lat: 33.597, lng: 73.087, aliases: ["chaklala", "چکلالہ"] },
  { id: "rwp-westridge", en: "Westridge", ur: "ویسٹرج", city: "Rawalpindi", lat: 33.605, lng: 73.02, aliases: ["westridge", "west ridge", "ویسٹرج"] },
  { id: "rwp-peshawar-road", en: "Peshawar Road", ur: "پشاور روڈ", city: "Rawalpindi", lat: 33.606, lng: 73.005, aliases: ["peshawar road", "پشاور روڈ"] },
];

export const AREA_BY_ID: Record<string, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a]));

export const DEFAULT_AREA_ID = "isb-g9";

export function getArea(id: string | null | undefined): Area {
  return (id && AREA_BY_ID[id]) || AREA_BY_ID[DEFAULT_AREA_ID];
}

/** Match a free-form spoken place name to a known area. */
export function matchArea(text: string | null | undefined): Area | null {
  if (!text) return null;
  const t = ` ${text.toLowerCase().replace(/[–—_]/g, "-")} `;
  // Prefer longest alias matches so "g-10" wins over "g-1"-like partials.
  let best: { area: Area; len: number } | null = null;
  for (const a of AREAS) {
    for (const alias of [a.en.toLowerCase(), a.ur, ...a.aliases]) {
      const isAscii = /^[\x00-\x7f]+$/.test(alias);
      const hit = isAscii
        ? new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "i").test(t)
        : t.includes(alias);
      if (hit && (!best || alias.length > best.len)) best = { area: a, len: alias.length };
    }
  }
  return best?.area ?? null;
}

export function nearestArea(lat: number, lng: number): Area {
  let best = AREAS[0];
  let bestD = Infinity;
  for (const a of AREAS) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}
