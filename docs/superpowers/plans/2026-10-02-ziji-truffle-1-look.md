# 字己 Truffle — Plan 1: New Look + Truffle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dragon with Truffle 松露 and restyle every child screen as "ink panels on warm paper". Truffle's mood should follow the child's answers, the chest should open by press-and-hold, and Home should get a word-of-the-day card.

**Architecture:**
- New pure modules: `src/fun/mood.ts` and `src/fun/wordOfDay.ts`.
- A new mascot component, `src/ui/truffle/`, built from the approved reference art, with a thin `Pet` wrapper so call sites change little.
- A new `HoldButton`.
- The restyle is an appended "ink" layer at the end of `styles.css`. It redefines tokens and the component rules that change, so the parent area picks up tokens automatically.
- Dragon code and growth-stage evolve logic are removed.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4 (jsdom), ts-fsrs 5.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` (§3, §4, §9 plan 1). Reference art: `docs/superpowers/specs/assets/2026-10-02-truffle-reference.html`.

## Global Constraints

- **Tokens (exact):**
  - `--paper #fbf6ea`
  - `--ink #2a2630`
  - `--green #7fdc7a`
  - `--green-soft #c9efc6`
  - `--red #ff5532`
  - `--marigold #ffc94a`
  - `--orange-soft #ffe0cc`
  - swashes `#ffd56a` / `#bfe0ff` at ~55%
  - fur `#b8b3b6`, shade `#a29ca1`, white `#fffdf7`
  - eye `#a9c96a`, nose `#ff9fa0`, blush `#ffb3a0`
- **Outlines:** 3.2px ink with round joins on Truffle. No dry-brush or displacement filters.
- **Grain:** only on Truffle, using one `<filter>` per Truffle instance with a `useId` id.
- **Hold-to-open:** 1.2 s. Releasing early cancels. Fires exactly once.
- **Accessibility:**
  - 64px touch targets;
  - text on `--green` is `--ink`;
  - only large text on `--red`, with an ink text-shadow;
  - reduced motion respected.
- **No new runtime dependencies or fonts.** The condensed label uses Nunito 900 uppercase with letter-spacing (the spec allows this fallback).
- **Learning engine unchanged:** FSRS, `buildSessionPlan`, runner and record logic.
- **Data:** no schema or backup format change. `petName`, `petColor` and `lastStageSeen` stay in `KidState` but are no longer read by the UI.
- **No photos** of the cat anywhere.
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **Existing installs:** a dragon-era kid with `wearing: '👑'` must show Truffle wearing 👑 on Home and in the wardrobe, and Meet Truffle must not appear.
2. **HoldButton under rapid input:**
   - pointerdown twice;
   - release at 1199 ms vs 1200 ms;
   - pointercancel or leaving the button mid-hold;
   - keyboard Space held.

   All must fire at most once.
3. **The hard-one close-up** must respect the 5-card cooldown and reduced motion, and must never block answering. The overlay is `pointer-events: none` and auto-hides.
4. **Resting mood** must come from the count of correct answers in this session only. Free play must work. A resumed session restarts at sulk (in-memory count; ruling).
5. **Contrast and clean space:** hanzi must never sit on swashes or speed lines. Text on `--green` must be ink.

---

### Task 1: Ink design layer (tokens + component restyle)

**Files:**
- Modify: `src/styles.css` (append the "Ink layer" section at the end, replacing the old `.scene*` rules there)
- Modify: `src/ui/Scene.tsx`
- Test: `src/ui/scenery.test.tsx`

**Interfaces:**
- Produces:
  - `Scene({ kind, band })`, with the same props;
  - `kind: 'home' | 'sky' | 'desk' | 'pond' | 'stage' | 'night'`;
  - output is paper (or red for `night`) plus two swash SVGs `.scene__swash`, with no clouds, hills, waves or stars.

- [ ] **Step 1: Write the failing test** (replace the existing scenery tests)

```tsx
import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Scene } from './Scene';

describe('Scene (ink layer)', () => {
  it('draws paper with two soft swashes and no old scenery', () => {
    const { container } = render(<Scene kind="home" />);
    expect(container.querySelectorAll('.scene__swash')).toHaveLength(2);
    expect(container.querySelector('.scene__cloud, .scene__hills, .scene__waves, .scene__star')).toBeNull();
  });
  it('uses the red celebration block for night', () => {
    const { container } = render(<Scene kind="night" />);
    expect(container.querySelector('.scene')?.className).toContain('scene--night');
  });
});
```

- [ ] **Step 2: Run it.** `npx vitest run src/ui/scenery.test.tsx`. Expected: FAIL (no `.scene__swash`).

- [ ] **Step 3: Implement Scene**

```tsx
export type SceneKind = 'home' | 'sky' | 'desk' | 'pond' | 'stage' | 'night';

const SWASHES: Record<SceneKind, [string, string]> = {
  home: ['#ffd56a', '#bfe0ff'], sky: ['#bfe0ff', '#ffd56a'], desk: ['#ffd56a', '#c9efc6'],
  pond: ['#bfe0ff', '#c9efc6'], stage: ['#ffd56a', '#ffc6b0'], night: ['#fbf6ea', '#fbf6ea'],
};

/** Paper background with two soft brush swashes (red block for celebrations). */
export function Scene({ kind, band = false }: { kind: SceneKind; band?: boolean }) {
  const [a, b] = SWASHES[kind];
  return (
    <div class={`scene scene--${kind}${band ? ' scene--band' : ''}`} aria-hidden="true">
      <svg class="scene__swash scene__swash--a" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M10 80 C110 30 230 50 390 20" stroke={a} stroke-width="54" fill="none" stroke-linecap="round" />
      </svg>
      <svg class="scene__swash scene__swash--b" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M10 40 C120 90 260 70 390 96" stroke={b} stroke-width="46" fill="none" stroke-linecap="round" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: Append the ink layer to `styles.css`.** Delete the old `/* Scenes */` block, lines `.scene { … }` through `.scene--band { … }`, and then append:

```css
/* ===== Ink layer (Truffle redesign) ===== */
:root {
  --paper: #fbf6ea; --page: #fbf6ea; --surface: #fffaf0; --ink: #2a2630; --ink-soft: #5d5864; --muted: #8f8a93;
  --line: #e6dcc8; --line-strong: #d4c7ae;
  --green: #7fdc7a; --green-edge: #2a2630; --green-soft: #c9efc6; --green-ink: #1f6e3b;
  --red: #ff5532; --marigold: #ffc94a; --gold: #ffc94a; --gold-edge: #2a2630; --gold-soft: #fff1c9;
  --orange-soft: #ffe0cc; --orange-ink: #b83a1c;
  --blue: #2a2630; --blue-soft: #e4efff;
  --panel-border: 3px solid var(--ink); --panel-shadow: 5px 5px 0 var(--ink);
}
body { background: var(--paper) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Ccircle cx='1' cy='1' r='.6' fill='%236e461a' fill-opacity='.08'/%3E%3C/svg%3E"); }
.scene { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: transparent; }
.screen .scene { position: absolute; }
.scene--night { background: var(--red); }
.scene__swash { position: absolute; width: 70%; height: 140px; opacity: 0.55; }
.scene__swash--a { right: -12%; top: 6%; }
.scene__swash--b { left: -14%; bottom: 10%; }
.scene--night .scene__swash { opacity: 0.18; }

/* Panels & pressables */
.card, .goal, .passage, .helper, .sticker, .family, .wardrobe button, .pinpad button {
  background: var(--surface); border: var(--panel-border); box-shadow: var(--panel-shadow);
}
.card, .goal { border-radius: 16px; }
.btn { background: var(--surface); color: var(--ink); border: var(--panel-border); border-radius: 16px; box-shadow: var(--panel-shadow); }
.btn:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 1px 1px 0 var(--ink); }
.btn--primary, .btn--good { background: var(--ink); color: var(--paper); border-color: var(--ink); box-shadow: 5px 5px 0 var(--green); }
.btn--primary:active:not(:disabled), .btn--good:active:not(:disabled) { box-shadow: 1px 1px 0 var(--green); }
.btn--secondary { background: var(--green); color: var(--ink); border-color: var(--ink); box-shadow: var(--panel-shadow); }
.btn--oops { background: var(--orange-soft); color: var(--ink); border-color: var(--ink); box-shadow: var(--panel-shadow); }
.btn--red { background: var(--red); color: var(--paper); border-color: var(--ink); box-shadow: var(--panel-shadow); text-shadow: 2px 2px 0 var(--ink); }
.btn--ghost { background: transparent; border-color: transparent; box-shadow: none; color: var(--ink); text-decoration: underline; }
.btn:disabled { background: var(--line); color: var(--muted); border-color: var(--line-strong); box-shadow: 5px 5px 0 var(--line-strong); }
.icon-btn { color: var(--ink); }
.chip, .stat { background: var(--surface); border: 2.5px solid var(--ink); color: var(--ink); border-radius: 999px; box-shadow: none; }
.stat--fire svg { color: var(--red); } .stat--star svg { color: #d9a400; fill: var(--marigold); }
.label-tag { display: inline-block; font-family: var(--font); font-weight: 900; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; background: var(--green); color: var(--ink); border: 2px solid var(--ink); border-radius: 5px; padding: 1px 7px; }

/* Answers */
.choice, .fishtile, .bubble-opt { background: var(--surface); color: var(--ink); border: var(--panel-border); border-radius: 16px; box-shadow: var(--panel-shadow); }
.bubble-opt { border-radius: 50%; }
.choice.is-right, .fishtile.is-right, .bubble-opt.is-right, .fishtile.is-on { background: var(--green-soft); }
.choice.is-oops, .fishtile.is-oops, .bubble-opt.is-oops { background: var(--orange-soft); }
.choice.is-dim { opacity: 0.45; }

/* Bars */
.bottombar, .tabbar { background: var(--paper); border-top: 3px solid var(--ink); }
.bottombar--good { background: var(--green-soft); } .bottombar--oops { background: var(--orange-soft); }
.tabbar__item { color: var(--ink); border-radius: 14px; }
.tabbar__item.is-active { background: var(--green); border: 2.5px solid var(--ink); }
.progressbar__track, .progress { background: var(--surface); border: 2.5px solid var(--ink); }
.progressbar__fill, .progress__fill { background: var(--marigold); }
.combo { background: var(--surface); border: 2.5px solid var(--ink); color: var(--ink); }

/* Path */
.path__node { background: var(--surface); border: var(--panel-border); border-radius: 22px; box-shadow: var(--panel-shadow); color: var(--ink); }
.path__node--done { background: var(--green-soft); box-shadow: var(--panel-shadow); }
.path__node--current { background: var(--green); box-shadow: var(--panel-shadow); transform: translateY(-6px) rotate(-4deg); animation: none; }
.path__node--current:active { transform: translate(4px, -2px) rotate(-4deg); box-shadow: 1px 1px 0 var(--ink); }
.path__bubble { background: var(--ink); color: var(--paper); }
.path__icon--hanzi { font-family: var(--hanzi); font-size: 40px; }

/* Word of the day */
.wotd { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 14px 12px; transform: rotate(-3deg); border-radius: 16px; }
.wotd__grid { position: relative; width: 112px; height: 112px; display: grid; place-items: center; font-family: var(--hanzi); font-size: 92px; line-height: 1; }
.wotd__grid::before { content: ''; position: absolute; inset: 0; border: 1.5px dashed rgba(42, 38, 48, 0.35); border-radius: 8px;
  background: linear-gradient(rgba(42,38,48,.18), rgba(42,38,48,.18)) center / 1.5px 100% no-repeat, linear-gradient(90deg, rgba(42,38,48,.18), rgba(42,38,48,.18)) center / 100% 1.5px no-repeat; }
.wotd__py { font-style: italic; font-weight: 800; }

/* Celebration on red */
.celebrate--night { color: var(--paper); }
.celebrate--night h1 { text-shadow: 4px 4px 0 var(--ink); }

/* Hold button */
.hold { position: relative; width: 112px; height: 112px; border-radius: 50%; border: var(--panel-border); background: var(--surface); box-shadow: var(--panel-shadow); display: grid; place-items: center; touch-action: none; }
.hold__ring { position: absolute; inset: -3px; transform: rotate(-90deg); pointer-events: none; }
.hold__ring circle { fill: none; stroke: var(--ink); stroke-width: 7; stroke-linecap: round; stroke-dasharray: 327; stroke-dashoffset: 327; transition: stroke-dashoffset 300ms ease-out; }
.hold.is-holding .hold__ring circle { stroke-dashoffset: 0; transition: stroke-dashoffset 1200ms linear; }
.hold.is-done .hold__ring circle { stroke-dashoffset: 0; transition: none; }
.hold__label { display: flex; flex-direction: column; align-items: center; font-weight: 900; font-size: 15px; letter-spacing: 0.12em; }

/* Truffle */
.truffle { display: block; overflow: visible; }
.truffle--bounce { animation: truffle-bounce var(--dur-slow) var(--spring-bouncy); }
@keyframes truffle-bounce { 0% { transform: scale(1, 1); } 30% { transform: scale(1.08, 0.92); } 100% { transform: scale(1, 1); } }
.closeup { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; pointer-events: none; animation: closeup var(--dur-slow) var(--ease-out); }
.closeup__sun { position: absolute; inset: 0; width: 100%; height: 100%; }
@keyframes closeup { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .truffle--bounce, .closeup { animation: none; } }
```

- [ ] **Step 5: Run.** `npx vitest run src/ui/scenery.test.tsx && npm run build`. Expected: PASS, build OK.
- [ ] **Step 6: Commit.** `git add src/styles.css src/ui/Scene.tsx src/ui/scenery.test.tsx && git commit -m "feat(look): ink layer tokens, panels and paper scenes"`

---

### Task 2: Truffle mascot component

**Files:**
- Create: `src/ui/truffle/parts.ts`, `src/ui/truffle/Truffle.tsx`
- Test: `src/ui/truffle/Truffle.test.tsx`

**Interfaces:**
- Produces:
  - `type TruffleMood = 'sulk' | 'neutral' | 'pleased' | 'side' | 'content' | 'wow' | 'cheer' | 'sleepy'`
  - `TRUFFLE_MOODS: TruffleMood[]`
  - `accessoryPlacement(emoji): { x: number; y: number; size: number }`
  - `Truffle({ mood = 'sulk', accessory = null, size = 160, lookAt = 0, label = '松露', bounce = false })`
    - renders `<svg class="truffle" role="img" aria-label="松露" data-mood={mood}>`
    - layers: `.truffle__body`, `.truffle__head`, `.truffle__face--{mood}`, `.truffle__accessory`
    - a grain `<filter>` with a `useId`-based id

**`parts.ts` content:**
- **Body:** the `#b-bean` markup from the reference file.
- **Head:** the `#head` markup.
- **Six faces:** `#f-sulk`, `#f-side`, `#f-wow`, `#f-content`, `#f-cheer` and `#f-sleepy`, copied verbatim as template strings (colours via the token values above). Name them `BODY`, `HEAD` and `FACES` (a record by mood).
- **Two new faces**, in the same coordinate system (viewBox `30 20 260 270`):

```ts
// neutral: open eyes, no lids, no brows, small straight mouth
neutral: EYES_OPEN + '<path d="M151 165 C156 166.5 164 166.5 169 165" stroke="#2a2630" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
// pleased: open eyes with cheeks pushing up, blush, small smile
pleased: EYES_OPEN + '<path d="M94 134 C106 126 130 126 142 134 L142 146 L94 146Z M178 134 C190 126 214 126 226 134 L226 146 L178 146Z" fill="#b8b3b6"/>'
  + '<ellipse cx="96" cy="150" rx="18" ry="10" fill="#ffb3a0" opacity=".6"/><ellipse cx="224" cy="150" rx="18" ry="10" fill="#ffb3a0" opacity=".6"/>'
  + '<path d="M150 163 C155 168 165 168 170 163" stroke="#2a2630" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
```

`EYES_OPEN` is the eye block of `#f-sulk` without its lid and brow paths.

`accessoryPlacement`:
- 🕶️ goes on the eyes, `{ x: 160, y: 132, size: 70 }`;
- 🧣 goes on the neck, `{ x: 160, y: 204, size: 60 }`;
- everything else goes on top of the head, `{ x: 160, y: 46, size: 54 }`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { TRUFFLE_MOODS, accessoryPlacement } from './parts';
import { Truffle } from './Truffle';

const svg = (c: Element) => c.querySelector('svg.truffle')!;

describe('Truffle', () => {
  it('is an image labelled 松露 with body, head and the requested face', () => {
    const { container } = render(<Truffle mood="wow" />);
    expect(svg(container).getAttribute('role')).toBe('img');
    expect(svg(container).getAttribute('aria-label')).toBe('松露');
    expect(svg(container).getAttribute('data-mood')).toBe('wow');
    expect(container.querySelector('.truffle__body')).toBeTruthy();
    expect(container.querySelector('.truffle__head')).toBeTruthy();
    expect(container.querySelector('.truffle__face--wow')).toBeTruthy();
  });
  it('has a face for every mood', () => {
    for (const mood of TRUFFLE_MOODS) {
      const { container, unmount } = render(<Truffle mood={mood} />);
      expect(container.querySelector(`.truffle__face--${mood}`)?.innerHTML.length).toBeGreaterThan(20);
      unmount();
    }
  });
  it('wears an accessory where it belongs', () => {
    const { container } = render(<Truffle accessory="🕶️" />);
    const t = container.querySelector('.truffle__accessory')!;
    expect(t.textContent).toBe('🕶️');
    expect(t.getAttribute('y')).toBe(String(accessoryPlacement('🕶️').y));
    expect(accessoryPlacement('👑').y).toBeLessThan(accessoryPlacement('🧣').y);
  });
  it('gives each instance its own grain filter id', () => {
    const { container } = render(<><Truffle /><Truffle /></>);
    const ids = [...container.querySelectorAll('filter')].map((f) => f.id);
    expect(new Set(ids).size).toBe(2);
  });
  it('can be decorative', () => {
    const { container } = render(<Truffle label={null} />);
    expect(svg(container).getAttribute('aria-hidden')).toBe('true');
  });
});
```

- [ ] **Step 2: Run.** `npx vitest run src/ui/truffle`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement `Truffle.tsx`**

```tsx
import { useId } from 'preact/hooks';
import { BODY, FACES, HEAD, accessoryPlacement, type TruffleMood } from './parts';

interface Props { mood?: TruffleMood; accessory?: string | null; size?: number; lookAt?: number; label?: string | null; bounce?: boolean }

export function Truffle({ mood = 'sulk', accessory = null, size = 160, lookAt = 0, label = '松露', bounce = false }: Props) {
  const grain = `truffle-grain-${useId()}`;
  const a11y = label === null ? { 'aria-hidden': 'true' as const } : { role: 'img' as const, 'aria-label': label };
  const tilt = Math.max(-1, Math.min(1, lookAt)) * 4;
  const acc = accessory ? accessoryPlacement(accessory) : null;
  return (
    <svg class={`truffle${bounce ? ' truffle--bounce' : ''}`} viewBox="30 20 260 270" width={size} height={(size * 270) / 260} data-mood={mood} {...a11y}>
      <defs>
        <filter id={grain} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={1} seed={2} result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g" result="l"><feFuncR type="linear" slope={0.3} intercept={0.76} /><feFuncG type="linear" slope={0.3} intercept={0.76} /><feFuncB type="linear" slope={0.3} intercept={0.76} /></feComponentTransfer>
          <feComposite in="l" in2="SourceGraphic" operator="in" result="m" />
          <feBlend in="SourceGraphic" in2="m" mode="multiply" />
        </filter>
      </defs>
      <g filter={`url(#${grain})`}>
        <g class="truffle__body" dangerouslySetInnerHTML={{ __html: BODY }} />
        <g transform={`rotate(${tilt} 160 120)`}>
          <g class="truffle__head" dangerouslySetInnerHTML={{ __html: HEAD }} />
          <g class={`truffle__face truffle__face--${mood}`} dangerouslySetInnerHTML={{ __html: FACES[mood] }} />
          {acc && <text class="truffle__accessory" x={acc.x} y={acc.y} font-size={acc.size} text-anchor="middle" dominant-baseline="middle">{accessory}</text>}
        </g>
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: Run.** `npx vitest run src/ui/truffle`. Expected: PASS (5/5).
- [ ] **Step 5: Visual check.** Build, open a scratch route or Storybook-free check in the browser by rendering all moods at 160px (a temporary page is allowed), and compare with the reference file. Remove the temporary page.
- [ ] **Step 6: Commit.** `git add src/ui/truffle && git commit -m "feat(truffle): layered vector mascot with eight moods and accessories"`

---

### Task 3: Mood rules (pure)

**Files:**
- Create: `src/fun/mood.ts`
- Test: `src/fun/mood.test.ts`

**Interfaces:**
- Consumes: `TruffleMood` from Task 2; `Card` and `State` from ts-fsrs.
- Produces:
  - `restingMood(correct: number): 'sulk' | 'neutral' | 'pleased'`
    - 0–2 → sulk; 3–7 → neutral; 8+ → pleased.
  - `reactionMood(e: { correct: boolean; hard: boolean; combo: number }): TruffleMood | null`
    - `combo` is the count *after* this answer;
    - wrong → `'side'`; correct and hard → `'wow'`; correct and combo ≥ 3 → `'content'`; otherwise `null`.
  - `isHardRecognition(card: Card | undefined): boolean`
    - true when the card's state *before* the answer is Relearning, or Learning with `reps >= 2`.
    - Ruling vs the spec's "previous review rated Again": ts-fsrs cards don't store the last rating, and Learning with ≥ 2 reps only happens after Again or Hard.
  - `isHardWrite(isNew: boolean, misses: number): boolean`
    - `isNew && misses === 0`.
  - `CLOSEUP_EVERY = 5`
  - `closeupAllowed(cardsSince: number, reduced: boolean): boolean`
    - `!reduced && cardsSince >= CLOSEUP_EVERY`.
  - `REACTION_MS = { side: 1000, content: 1000, wow: 1200 }`

- [ ] **Step 1: Write the failing test**

```ts
import { createEmptyCard, State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { closeupAllowed, isHardRecognition, isHardWrite, reactionMood, restingMood } from './mood';

describe('mood', () => {
  it('warms up with correct answers this session', () => {
    expect([0, 2, 3, 7, 8, 30].map(restingMood)).toEqual(['sulk', 'sulk', 'neutral', 'neutral', 'pleased', 'pleased']);
  });
  it('reacts: wow beats content beats nothing; wrong is side-eye', () => {
    expect(reactionMood({ correct: false, hard: true, combo: 0 })).toBe('side');
    expect(reactionMood({ correct: true, hard: true, combo: 5 })).toBe('wow');
    expect(reactionMood({ correct: true, hard: false, combo: 3 })).toBe('content');
    expect(reactionMood({ correct: true, hard: false, combo: 2 })).toBeNull();
  });
  it('knows a hard card', () => {
    const c = createEmptyCard(new Date(2026, 9, 2));
    expect(isHardRecognition(undefined)).toBe(false);
    expect(isHardRecognition(c)).toBe(false);
    expect(isHardRecognition({ ...c, state: State.Relearning })).toBe(true);
    expect(isHardRecognition({ ...c, state: State.Learning, reps: 1 })).toBe(false);
    expect(isHardRecognition({ ...c, state: State.Learning, reps: 2 })).toBe(true);
    expect(isHardWrite(true, 0)).toBe(true);
    expect(isHardWrite(true, 1)).toBe(false);
    expect(isHardWrite(false, 0)).toBe(false);
  });
  it('rations the close-up and never shows it with reduced motion', () => {
    expect(closeupAllowed(5, false)).toBe(true);
    expect(closeupAllowed(4, false)).toBe(false);
    expect(closeupAllowed(9, true)).toBe(false);
  });
});
```

- [ ] **Step 2: Run.** `npx vitest run src/fun/mood.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `mood.ts` exactly per the interface above.
- [ ] **Step 4: Run.** Expected: PASS (4/4).
- [ ] **Step 5: Commit.** `git commit -am "feat(mood): Truffle mood ladder and reaction rules"` (add the new files first).

---

### Task 4: HoldButton + chest by press-and-hold

**Files:**
- Create: `src/ui/HoldButton.tsx`
- Test: `src/ui/HoldButton.test.tsx`
- Modify: `src/ui/Chest.tsx` (becomes art only: `Chest({ open })`, no button), `src/app/Celebration.tsx` (chest phase uses HoldButton), `src/app/celebration.test.tsx`

**Interfaces:**
- Produces:
  - `HOLD_MS = 1200`
  - `HoldButton({ label, onComplete, disabled = false, holdMs = HOLD_MS })`
    - a `<button class="hold">`;
    - `aria-label={label}`;
    - classes `is-holding` and `is-done`;
    - `onComplete` is called at most once per mount.
- Celebration chest phase:
  - `<Chest open={!!chest} />` above `<HoldButton label="按住打开宝箱" onComplete={open} disabled={!!chest} />`;
  - the 继续 button appears after opening, as now.

- [ ] **Step 1: Write the failing test**

```tsx
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HoldButton } from './HoldButton';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const btn = () => screen.getByRole('button', { name: '按住打开' });
const down = (el: Element) => fireEvent(el, new Event('pointerdown', { bubbles: true }));
const up = (el: Element) => fireEvent(el, new Event('pointerup', { bubbles: true }));

describe('HoldButton', () => {
  it('fires once after a full hold', () => {
    const done = vi.fn();
    render(<HoldButton label="按住打开" onComplete={done} />);
    down(btn());
    expect(btn().className).toContain('is-holding');
    act(() => { vi.advanceTimersByTime(1199); });
    expect(done).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(done).toHaveBeenCalledTimes(1);
    expect(btn().className).toContain('is-done');
    down(btn()); act(() => { vi.advanceTimersByTime(2000); });
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('cancels when released, cancelled or left early', () => {
    const done = vi.fn();
    render(<HoldButton label="按住打开" onComplete={done} />);
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
      down(btn()); act(() => { vi.advanceTimersByTime(600); });
      fireEvent(btn(), new Event(ev, { bubbles: true }));
      expect(btn().className).not.toContain('is-holding');
    }
    act(() => { vi.advanceTimersByTime(5000); });
    expect(done).not.toHaveBeenCalled();
  });
  it('a second pointerdown mid-hold does not restart or double-fire', () => {
    const done = vi.fn();
    render(<HoldButton label="按住打开" onComplete={done} />);
    down(btn()); act(() => { vi.advanceTimersByTime(700); });
    down(btn()); act(() => { vi.advanceTimersByTime(500); });
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('works by holding Space or Enter', () => {
    const done = vi.fn();
    render(<HoldButton label="按住打开" onComplete={done} />);
    fireEvent.keyDown(btn(), { key: ' ' });
    fireEvent.keyDown(btn(), { key: ' ', repeat: true });
    act(() => { vi.advanceTimersByTime(1200); });
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('does nothing when disabled', () => {
    const done = vi.fn();
    render(<HoldButton label="按住打开" onComplete={done} disabled />);
    down(btn()); act(() => { vi.advanceTimersByTime(2000); });
    expect(done).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run.** `npx vitest run src/ui/HoldButton.test.tsx`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement**

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import { Label } from './Label';

export const HOLD_MS = 1200;

interface Props { label: string; onComplete: () => void; disabled?: boolean; holdMs?: number }

/** Press and hold to confirm: the ring fills over holdMs; letting go early cancels. Fires once. */
export function HoldButton({ label, onComplete, disabled = false, holdMs = HOLD_MS }: Props) {
  const [phase, setPhase] = useState<'idle' | 'holding' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!fired.current) setPhase('idle');
  };
  const start = () => {
    if (disabled || fired.current || timer.current) return;
    setPhase('holding');
    timer.current = setTimeout(() => {
      timer.current = null;
      fired.current = true;
      setPhase('done');
      onComplete();
    }, holdMs);
  };
  useEffect(() => cancel, []);
  return (
    <button
      type="button"
      class={`hold ${phase === 'holding' ? 'is-holding' : ''} ${phase === 'done' ? 'is-done' : ''}`}
      aria-label={label}
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') cancel(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg class="hold__ring" viewBox="0 0 112 112" aria-hidden="true"><circle cx="56" cy="56" r="52" /></svg>
      <span class="hold__label"><Label zh="按住" /><b>HOLD</b></span>
    </button>
  );
}
```

- [ ] **Step 4: Run.** Expected: PASS (5/5).
- [ ] **Step 5: Chest + Celebration.**
  - Change `Chest` to `export function Chest({ open }: { open: boolean })`, rendering the same SVG inside `<div class={`chest ${open ? 'is-open' : ''}`}>`.
  - In Celebration's chest phase, render `<Chest open={!!chest} />` and `<HoldButton label="按住打开宝箱" onComplete={() => void open()} disabled={!!chest} />`.
  - Update `celebration.test.tsx`:
    - replace the triple-click with three `pointerdown` events plus fake timers advancing 1200 ms;
    - assert one prize.
  - Other assertions are unchanged.
- [ ] **Step 6: Run.** `npx vitest run src/ui src/app/celebration.test.tsx`. Expected: PASS.
- [ ] **Step 7: Commit.** `git commit -am "feat(hold): press-and-hold button; chest opens by holding"` (add new files).

---

### Task 5: Truffle replaces the dragon everywhere (moods wired)

**Files:**
- Modify:
  - `src/ui/Pet.tsx`
  - `src/activities/flashcards/FlashcardStep.tsx`
  - `src/activities/writing/WritingStep.tsx`
  - `src/activities/components/ComponentsStep.tsx`
  - `src/app/SessionScreen.tsx`
  - `src/app/HomeScreen.tsx`
  - `src/app/PlacementScreen.tsx`
  - `src/app/Wardrobe.tsx`
  - `src/app/Celebration.tsx`
  - `src/app/TodayPath.tsx`
  - `src/ui/TabBar.tsx`
  - `src/fun/pet.ts`
- Create: `src/app/Closeup.tsx`
- Delete: `src/ui/dragon/` (`Dragon.tsx`, `parts.ts` and both tests)
- Tests:
  - `src/ui/widgets.test.tsx` (Pet)
  - `src/activities/flashcards/FlashcardStep.test.tsx`
  - `src/app/SessionScreen.test.tsx`
  - `src/app/celebration.test.tsx`
  - `src/app/home.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces:
  - `Pet({ kid, mood = 'sulk', bubble = null, size = 120, lookAt = 0, bounce = false })`
    - renders `<Truffle accessory={kid.wearing} …>` inside `.pet` with the bubble;
    - `known` and `stage` props are removed.
  - Step props:
    - `FlashcardStep` gains `resting: TruffleMood`, `combo: number`, `closeupReady: boolean`;
    - `FlashResult` gains `hard: boolean`.
  - `WritingStep` gains `resting`, `isNew: boolean`.
  - `ComponentsStep` gains `resting`.
  - `Closeup({ mood = 'wow' })`: a full-screen overlay with a green sunburst and a big Truffle face. It calls `onDone` after 900 ms.
  - `pet.ts`: removes `STAGE_THRESHOLDS`, `petStage` and `PET_COLORS`. `ACCESSORIES`, `openChest`, `canOpenChest`, `comboMilestone`, `pickLine`, `CHEERS` and `COMFORTS` stay.

**Behaviour:**
- **SessionScreen:**
  - keeps `correct` (session count) and `cardsSinceCloseup` (a ref starting at 5);
  - passes `resting = restingMood(correct)`, `combo` and `closeupReady = closeupAllowed(cardsSinceCloseup, reducedMotion())` to FlashcardStep;
  - in `onFlashDone`:
    - if correct, increment `correct`;
    - if `r.correct && r.hard && closeupReady`, reset `cardsSinceCloseup` to 0, otherwise increment it.
- **FlashcardStep:**
  - computes `hard = isHardRecognition(card?.fsrs)` at answer time;
  - in feedback, mood = `reactionMood({ correct, hard, combo: correct ? combo + 1 : 0 }) ?? resting`;
  - in quiz, mood = `resting`; in intro, mood = `'neutral'`;
  - bubbles:
    - quiz as now;
    - side → `再想想`;
    - wow → `咦！好厉害`;
    - content → `呼噜～`;
  - on correct, the tile flies to Truffle as now, and `bounce` is set;
  - when `hard && correct && closeupReady`, renders `<Closeup />` once (pointer-events none; auto-hides).
- **WritingStep:**
  - mood = `resting` while writing;
  - when done, mood = `reactionMood({ correct: misses <= 3, hard: isHardWrite(isNew, misses), combo: 0 }) ?? 'pleased'`.
- **ComponentsStep:**
  - unchecked → `resting`;
  - right → `'pleased'`;
  - wrong → `'side'`.
- **HomeScreen:**
  - Truffle mood: `sleepy` when idle, else `pleased` if today's session is done, else `sulk`;
  - the `home__who` name shows `松露`.
- **PlacementScreen:** `neutral` with the existing bubble.
- **Wardrobe:** `<Pet kid={k} mood="content" size={180} />`.
- **Celebration:**
  - mood `cheer`;
  - the **evolve phase is removed**, including the `stage`, `fromStage` and `beforeEvolve` logic and the `lastStageSeen` save. Ruling: Truffle does not grow (spec §5 replaces growth), and plan 2 adds the power phase;
  - `Scene kind="night"` is now the red block.
- **TodayPath:**
  - flashcards node: name `认一认`, icon `字` rendered with class `path__icon--hanzi`;
  - the `pet` slot is unchanged.
- **TabBar:** the wardrobe tab label becomes `松露`.

- [ ] **Step 1: Write failing tests** (adapt the existing ones; new assertions):

```tsx
// widgets.test.tsx — Pet
it('Pet is Truffle wearing the kid\'s accessory', () => {
  const { container } = render(<Pet kid={{ ...DEFAULT_KID, wearing: '👑' }} mood="pleased" />);
  expect(container.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('pleased');
  expect(container.querySelector('.truffle__accessory')?.textContent).toBe('👑');
});
// FlashcardStep.test.tsx
it('side-eyes a wrong answer and goes wide-eyed for a hard one', () => {
  const relearn = { id: `${he.id}:recognise`, wordId: he.id, kind: 'recognise' as const, fsrs: { ...createEmptyCard(new Date()), state: State.Relearning } };
  const { container } = render(<FlashcardStep {...base} card={relearn} item={review} voice={false} resting="sulk" combo={0} closeupReady={false} onDone={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: he.pinyin }));
  expect(container.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('wow');
  cleanup();
  const r2 = render(<FlashcardStep {...base} item={review} voice={false} resting="sulk" combo={0} closeupReady={false} onDone={vi.fn()} />);
  fireEvent.click([...r2.container.querySelectorAll<HTMLButtonElement>('.choice')].find((b) => b.textContent !== he.pinyin)!);
  expect(r2.container.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('side');
});
it('shows the close-up only when allowed, and reports hard', () => {
  const relearn = { id: `${he.id}:recognise`, wordId: he.id, kind: 'recognise' as const, fsrs: { ...createEmptyCard(new Date()), state: State.Relearning } };
  const onDone = vi.fn();
  render(<FlashcardStep {...base} card={relearn} item={review} voice={false} resting="sulk" combo={0} closeupReady onDone={onDone} />);
  fireEvent.click(screen.getByRole('button', { name: he.pinyin }));
  expect(document.querySelector('.closeup')).toBeTruthy();
  fireEvent.click(screen.getByText('继续'));
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ correct: true, hard: true }));
});
// home.test.tsx
it('shows Truffle sulking before practice, named 松露', async () => {
  const app = await makeAppData();
  renderWithApp(<HomeScreen />, app);
  await screen.findByText('今天的练习');
  expect(document.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('sulk');
  expect(screen.getByText('松露')).toBeTruthy();
});
```

  Also update:
  - the existing `HomeScreen dragon` sleepy test, to expect `data-mood="sleepy"` then `"sulk"`;
  - the existing Pet-stage test (`keeps the highest stage…`), deleted (no stages).
- [ ] **Step 2: Run.** `npx vitest run src/ui src/activities src/app`. Expected: the new assertions FAIL.
- [ ] **Step 3: Implement** the behaviour above. Then delete `src/ui/dragon/`, the `.dragon*` CSS rules, the `petStage` imports, and the `PET_COLORS` import from `PetSetup`. PetSetup is rewritten in Task 6; until then, render a temporary `<Truffle mood="neutral" />` there in place of the swatch grid.
- [ ] **Step 4: Run.** `npm test && npx tsc --noEmit -p . && npm run build`. Expected: all green, no type errors.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(truffle): Truffle replaces the dragon; moods follow answers; hard-one close-up"`

---

### Task 6: Meet Truffle (replaces pet setup)

**Files:**
- Modify: `src/app/PetSetup.tsx` (rewritten as `MeetTruffle`, export kept as `PetSetup` for the route), `src/app/setup.test.tsx`

**Interfaces:**
- Produces: route `petSetup` renders Meet Truffle. It saves `{ ...DEFAULT_KID, petName: '松露' }` and then calls `go({ name: 'placement' })`.

**Behaviour:**
1. Truffle is shown `sleepy` at 240px inside a button labelled `叫醒松露`.
2. A tap wakes him: mood `sulk`, with the bubble `哼……我是松露。来吧！`.
3. The 字己 brand and the `.pun` line (unchanged) are shown.
4. The `好！` button is enabled only after waking.

- [ ] **Step 1: Write the failing test** (replace the PetSetup name/colour test):

```tsx
it('Meet Truffle: wake him, then continue to placement', async () => {
  const app = await makeAppData({ kid: null });
  renderWithApp(<PetSetup />, app);
  expect(document.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('sleepy');
  expect((screen.getByText('好！').closest('button') as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '叫醒松露' }));
  expect(document.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('sulk');
  expect(screen.getByText(/我是松露/)).toBeTruthy();
  fireEvent.click(screen.getByText('好！'));
  await waitFor(() => expect(app.go).toHaveBeenCalledWith({ name: 'placement' }));
  expect((await getKid(app.db))?.petName).toBe('松露');
});
```

  Keep the existing 字己 pun test.
- [ ] **Step 2: Run.** `npx vitest run src/app/setup.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** Meet Truffle as described, and remove the `.swatch` and `.name-input` CSS.
- [ ] **Step 4: Run.** Expected: PASS. `npm test` green.
- [ ] **Step 5: Commit.** `git commit -am "feat(truffle): Meet Truffle first-run screen"`

---

### Task 7: Word of the day on Home

**Files:**
- Create: `src/fun/wordOfDay.ts`, `src/fun/wordOfDay.test.ts`
- Modify: `src/app/HomeScreen.tsx`, `src/app/home.test.tsx`

**Interfaces:**
- Produces: `wordOfTheDay({ plannedNew, knownChars, date }): string | null`. In order:
  1. the first single character in `plannedNew` (today's new words, in plan order);
  2. otherwise a known single character chosen by `mulberry32(seedFromString(date))`, from the sorted `knownChars`;
  3. otherwise `null`.
- Home renders a `.card.wotd` panel when the result is non-null:
  - a `label-tag` reading 今日一字;
  - a `.wotd__grid` showing the character;
  - `.wotd__py` showing the pinyin (`pinyin-pro`, tone marks);
  - tapping it calls `speak(char)`;
  - `aria-label` = `今日一字：${char}`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { wordOfTheDay } from './wordOfDay';

describe('wordOfTheDay', () => {
  it("prefers today's first new single character", () => {
    expect(wordOfTheDay({ plannedNew: ['你好', '猫', '狗'], knownChars: new Set(['大']), date: '2026-10-02' })).toBe('猫');
  });
  it('otherwise picks a known character, stable for the day', () => {
    const known = new Set(['大', '小', '人', '口']);
    const a = wordOfTheDay({ plannedNew: [], knownChars: known, date: '2026-10-02' });
    expect(known.has(a!)).toBe(true);
    expect(wordOfTheDay({ plannedNew: [], knownChars: known, date: '2026-10-02' })).toBe(a);
  });
  it('is empty with nothing to show', () => {
    expect(wordOfTheDay({ plannedNew: [], knownChars: new Set(), date: '2026-10-02' })).toBeNull();
  });
});
```

  and in `home.test.tsx`:

```tsx
it('shows the word of the day', async () => {
  const app = await makeAppData();
  await putWords(app.db, builtinWords(0));
  await putCards(app.db, [makeCard('b:大', 'recognise', new Date(2026, 9, 20), true)]);
  renderWithApp(<HomeScreen />, app);
  expect(await screen.findByRole('button', { name: '今日一字：大' })).toBeTruthy();
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `plannedNew` = today's session `plan.newWordIds` mapped to word text when a session exists. Otherwise it's empty: Home doesn't build a plan.
  - Render the panel above the path title.
- [ ] **Step 4: Run.** `npm test`. Expected: green.
- [ ] **Step 5: Commit.** `git commit -am "feat(home): word-of-the-day panel"` (add new files).

---

### Task 8: Walkthrough, polish, docs

**Files:**
- Modify: `README.md`, `CREDITS.md` (Truffle note: original art of the family cat), and any CSS needed for issues found
- Test: none new unless a bug is found (then TDD it)

- [ ] **Step 1:** `npm test && npm run build`. Expected: green.
- [ ] **Step 2:** In the browser at 768×1024 and at 1024×768, walk through:
  - Meet Truffle (via a fresh DB) → placement → Home (word of the day, path);
  - a session: flashcards right, wrong and hard (close-up); writing; fishing; speaking with a test picture;
  - the celebration, holding the chest;
  - the wardrobe and the sticker book;
  - the parent area.

  Then repeat the session with reduced motion emulated. Check:
  - hanzi on clean space;
  - no clipped Truffle;
  - 64px targets;
  - text contrast on green and red.
- [ ] **Step 3:** Fix findings. CSS-only fixes are verified visually; logic fixes get a failing test first.
- [ ] **Step 4:** Update the README "What it is" section (mascot Truffle) and CREDITS.
- [ ] **Step 5:** `npm test && npm run build`, then commit: `git commit -am "chore: plan 1 walkthrough fixes and docs"`.
