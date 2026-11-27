/**
 * All money is stored as integer piasters (قروش): 1 EGP = 100 piasters.
 * Never store or sum floats.
 */

const EASTERN_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => EASTERN_DIGITS[d] ?? d);
}

/**
 * Parses user input ("1,250.5", "١٢٥٠٫٥", "1250") into piasters.
 * Returns null for empty/invalid input or more than 2 decimals.
 */
export function parseAmount(input: string): number | null {
  const cleaned = normalizeDigits(input)
    .replace(/[٬,\s]/g, '') // thousands separators
    .replace(/[٫]/g, '.'); // Arabic decimal separator
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  const piasters = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(piasters)) return null;
  return piasters;
}

function groupThousands(n: string): string {
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 123456 -> "1,234.56" ; 100000 -> "1,000" */
export function formatAmount(piasters: number, opts: { signed?: boolean } = {}): string {
  const negative = piasters < 0;
  const abs = Math.abs(piasters);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const body = groupThousands(String(whole)) + (frac ? '.' + String(frac).padStart(2, '0') : '');
  if (negative) return '-' + body;
  if (opts.signed && piasters > 0) return '+' + body;
  return body;
}

export function formatMoney(piasters: number, opts: { signed?: boolean } = {}): string {
  return `${formatAmount(piasters, opts)} ج.م`;
}

/** Value to prefill an input with when editing. */
export function amountToInput(piasters: number): string {
  const abs = Math.abs(piasters);
  const frac = abs % 100;
  return String(Math.floor(abs / 100)) + (frac ? '.' + String(frac).padStart(2, '0') : '');
}
