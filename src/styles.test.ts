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

describe('no dragon left in what people see', () => {
  it('manifest, theme colour and settings copy', () => {
    const vite = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const settings = readFileSync(new URL('./parent/SettingsPanel.tsx', import.meta.url), 'utf8');
    for (const s of [vite, settings]) expect(s).not.toMatch(/dragon/i);
    expect(vite).toContain("theme_color: '#fbf6ea'");
    expect(html).toContain('content="#fbf6ea"');
  });
});
