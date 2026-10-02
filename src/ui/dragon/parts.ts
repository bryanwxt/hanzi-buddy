import type { PetColor } from '../../types';

/** The one-piece pear-shaped body: top and bottom y, and half-width, in a 200×200 viewBox. */
export interface Blob {
  top: number;
  bottom: number;
  hw: number;
}

export interface DragonParts {
  egg: boolean;
  shell: boolean;
  wingScale: number;
  horns: boolean;
  tail: boolean;
  aura: boolean;
  blob: Blob | null;
}

export function stageParts(stage: number): DragonParts {
  const s = Math.max(0, Math.min(5, Math.round(stage)));
  const none = { egg: false, shell: false, wingScale: 0, horns: false, tail: false, aura: false };
  if (s === 0) return { ...none, egg: true, blob: null };
  if (s === 1) return { ...none, shell: true, blob: { top: 68, bottom: 170, hw: 48 } };
  if (s === 2) return { ...none, wingScale: 1, blob: { top: 62, bottom: 182, hw: 50 } };
  if (s === 3) return { ...none, wingScale: 1, horns: true, tail: true, blob: { top: 54, bottom: 182, hw: 54 } };
  return { ...none, wingScale: 1.4, horns: true, tail: true, aura: s === 5, blob: { top: 44, bottom: 182, hw: 60 } };
}

/** Rounded at the top, widest low down, flat-ish bottom — head and body in one shape. */
export function blobPath({ top, bottom, hw }: Blob): string {
  const h = bottom - top;
  const side = top + h * 0.62;
  return [
    `M100 ${top}`,
    `C${100 + hw * 0.9} ${top} ${100 + hw} ${top + h * 0.42} ${100 + hw} ${side}`,
    `C${100 + hw * 0.98} ${bottom - h * 0.1} ${100 + hw * 0.55} ${bottom} 100 ${bottom}`,
    `C${100 - hw * 0.55} ${bottom} ${100 - hw * 0.98} ${bottom - h * 0.1} ${100 - hw} ${side}`,
    `C${100 - hw} ${top + h * 0.42} ${100 - hw * 0.9} ${top} 100 ${top}`,
    'Z',
  ].join(' ');
}

export interface Face {
  eyeY: number;
  eyeDx: number;
  eyeRx: number;
  eyeRy: number;
  pupilR: number;
  browY: number;
  cheekY: number;
  muzzleY: number;
  muzzleRx: number;
  muzzleRy: number;
  bellyY: number;
  bellyRx: number;
  bellyRy: number;
}

/** Big close-set eyes high on the blob, a small muzzle below, a belly patch at the bottom. */
export function faceGeometry({ top, bottom, hw }: Blob): Face {
  const h = bottom - top;
  const eyeY = top + h * 0.34;
  const eyeRy = hw * 0.36;
  return {
    eyeY,
    eyeDx: hw * 0.37,
    eyeRx: hw * 0.31,
    eyeRy,
    pupilR: hw * 0.18,
    browY: eyeY - eyeRy - 7,
    cheekY: top + h * 0.5,
    muzzleY: top + h * 0.57,
    muzzleRx: hw * 0.4,
    muzzleRy: hw * 0.22,
    bellyY: top + h * 0.82,
    bellyRx: hw * 0.56,
    bellyRy: h * 0.15,
  };
}

/** Where an accessory emoji sits: its baseline just inside the top of the egg or blob. */
export function accessoryAnchor(parts: DragonParts): { x: number; y: number; size: number } {
  if (!parts.blob) return { x: 100, y: 66, size: 40 };
  const size = Math.round(parts.blob.hw * 0.85);
  return { x: 100, y: parts.blob.top + Math.round(size * 0.3), size };
}

export interface DragonPalette {
  body: string;
  belly: string;
  wing: string;
  cheek: string;
  dark: string;
}

export const DRAGON_PALETTES: Record<PetColor, DragonPalette> = {
  green: { body: '#58cc6f', belly: '#eafbe0', wing: '#3aa856', cheek: '#ff9fb0', dark: '#1f5a33' },
  blue: { body: '#4fa8f5', belly: '#e3f1ff', wing: '#2f86dd', cheek: '#ffa3b5', dark: '#1d4a7c' },
  purple: { body: '#a685f7', belly: '#f1ebff', wing: '#8160e0', cheek: '#ffa3c8', dark: '#43307f' },
  red: { body: '#f6766b', belly: '#ffece6', wing: '#df5546', cheek: '#ffc2a8', dark: '#7a2a21' },
  gold: { body: '#f8c33c', belly: '#fff6d6', wing: '#e3a018', cheek: '#ff9f7a', dark: '#71520a' },
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
