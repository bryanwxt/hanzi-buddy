import { afterEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../lib/random';
import { arcPoints, burst, burstVectors, flyAlong, withViewTransition } from './motion';

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelectorAll('.particles').forEach((n) => n.remove());
  delete (Element.prototype as { animate?: unknown }).animate;
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});

describe('motion geometry', () => {
  it('arcs from start to end, bowing above both', () => {
    const pts = arcPoints({ x: 0, y: 100 }, { x: 200, y: 50 }, 80, 10);
    expect(pts[0]).toEqual({ x: 0, y: 100 });
    expect(pts[10]).toEqual({ x: 200, y: 50 });
    expect(Math.min(...pts.map((p) => p.y))).toBeLessThan(50);
  });
  it('spreads burst vectors around the circle within range', () => {
    const v = burstVectors(10, mulberry32(1), 40, 90);
    expect(v).toHaveLength(10);
    for (const { dx, dy } of v) {
      const d = Math.hypot(dx, dy);
      expect(d).toBeGreaterThanOrEqual(40 - 1e-9);
      expect(d).toBeLessThanOrEqual(90 + 1e-9);
    }
  });
});

describe('motion effects', () => {
  it('does nothing where Web Animations are unavailable', async () => {
    burst(10, 10);
    expect(document.querySelector('.particles')).toBeNull();
    await expect(flyAlong(document.createElement('div'), { x: 0, y: 0 })).resolves.toBeUndefined();
  });
  it('spawns particles when Web Animations exist', () => {
    Element.prototype.animate = vi.fn(() => ({ onfinish: null, finished: Promise.resolve() })) as never;
    burst(10, 10, { count: 6 });
    expect(document.querySelectorAll('.particles .particle')).toHaveLength(6);
  });
  it('skips particles when the user prefers reduced motion', () => {
    Element.prototype.animate = vi.fn() as never;
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    burst(10, 10);
    expect(document.querySelector('.particles')).toBeNull();
  });
  it('updates directly without the View Transitions API, and through it when present', () => {
    const update = vi.fn();
    withViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
    const start = vi.fn((cb: () => unknown) => cb());
    (document as { startViewTransition?: unknown }).startViewTransition = start;
    withViewTransition(update);
    expect(start).toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(2);
  });
});
