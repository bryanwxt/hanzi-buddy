import { describe, expect, it } from 'vitest';
import { radicalMeaning } from './radicals';

describe('power radicals', () => {
  it('has a meaning for 金 so the power intro is not "金 = 金"', () => {
    expect(radicalMeaning('金')?.en).toBe('metal');
  });
});
