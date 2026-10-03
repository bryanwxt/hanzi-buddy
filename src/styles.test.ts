// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const inkLayer = css.slice(css.indexOf('/* ===== Ink layer'));
const reducedBlocks = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]);

describe('ink layer contracts (paint rules jsdom cannot see)', () => {
  it('the hold ring still fills over 1.2 s with reduced motion', () => {
    expect(reducedBlocks.some((b) => /\.hold\.is-holding \.hold__ring circle \{[^}]*transition: stroke-dashoffset 1200ms linear !important/.test(b))).toBe(true);
  });
  it('small text on the red celebration block gets an ink shadow', () => {
    expect(inkLayer).toMatch(/\.celebrate--night p[^{]*\{[^}]*text-shadow/);
    expect(inkLayer).toMatch(/\.celebrate--night \.label__py[^{]*\{[^}]*text-shadow|\.celebrate--night p, \.celebrate--night \.label__py/);
  });
  it('keeps the highlights the restyle overrode: reached goal, radical in the intro, emoji picker', () => {
    expect(inkLayer).toMatch(/\.goal--reached \{[^}]*--green-soft/);
    expect(inkLayer).toMatch(/\.part--radical \{[^}]*color:(?! var\(--blue\))/);
    expect(inkLayer).toMatch(/\.swatch \{/);
    expect(inkLayer).toMatch(/\.swatch\.is-on \{/);
  });
});

describe('pinyin labels', () => {
  it('every character gets the same slot, so 完成 is not pushed apart by a long syllable', () => {
    expect(css).toMatch(/\.label__cell--zh \{[^}]*min-width: 1\.3em/);
    expect(css).not.toMatch(/\.label__py \{[^}]*margin: 0 -/); // no overhang: neighbouring syllables must never touch
  });
  it('a blank is an empty box with its underscore hidden', () => {
    expect(css).toMatch(/\.label__cell--blank \.label__ch \{[^}]*color: transparent[^}]*border:/);
  });
  it('the home corner lines labels up on their bottoms', () => {
    expect(css).toMatch(/\.home__who \{[^}]*align-items: flex-end/);
  });
});

describe('collection contrast', () => {
  it('stars on gold cards are ink, not gold-on-gold', () => {
    expect(css).toMatch(/\.card--gold \.zika__stars \{[^}]*color: var\(--ink\)/);
  });
});

describe('no dragon left in what people see', () => {
  it('manifest, theme colour and settings copy', () => {
    const vite = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const settings = readFileSync(new URL('./parent/SettingsPanel.tsx', import.meta.url), 'utf8');
    for (const s of [vite, settings]) expect(s).not.toMatch(/pet dragon|feed the dragon/i); // the 龙 zodiac onesie is fine
    expect(vite).toContain("theme_color: '#fbf6ea'");
    expect(html).toContain('content="#fbf6ea"');
  });
});

describe('world layers never get in the way', () => {
  it('scene and strip ignore taps and sit behind content', () => {
    expect(css).toMatch(/\.world-scene \{[^}]*pointer-events: none/);
    expect(css).toMatch(/\.world-scene \{[^}]*z-index: -1/);
    expect(css).toMatch(/\.world-strip \{[^}]*pointer-events: none/);
  });
  it('the Home world is pinned to the screen, not stretched over the whole scrolling page', () => {
    expect(css).toMatch(/\.world-scene \{[^}]*position: fixed/);
    expect(css).toMatch(/\.home \.world-scene \{[^}]*bottom: 80px/); // ground sits above the sticky tab bar
  });
  it("Truffle's bubble keeps its line on one row", () => {
    expect(css).toMatch(/\.pet__bubble \.label__cells \{[^}]*flex-wrap: nowrap/);
  });
});
