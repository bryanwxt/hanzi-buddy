import type { PetColor } from '../../types';

export interface Circle {
  cy: number;
  r: number;
}

export interface Body {
  cy: number;
  rx: number;
  ry: number;
}

export interface DragonParts {
  egg: boolean;
  shell: boolean;
  wingScale: number;
  horns: boolean;
  tail: boolean;
  aura: boolean;
  head: Circle | null;
  body: Body | null;
}

/** Geometry per growth stage, in a 200×200 viewBox. */
export function stageParts(stage: number): DragonParts {
  const s = Math.max(0, Math.min(5, Math.round(stage)));
  const none = { egg: false, shell: false, wingScale: 0, horns: false, tail: false, aura: false };
  if (s === 0) return { ...none, egg: true, head: null, body: null };
  if (s === 1) return { ...none, shell: true, head: { cy: 108, r: 46 }, body: null };
  if (s === 2) return { ...none, wingScale: 1, head: { cy: 86, r: 44 }, body: { cy: 150, rx: 42, ry: 36 } };
  if (s === 3) return { ...none, wingScale: 1, horns: true, tail: true, head: { cy: 80, r: 42 }, body: { cy: 148, rx: 46, ry: 40 } };
  return { ...none, wingScale: 1.45, horns: true, tail: true, aura: s === 5, head: { cy: 74, r: 40 }, body: { cy: 146, rx: 50, ry: 44 } };
}

/** Where an accessory emoji sits: its baseline just inside the top of the egg or head. */
export function accessoryAnchor(parts: DragonParts): { x: number; y: number; size: number } {
  if (!parts.head) return { x: 100, y: 66, size: 40 };
  const size = Math.round(parts.head.r * 0.95);
  return { x: 100, y: parts.head.cy - parts.head.r + Math.round(size * 0.3), size };
}

export interface DragonPalette {
  body: string;
  belly: string;
  wing: string;
  cheek: string;
  dark: string;
}

export const DRAGON_PALETTES: Record<PetColor, DragonPalette> = {
  green: { body: '#5bc98c', belly: '#e8f8d8', wing: '#3fa36c', cheek: '#ff9fb0', dark: '#2e6b4a' },
  blue: { body: '#5aa9f0', belly: '#e3f1ff', wing: '#3b82d6', cheek: '#ffa3b5', dark: '#234e7e' },
  purple: { body: '#a98bf0', belly: '#f1ebff', wing: '#7e5bd6', cheek: '#ffa3c8', dark: '#4a3488' },
  red: { body: '#f07a6a', belly: '#ffe9e2', wing: '#d65745', cheek: '#ffc2a8', dark: '#7e2e24' },
  gold: { body: '#f6c343', belly: '#fff6d6', wing: '#e0a21e', cheek: '#ff9f7a', dark: '#7a5a10' },
};

export function paletteVars(color: PetColor): Record<string, string> {
  const p = DRAGON_PALETTES[color];
  return { '--d-body': p.body, '--d-belly': p.belly, '--d-wing': p.wing, '--d-cheek': p.cheek, '--d-dark': p.dark };
}

export const BLINK_MIN_MS = 2500;
export const BLINK_MAX_MS = 5000;

export function nextBlinkDelay(rng: () => number): number {
  return BLINK_MIN_MS + rng() * (BLINK_MAX_MS - BLINK_MIN_MS);
}
