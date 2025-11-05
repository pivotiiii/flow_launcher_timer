import { Rule } from '../types.js';
import { formatHMS } from '../normalize.js';

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
  matches(input: string): boolean { return /^\d{1,3}:\d{1,2}(:\d{1,2})?$/.test(input.trim()); }
  parse(input: string): string | null {
    const parts = input.trim().split(':').map((p) => parseIntSafe(p));
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
    const tokenRegex = /(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g;
    return tokenRegex.test(s);
  }
  parse(input: string): string | null {
    const s = input.trim().toLowerCase();
    const tokenRegex = /(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g;
    let hh = 0, mm = 0, ss = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(s))) {
      const n = parseIntSafe(match[1]);
      const u = match[2];
      if (['h','hr','hrs','hour','hours'].includes(u)) hh += n;
      else if (['m','min','mins','minute','minutes'].includes(u)) mm += n;
      else ss += n;
    }
    return formatHMS(hh || undefined, mm || undefined, ss || undefined) || null;
  }
}
