import { HourglassValidatorResult, Rule } from './types.js';
import { PureNumberMinutesRule, ColonDurationRule, UnitDurationRule } from './rules/duration.js';
import { NumericDateRule, LongDateRule, CompactMonthDayRule } from './rules/date.js';
import { DayOfWeekRule } from './rules/dow.js';
import { NoonMidnightRule, TimeOfDayRule, UntilPrefixRule } from './rules/time.js';

function buildRules(): Rule[] {
  // Order matters: first matching rule is used
  return [
    // No-op/help cases handled by driver
    new UntilPrefixRule(),
    new NoonMidnightRule(),
    // Duration-first to resolve ambiguity like "5:30" -> minutes:seconds, not time-of-day
    new ColonDurationRule(),
    new UnitDurationRule(),
    new PureNumberMinutesRule(),
    // Time-of-day after durations so bare "5" isn't treated as a clock time
    new TimeOfDayRule(),
    new NumericDateRule(),
    new LongDateRule(),
    new CompactMonthDayRule(),
    new DayOfWeekRule(),
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
