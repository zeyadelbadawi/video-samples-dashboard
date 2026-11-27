/**
 * Dates are stored as local 'YYYY-MM-DD' strings so they sort and compare as text.
 * Weeks follow the Egyptian work week: Saturday → Friday.
 */

export type PeriodType = 'week' | 'month' | 'year';

export interface Period {
  type: PeriodType;
  from: string; // inclusive
  to: string; // inclusive
  label: string;
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toISODate(new Date());
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** Saturday on or before the given date. */
function startOfWeek(d: Date): Date {
  const diff = (d.getDay() + 1) % 7; // Sat=0, Sun=1, ... Fri=6
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -diff);
}

export function formatDate(s: string): string {
  const d = fromISODate(s);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(s: string): string {
  const d = fromISODate(s);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}

export function weekdayName(s: string): string {
  return WEEKDAYS_AR[fromISODate(s).getDay()];
}

/**
 * Period containing `ref`, shifted by `offset` periods (offset -1 = previous period).
 */
export function getPeriod(type: PeriodType, offset = 0, ref: Date = new Date()): Period {
  if (type === 'week') {
    const start = addDays(startOfWeek(ref), offset * 7);
    const end = addDays(start, 6);
    const from = toISODate(start);
    const to = toISODate(end);
    return { type, from, to, label: `أسبوع ${formatDateShort(from)} – ${formatDateShort(to)}` };
  }
  if (type === 'month') {
    const start = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return {
      type,
      from: toISODate(start),
      to: toISODate(end),
      label: `شهر ${MONTHS_AR[start.getMonth()]} ${start.getFullYear()}`,
    };
  }
  const year = ref.getFullYear() + offset;
  return { type, from: `${year}-01-01`, to: `${year}-12-31`, label: `سنة ${year}` };
}

export const PERIOD_LABELS: Record<PeriodType, string> = {
  week: 'أسبوعي',
  month: 'شهري',
  year: 'سنوي',
};
