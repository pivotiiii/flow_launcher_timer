import { HourglassValidatorResult, Rule } from './types.js';
import { PureNumberMinutesRule, ColonDurationRule, UnitDurationRule } from './rules/duration.js';
import { NumericDateRule, LongDateRule, CompactMonthDayRule } from './rules/date.js';
import { DayOfWeekRule } from './rules/dow.js';
import { NoonMidnightRule, TimeOfDayRule, UntilPrefixRule } from './rules/time.js';
import { DayOfWeekRelativeRule, TomorrowRule } from './rules/relative.js';

// Combined date + time parsing
function tryParseDate(expr: string): string | null {
  const dateRules: Rule[] = [new NumericDateRule(), new LongDateRule(), new CompactMonthDayRule(), new DayOfWeekRule(), new DayOfWeekRelativeRule(), new TomorrowRule()];
  for (const r of dateRules) {
    if (r.matches(expr)) return r.parse(expr);
  }
  return null;
}

function tryParseTime(expr: string): string | null {
  const timeRules: Rule[] = [new TimeOfDayRule()];
  for (const r of timeRules) {
    if (r.matches(expr)) return r.parse(expr)?.replace(/^until\s+/, '');
  }
  return null;
}

class CombinedDateTimeRule implements Rule {
  name = 'combined-date-time';
  matches(input: string): boolean {
    const s = input.trim();
    // quick checks to avoid overmatching durations
    return /(at|on)\s+/i.test(s) || /(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2})/i.test(s);
  }
  parse(input: string): string | null {
    const s = input.trim();
    // Patterns: [date] (at|on)? [time] OR [time] (at|on)? [date]
    const connectors = ['at', 'on'];
    // split into tokens to attempt both orders
    const parts = s.split(/\s+/);
    // try to find time chunk anywhere and date chunk anywhere
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j <= parts.length; j++) {
        const left = parts.slice(0, i).join(' ');
        const mid = parts.slice(i, j).join(' ');
        const right = parts.slice(j).join(' ');
        const a = left ? left + ' ' + mid : mid;
        const b = right;
        // try a=date, b=time (allow connectors)
        const aStr = a.replace(/\b(at|on)\b/i, '').trim();
        const bStr = b.replace(/\b(at|on)\b/i, '').trim();
        const date1 = tryParseDate(aStr);
        const time1 = tryParseTime(bStr);
        if (date1 && time1) {
          // tomorrow vs weekdays/dates wording
          if (/^tomorrow$/i.test(aStr)) return `until ${time1} tomorrow`;
          if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(aStr)) return `until ${time1} on ${date1}`;
          return `until ${time1} on ${date1}`;
        }
        // try a=time, b=date
        const time2 = tryParseTime(aStr);
        const date2 = tryParseDate(bStr);
        if (time2 && date2) {
          if (/^tomorrow$/i.test(bStr)) return `until ${time2} tomorrow`;
          if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(bStr)) return `until ${time2} on ${date2}`;
          return `until ${time2} on ${date2}`;
        }
      }
    }
    return null;
  }
}

function buildRules(): Rule[] {
  // Order matters: first matching rule is used
  return [
    // No-op/help cases handled by driver
    new UntilPrefixRule(),
    new NoonMidnightRule(),
    new CombinedDateTimeRule(),
    // Duration-first to resolve ambiguity like "5:30" -> minutes:seconds, not time-of-day
    new ColonDurationRule(),
    new UnitDurationRule(),
    new PureNumberMinutesRule(),
    // Time-of-day after durations so bare "5" isn't treated as a clock time
    new TimeOfDayRule(),
    new NumericDateRule(),
    new LongDateRule(),
    new CompactMonthDayRule(),
    new DayOfWeekRelativeRule(),
    new DayOfWeekRule(),
    new TomorrowRule(),
  ];
}

function stripTitleArgs(args: string[]): { expr: string; ok: boolean } {
  if (!args || args.length === 0) return { expr: '', ok: true };
  const parts: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title') { i++; continue; }
    parts.push(args[i]);
  }
  return { expr: parts.join(' ').trim(), ok: true };
}

export function validateArgs(args: string[]): HourglassValidatorResult {
  // Emulate exe behaviour: no args or help flags => valid with no timeStrings
  if (!args || args.length === 0) {
    return { result: true, timeStrings: [] };
  }
  if (args.length === 1 && /^(--help|\/\?)$/i.test(args[0])) {
    return { result: true, timeStrings: [] };
  }

  const { expr } = stripTitleArgs(args);
  if (expr.length === 0) {
    return { result: true, timeStrings: [] };
  }

  const rules = buildRules();
  for (const rule of rules) {
    if (rule.matches(expr)) {
      const normalized = rule.parse(expr);
      if (normalized) return { result: true, timeStrings: [normalized] };
    }
  }
  return { result: false, timeStrings: [] };
}

export default {
  validateArgs,
};
