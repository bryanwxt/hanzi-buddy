import { mulberry32, seedFromString, type Rng } from '../lib/random';
import type { KidState } from '../types';

export const ACCESSORIES = ['🎩', '👑', '🕶️', '🎀', '🧢', '🎓', '⛑️', '🌸', '⭐', '🎈', '🍀', '🦋', '🌈', '🎧', '🧣', '🪁'];
export const CHEERS = ['好棒！', '你真努力！', '加油！', '太好了！', '真厉害！', '继续加油！'];
export const COMFORTS = ['没关系，再来！', '慢慢来！', '你可以的！'];
export const CHEST_BONUS_STARS = 3;

export type ChestResult = { kind: 'accessory'; item: string } | { kind: 'stars'; amount: number };

/** Call only after today's daily (not free-play) session is complete. */
export function canOpenChest(kid: KidState, today: string): boolean {
  return kid.lastChestDate !== today;
}

export function openChest(kid: KidState, today: string): { kid: KidState; result: ChestResult } {
  const missing = ACCESSORIES.filter((a) => !kid.ownedAccessories.includes(a));
  if (!missing.length) {
    return {
      kid: { ...kid, bonusStars: kid.bonusStars + CHEST_BONUS_STARS, lastChestDate: today },
      result: { kind: 'stars', amount: CHEST_BONUS_STARS },
    };
  }
  const item = missing[Math.floor(mulberry32(seedFromString(today))() * missing.length)]!;
  return {
    kid: { ...kid, ownedAccessories: [...kid.ownedAccessories, item], lastChestDate: today },
    result: { kind: 'accessory', item },
  };
}

export function comboMilestone(combo: number): boolean {
  return combo === 3 || combo === 5 || (combo >= 10 && combo % 10 === 0);
}

export function pickLine(lines: readonly string[], rng: Rng): string {
  return lines[Math.floor(rng() * lines.length)]!;
}
