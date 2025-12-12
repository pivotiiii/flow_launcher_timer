import { describe, it, expect } from 'vitest';
import { validateArgs } from '../src/validator/index.js';

describe('validateArgs (README examples)', () => {
  it('5 -> 5 minutes', () => {
    expect(validateArgs(['5'])).toEqual({ result: true, timeStrings: ['5 minutes'] });
  });

  it('5:30 -> 5 minutes 30 seconds', () => {
    expect(validateArgs(['5:30'])).toEqual({ result: true, timeStrings: ['5 minutes 30 seconds'] });
  });

  it('7:30:00 -> 7 hours 30 minutes', () => {
    expect(validateArgs(['7:30:00'])).toEqual({ result: true, timeStrings: ['7 hours 30 minutes'] });
  });

  it('5min -> 5 minutes', () => {
    expect(validateArgs(['5min'])).toEqual({ result: true, timeStrings: ['5 minutes'] });
  });

  it('7 hours 30 minutes -> 7 hours 30 minutes', () => {
    expect(validateArgs(['7 hours 30 minutes'])).toEqual({ result: true, timeStrings: ['7 hours 30 minutes'] });
  });

  it('01/01/25 -> 1 January 2025', () => {
    expect(validateArgs(['01/01/25'])).toEqual({ result: true, timeStrings: ['1 January 2025'] });
  });

  it('01/01/2025 -> 1 January 2025', () => {
    expect(validateArgs(['01/01/2025'])).toEqual({ result: true, timeStrings: ['1 January 2025'] });
  });

  it('January 1, 2025 -> 1 January 2025', () => {
    expect(validateArgs(['January 1, 2025'])).toEqual({ result: true, timeStrings: ['1 January 2025'] });
  });

  it('Jan1 -> 1 January', () => {
    expect(validateArgs(['Jan1'])).toEqual({ result: true, timeStrings: ['1 January'] });
  });

  it('2 pm -> until 2 pm', () => {
    expect(validateArgs(['2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm'] });
  });

  it('until 5 -> until 5:00', () => {
    expect(validateArgs(['until 5'])).toEqual({ result: true, timeStrings: ['until 5:00'] });
  });

  it('noon -> until 12 noon', () => {
    expect(validateArgs(['noon'])).toEqual({ result: true, timeStrings: ['until 12 noon'] });
  });

  it('midnight -> until 12 midnight', () => {
    expect(validateArgs(['midnight'])).toEqual({ result: true, timeStrings: ['until 12 midnight'] });
  });

  it('Friday -> Friday', () => {
    expect(validateArgs(['Friday'])).toEqual({ result: true, timeStrings: ['Friday'] });
  });

  it('--help -> valid empty', () => {
    expect(validateArgs(['--help'])).toEqual({ result: true, timeStrings: [] });
  });

  it('no args -> valid empty', () => {
    expect(validateArgs([])).toEqual({ result: true, timeStrings: [] });
  });

  it('invalid mixed string -> invalid', () => {
    expect(validateArgs(['5:30 pizza']).result).toBe(false);
  });

  it('--title integration: --title pizza "5:30"', () => {
    expect(validateArgs(['--title', 'pizza', '5:30'])).toEqual({ result: true, timeStrings: ['5 minutes 30 seconds'] });
  });

  // Abbreviated 'u' and undelimited time inputs should normalize to the same moment
  function minutesOfDay(s: string): number | null {
    const str = s.trim().toLowerCase();
    const m = str.match(/^until\s+(.+)$/);
    const t = m ? m[1].trim() : str;
    // 24h
    let mm = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (mm) {
      return parseInt(mm[1], 10) * 60 + parseInt(mm[2], 10);
    }
    // 12h
    mm = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (mm) {
      let h = parseInt(mm[1], 10) % 12;
      if (mm[3] === 'pm') h += 12;
      const m2 = mm[2] ? parseInt(mm[2], 10) : 0;
      return h * 60 + m2;
    }
    return null;
  }

  it('aliases and undelimited times map to the same time-of-day', () => {
    const cases = [
      ['u 1410'],
      ['u 210pm'],
      ['u 14:10'],
      ['until 14:10'],
      ['until 1410'],
      ['until 210pm'],
    ];
    const expected = 14 * 60 + 10;
    for (const args of cases) {
      const res = validateArgs(args as unknown as string[]);
      expect(res.result).toBe(true);
      expect(res.timeStrings.length).toBe(1);
      const mod = minutesOfDay(res.timeStrings[0]);
      expect(mod).toBe(expected);
    }
  });

  // Extended tests from README (official site examples)
  it('minutes: 1 -> 1 minute', () => {
    expect(validateArgs(['1'])).toEqual({ result: true, timeStrings: ['1 minute'] });
  });

  it('units long form', () => {
    expect(validateArgs(['30 seconds'])).toEqual({ result: true, timeStrings: ['30 seconds'] });
    expect(validateArgs(['5 minutes'])).toEqual({ result: true, timeStrings: ['5 minutes'] });
    expect(validateArgs(['7 hours'])).toEqual({ result: true, timeStrings: ['7 hours'] });
    expect(validateArgs(['3 days'])).toEqual({ result: true, timeStrings: ['3 days'] });
    expect(validateArgs(['25 weeks'])).toEqual({ result: true, timeStrings: ['25 weeks'] });
    expect(validateArgs(['6 months'])).toEqual({ result: true, timeStrings: ['6 months'] });
    expect(validateArgs(['2 years'])).toEqual({ result: true, timeStrings: ['2 years'] });
  });

  it('units short form', () => {
    expect(validateArgs(['30s'])).toEqual({ result: true, timeStrings: ['30 seconds'] });
    expect(validateArgs(['5m'])).toEqual({ result: true, timeStrings: ['5 minutes'] });
    expect(validateArgs(['7h'])).toEqual({ result: true, timeStrings: ['7 hours'] });
    expect(validateArgs(['3d'])).toEqual({ result: true, timeStrings: ['3 days'] });
    expect(validateArgs(['25w'])).toEqual({ result: true, timeStrings: ['25 weeks'] });
    expect(validateArgs(['6mo'])).toEqual({ result: true, timeStrings: ['6 months'] });
    expect(validateArgs(['2y'])).toEqual({ result: true, timeStrings: ['2 years'] });
  });

  it('combining units and compact tokens', () => {
    expect(validateArgs(['5 minutes 30 seconds'])).toEqual({ result: true, timeStrings: ['5 minutes 30 seconds'] });
    expect(validateArgs(['5m30s'])).toEqual({ result: true, timeStrings: ['5 minutes 30 seconds'] });
    expect(validateArgs(['7 hours 15 minutes'])).toEqual({ result: true, timeStrings: ['7 hours 15 minutes'] });
    expect(validateArgs(['7h15m'])).toEqual({ result: true, timeStrings: ['7 hours 15 minutes'] });
  });

  it('decimal notation', () => {
    expect(validateArgs(['5.5 minutes'])).toEqual({ result: true, timeStrings: ['5 minutes 30 seconds'] });
    expect(validateArgs(['1.5 hours'])).toEqual({ result: true, timeStrings: ['1 hour 30 minutes'] });
    expect(validateArgs(['0.5 years'])).toEqual({ result: true, timeStrings: ['6 months'] });
  });

  it('short form duration with dot separator', () => {
    expect(validateArgs(['5.30'])).toEqual({ result: true, timeStrings: ['5 minutes 30 seconds'] });
    expect(validateArgs(['7.15.00'])).toEqual({ result: true, timeStrings: ['7 hours 15 minutes'] });
  });

  it('until time of day (am/pm with optional seconds and dot separator)', () => {
    expect(validateArgs(['2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm'] });
    expect(validateArgs(['2:30 pm'])).toEqual({ result: true, timeStrings: ['until 2:30 pm'] });
    expect(validateArgs(['2:30:15 pm'])).toEqual({ result: true, timeStrings: ['until 2:30:15 pm'] });
    expect(validateArgs(['2.30 pm'])).toEqual({ result: true, timeStrings: ['until 2:30 pm'] });
    expect(validateArgs(['2.30.15 pm'])).toEqual({ result: true, timeStrings: ['until 2:30:15 pm'] });
  });

  it('until date formats', () => {
    expect(validateArgs(['January 1'])).toEqual({ result: true, timeStrings: ['1 January'] });
    expect(validateArgs(['1 January'])).toEqual({ result: true, timeStrings: ['1 January'] });
    expect(validateArgs(['January 1, 2019'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });
    expect(validateArgs(['1 January, 2019'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });

    expect(validateArgs(['Jan 1'])).toEqual({ result: true, timeStrings: ['1 January'] });
    expect(validateArgs(['1 Jan'])).toEqual({ result: true, timeStrings: ['1 January'] });
    expect(validateArgs(['Jan 1, 2019'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });
    expect(validateArgs(['1 Jan, 2019'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });

    expect(validateArgs(['1/1'])).toEqual({ result: true, timeStrings: ['1 January'] });
    expect(validateArgs(['01/01'])).toEqual({ result: true, timeStrings: ['1 January'] });
    expect(validateArgs(['1/1/19'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });
    expect(validateArgs(['01/01/19'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });
    expect(validateArgs(['1/1/2019'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });
    expect(validateArgs(['01/01/2019'])).toEqual({ result: true, timeStrings: ['1 January 2019'] });
  });

  it('until weekday long and short forms', () => {
    expect(validateArgs(['Monday'])).toEqual({ result: true, timeStrings: ['Monday'] });
    expect(validateArgs(['Wednesday'])).toEqual({ result: true, timeStrings: ['Wednesday'] });
    expect(validateArgs(['Saturday'])).toEqual({ result: true, timeStrings: ['Saturday'] });
    expect(validateArgs(['Mon'])).toEqual({ result: true, timeStrings: ['Monday'] });
    expect(validateArgs(['Wed'])).toEqual({ result: true, timeStrings: ['Wednesday'] });
    expect(validateArgs(['Sat'])).toEqual({ result: true, timeStrings: ['Saturday'] });
  });

  it('weekday relative', () => {
    expect(validateArgs(['Wednesday next week'])).toEqual({ result: true, timeStrings: ['Wednesday next week'] });
    expect(validateArgs(['Wednesday next'])).toEqual({ result: true, timeStrings: ['Wednesday next'] });
    expect(validateArgs(['Wednesday after next'])).toEqual({ result: true, timeStrings: ['Wednesday after next'] });
    expect(validateArgs(['Thu next week'])).toEqual({ result: true, timeStrings: ['Thursday next week'] });
    expect(validateArgs(['Thu next'])).toEqual({ result: true, timeStrings: ['Thursday next'] });
    expect(validateArgs(['Thu after next'])).toEqual({ result: true, timeStrings: ['Thursday after next'] });
  });

  it('tomorrow', () => {
    expect(validateArgs(['tomorrow'])).toEqual({ result: true, timeStrings: ['tomorrow'] });
  });

  it('combining date/weekday/tomorrow with time of day (with/without connectors)', () => {
    expect(validateArgs(['January 1, 2019 at 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['2 pm on January 1, 2019'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['01/01/2019 at 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['2 pm on 01/01/2019'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['Wednesday at 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm on Wednesday'] });
    expect(validateArgs(['2 pm on Wednesday'])).toEqual({ result: true, timeStrings: ['until 2 pm on Wednesday'] });
    expect(validateArgs(['tomorrow at 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm tomorrow'] });
    expect(validateArgs(['2 pm tomorrow'])).toEqual({ result: true, timeStrings: ['until 2 pm tomorrow'] });

    expect(validateArgs(['January 1, 2019 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['2 pm January 1, 2019'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['01/01/2019 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['2 pm 01/01/2019'])).toEqual({ result: true, timeStrings: ['until 2 pm on 1 January 2019'] });
    expect(validateArgs(['Wednesday 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm on Wednesday'] });
    expect(validateArgs(['2 pm Wednesday'])).toEqual({ result: true, timeStrings: ['until 2 pm on Wednesday'] });
    expect(validateArgs(['tomorrow 2 pm'])).toEqual({ result: true, timeStrings: ['until 2 pm tomorrow'] });
    expect(validateArgs(['2 pm tomorrow'])).toEqual({ result: true, timeStrings: ['until 2 pm tomorrow'] });
  });
});
