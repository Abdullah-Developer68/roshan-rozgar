/** Normalise Pakistani mobile numbers to E.164 (+923XXXXXXXXX). Returns null if invalid. */
export function normalizePkPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local: string | null = null;
  if (/^03\d{9}$/.test(digits)) local = digits.slice(1);
  else if (/^923\d{9}$/.test(digits)) local = digits.slice(2);
  else if (/^3\d{9}$/.test(digits)) local = digits;
  return local ? `+92${local}` : null;
}

export function isValidPkPhone(e164: string): boolean {
  return /^\+923\d{9}$/.test(e164);
}

/** +923001234567 -> 0300 1234567 */
export function displayPkPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const m = e164.match(/^\+92(3\d{2})(\d{7})$/);
  return m ? `0${m[1]} ${m[2]}` : e164;
}
