import { describe, expect, it } from 'vitest';
import { accessoryAnchor, BLINK_MAX_MS, BLINK_MIN_MS, DRAGON_PALETTES, nextBlinkDelay, paletteVars, stageParts } from './parts';

describe('dragon parts', () => {
  it('grows from egg to golden dragon', () => {
    const s = [0, 1, 2, 3, 4, 5].map(stageParts);
    expect(s.map((p) => p.egg)).toEqual([true, false, false, false, false, false]);
    expect(s.map((p) => p.shell)).toEqual([false, true, false, false, false, false]);
    expect(s.map((p) => p.wingScale)).toEqual([0, 0, 1, 1, 1.45, 1.45]);
    expect(s.map((p) => p.horns)).toEqual([false, false, false, true, true, true]);
    expect(s.map((p) => p.tail)).toEqual([false, false, false, true, true, true]);
    expect(s.map((p) => p.aura)).toEqual([false, false, false, false, false, true]);
  });
  it('clamps out-of-range stages', () => {
    expect(stageParts(-3).egg).toBe(true);
    expect(stageParts(9).aura).toBe(true);
  });
  it('puts accessories just above the egg or the head', () => {
    expect(accessoryAnchor(stageParts(0))).toEqual({ x: 100, y: 66, size: 40 });
    const p = stageParts(2);
    const a = accessoryAnchor(p);
    expect(a.y).toBeLessThan(p.head!.cy);
    expect(a.y).toBeGreaterThan(p.head!.cy - p.head!.r - 5);
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
