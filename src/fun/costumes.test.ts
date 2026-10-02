import { describe, expect, it } from 'vitest';
import { addDays, localDateKey } from '../lib/date';
import { DEFAULT_KID } from '../types';
import { canOpenChest, costumeById, COSTUMES, ONESIES, openChest, OUTFITS, visibleAccessory } from './costumes';
import { ACCESSORIES } from './pet';

describe('costumes', () => {
  it('has 12 onesies and 8 outfits with Chinese names', () => {
    expect(ONESIES).toHaveLength(12);
    expect(OUTFITS).toHaveLength(8);
    expect(costumeById('tiger')).toMatchObject({ zh: '虎', py: 'hǔ', kind: 'onesie' });
    expect(costumeById('nope')).toBeUndefined();
  });
  it("first chest is the child's zodiac onesie (dragon by default), once", () => {
    const a = openChest(DEFAULT_KID, '2026-10-02', 'tiger');
    expect(a.result).toEqual({ kind: 'costume', id: 'tiger' });
    expect(a.kid.ownedCostumes).toEqual(['tiger']);
    expect(openChest(DEFAULT_KID, '2026-10-02', null).result).toEqual({ kind: 'costume', id: 'dragon' });
    const b = openChest(a.kid, '2026-10-03', 'rabbit');
    expect(b.result).not.toEqual({ kind: 'costume', id: 'rabbit' });
    expect(canOpenChest(b.kid, '2026-10-03')).toBe(false);
  });
  it('dragon-era installs with accessories still get the zodiac first', () => {
    const old = { ...DEFAULT_KID, ownedAccessories: ['👑', '🎩'], lastChestDate: '2026-09-30' };
    expect(openChest(old, '2026-10-02', 'pig').result).toEqual({ kind: 'costume', id: 'pig' });
  });
  it('never repeats; stars when everything is owned', () => {
    let kid = { ...DEFAULT_KID };
    const seen = new Set<string>();
    for (let d = 0; d < COSTUMES.length + ACCESSORIES.length; d++) {
      const day = localDateKey(addDays(new Date(2026, 10, 1), d));
      const { kid: next, result } = openChest(kid, day, 'dog');
      const key = result.kind === 'costume' ? result.id : result.kind === 'accessory' ? result.item : 'stars';
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      kid = next;
    }
    expect(openChest(kid, '2026-12-25', 'dog').result).toEqual({ kind: 'stars', amount: 3 });
  });
  it('a onesie hides the accessory', () => {
    expect(visibleAccessory({ ...DEFAULT_KID, wearing: '👑', outfit: 'tiger' })).toBeNull();
    expect(visibleAccessory({ ...DEFAULT_KID, wearing: '👑', outfit: 'chef' })).toBe('👑');
    expect(visibleAccessory({ ...DEFAULT_KID, wearing: '👑', outfit: 'bogus' })).toBe('👑');
  });
});
