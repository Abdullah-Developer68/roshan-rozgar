/**
 * Spoken-number parsing for Urdu, Roman Urdu and English, e.g.
 * "پندرہ سو" -> 1500, "dedh hazar" -> 1500, "do hazaar paanch sau" -> 2500, "1,200" -> 1200.
 * Used by the non-AI fallback parsers.
 */

const URDU_DIGITS: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

const UNITS: Record<string, number> = {
  // Urdu script
  ایک: 1, دو: 2, تین: 3, چار: 4, پانچ: 5, چھ: 6, چھے: 6, سات: 7, آٹھ: 8, نو: 9, دس: 10,
  گیارہ: 11, بارہ: 12, تیرہ: 13, چودہ: 14, پندرہ: 15, سولہ: 16, سترہ: 17, اٹھارہ: 18, انیس: 19,
  بیس: 20, اکیس: 21, بائیس: 22, پچیس: 25, تیس: 30, پینتیس: 35, چالیس: 40, پچاس: 50, ساٹھ: 60,
  ستر: 70, اسی: 80, نوے: 90, ڈیڑھ: 1.5, ڈھائی: 2.5, آدھا: 0.5,
  // Roman Urdu
  ek: 1, aik: 1, do: 2, teen: 3, char: 4, chaar: 4, panch: 5, paanch: 5, chay: 6, chhe: 6,
  saat: 7, aath: 8, aat: 8, nau: 9, das: 10, gyarah: 11, gyara: 11, barah: 12, bara: 12,
  terah: 13, tera: 13, chaudah: 14, choda: 14, pandrah: 15, pandra: 15, solah: 16, sola: 16, satrah: 17,
  athara: 18, atharah: 18, unees: 19, unnees: 19, bees: 20, pachees: 25, pachis: 25, tees: 30,
  chalees: 40, chalis: 40, pachas: 50, pachaas: 50, saath: 60, dedh: 1.5, derh: 1.5, dhai: 2.5, dhaai: 2.5,
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, half: 0.5,
};

const MULTIPLIERS: Record<string, number> = {
  سو: 100, ہزار: 1000, sau: 100, so: 100, hundred: 100, hazar: 1000, hazaar: 1000, hajar: 1000, thousand: 1000, k: 1000,
};

function normalise(text: string): string {
  return text
    .replace(/[۰-۹٠-٩]/g, (d) => URDU_DIGITS[d] ?? d)
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/(\d)\s*k\b/gi, "$1 k")
    .toLowerCase();
}

export type FoundNumber = { value: number; index: number; end: number };

/** Find all numbers (digits or spoken words) in a text, with their character positions. */
export function findNumbers(text: string): FoundNumber[] {
  const src = normalise(text);
  const tokens = [...src.matchAll(/[\p{L}\p{M}]+|\d+(?:\.\d+)?/gu)];
  const out: FoundNumber[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i][0];
    const isNum = /^\d/.test(tok) || tok in UNITS;
    if (!isNum) {
      i++;
      continue;
    }
    const start = tokens[i].index ?? 0;
    let total = 0;
    let current = /^\d/.test(tok) ? parseFloat(tok) : UNITS[tok];
    let j = i + 1;
    let end = start + tok.length;
    while (j < tokens.length) {
      const t = tokens[j][0];
      if (t in MULTIPLIERS) {
        const m = MULTIPLIERS[t];
        current = (current || 1) * m;
        if (m >= 1000) {
          total += current;
          current = 0;
        }
      } else if ((/^\d/.test(t) || t in UNITS) && current === 0 && total > 0) {
        current = /^\d/.test(t) ? parseFloat(t) : UNITS[t];
      } else if (t === "aur" || t === "اور" || t === "and") {
        // "do hazar aur paanch sau"
      } else {
        break;
      }
      end = (tokens[j].index ?? 0) + t.length;
      j++;
    }
    out.push({ value: Math.round(total + current), index: start, end });
    i = j;
  }
  return out;
}

const MONEY_HINT = /(rs\.?|rupay|rupees?|rupaye|روپے|روپیہ|روپ|fee|charge|kharcha|فیس|چارج|قیمت|pkr|price|dam|دام)/i;
const YEARS_HINT = /(saal|sal|years?|yrs?|سال|برس)/i;

/** Best guess at a rupee amount mentioned in a sentence. */
export function extractMoney(text: string): number | null {
  const nums = findNumbers(text).filter((n) => n.value >= 50 && n.value <= 500_000);
  if (!nums.length) return null;
  const src = normalise(text);
  const near = nums.find((n) => MONEY_HINT.test(src.slice(Math.max(0, n.index - 25), n.end + 25)));
  return (near ?? nums[nums.length - 1]).value;
}

/** Best guess at "N years of experience". */
export function extractYears(text: string): number | null {
  const src = normalise(text);
  const nums = findNumbers(text).filter((n) => n.value >= 1 && n.value <= 60);
  const near = nums.find((n) => YEARS_HINT.test(src.slice(n.end, n.end + 20)));
  return near ? near.value : null;
}
