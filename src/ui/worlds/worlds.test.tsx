import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../fun/worlds';
import { SCENES, STRIP_VIEW, timeLayers } from './scenes';
import { WorldScene } from './WorldScene';
import { WorldStrip } from './WorldStrip';

describe('world scenes', () => {
  it('every world has ink-outlined art with no gradients or filters', () => {
    for (const w of WORLDS) {
      const s = SCENES[w.id];
      expect(s.length).toBeGreaterThan(400);
      expect(s).toContain('#2a2630');
      expect(s).not.toMatch(/Gradient|<filter|url\(#/);
    }
  });
  it('WorldScene draws the world with its time of day, decorative only', () => {
    const { container } = render(<WorldScene world="race" time="afternoon" />);
    const el = container.querySelector('.world-scene')!;
    expect(el.getAttribute('data-world')).toBe('race');
    expect(el.getAttribute('data-time')).toBe('afternoon');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-part="moon"]')).toBeNull();
  });
  it('evening adds the moon, stars and lanterns', () => {
    const { container } = render(<WorldScene world="yard" time="evening" />);
    expect(container.querySelector('[data-part="moon"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-part="lantern"]').length).toBe(4);
    expect(timeLayers('morning').over).toBe('');
  });
  it('the lesson strip shows the ground of the current world', () => {
    const { container } = render(<WorldStrip world="sea" />);
    const el = container.querySelector('.world-strip')!;
    expect(el.getAttribute('data-world')).toBe('sea');
    expect(el.querySelector('svg')!.getAttribute('viewBox')).toBe(STRIP_VIEW.sea);
  });
  it('each strip frames the lively part of its ground, not just grass', () => {
    for (const w of WORLDS) {
      const [, y, , h] = STRIP_VIEW[w.id].split(' ').map(Number);
      expect(y).toBeGreaterThanOrEqual(260);
      expect(h).toBeLessThanOrEqual(130);
    }
  });
  it('the morning and afternoon washes cover the whole canvas (no seam)', () => {
    for (const t of ['morning', 'afternoon'] as const) expect(timeLayers(t).wash).toContain('height="480"');
  });
  it('the moon base keeps its own sky in the evening: stars, no lanterns or second moon', () => {
    const { container } = render(<WorldScene world="space" time="evening" />);
    expect(container.querySelector('[data-part="moon"]')).toBeNull();
    expect(container.querySelectorAll('[data-part="lantern"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-part="star"]').length).toBeGreaterThan(0);
  });
  it('the race flag stands on the hill, not in mid-air', () => {
    const m = SCENES.race.match(/data-part="flag"[^>]*>\s*<path d="M40 (\d+) v-(\d+)"/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBeGreaterThanOrEqual(395); // the ground line near x=40
  });
});
