import { mulberry32, seedFromString, type Rng } from '../lib/random';
import type { KidState, PetColor } from '../types';

export const STAGE_THRESHOLDS = [0, 25, 75, 150, 300, 500] as const;

export const PET_COLORS: Record<PetColor, { zh: string }> = {
  green: { zh: '绿色' },
  blue: { zh: '蓝色' },
  purple: { zh: '紫色' },
  red: { zh: '红色' },
  gold: { zh: '金色' },
};

export const ACCESSORIES = ['🎩', '👑', '🕶️', '🎀', '🧢', '🎓', '⛑️', '🌸', '⭐', '🎈', '🍀', '🦋', '🌈', '🎧', '🧣', '🪁'];
export const CHEERS = ['好棒！', '你真努力！', '加油！', '太好了！', '真厉害！', '继续加油！'];
export const COMFORTS = ['没关系，再来！', '慢慢来！', '你可以的！'];
export const CHEST_BONUS_STARS = 3;

export type ChestResult = { kind: 'accessory'; item: string } | { kind: 'stars'; amount: number };

export function petStage(known: number): number {
  let stage = 0;
  STAGE_THRESHOLDS.forEach((t, i) => {
    if (known >= t) stage = i;
  });
  return stage;
}

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
