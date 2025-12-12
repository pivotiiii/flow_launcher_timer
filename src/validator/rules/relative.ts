import { Rule } from '../types.js';
import { isDayOfWeek } from '../normalize.js';

export class TomorrowRule implements Rule {
  name = 'tomorrow';
  matches(input: string): boolean { return /^tomorrow$/i.test(input.trim()); }
  parse(input: string): string | null { return 'tomorrow'; }
}

export class DayOfWeekRelativeRule implements Rule {
  name = 'day-of-week-relative';
  matches(input: string): boolean {
    const s = input.trim();
    const m = s.match(/^([A-Za-z]+)\s+(next week|next|after next)$/i);
    if (!m) return false;
    return !!isDayOfWeek(m[1]);
  }
  parse(input: string): string | null {
    const m = input.trim().match(/^([A-Za-z]+)\s+(next week|next|after next)$/i);
    if (!m) return null;
    const day = isDayOfWeek(m[1]);
    if (!day) return null;
    const rel = m[2].toLowerCase();
    if (rel === 'next week') return `${day} next week`;
    if (rel === 'next') return `${day} next`;
    if (rel === 'after next') return `${day} after next`;
    return null;
  }
}

