import { describe, expect, it } from 'vitest';
import { radicalMeaning } from './radicals';

describe('power radicals', () => {
  it('has a meaning for 金 so the power intro is not "金 = 金"', () => {
    expect(radicalMeaning('金')?.en).toBe('metal');
  });
});

describe('radical icons', () => {
  it('every radical meaning has an ink icon', async () => {
    const { RADICALS } = await import('./radicals');
    const { ICONS } = await import('../ui/icons/icons');
    for (const [r, m] of Object.entries(RADICALS)) expect(ICONS[(m as { icon: keyof typeof ICONS }).icon], r).toBeTruthy();
  });
});
