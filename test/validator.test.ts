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
});

