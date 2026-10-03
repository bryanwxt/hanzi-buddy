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
  it('stopping straight away is not "quicker": a read must take at least half as long as last time', () => {
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.05, durationSec: 1 })).toBe(false);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.2, durationSec: 2 })).toBe(false); // louder, but not a real read
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.05, durationSec: 15 })).toBe(true);
  });
});
