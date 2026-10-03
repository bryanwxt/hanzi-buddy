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
  it('on lessons the waiting bottom bar is see-through so the ground shows under the button; feedback bars stay solid', () => {
    expect(css).toMatch(/\.screen:has\(\.world-strip\) \.bottombar--neutral \{[^}]*background: transparent/);
    expect(css).not.toMatch(/\.bottombar--good[^{]*\{[^}]*background: transparent/);
    // see-through must also mean tap-through: an answer showing under the empty bar still takes the tap
    expect(css).toMatch(/\.screen:has\(\.world-strip\) \.bottombar--neutral \{[^}]*pointer-events: none/);
    expect(css).toMatch(/\.bottombar--neutral \.btn \{[^}]*pointer-events: auto/);
  });
  it('text that sits straight on the page gets a paper backing, so scenery never runs under it', () => {
    expect(css).toMatch(/\.home__who \{[^}]*background: var\(--paper\)/);
    expect(css).toMatch(/\.home__title \{[^}]*background: var\(--paper\)/);
    expect(css).toMatch(/\.path__name \{[^}]*background: var\(--paper\)/);
  });
  it("Truffle's bubble keeps its line on one row", () => {
    expect(css).toMatch(/\.pet__bubble \.label__cells \{[^}]*flex-wrap: nowrap/);
  });
});

describe('看图说话 layout', () => {
  it('the picture is sized to the screen height so the model sentence stays above the bottom bar', () => {
    expect(css).toMatch(/\.kantu__pic \{[^}]*height: min\(34vh/);
  });
});

describe('world tap fun never gets in the way', () => {
  it('the tap layer sits over the scene, under Home content, and only its target takes taps', () => {
    expect(css).toMatch(/\.world-taps \{[^}]*position: fixed[^}]*pointer-events: none/);
    expect(css).toMatch(/\.world-taps \.tap[^{]*\{[^}]*pointer-events: all/);
    expect(css).toMatch(/\.home \.home__main, \.home \.path, \.home \.path__row \{[^}]*pointer-events: none/);
    expect(css).toMatch(/\.home \.path__row > \* \{[^}]*pointer-events: auto/);
    expect(css).toMatch(/\.home > \.topbar, \.home > \.home__main \{[^}]*z-index: 1/);
  });
});

describe('scene texture', () => {
  it('worlds, lesson strips and pictures get a grain overlay like Truffle\'s', () => {
    expect(css).toMatch(/\.world-scene::after, \.world-strip::after, \.grainy::after \{[^}]*mix-blend-mode: multiply/);
  });
});

describe('the 字己 seal', () => {
  it('stacks its characters without vertical writing mode (WebKit pushes WenKai glyphs out of the red box)', () => {
    const rules = [...css.matchAll(/\.seal[^{]*\{[^}]*\}/g)].map((m) => m[0]);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.filter((r) => /writing-mode:\s*vertical/.test(r))).toEqual([]);
  });
});

describe('adaptive layouts (spec §18)', () => {
  const adaptive = css.slice(css.indexOf('/* ===== Adaptive layouts (spec §18)'));
  it('a screen is exactly one screen tall and the document never scrolls (the parent area may)', () => {
    expect(css).toMatch(/\.screen \{[^}]*height: 100dvh;[^}]*overflow: hidden;/);
    expect(adaptive).toMatch(/html, body \{ overflow: hidden; \}/);
    expect(adaptive).toMatch(/html:has\(\.screen--scroll\), html:has\(\.screen--scroll\) body \{ overflow: auto; \}/);
    expect(adaptive).toMatch(/\.screen--scroll \{[^}]*height: auto;[^}]*min-height: 100dvh;[^}]*overflow: visible;/);
  });
  it('long lists scroll inside their own panel', () => {
    expect(adaptive).toMatch(/\.scroll-panel \{[^}]*flex: 1;[^}]*min-height: 0;[^}]*overflow-y: auto;/);
  });
  it('has the three arrangements and the phone-sideways overlay', () => {
    expect(adaptive).toContain('@media (max-width: 599px)');
    expect(adaptive).toContain('@media (orientation: landscape) and (min-height: 600px)');
    expect(adaptive).toMatch(/@media \(orientation: landscape\) and \(max-height: 499px\) \{[^@]*\.rotate-hint \{[^}]*display: flex;/);
    expect(adaptive).toMatch(/\.rotate-hint \{ display: none; \}/);
  });
  it('the nav height clears the home indicator, and pinyin never drops below 9px', () => {
    expect(adaptive).toMatch(/--nav-h: calc\(\d+px \+ env\(safe-area-inset-bottom\)\)/);
    expect(adaptive).toMatch(/\.label__py \{ font-size: max\(0\.5em, 9px\); \}/);
  });
  it('Home: on the ground everything stays in the middle band (the sides hold the world taps); Truffle pinned above a --nav-h nav', () => {
    expect(adaptive).toMatch(/:root \{ --band: 50vw; \}/);
    expect(adaptive).toMatch(/\.home__path \{[^}]*width: min\(100%, var\(--band\)\);/);
    expect(adaptive).toMatch(/\.home__cards \{ width: min\(100%, var\(--band\), 560px\);/);
    expect(adaptive).toMatch(/\.world-scene \{ top: auto; height: min\(100%, 133\.33vw\);/); // never wider than the screen: no target cropped off
    expect(adaptive).toMatch(/\.home__pet \{[^}]*position: absolute;[^}]*bottom: calc\(var\(--nav-h\)[^}]*left: 50%;/);
    expect(adaptive).toMatch(/\.tabbar \{ height: var\(--nav-h\);/);
    expect(adaptive).toMatch(/\.home \.home__cards, \.home \.home__path \{ pointer-events: none; \}/);
  });
});
