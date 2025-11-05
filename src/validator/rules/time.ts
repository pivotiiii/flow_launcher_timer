import { Rule } from '../types.js';
import { pad2 } from '../normalize.js';

function toInt(s: string): number { return parseInt(s, 10); }

export class NoonMidnightRule implements Rule {
  name = 'noon-midnight';
  matches(input: string): boolean { return /^(noon|midnight)$/i.test(input.trim()); }
  parse(input: string): string | null {
    const s = input.trim().toLowerCase();
    if (s === 'noon') return 'until 12 noon';
    if (s === 'midnight') return 'until 12 midnight';
    return null;
  }
}

export class UntilPrefixRule implements Rule {
  name = 'until-prefix';
  matches(input: string): boolean { return /^(until|u)\s+.+/i.test(input.trim()); }
  parse(input: string): string | null {
    const rem = input.trim().replace(/^(until|u)\s+/i, '');
    const normalized = normalizeTimeOfDay(rem);
    return normalized ? `until ${normalized}` : null;
  }
}

export class TimeOfDayRule implements Rule {
  name = 'time-of-day';
  matches(input: string): boolean {
    const s = input.trim();
    // Require either a colon or an explicit am/pm to avoid colliding with pure minute counts like "5"
    return /^(\d{1,2}([:\.]([0-5]\d)){1,2}\s*(am|pm)?|\d{1,2}\s*(am|pm))$/i.test(s);
  }
  parse(input: string): string | null {
    const norm = normalizeTimeOfDay(input.trim());
    return norm ? `until ${norm}` : null;
  }
}

export function normalizeTimeOfDay(s: string): string | null {
  const t = s.trim().toLowerCase();
  // 24h HH:MM
  let m = t.match(/^([01]?\d|2[0-3])[:\.]([0-5]\d)(?:[:\.]([0-5]\d))?$/);
  if (m) {
    const hh = toInt(m[1]);
    const mm = toInt(m[2]);
    const ss = m[3] ? toInt(m[3]) : undefined;
    return ss === undefined ? `${pad2(hh)}:${pad2(mm)}` : `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  }

  // 24h HHMM (no separator), e.g., 1410 -> 14:10. Only accept 3-4 digits to avoid ambiguity with pure minutes
  m = t.match(/^([01]?\d|2[0-3])([0-5]\d)$/);
  if (m) {
    const hh = toInt(m[1]);
    const mm = toInt(m[2]);
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  // H or H:MM with am/pm
  m = t.match(/^(\d{1,2})(?:(?:[:\.])([0-5]\d))?(?:(?:[:\.])([0-5]\d))?\s*(am|pm)$/);
  if (m) {
    const h = toInt(m[1]);
    const mm = m[2] ? toInt(m[2]) : 0;
    const ss = m[3] ? toInt(m[3]) : undefined;
    if (h < 1 || h > 12) return null;
    if (ss !== undefined) return `${h}:${pad2(mm)}:${pad2(ss)} ${m[4]}`;
    return mm === 0 ? `${h} ${m[4]}` : `${h}:${pad2(mm)} ${m[4]}`;
  }

  // HMMam/pm or HHMMam/pm without separator, e.g., 210pm -> 2:10 pm
  m = t.match(/^(\d{1,2})([0-5]\d)\s*(am|pm)$/);
  if (m) {
    const h = toInt(m[1]);
    const mm = toInt(m[2]);
    const ap = m[3];
    if (h < 1 || h > 12) return null;
    return `${h}:${pad2(mm)} ${ap}`;
  }

  // bare H or H:MM => default to HH:MM with :00
  m = t.match(/^(\d{1,2})(?::|\.([0-5]\d))?$/);
  if (m) {
    const h = toInt(m[1]);
    const mm = m[2] ? toInt(m[2]) : 0;
    if (h < 0 || h > 23) return null;
    return `${h}:${pad2(mm)}`;
  }

  return null;
}
