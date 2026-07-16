import { describe, expect, it } from 'vitest';

import { compareNumber, compareText, uniqueSorted } from './collection';
import { formatInr } from './formatters';

describe('shared utility functions', () => {
  it('formats prices as Indian rupees without decimals', () => {
    expect(formatInr(2499)).toContain('2,499');
    expect(formatInr(0)).toContain('0');
  });

  it('returns unique sorted non-empty values', () => {
    expect(uniqueSorted(['Tech', '', 'Home', 'Tech'])).toEqual(['Home', 'Tech']);
  });

  it('compares optional text and numbers safely', () => {
    expect(compareText('A', 'B')).toBeLessThan(0);
    expect(compareText(undefined, 'A')).toBeLessThan(0);
    expect(compareNumber(10, 5)).toBe(5);
    expect(compareNumber(undefined, 5)).toBe(-5);
  });
});
