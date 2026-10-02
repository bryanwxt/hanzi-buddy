import { describe, expect, it } from 'vitest';
import { accessoryAnchor, blobPath, BLINK_MAX_MS, BLINK_MIN_MS, DRAGON_PALETTES, faceGeometry, nextBlinkDelay, paletteVars, stageParts } from './parts';

describe('dragon parts', () => {
  it('grows from egg to golden dragon', () => {
    const s = [0, 1, 2, 3, 4, 5].map(stageParts);
    expect(s.map((p) => p.egg)).toEqual([true, false, false, false, false, false]);
    expect(s.map((p) => p.shell)).toEqual([false, true, false, false, false, false]);
    expect(s.map((p) => p.wingScale)).toEqual([0, 0, 1, 1, 1.4, 1.4]);
    expect(s.map((p) => p.horns)).toEqual([false, false, false, true, true, true]);
    expect(s.map((p) => p.tail)).toEqual([false, false, false, true, true, true]);
    expect(s.map((p) => p.aura)).toEqual([false, false, false, false, false, true]);
  });
  it('gets bigger as it grows', () => {
    const height = (n: number) => { const b = stageParts(n).blob!; return b.bottom - b.top; };
    expect(height(2)).toBeLessThan(height(3));
    expect(height(3)).toBeLessThan(height(4));
  });
  it('clamps out-of-range stages', () => {
    expect(stageParts(-3).egg).toBe(true);
    expect(stageParts(9).aura).toBe(true);
  });
  it('draws one closed pear-shaped body', () => {
    const b = stageParts(3).blob!;
    const d = blobPath(b);
    expect(d.startsWith(`M100 ${b.top}`)).toBe(true);
    expect(d.trim().endsWith('Z')).toBe(true);
  });
  it('gives the face huge eyes that stay inside the body', () => {
    const b = stageParts(2).blob!;
    const f = faceGeometry(b);
    expect(f.eyeDx + f.eyeRx).toBeLessThan(b.hw);
    expect(f.eyeRx).toBeGreaterThanOrEqual(b.hw * 0.28);
    expect(f.browY).toBeLessThan(f.eyeY - f.eyeRy);
    expect(f.muzzleY).toBeGreaterThan(f.eyeY);
  });
  it('puts accessories just above the egg or the head', () => {
    expect(accessoryAnchor(stageParts(0))).toEqual({ x: 100, y: 66, size: 40 });
    const b = stageParts(2).blob!;
    const a = accessoryAnchor(stageParts(2));
    expect(a.y).toBeGreaterThan(b.top);
    expect(a.y).toBeLessThan(faceGeometry(b).browY);
  });
  it('exposes palette colours as CSS variables', () => {
    expect(paletteVars('blue')['--d-body']).toBe(DRAGON_PALETTES.blue.body);
    expect(Object.keys(paletteVars('gold'))).toEqual(['--d-body', '--d-belly', '--d-wing', '--d-cheek', '--d-dark']);
  });
  it('blinks every 2.5–5 seconds', () => {
    expect(nextBlinkDelay(() => 0)).toBe(BLINK_MIN_MS);
    expect(nextBlinkDelay(() => 0.999999)).toBeLessThanOrEqual(BLINK_MAX_MS);
  });
});
