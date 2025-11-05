const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function formatHMS(h?: number, m?: number, s?: number): string {
  const parts: string[] = [];
  if (h && h > 0) parts.push(pluralize(h, 'hour', 'hours'));
  if (m && m > 0) parts.push(pluralize(m, 'minute', 'minutes'));
  if (s && s > 0) parts.push(pluralize(s, 'second', 'seconds'));
  return parts.join(' ');
}

export function normalizeMonthName(name: string): string | null {
  const lower = name.toLowerCase();
  for (const month of MONTHS) {
    if (month.toLowerCase().startsWith(lower)) return month;
  }
  return null;
}

export function formatDMY(day: number, month: number, year?: number): string {
  const monthName = MONTHS[month - 1];
  return `${day} ${monthName}${year ? ` ${year}` : ''}`;
}

export function toFourDigitYear(y: number): number {
  if (y >= 100) return y;
  return y <= 69 ? 2000 + y : 1900 + y; // typical windowing
}

export function isDayOfWeek(word: string): string | null {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const w = word.toLowerCase();
  for (const d of days) {
    if (d.toLowerCase() === w || d.toLowerCase().startsWith(w)) return d;
  }
  return null;
}

export function pad2(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

