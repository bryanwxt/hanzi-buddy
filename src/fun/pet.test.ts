import { describe, expect, it } from 'vitest';
import { DEFAULT_KID } from '../types';
import { ACCESSORIES, canOpenChest, CHEST_BONUS_STARS, comboMilestone, openChest, petStage } from './pet';

describe('pet', () => {
  it('grows through stages at 25/75/150/300/500 known characters', () => {
    const counts = [0, 24, 25, 74, 75, 149, 150, 299, 300, 499, 500, 9999];
    expect(counts.map(petStage)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('opens one chest per day with a deterministic, unowned accessory', () => {
    const a = openChest(DEFAULT_KID, '2026-10-02');
    expect(openChest(DEFAULT_KID, '2026-10-02').result).toEqual(a.result);
    expect(a.result.kind).toBe('accessory');
    expect(a.kid.lastChestDate).toBe('2026-10-02');
    expect(canOpenChest(a.kid, '2026-10-02')).toBe(false);
    expect(canOpenChest(a.kid, '2026-10-03')).toBe(true);
  });

  it('never repeats an accessory, then gives bonus stars', () => {
    let kid = DEFAULT_KID;
    for (let d = 1; d <= ACCESSORIES.length; d++) kid = openChest(kid, `2026-11-${String(d).padStart(2, '0')}`).kid;
    expect(new Set(kid.ownedAccessories).size).toBe(ACCESSORIES.length);
    const extra = openChest(kid, '2026-12-01');
    expect(extra.result).toEqual({ kind: 'stars', amount: CHEST_BONUS_STARS });
    expect(extra.kid.bonusStars).toBe(CHEST_BONUS_STARS);
    expect(extra.kid.ownedAccessories).toHaveLength(ACCESSORIES.length);
  });

  it('celebrates combos at 3, 5, 10 and every 10 after', () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10, 11, 20, 30].map(comboMilestone)).toEqual([false, false, true, false, true, false, false, true, false, true, true]);
  });
});
