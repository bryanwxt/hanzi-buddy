import { describe, expect, it } from 'vitest';
import { earnsBonus } from './stars';
describe('bonus star', () => {
  it('for reading louder on average, or 10% quicker, than last time', () => {
    expect(earnsBonus(undefined, { level: 0.2, durationSec: 20 })).toBe(false);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.12, durationSec: 22 })).toBe(true);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.09, durationSec: 18 })).toBe(true);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.1, durationSec: 19 })).toBe(false);
    expect(earnsBonus({ level: undefined, durationSec: 20 }, { level: 0.1, durationSec: 20 })).toBe(false); // old recording without a level
  });
});
