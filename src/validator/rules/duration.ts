import { Rule } from '../types.js';
import { formatDuration, formatHMS } from '../normalize.js';

function parseIntSafe(s: string): number { return parseInt(s, 10); }

// e.g. 5 (minutes)
export class PureNumberMinutesRule implements Rule {
  name = 'pure-number-minutes';
  matches(input: string): boolean { return /^\d+$/.test(input.trim()); }
  parse(input: string): string | null {
    const m = parseIntSafe(input.trim());
    return formatHMS(undefined, m, undefined) || null;
  }
}

// e.g. 5:30 => 5 minutes 30 seconds; 7:30:00 => 7 hours 30 minutes
export class ColonDurationRule implements Rule {
  name = 'colon-duration';
  matches(input: string): boolean { return /^\d{1,3}[:\.]\d{1,2}([:\.]\d{1,2})?$/.test(input.trim()); }
  parse(input: string): string | null {
    const parts = input.trim().replaceAll('.', ':').split(':').map((p) => parseIntSafe(p));
    if (parts.length === 2) {
      const [mm, ss] = parts;
      return formatHMS(undefined, mm, ss) || null;
    }
    if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      return formatHMS(hh, mm, ss) || null;
    }
    return null;
  }
}

// e.g. 5min, 7 hours 30 minutes, 1h 5m 2s
export class UnitDurationRule implements Rule {
  name = 'unit-duration';
  matches(input: string): boolean {
    const s = input.trim().toLowerCase();
    // ensure at least one number+unit present and string is composed of such tokens
    const tokenRegex = /(\d+(?:\.\d+)?)\s*(y|yr|yrs|year|years|mo|month|months|w|wk|wks|week|weeks|d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g;
    return tokenRegex.test(s);
  }
  parse(input: string): string | null {
    const s = input.trim().toLowerCase();
    const tokenRegex = /(\d+(?:\.\d+)?)\s*(y|yr|yrs|year|years|mo|month|months|w|wk|wks|week|weeks|d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g;
    let years = 0, months = 0, weeks = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(s))) {
      const numStr = match[1];
      const n = parseFloat(numStr);
      const u = match[2];
      if (['y','yr','yrs','year','years'].includes(u)) {
        if (Number.isInteger(n)) years += n;
        else months += Math.round((n - Math.floor(n)) * 12) + Math.floor(n) * 12; // convert fractional years to months
      } else if (['mo','month','months'].includes(u)) {
        if (Number.isInteger(n)) months += n;
        else days += Math.round((n - Math.floor(n)) * 30) + Math.floor(n) * 30; // rough convert fractional months to days
      } else if (['w','wk','wks','week','weeks'].includes(u)) {
        if (Number.isInteger(n)) weeks += n;
        else days += Math.round(n * 7);
      } else if (['d','day','days'].includes(u)) {
        if (Number.isInteger(n)) days += n;
        else hours += Math.round(n * 24);
      } else if (['h','hr','hrs','hour','hours'].includes(u)) {
        if (Number.isInteger(n)) hours += n;
        else {
          const whole = Math.floor(n); const frac = n - whole;
          hours += whole; minutes += Math.round(frac * 60);
        }
      } else if (['m','min','mins','minute','minutes'].includes(u)) {
        if (Number.isInteger(n)) minutes += n;
        else {
          const whole = Math.floor(n); const frac = n - whole;
          minutes += whole; seconds += Math.round(frac * 60);
        }
      } else {
        seconds += Math.round(n);
      }
    }

    // prefer compact HMS formatting when only h/m/s present
    if (!years && !months && !weeks && !days) {
      const out = formatHMS(hours || undefined, minutes || undefined, seconds || undefined);
      if (out) return out;
    }
    const out = formatDuration({ years, months, weeks, days, hours, minutes, seconds });
    return out || null;
  }
}
