import { describe, expect, it } from 'vitest';
import { comboMilestone } from './pet';

describe('pet', () => {
  it('celebrates combos at 3, 5, 10 and every 10 after', () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10, 11, 20, 30].map(comboMilestone)).toEqual([false, false, true, false, true, false, false, true, false, true, true]);
  });
});
