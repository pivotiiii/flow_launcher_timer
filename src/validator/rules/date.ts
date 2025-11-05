import { Rule } from '../types.js';
import { formatDMY, normalizeMonthName, toFourDigitYear } from '../normalize.js';

function toInt(s: string): number { return parseInt(s, 10); }

export class NumericDateRule implements Rule {
  name = 'numeric-date';
  matches(input: string): boolean { return /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(input.trim()); }
  parse(input: string): string | null {
    const [a, b, c] = input.trim().split('/');
    let d = toInt(a), m = toInt(b);
    // try to infer ordering: if first > 12 and second <= 12 -> DD/MM; if first <=12 and second >12 -> MM/DD; else default DD/MM
    if (d <= 12 && m > 12) { const tmp = d; d = m; m = tmp; }
    const y = toFourDigitYear(toInt(c));
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return formatDMY(d, m, y);
  }
}

export class LongDateRule implements Rule {
  name = 'long-date';
  matches(input: string): boolean {
    const s = input.trim();
    return /^(\d{1,2}\s+)?[A-Za-z]+\s+\d{1,2}(,\s*\d{2,4})?$/.test(s) || /^[A-Za-z]+\s+\d{1,2}(,\s*\d{2,4})?$/.test(s);
  }
  parse(input: string): string | null {
    const s = input.trim().replace(/,/g, '');
    // Try forms: Month D [Y] or D Month [Y]
    let mName: string | null = null; let d: number | null = null; let y: number | undefined;
    const parts = s.split(/\s+/);
    if (parts.length >= 2) {
      // Month D [Y]
      mName = normalizeMonthName(parts[0]);
      if (mName) {
        d = toInt(parts[1]);
        if (parts[2]) y = toFourDigitYear(toInt(parts[2]));
      } else {
        // D Month [Y]
        const possibleD = toInt(parts[0]);
        const maybeMonth = normalizeMonthName(parts[1] || '');
        if (!isNaN(possibleD) && maybeMonth) {
          d = possibleD; mName = maybeMonth;
          if (parts[2]) y = toFourDigitYear(toInt(parts[2]));
        }
      }
    }
    if (!mName || !d) return null;
    const monthIndex = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(mName) + 1;
    return formatDMY(d, monthIndex, y);
  }
}

export class CompactMonthDayRule implements Rule {
  name = 'compact-month-day';
  matches(input: string): boolean { return /^[A-Za-z]+\s*\d{1,2}$/.test(input.trim()); }
  parse(input: string): string | null {
    const s = input.trim().replace(/\s+/, '');
    const m = s.match(/^([A-Za-z]+)\s*(\d{1,2})$/);
    if (!m) return null;
    const monthName = normalizeMonthName(m[1]);
    const d = toInt(m[2]);
    if (!monthName || d < 1 || d > 31) return null;
    const monthIndex = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(monthName) + 1;
    return formatDMY(d, monthIndex, undefined);
  }
}

