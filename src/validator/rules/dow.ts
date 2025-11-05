import { Rule } from '../types.js';
import { isDayOfWeek } from '../normalize.js';

export class DayOfWeekRule implements Rule {
  name = 'day-of-week';
  matches(input: string): boolean { return !!isDayOfWeek(input.trim()); }
  parse(input: string): string | null {
    const d = isDayOfWeek(input.trim());
    return d ? d : null;
  }
}

