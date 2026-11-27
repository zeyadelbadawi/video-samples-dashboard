import { normalizeDigits } from './money';

/**
 * Normalizes Arabic text for searching so "أحمد" matches "احمد",
 * "فاطمة" matches "فاطمه", "مصطفى" matches "مصطفي", etc.
 */
export function normalizeForSearch(input: string): string {
  return normalizeDigits(input)
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '') // tashkeel
    .replace(/ـ/g, '') // tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escapes LIKE wildcards; use with `ESCAPE '\\'`. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}
