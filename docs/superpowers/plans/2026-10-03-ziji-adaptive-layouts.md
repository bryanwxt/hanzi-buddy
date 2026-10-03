# Adaptive Layouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every child screen of 字己 ZiJi fits exactly one screen, with no document scroll, on an upright iPhone (from 375×667) and on an iPad in either orientation. Lessons show the whole world behind them, and Truffle stands still on Home.

**Architecture:** This is CSS-first.
- `.screen` becomes exactly `100dvh` with `overflow: hidden`.
- Long lists scroll inside a `.scroll-panel`.
- Fluid size tokens (`clamp()` on `dvh`/`vw`) plus three media-query arrangements (phone, tablet portrait, tablet landscape) shape each screen.
- A sideways phone gets a `RotateHint` overlay.
- Small markup changes:
  - Home's Truffle moves out of the path list into a pinned `.home__pet`;
  - lessons render `WorldScene` instead of `WorldStrip`;
  - the writing box size comes from a pure function of the viewport.
- A WebKit "fit sweep" (`npm run fit`) seeds a test profile and walks every child screen and lesson step at six sizes. It fails on any overflow, off-screen or undersized control, or covered world tap. It is the acceptance gate for the visual tasks.

**Tech Stack:** Preact 10 + TypeScript 5.9, Vite 7, Vitest 4 (jsdom, fake-indexeddb), plain CSS in `src/styles.css`. `playwright-core@1.52.0` (new dev dependency) drives WebKit for the sweep; tsx runs the script.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §18 (with §13 ink rules, §15 worlds/world taps, §16 朗读, §17 看图说话).

## Global Constraints

- Child screens = everything outside the PIN-gated parent area (the PIN pad counts as a child screen). Each is **exactly one screen tall; the document never scrolls**, on an upright iPhone from 375×667 and on an iPad in either orientation.
- Long lists scroll **inside their own panel** (字卡 collection, the costumes tab, any growing list). The top bar, tabs and bottom nav stay put.
- The parent area may scroll; on a phone nothing in it may overflow sideways (wide tables scroll sideways inside their own box).
- Safe areas: `viewport-fit=cover` and the `env(safe-area-inset-*)` padding stay.
- Arrangements:
  - phone: width < 600px, portrait;
  - tablet portrait: width ≥ 600px, portrait;
  - tablet landscape: landscape and height ≥ 600px.
  - CSS only; no device detection in code.
- Phone sideways (landscape, height < 500px): full-screen overlay, Truffle + 请把手机竖过来, child screens only, lesson state kept.
- Tap targets:
  - every tappable element is at least 44px;
  - main actions are at least 64px on tablets and 52px on phones. Main actions are the answer tiles, 继续, the path stops, the record button and the nav.
- Text: Chinese labels at least 16px; pinyin at least 9px (`max(0.5em, 9px)`).
- §13 ink rules for any new art: outline `#2a2630`, no gradients/filters in scene markup. No emoji on child screens (`src/childEmoji.test.ts`). Borrow mechanics only, no IP.
- Never push or deploy without the parent's go-ahead in chat. Never put the cat photos in the repo.

## Review Focus

1. **iPhones with a notch or home indicator.** The floating 继续 card and the nav must clear the home indicator. The sweep cannot emulate insets, so a CSS contract pins `env(safe-area-inset-bottom)` in the floating card's offset and in `--nav-h` (Task 1, Task 4).
2. **Turning the phone sideways mid-lesson.** It must not lose the lesson. The overlay is drawn beside the routed screen, never instead of it; a test asserts the session's DOM is still there under the overlay (Task 1).
3. **A long parent 朗读 passage on an iPhone SE.** It must scroll inside the passage card; the page must not overflow. The fit profile includes a 160-character passage and a CSS contract pins `.passage` scrolling (Task 2, Task 6).
4. **Home with every optional card at once** (reward goal + done-today + word of the day + 多读一遍) on an iPhone SE must still fit. The fit profile's "done" Home has all four (Task 2, Task 3).
5. **The evening wash** (§15 time layers, the darkest) behind lessons. Text sitting on the sky must stay readable. The sweep runs the flashcard flow at 21:00 too (`flashcards-evening`), and its screenshots are reviewed (Task 8).

---

## File structure

| File | Responsibility |
|---|---|
| `src/styles.css` | Edit `.screen`; new section `/* ===== Adaptive layouts (spec §18) ===== */` at the end holds tokens, arrangements, the overlay and per-screen rules |
| `src/styles.test.ts` | CSS contracts jsdom can't see |
| `src/ui/RotateHint.tsx` (new) | The phone-sideways overlay |
| `src/App.tsx` | Renders `RotateHint` beside every child route |
| `src/parent/ParentArea.tsx` | Adds `screen--scroll` (the one scrolling screen) |
| `src/app/HomeScreen.tsx`, `src/app/TodayPath.tsx` | Pinned Truffle, cards/path regions, zigzag sides |
| `src/app/SessionScreen.tsx`, `src/app/LangduScreen.tsx` | `WorldScene` instead of `WorldStrip` |
| `src/ui/worlds/WorldStrip.tsx` | Deleted (no users left); `STRIP_VIEW` stays only if still used, otherwise removed with its test |
| `src/activities/writing/size.ts` (new) | `writingBoxSize(w, h)`, a pure function |
| `src/activities/writing/WritingStep.tsx` | Uses `writingBoxSize` |
| `src/app/CollectionScreen.tsx`, `src/app/Wardrobe.tsx` | Lists inside `.scroll-panel` |
| `scripts/fit-profile.ts` (new) | Builds a seeded backup JSON with real repo functions in fake-indexeddb |
| `scripts/fit-check.ts` (new) | The WebKit sweep |
| `package.json`, `.gitignore` | `fit` script, `playwright-core` dev dependency, `fit-shots/` ignored |

Pixel values in the CSS below are **starting values**. Task 8's sweep and screenshot review are the gate. Tuning a value to pass it is expected, and each tuning is a ledger ruling (`Ruling: <rule> — <why> — <cost if wrong>`).

---

### Task 0: Park 看图说话 (added at the parent's request, same message as "native")

The parent isn't happy with the story flow and will rethink it. Until then:
- every speaking step is 朗读;
- with nothing to read, the step is skipped (plan 8's behaviour);
- the code, scenes and tests stay behind a setting the parent can't see yet: `settings.story`, default `false`. That way it comes back with one switch.

**Files:**
- Modify: `src/types.ts` (`Settings.story: boolean`, `DEFAULT_SETTINGS.story = false`), `src/kantu/flow.ts`, `src/app/SessionScreen.tsx:73-80`, `src/app/HomeScreen.tsx`
- Test: `src/kantu/kantu.test.tsx`, `src/app/kantuSession.test.tsx`, `src/app/langduExtra.test.tsx`

**Interfaces:**
- Produces: `nextSpeaking(last: SpeakingKind | null, langduAvailable: boolean, storyOn = false): SpeakingKind | null`. With `storyOn` false it returns `'langdu'` when available, otherwise `null`.

- [ ] **Step 1: Write the failing tests**

In `src/kantu/kantu.test.tsx`, replace the alternation assertions with:

```ts
    // parked (the default): always 朗读; nothing to read → no speaking activity
    expect(nextSpeaking(null, true)).toBe('langdu');
    expect(nextSpeaking('langdu', true)).toBe('langdu');
    expect(nextSpeaking(null, false)).toBeNull();
    // switched back on: the old alternation
    expect(nextSpeaking(null, true, true)).toBe('story');
    expect(nextSpeaking('story', true, true)).toBe('langdu');
    expect(nextSpeaking('langdu', true, true)).toBe('story');
    expect(nextSpeaking('story', false, true)).toBe('story');
```

In `src/app/kantuSession.test.tsx`:
- `setup()` turns the story on (`updateSettings(app.db, { activities: speakingOnly, story: true })`), so the existing story tests keep covering the parked code.
- Add:

```tsx
describe('看图说话 is parked by default', () => {
  it('a fresh profile gets 朗读, not a story', async () => {
    const app = await makeAppData({ now: () => new Date(2026, 9, 6, 17) });
    await updateSettings(app.db, { activities: speakingOnly });
    await saveParentPassage(app.db, { id: 'pp:1', title: '我家', text: '我爱爸爸，我爱妈妈。', createdAt: 1 });
    await saveKid(app.db, { ...DEFAULT_KID });
    renderWithApp(<SessionScreen free={false} />, app);
    expect(await screen.findByText('老师好！')).toBeTruthy();
    expect(screen.queryByText('图上画的是什么？')).toBeNull();
  });
  it('with nothing to read, the speaking step is skipped', async () => {
    const app = await makeAppData({ now: () => new Date(2026, 9, 6, 17) });
    await updateSettings(app.db, { activities: speakingOnly });
    await saveKid(app.db, { ...DEFAULT_KID });
    renderWithApp(<SessionScreen free={false} />, app);
    expect(await screen.findByText('太棒了！')).toBeTruthy();
  });
});
```

In `src/app/langduExtra.test.tsx`, the two tests expecting the path to name 看图说话 set `story: true` in their settings first. Add one that expects 朗读 with the default settings.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/kantu src/app/kantuSession.test.tsx src/app/langduExtra.test.tsx`
Expected: FAIL. The new nextSpeaking cases fail, a fresh profile gets the story, and `story` isn't a settings key (TS only; vitest still runs).

- [ ] **Step 3: Implement**

`src/types.ts`: add `story: boolean; // 看图说话 is parked until the parent rethinks it (spec §17)` to `Settings` and `story: false` to `DEFAULT_SETTINGS`. Check whether `getSettings` merging covers it; it spreads the defaults, so it does.

`src/kantu/flow.ts`:

```ts
/** 看图说话 is parked (settings.story off): the speaking step is 朗读, or nothing when there's nothing to read.
 *  Switched on, it alternates 朗读 and 看图说话, starting with a story; 朗读 with nothing to read hands over to a story. */
export function nextSpeaking(last: SpeakingKind | null, langduAvailable: boolean, storyOn = false): SpeakingKind | null {
  if (!storyOn) return langduAvailable ? 'langdu' : null;
  if (!langduAvailable) return 'story';
  return last === 'story' ? 'langdu' : 'story';
}
```

`src/app/SessionScreen.tsx` speaking chooser:

```ts
          const kind = nextSpeaking(k.speakingLast, !!passage, settings.story);
          return kind === 'langdu' && passage ? { kind: 'langdu' as const, passage, oral: settings.oral } : kind === 'story' ? { kind: 'story' as const, scene: sceneFor(k.story) } : null;
```

`src/app/HomeScreen.tsx`:
- compute `const speakingKind = todaySession?.completedSteps.includes('speaking') ? k.speakingLast ?? 'langdu' : nextSpeaking(k.speakingLast, canRead, settings.story);`;
- pass `speakingName={speakingKind === 'story' ? '看图说话' : '朗读'}`;
- when there's no session yet and `speakingKind === null`, leave `speaking` out of the planned steps shown on the path: `STEP_ORDER.filter((s) => settings.activities[s] && (s !== 'speaking' || speakingKind !== null))`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/kantu src/app`
Expected: PASS.

- [ ] **Step 5: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass.

```bash
git add src/types.ts src/kantu/flow.ts src/app/SessionScreen.tsx src/app/HomeScreen.tsx src/kantu/kantu.test.tsx src/app/kantuSession.test.tsx src/app/langduExtra.test.tsx
git commit -m "feat: park 看图说话; the speaking step is 朗读 until the parent rethinks the story flow"
```

---

### Task 1: Layout foundation: one-screen `.screen`, tokens, arrangements, rotate overlay

**Files:**
- Modify: `src/styles.css:56-61` (the `.screen` rule); append the new section at the end
- Create: `src/ui/RotateHint.tsx`
- Modify: `src/App.tsx`, `src/parent/ParentArea.tsx:34`
- Test: `src/styles.test.ts`, `src/App.test.tsx`

**Interfaces:**
- Produces:
  - CSS classes `.screen--scroll`, `.scroll-panel`, `.rotate-hint`, `.rotate-hint__msg`;
  - CSS custom properties `--tap-main`, `--pet`, `--pet-home`, `--hanzi-xl`, `--nav-h` on `:root`, overridden in the phone media query;
  - the media queries, used verbatim by later tasks:
    - `@media (max-width: 599px)` (phone);
    - `@media (orientation: landscape) and (min-height: 600px)` (tablet landscape);
    - `@media (orientation: landscape) and (max-height: 499px)` (phone sideways);
  - `export function RotateHint({ kid }: { kid: KidState | null }): JSX.Element` in `src/ui/RotateHint.tsx`.

- [ ] **Step 1: Write the failing tests**

Append to `src/styles.test.ts`:

```ts
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
});
```

Append inside `describe('App', …)` in `src/App.test.tsx`:

```ts
  it('draws the phone-sideways overlay beside the screen, never instead of it', async () => {
    render(<App dbName={`test-${crypto.randomUUID()}`} now={() => new Date(2026, 9, 2, 9)} />);
    await screen.findByText('For parents: choose a 4-digit PIN');
    const hint = document.querySelector('.rotate-hint');
    expect(hint?.textContent).toContain('竖');
    expect(hint?.getAttribute('aria-label')).toBe('请把手机竖过来');
    expect(document.querySelector('.screen')).toBeTruthy(); // the routed screen stays mounted under it, so a lesson keeps its state
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/styles.test.ts src/App.test.tsx`
Expected: FAIL. The 4 new style tests fail (no adaptive section, `.screen` still uses `min-height`), and the App test fails because `.rotate-hint` is null.

- [ ] **Step 3: Implement**

In `src/styles.css`, change the `.screen` rule (lines 56–61) to:

```css
.screen {
  --pad-x: max(20px, env(safe-area-inset-left), env(safe-area-inset-right));
  --pad-b: max(16px, env(safe-area-inset-bottom));
  position: relative; z-index: 1; height: 100vh; height: 100dvh; overflow: hidden; display: flex; flex-direction: column; gap: 16px;
  padding: max(16px, env(safe-area-inset-top)) var(--pad-x) var(--pad-b);
}
```

Append to the end of `src/styles.css`:

```css
/* ===== Adaptive layouts (spec §18): one screen on every iPad and iPhone ===== */
:root {
  --tap-main: 64px;
  --pet: clamp(96px, 17dvh, 180px);
  --pet-home: clamp(110px, 16dvh, 170px);
  --hanzi-xl: clamp(104px, 17dvh, 190px);
  --nav-h: calc(84px + env(safe-area-inset-bottom));
}
html, body { overflow: hidden; }
html:has(.screen--scroll), html:has(.screen--scroll) body { overflow: auto; }
.screen--scroll { height: auto; min-height: 100dvh; overflow: visible; }
.scroll-panel { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.label__py { font-size: max(0.5em, 9px); }
.hanzi--xl { font-size: var(--hanzi-xl); }
.rotate-hint { display: none; }

/* phone: one column, smaller Truffle */
@media (max-width: 599px) {
  :root { --tap-main: 52px; --pet: clamp(72px, 12dvh, 110px); --pet-home: clamp(84px, 14dvh, 120px); --hanzi-xl: clamp(88px, 15dvh, 140px); --nav-h: calc(72px + env(safe-area-inset-bottom)); }
  body { font-size: 18px; }
  .screen { --pad-x: max(14px, env(safe-area-inset-left), env(safe-area-inset-right)); gap: 10px; }
}

/* tablet landscape: two columns (per-screen rules below) */
@media (orientation: landscape) and (min-height: 600px) {
  :root { --pet: clamp(110px, 20dvh, 170px); }
}

/* phone turned sideways: too short for a lesson, so Truffle asks for upright */
@media (orientation: landscape) and (max-height: 499px) {
  .rotate-hint { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; gap: 24px; background: var(--paper); }
  .rotate-hint__msg { margin: 0; font-size: 26px; background: var(--surface); border: var(--panel-border); box-shadow: var(--panel-shadow); border-radius: 16px; padding: 12px 20px; }
}
```

Create `src/ui/RotateHint.tsx`:

```tsx
import { DEFAULT_KID, type KidState } from '../types';
import { Label } from './Label';
import { Pet } from './Pet';

/** Shown (by CSS) only on a phone turned sideways: too short for a lesson. Drawn beside the screen, so nothing underneath resets. */
export function RotateHint({ kid }: { kid: KidState | null }) {
  return (
    <div class="rotate-hint" role="dialog" aria-label="请把手机竖过来">
      <Pet kid={kid ?? DEFAULT_KID} mood="content" size={120} />
      <p class="rotate-hint__msg"><Label zh="请把手机竖过来" /></p>
    </div>
  );
}
```

In `src/App.tsx`, import `RotateHint` and render it beside child routes:

```tsx
import { RotateHint } from './ui/RotateHint';
// …
  return (
    <AppContext.Provider value={app}>
      <Screen route={route} />
      {route.name !== 'parent' && <RotateHint kid={booted.kid} />}
    </AppContext.Provider>
  );
```

In `src/parent/ParentArea.tsx:34` change `<div class="screen parent">` to `<div class="screen screen--scroll parent">`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/styles.test.ts src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass. `src/childEmoji.test.ts` still passes because RotateHint has no emoji.

```bash
git add src/styles.css src/styles.test.ts src/ui/RotateHint.tsx src/App.tsx src/App.test.tsx src/parent/ParentArea.tsx
git commit -m "feat: one-screen layout foundation, arrangements and the phone-sideways overlay"
```

---

### Task 2: The fit sweep (`npm run fit`)

**Files:**
- Create: `scripts/fit-profile.ts`, `scripts/fit-profile.test.ts`, `scripts/fit-check.ts`
- Modify: `package.json` (devDependency `"playwright-core": "1.52.0"`, script `"fit": "vite build && tsx scripts/fit-check.ts"`), `.gitignore` (`fit-shots/`)

**Interfaces:**
- Consumes:
  - `openAppDb(name)` (`src/store/db.ts`);
  - `seedBuiltinWords(db, words)`, `updateSettings`, `saveKid`, `saveSession`, `saveReward`, `saveParentPassage` (`src/store/repo.ts`);
  - `builtinWords(now)` (`src/content/index.ts`);
  - `applyPlacement(db, ids, now)` (`src/placement/apply.ts`);
  - `createSessionRecord(plan, date, startedAt)` (`src/session/runner.ts`);
  - `exportBackup(db, { includeMedia: false, now })` (`src/store/backup.ts`);
  - `localDateKey(date)` (`src/lib/date.ts`);
  - `WORLDS` (`src/fun/worlds.ts`).
- Produces:
  - `export interface FitProfileOptions { now: Date; activities?: Partial<Record<StepKind, boolean>>; speakingLast?: 'langdu' | 'story' | null; doneToday?: boolean; world?: WorldId; pin?: boolean; kid?: boolean; placementDone?: boolean }`;
  - `export async function buildFitProfile(o: FitProfileOptions): Promise<string>`, which returns a backup JSON in the app's `BackupFile` format;
  - the CLI `npm run fit`, which exits 1 on any problem and writes `fit-shots/<size>/<flow>-NN.png` and `fit-shots/report.txt`.

- [ ] **Step 1: Write the failing test for the profile builder**

Create `scripts/fit-profile.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readBackup } from '../src/store/backup';
import { buildFitProfile } from './fit-profile';

const NOW = new Date(2026, 9, 6, 16, 0);

describe('buildFitProfile', () => {
  it('is a valid backup with known words, a goal, a long parent passage and a set PIN', async () => {
    const p = readBackup(await buildFitProfile({ now: NOW }));
    expect(p.counts.cards).toBeGreaterThanOrEqual(60);
    const settings = p.file.settings as { pinHash: string | null; placementDone: boolean };
    expect(settings.pinHash).toBeTruthy();
    expect(settings.placementDone).toBe(true);
    expect((p.file.stores.rewards ?? []).length).toBe(1);
    const passages = (p.file.stores.passages ?? []) as { text: string }[];
    expect(passages[0]!.text.length).toBeGreaterThanOrEqual(160);
  });
  it('can be done for today (every Home card at once) and can switch activities and the world', async () => {
    const p = readBackup(await buildFitProfile({ now: NOW, doneToday: true, activities: { writing: false }, world: 'blocks', speakingLast: 'story' }));
    const sessions = (p.file.stores.sessions ?? []) as { date: string; completed: boolean }[];
    expect(sessions.some((s) => s.date === '2026-10-06' && s.completed)).toBe(true);
    const kid = p.file.kid as { lastChestDate: string; world: string; worldsSeen: string[]; speakingLast: string };
    expect(kid.lastChestDate).toBe('2026-10-06');
    expect(kid.world).toBe('blocks');
    expect(kid.worldsSeen).toContain('blocks');
    expect(kid.speakingLast).toBe('story');
    expect((p.file.settings as { activities: Record<string, boolean> }).activities.writing).toBe(false);
  });
  it('can stop before the PIN, the pet or placement', async () => {
    expect((readBackup(await buildFitProfile({ now: NOW, pin: false })).file.settings as { pinHash: unknown }).pinHash).toBeNull();
    expect(readBackup(await buildFitProfile({ now: NOW, kid: false })).file.kid).toBeNull();
    expect((readBackup(await buildFitProfile({ now: NOW, placementDone: false })).file.settings as { placementDone: boolean }).placementDone).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/fit-profile.test.ts`
Expected: FAIL with "Failed to resolve import './fit-profile'".

- [ ] **Step 3: Implement the profile builder**

Create `scripts/fit-profile.ts`:

```ts
/** A seeded 字己 profile for the fit sweep (spec §18), built with the app's own repo functions and exported as a backup. */
import 'fake-indexeddb/auto';
import { builtinWords } from '../src/content';
import { WORLDS, type WorldId } from '../src/fun/worlds';
import { localDateKey } from '../src/lib/date';
import { applyPlacement } from '../src/placement/apply';
import { createSessionRecord } from '../src/session/runner';
import { exportBackup } from '../src/store/backup';
import { openAppDb } from '../src/store/db';
import { saveKid, saveParentPassage, saveReward, saveSession, seedBuiltinWords, updateSettings } from '../src/store/repo';
import { DEFAULT_KID, DEFAULT_SETTINGS, type SessionPlan, type StepKind } from '../src/types';

export interface FitProfileOptions {
  now: Date;
  activities?: Partial<Record<StepKind, boolean>>;
  speakingLast?: 'langdu' | 'story' | null;
  doneToday?: boolean;
  world?: WorldId;
  pin?: boolean; // false: stop at the PIN set-up
  kid?: boolean; // false: stop at PetSetup
  placementDone?: boolean; // false: stop at the placement quiz
}

const LONG_PASSAGE =
  '我家有四口人：爸爸、妈妈、妹妹和我。爸爸每天早上送我上学，妈妈下班后陪我读书。妹妹今年三岁，她最喜欢和我们的猫松露玩。周末我们一起去公园散步，看小鸟在树上唱歌，看小鱼在水里游来游去。晚上我们一起吃饭，一起说说今天发生的事。我爱我的家，我的家人也很爱我。';

const emptyPlan: SessionPlan = { steps: [], reviewWordIds: [], newWordIds: [], flashTimeBoxMs: 0, writeCandidates: [], writeCount: 0 };

export async function buildFitProfile(o: FitProfileOptions): Promise<string> {
  const db = await openAppDb(`fit-${Math.random().toString(36).slice(2)}`);
  const t = o.now.getTime();
  const words = builtinWords(t);
  await seedBuiltinWords(db, words);
  await applyPlacement(db, words.slice(0, 80).map((w) => w.id), o.now);
  await updateSettings(db, {
    pinHash: o.pin === false ? null : 'fit-check',
    placementDone: o.placementDone ?? true,
    activities: { ...DEFAULT_SETTINGS.activities, ...o.activities },
    oral: { ...DEFAULT_SETTINGS.oral, name: '小明', age: '8', school: '光明小学', className: '二年级' },
  });
  await saveParentPassage(db, { id: 'pp:fit', title: '我的家', text: LONG_PASSAGE, createdAt: t - 86_400_000 });
  await saveReward(db, { id: 'goal:fit', title: 'Lego set', emoji: '🧱', metric: 'stars', target: 40, createdAt: t - 86_400_000, claimedAt: null });
  const today = localDateKey(o.now);
  const yesterday = localDateKey(new Date(t - 86_400_000));
  await saveSession(db, { ...createSessionRecord(emptyPlan, yesterday, t - 86_400_000), completed: true, completedSteps: ['flashcards', 'writing'] });
  if (o.doneToday) await saveSession(db, { ...createSessionRecord({ ...emptyPlan, steps: ['flashcards', 'writing', 'components', 'speaking'] }, today, t - 3_600_000), completed: true, completedSteps: ['flashcards', 'writing', 'components', 'speaking'] });
  if (o.kid !== false) {
    const world = o.world ?? 'race';
    await saveKid(db, {
      ...DEFAULT_KID,
      worldsSeen: WORLDS.map((w) => w.id),
      world,
      speakingLast: o.speakingLast ?? null,
      lastChestDate: o.doneToday ? today : null,
      bonusStars: 3,
    });
  }
  const json = await exportBackup(db, { includeMedia: false, now: t });
  db.close();
  return json;
}
```

The reward goal's emoji is parent data: the parent area shows it, and Home renders it in `.goal__emoji`. That's existing behaviour; Home already shows `goal.emoji`, and `childEmoji.test.ts` checks source text, not parent data.

If `kid.world` is not how `currentWorld()` picks the world, read `currentWorld` in `src/fun/worlds.ts` and set whichever field it reads. Ledger that as a ruling.

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run scripts/fit-profile.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the dependency and the script entry**

```bash
npm i -D playwright-core@1.52.0
```

In `package.json` `scripts`, add `"fit": "vite build && tsx scripts/fit-check.ts"`. Append `fit-shots/` to `.gitignore`.

Playwright 1.52.0 uses WebKit revision 2158. If `~/Library/Caches/ms-playwright/webkit-2158` is missing, the script tells you to run `npx playwright-core install webkit`. That is a download, so ask the parent first.

- [ ] **Step 6: Write the sweep**

Create `scripts/fit-check.ts`:

```ts
/* Fit sweep (spec §18): every child screen and lesson step must fit one screen in WebKit, the engine of the iPad and iPhone.
   Run: npm run fit  (builds, serves dist on :4174, walks every flow at every size, writes fit-shots/). Exit 1 on any problem. */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { webkit, type Browser, type Page } from 'playwright-core';
import { WORLDS } from '../src/fun/worlds';
import { buildFitProfile, type FitProfileOptions } from './fit-profile';

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT = 'fit-shots';
const AFTERNOON = new Date(2026, 9, 6, 16, 0);
const EVENING = new Date(2026, 9, 6, 21, 0); // timeOfDay() calls this 'evening': the darkest wash
const SIZES = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-15', width: 390, height: 844 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-air-landscape', width: 1180, height: 820 },
];
type Size = (typeof SIZES)[number];
interface Result { size: string; flow: string; step: number; sig: string; problems: string[] }
const results: Result[] = [];

/* ---------- in-page probes (plain JS: they run inside WebKit) ---------- */
const MAIN = '.choice, .bottombar .btn, .path__node, .mic-btn, .tabbar__item, .fishtile, .bubble-opt';
const SCROLLERS = '.scroll-panel, .filters, .kantu__words, .passage, .langdu__passage';

function probe(args: { main: string; scrollers: string }): string[] {
  const out: string[] = [];
  const de = document.documentElement;
  if (de.scrollHeight > innerHeight + 1) out.push(`page scrolls ${de.scrollHeight - innerHeight}px`);
  if (de.scrollWidth > innerWidth + 1) out.push(`page scrolls sideways ${de.scrollWidth - innerWidth}px`);
  const name = (el: Element) => (el.getAttribute('aria-label') || el.textContent || el.className.toString()).trim().slice(0, 24);
  const mainMin = innerWidth < 600 ? 52 : 64;
  for (const el of document.querySelectorAll('button, [role="button"], [role="tab"], a[href], input, select, textarea')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || el.closest('[aria-hidden="true"], .sr-only, .world-taps') || getComputedStyle(el).visibility === 'hidden') continue;
    if (!el.parentElement?.closest(args.scrollers) && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)) out.push(`off screen: ${name(el)}`);
    if (Math.min(r.width, r.height) < 43.5) out.push(`under 44px: ${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    if (el.matches(args.main) && Math.min(r.width, r.height) < mainMin - 0.5) out.push(`main action under ${mainMin}px: ${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  const small = new Set<string>();
  for (const el of document.querySelectorAll('.label__ch')) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest('[aria-hidden="true"], .world-taps, .sr-only')) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 15.5) small.add(`Chinese text under 16px: ${(el.parentElement?.closest('.label')?.textContent ?? el.textContent ?? '').slice(0, 12)} ${fs}px`);
  }
  out.push(...small);
  for (const t of document.querySelectorAll('.world-taps .tap > *')) {
    const r = t.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!top?.closest('.world-taps .tap')) out.push(`world tap covered by ${top ? top.className.toString() || top.tagName : 'nothing'}`);
  }
  return out;
}

function signature(): string {
  const s = document.querySelector('.screen');
  const marks = ['.home', '.flash', '.intro', '.write', '.components', '.pond', '.bubbles', '.langdu', '.kantu', '.kantu__ask', '.kantu__model', '.celebrate', '.chest', '.room', '.zika-grid', '.setup', '.pinpad', '.choices', '.arrival', '.zika-big', '.rotate-hint'];
  const on = marks.filter((m) => s?.matches(m) || s?.querySelector(m) || document.querySelector(`${m}:not(.rotate-hint)`));
  const tone = document.querySelector('.bottombar')?.className ?? '';
  const words = (s?.querySelector('.kantu__q, .langdu__step, .pet__bubble, h1, h2')?.textContent ?? '').slice(0, 14);
  return `${on.join(',')}|${tone}|${words}`;
}

/** One forward tap through a lesson. Returns false when nothing could be tapped. */
function advance(): boolean {
  const vis = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const enabled = (el: Element) => !(el as HTMLButtonElement).disabled;
  const first = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].find((e) => vis(e) && enabled(e));
  const byText = (t: string) => [...document.querySelectorAll<HTMLButtonElement>('.screen button')].find((b) => vis(b) && enabled(b) && b.textContent?.includes(t));
  const tap = (el: HTMLElement | undefined) => (el ? (el.click(), true) : false);
  if (tap(byText('停止'))) return true;
  if (!document.querySelector('.kantu__model') && tap(byText('听松露说'))) return true; // show the model once: the tallest state
  if (tap(first('.bottombar .btn'))) return true;
  if (tap(byText('开始录音'))) return true;
  for (const t of ['我记住了', '下一句', '开始朗读', '听听你自己', '开始！', '走吧']) if (tap(byText(t))) return true;
  if (tap(first('.choice'))) return true;
  if (tap(first('.fishtile, .bubble-opt, .whichpart__char'))) return true;
  if (tap(first('.chest'))) return true;
  return false;
}

/* ---------- harness ---------- */
async function seed(page: Page, json: string) {
  await page.goto(BASE);
  await page.waitForSelector('.screen');
  await page.evaluate(async (text) => {
    const file = JSON.parse(text);
    const decode = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(decode) : v && typeof v === 'object' ? (typeof (v as { $date?: unknown }).$date === 'string' ? new Date((v as { $date: string }).$date) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]))) : v;
    const db: IDBDatabase = await new Promise((ok, no) => { const r = indexedDB.open('hanzi-buddy'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    const tx = db.transaction([...Object.keys(file.stores), 'settings', 'kid'], 'readwrite');
    for (const [name, rows] of Object.entries(file.stores) as [string, unknown[]][]) { const st = tx.objectStore(name); st.clear(); for (const row of rows) st.put(decode(row)); }
    if (file.settings) tx.objectStore('settings').put(decode(file.settings), 'main'); else tx.objectStore('settings').delete('main');
    if (file.kid) tx.objectStore('kid').put(decode(file.kid), 'main'); else tx.objectStore('kid').delete('main');
    await new Promise((ok, no) => { tx.oncomplete = ok; tx.onerror = () => no(tx.error); });
    db.close();
  }, json);
  await page.reload();
  await page.waitForSelector('.screen:not(.loading)');
  await page.waitForTimeout(600);
}

async function open(browser: Browser, size: Size, now: Date, profile: Omit<FitProfileOptions, 'now'>): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, hasTouch: true, serviceWorkers: 'block' });
  await ctx.clock.setFixedTime(now);
  await ctx.addInitScript(() => {
    // A pretend microphone, so the recorded states (听松露说, 重录) are walked too.
    class FakeRecorder {
      static isTypeSupported() { return true; }
      mimeType = 'audio/mp4'; state = 'inactive';
      ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      constructor(_s: MediaStream) {}
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; setTimeout(() => { this.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/mp4' }) }); this.onstop?.(); }, 10); }
      addEventListener(t: string, f: () => void) { (this as Record<string, unknown>)[`on${t}`] = f; }
      removeEventListener() {}
    }
    (window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeRecorder;
    const stream = () => { const ac = new AudioContext(); const o = ac.createOscillator(); const d = ac.createMediaStreamDestination(); o.connect(d); o.start(); return d.stream; };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => stream() } });
  });
  const page = await ctx.newPage();
  await seed(page, await buildFitProfile({ now, ...profile }));
  return page;
}

async function check(page: Page, size: Size, flow: string, step: number) {
  await page.waitForTimeout(500);
  const sig = await page.evaluate(signature);
  const problems = await page.evaluate(probe, { main: MAIN, scrollers: SCROLLERS });
  mkdirSync(`${OUT}/${size.name}`, { recursive: true });
  await page.screenshot({ path: `${OUT}/${size.name}/${flow}-${String(step).padStart(2, '0')}.png` });
  results.push({ size: size.name, flow, step, sig, problems });
}

async function walkLesson(page: Page, size: Size, flow: string, opts: { firstOnly?: boolean } = {}) {
  let last = '';
  let same = 0;
  for (let i = 0; i < 70; i++) {
    await page.waitForTimeout(700);
    if (!(await page.$('.lessonbar')) && !(await page.$('.celebrate'))) return; // back home
    const sig = await page.evaluate(signature);
    if (sig !== last) { await check(page, size, flow, i); last = sig; same = 0; } else if (++same > 5) return;
    if (opts.firstOnly) return;
    if (!(await page.evaluate(advance))) return;
  }
}

async function sweep(browser: Browser, size: Size) {
  const run = async (flow: string, now: Date, profile: Omit<FitProfileOptions, 'now'>, then: (p: Page) => Promise<void>) => {
    const page = await open(browser, size, now, profile);
    try { await then(page); } catch (e) { results.push({ size: size.name, flow, step: -1, sig: '', problems: [`flow crashed: ${String(e).slice(0, 160)}`] }); }
    await page.context().close();
  };
  const tabTo = (p: Page, label: string) => p.click(`.tabbar__item:has-text("${label}")`);
  const startLesson = async (p: Page) => { await p.click('.path__node--current'); };

  // Home: not started, and done-for-today with every optional card; world taps in every world
  await run('home', AFTERNOON, {}, (p) => check(p, size, 'home', 0));
  await run('home-done', AFTERNOON, { doneToday: true }, (p) => check(p, size, 'home-done', 0));
  for (const w of WORLDS) await run(`home-${w.id}`, AFTERNOON, { world: w.id }, (p) => check(p, size, `home-${w.id}`, 0));
  // First run
  await run('setup-pin', AFTERNOON, { pin: false, kid: false, placementDone: false }, (p) => check(p, size, 'setup-pin', 0));
  await run('pet-setup', AFTERNOON, { kid: false, placementDone: false }, (p) => check(p, size, 'pet-setup', 0));
  await run('placement', AFTERNOON, { placementDone: false }, async (p) => { await check(p, size, 'placement', 0); await p.click('.btn--big'); await check(p, size, 'placement', 1); });
  // Tabs
  await run('collection', AFTERNOON, {}, async (p) => { await tabTo(p, '字卡'); await check(p, size, 'collection', 0); await p.click('.zika:not(.card--back)'); await check(p, size, 'collection', 1); });
  await run('room', AFTERNOON, {}, async (p) => {
    await tabTo(p, '松露');
    let i = 0;
    for (const tab of await p.$$('.room__tabs [role="tab"], .room__tabs .chip')) { await tab.click(); await check(p, size, 'room', i++); }
  });
  await run('pin-gate', AFTERNOON, {}, async (p) => { await tabTo(p, '家长'); await check(p, size, 'pin-gate', 0); });
  // Lessons, one activity at a time
  const only = (k: 'flashcards' | 'writing' | 'components' | 'speaking') => ({ flashcards: k === 'flashcards', writing: k === 'writing', components: k === 'components', speaking: k === 'speaking' });
  await run('flashcards', AFTERNOON, { activities: only('flashcards') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'flashcards'); });
  await run('flashcards-evening', EVENING, { activities: only('flashcards') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'flashcards-evening'); });
  await run('writing', AFTERNOON, { activities: only('writing') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'writing', { firstOnly: true }); });
  await run('components', AFTERNOON, { activities: only('components') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'components'); });
  await run('langdu', AFTERNOON, { activities: only('speaking'), speakingLast: 'story' }, async (p) => { await startLesson(p); await walkLesson(p, size, 'langdu'); });
  await run('langdu-extra', AFTERNOON, { doneToday: true }, async (p) => { await p.click('.langdu-btn'); await walkLesson(p, size, 'langdu-extra'); });
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 250)); }
    let browser: Browser;
    try { browser = await webkit.launch(); } catch (e) { console.error(`WebKit is missing: run  npx playwright-core install webkit  (ask first: it downloads ~100 MB)\n${e}`); process.exit(2); }
    for (const size of SIZES) await sweep(browser, size);
    // A phone turned sideways: the overlay covers the screen
    const side = { name: 'iphone-sideways', width: 667, height: 375 };
    const page = await open(browser, side, AFTERNOON, {});
    const covered = await page.evaluate(() => { const h = document.querySelector('.rotate-hint'); if (!h) return false; const r = h.getBoundingClientRect(); return getComputedStyle(h).display !== 'none' && r.width >= innerWidth && r.height >= innerHeight; });
    mkdirSync(`${OUT}/${side.name}`, { recursive: true });
    await page.screenshot({ path: `${OUT}/${side.name}/home-00.png` });
    results.push({ size: side.name, flow: 'rotate', step: 0, sig: '', problems: covered ? [] : ['the turn-it-upright overlay does not cover the screen'] });
    await browser.close();
  } finally {
    server.kill();
  }
  const bad = results.filter((r) => r.problems.length);
  const lines = results.map((r) => `${r.problems.length ? 'FAIL' : 'ok  '} ${r.size.padEnd(18)} ${r.flow}-${String(r.step).padStart(2, '0')}  ${r.sig}${r.problems.length ? `\n       - ${r.problems.join('\n       - ')}` : ''}`);
  writeFileSync(`${OUT}/report.txt`, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log(`\n${results.length} screens checked, ${bad.length} with problems. Screenshots: ${OUT}/`);
  process.exit(bad.length ? 1 : 0);
}

void main();
```

- [ ] **Step 7: Run the sweep once to record the baseline**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-baseline.txt 2>&1; tail -5 .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-baseline.txt`
Expected: the sweep **runs to completion** and exits 1 with problems listed (Home clipped, lessons, etc.). This baseline is what Tasks 3–7 fix.

The harness itself must work. A "flow crashed" problem caused by the harness, such as a selector that matches nothing, is fixed now, with a ruling if it changes the plan's code. A crash caused by an app layout problem is left for the later tasks.

- [ ] **Step 8: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass. `scripts/fit-check.ts` isn't a test file, and `scripts/fit-profile.test.ts` passes.

```bash
git add scripts/fit-profile.ts scripts/fit-profile.test.ts scripts/fit-check.ts package.json package-lock.json .gitignore
git commit -m "feat: a WebKit fit sweep across iPhone and iPad sizes (npm run fit)"
```

---

### Task 3: Home: one screen, Truffle pinned, compact zigzag path

**Files:**
- Modify: `src/app/HomeScreen.tsx`, `src/app/TodayPath.tsx`, `src/styles.css` (adaptive section)
- Test: `src/app/home.test.tsx`, `src/styles.test.ts`

**Interfaces:**
- Consumes: the Task 1 tokens `--pet-home`, `--nav-h`, `--tap-main` and the media queries.
- Produces:
  - `TodayPath` props become `{ nodes: PathNode[]; started: boolean; onStart: () => void; speakingName?: string }`, with no `pet`;
  - each `.path__row` carries `style="--side:-1|1"` (even index −1, odd 1);
  - `.path` carries `style="--stops:N"`;
  - Home markup: `main.home__main > .home__cards + .home__path`, with `.home__pet` as a direct child of `.screen.home`.

- [ ] **Step 1: Write the failing tests**

Add to `src/app/home.test.tsx` inside `describe('HomeScreen', …)`:

```tsx
  it('Truffle stands on the ground beside the path, not inside it (he never moves with the list)', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect(document.querySelector('.home > .home__pet .pet')).toBeTruthy();
    expect(document.querySelector('.path .pet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '换装' }));
    expect(app.go).toHaveBeenCalledWith({ name: 'wardrobe' });
  });
  it('the path zigzags left and right and knows how many stops it has; the cards sit above it', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    const rows = [...document.querySelectorAll<HTMLElement>('.path__row')];
    expect(rows.map((r) => r.style.getPropertyValue('--side'))).toEqual(rows.map((_, i) => (i % 2 === 0 ? '-1' : '1')));
    expect(document.querySelector<HTMLElement>('.path')!.style.getPropertyValue('--stops')).toBe(String(rows.length));
    expect(document.querySelector('.home__main > .home__path .path')).toBeTruthy();
    expect(document.querySelector('.home__main > .home__cards')).toBeTruthy();
  });
```

Append to the `adaptive layouts (spec §18)` describe in `src/styles.test.ts`:

```ts
  it('Home: the path squeezes into the room left, Truffle is pinned above the nav, the nav is --nav-h tall', () => {
    expect(adaptive).toMatch(/\.home__path \{[^}]*flex: 1;[^}]*min-height: 0;[^}]*container-type: size;/);
    expect(adaptive).toMatch(/\.home__pet \{[^}]*position: absolute;[^}]*bottom: calc\(var\(--nav-h\)/);
    expect(adaptive).toMatch(/\.tabbar \{[^}]*height: var\(--nav-h\);/);
    expect(adaptive).toMatch(/\.home \.world-scene \{ bottom: var\(--nav-h\); \}/);
    expect(adaptive).toMatch(/\.world-taps \{[^}]*bottom: var\(--nav-h\);[^}]*height: calc\(100% - var\(--nav-h\)\);/);
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/app/home.test.tsx src/styles.test.ts`
Expected: FAIL. `.home > .home__pet` is null (the pet is inside the path), `--side` is empty, and the style test fails.

- [ ] **Step 3: Implement the markup**

`src/app/TodayPath.tsx`:
- Remove the `pet` prop and the `ComponentChildren` import.
- Remove the `useEffect`/`useRef` that called `scrollIntoView`, since there is nothing to scroll now.
- Render `<ol class="path" aria-label="今天的练习" style={`--stops:${nodes.length}`}>`.
- Each row is `<li key={n.kind} class="path__row" style={`--side:${i % 2 === 0 ? -1 : 1}`}>`.
- Delete the `{i === Math.max(0, currentIndex) && <div class="path__pet">{pet}</div>}` line, and `currentIndex` if it's now unused.

`src/app/HomeScreen.tsx`: replace the `<main class="home__main">…</main>` block with:

```tsx
      <main class="home__main">
        <div class="home__cards">
          {/* goal, done-card, wotd and 多读一遍 exactly as before, unchanged */}
        </div>
        <div class="home__path">
          <h2 class="home__title"><Label zh="今天的练习" /></h2>
          <TodayPath
            speakingName={(todaySession?.completedSteps.includes('speaking') ? k.speakingLast ?? 'story' : nextSpeaking(k.speakingLast, canRead)) === 'story' ? '看图说话' : '朗读'}
            nodes={nodes}
            started={!!todaySession}
            onStart={() => play(false)}
          />
        </div>
      </main>
      <div class="home__pet">
        <button type="button" class="pet-button" aria-label="换装" onClick={() => go({ name: 'wardrobe' })}>
          <Pet kid={k} mood={sleepy ? 'sleepy' : doneToday ? 'pleased' : 'sulk'} size={150} bubble={said ?? (sleepy ? null : worldLine(world, today))} />
        </button>
      </div>
```

Move the four existing card blocks (goal, done-card, wotd, 多读一遍) into `.home__cards` verbatim.

- [ ] **Step 4: Implement the CSS**

Append to the adaptive section of `src/styles.css`:

```css
/* Home: one screen. Cards up top (the sky), the path in the room left, Truffle pinned on the ground. */
.tabbar { height: var(--nav-h); align-items: stretch; }
.tabbar__item { min-height: var(--tap-main); }
.home .world-scene { bottom: var(--nav-h); }
.world-taps { inset: 0; bottom: var(--nav-h); height: calc(100% - var(--nav-h)); }
.home__main { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: stretch; gap: 10px; }
.home__cards { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.home__cards .wotd { flex-direction: row; gap: 14px; transform: rotate(-1.5deg); }
.home__cards .wotd__grid { width: 76px; height: 76px; font-size: 62px; }
.home__cards .wotd__example { margin-top: 0; font-size: 20px; }
.home__path { flex: 1; min-height: 0; container-type: size; position: relative; display: flex; flex-direction: column; align-items: center; padding-right: calc(var(--pet-home) * 0.8); }
.home__title { margin: 0; font-size: 22px; }
.path { flex: 1; min-height: 0; width: 100%; padding: 6px 0 0; gap: 0; justify-content: space-evenly; --node: clamp(48px, calc(100cqh / var(--stops, 5) - 34px), 88px); --zig: min(70px, 13vw); }
.path::before { display: none; }
.path__row { transform: translateX(calc(var(--side, 0) * var(--zig))); }
.path__node { width: var(--node); height: var(--node); min-width: var(--tap-main); min-height: var(--tap-main); }
.path__node--current { width: calc(var(--node) * 1.1); height: calc(var(--node) * 1.1); }
.path__name { margin-top: 4px; font-size: 16px; }
.path__bubble { top: -34px; font-size: 16px; }
.home__pet { position: absolute; z-index: 2; bottom: calc(var(--nav-h) + 6px); left: 58%; }
.home__pet .truffle { width: var(--pet-home); height: auto; }
.home__pet .pet__bubble { font-size: 17px; }

@media (max-width: 599px) {
  .home .topbar .stat { font-size: 18px; padding: 4px 10px; }
  .home__who { font-size: 17px; }
  .home__cards .done-card { padding: 8px 12px; gap: 10px; width: 100%; justify-content: space-between; }
  .home__cards .done-today { font-size: 20px; }
  .home__cards .goal { padding: 8px 14px; width: 100%; }
  .home__title { font-size: 18px; }
  .home__pet { left: 55%; }
}

@media (orientation: landscape) and (min-height: 600px) {
  .home__main { display: grid; grid-template-columns: minmax(300px, 34%) 1fr; align-items: start; }
  .home__cards { align-items: stretch; }
  .home__cards .wotd { flex-direction: column; transform: rotate(-3deg); align-self: center; }
  .home__cards .wotd__grid { width: 112px; height: 112px; font-size: 92px; }
  .home__path { height: 100%; padding-right: 0; padding-bottom: calc(var(--pet-home) + 20px); }
  .path { flex-direction: row; justify-content: space-evenly; align-items: center; --node: clamp(56px, calc(100cqw / var(--stops, 5) - 40px), 88px); }
  .path__row { transform: translateY(calc(var(--side, 0) * 34px)); }
  .home__pet { left: auto; right: 24%; }
}
```

Also remove the now-dead `.path__pet` rule from `src/styles.css:339`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/app/home.test.tsx src/styles.test.ts src/app/TodayPath* 2>/dev/null; npx vitest run src/app`
Expected: PASS. Fix any existing Home test that relied on `pet` inside `TodayPath`, keeping its intent. For example, a test that found the pet via `.path__pet` now uses `.home__pet`.

- [ ] **Step 6: Check Home in the sweep**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-home.txt 2>&1; grep -E "home" .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-home.txt | grep -A4 FAIL | head -60`
Expected: no `FAIL` line for any `home*` flow at any size. That covers page scroll, off-screen buttons, controls under 44px or under the main-action size, and covered world taps.

If one fails, tune the values in Step 4 and re-run; ledger each tuning as a ruling. Open `fit-shots/*/home-done-00.png` for iphone-se, ipad-portrait and ipad-landscape: Truffle must stand on the ground and must not cover a path stop or its label.

- [ ] **Step 7: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass.

```bash
git add src/app/HomeScreen.tsx src/app/TodayPath.tsx src/styles.css src/styles.test.ts src/app/home.test.tsx
git commit -m "feat: Home fits one screen; Truffle pinned on the ground; compact zigzag path"
```

---

### Task 4: Lessons: the whole world behind them, floating 继续 and feedback, flashcards and placement in three arrangements

**Files:**
- Modify: `src/app/SessionScreen.tsx:216`, `src/app/LangduScreen.tsx:46`, `src/styles.css` (adaptive section; delete the `.world-strip` rules at lines 607–608, 628 and the `.world-strip::after` selector at 689)
- Delete: `src/ui/worlds/WorldStrip.tsx`
- Test: `src/app/SessionScreen.test.tsx:38`, `src/ui/worlds/worlds.test.tsx:6,32-33`, `src/styles.test.ts:59,66,69,100`

**Interfaces:**
- Consumes: `WorldScene({ world, time })` (`src/ui/worlds/WorldScene.tsx`); `timeOfDay(now())` and `currentWorld(kid)` (`src/fun/worlds.ts`).
- Produces: lessons render `.world-scene` (full screen, fixed). `.bottombar` is a floating card, not full-bleed. Later tasks rely on `.screen:has(.lessonbar)` as the "lesson screen" selector.

- [ ] **Step 1: Update the tests first**

In `src/app/SessionScreen.test.tsx:38`, change the assertion to:

```ts
    await waitFor(() => expect(document.querySelector('.world-scene')?.getAttribute('data-world')).toBe('grass'));
    expect(document.querySelector('.world-strip')).toBeNull(); // the whole world, not a strip
```

In `src/ui/worlds/worlds.test.tsx`, delete the `WorldStrip` import (line 6) and the test that renders it (lines ~31–36). Delete `STRIP_VIEW` from `scenes.ts` only if nothing else imports it, which you can check with `grep -rn STRIP_VIEW src`.

In `src/styles.test.ts`:
- Replace the tests at lines 59, 66 and 69 (world-strip pass-through) with the test below.
- Change line 100 to expect `/\.world-scene::after, \.grainy::after \{[^}]*mix-blend-mode: multiply/`.

```ts
  it('lessons: the ground shows under a floating 继续 card that clears the home indicator', () => {
    expect(adaptive).toMatch(/\.bottombar \{[^}]*position: sticky;[^}]*bottom: 0;[^}]*margin: auto 0 0;[^}]*border-radius: 18px;/);
    expect(adaptive).toMatch(/\.screen:has\(\.lessonbar\) \{[^}]*padding-bottom: max\(16px, env\(safe-area-inset-bottom\)\);/);
    expect(adaptive).toMatch(/\.bottombar--neutral \{[^}]*background: transparent;[^}]*border-color: transparent;[^}]*pointer-events: none;/);
    expect(css).not.toContain('.world-strip');
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/app/SessionScreen.test.tsx src/styles.test.ts src/ui/worlds/worlds.test.tsx`
Expected: FAIL. `.world-scene` is null in the session, and the style tests fail.

- [ ] **Step 3: Implement**

In `src/app/SessionScreen.tsx`:
- Replace `<WorldStrip world={currentWorld(kid)} />` with `<WorldScene world={currentWorld(kid)} time={timeOfDay(now())} />`.
- Import `WorldScene` from `'../ui/worlds/WorldScene'` and `timeOfDay` from `'../fun/worlds'`, and remove the `WorldStrip` import.
- `now` comes from `useApp()`; add it to the destructuring if it's not there.

In `src/app/LangduScreen.tsx`, do the same with `currentWorld(state.kid)`. Delete `src/ui/worlds/WorldStrip.tsx`.

In `src/styles.css`:
- Delete the `.world-strip` and `.world-strip svg` rules (607–608).
- Delete the `.screen:has(.world-strip) .bottombar--neutral …` rule and the following `.bottombar--neutral .btn` rule (628–629).
- Change line 689 to `.world-scene::after, .grainy::after {`.
- Then append to the adaptive section:

```css
/* Lessons: the whole world behind every step; 继续 and feedback float as a card with ground around it */
.screen:has(.lessonbar) { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
.bottombar { position: sticky; bottom: 0; margin: auto 0 0; border-radius: 18px; border: var(--panel-border); box-shadow: var(--panel-shadow); padding: 12px 14px; gap: 14px; }
.bottombar--neutral { background: transparent; border-color: transparent; box-shadow: none; padding: 0; pointer-events: none; justify-content: center; }
.bottombar--neutral .btn { pointer-events: auto; }
.bottombar .btn { min-width: 200px; min-height: var(--tap-main); }
.bottombar__title { font-size: 24px; }
.bottombar__badge { width: 48px; height: 48px; }
@media (orientation: portrait) { .bottombar { flex-direction: row; align-items: center; } .bottombar .btn { width: auto; } .bottombar--neutral .btn { width: min(100%, 520px); } }
.lessonbar .icon-btn { width: 52px; height: 52px; }

/* 认一认 and placement */
.flash { min-height: 0; }
.flash__pet .truffle { width: var(--pet); height: auto; }
.flash__prompt { min-height: 0; }
.choice { min-height: clamp(var(--tap-main), 10dvh, 112px); font-size: clamp(22px, 3.4dvh, 30px); }
.choices--hanzi .choice { font-size: clamp(44px, 7dvh, 70px); }
.intro__card { padding: 14px 28px; gap: 4px; max-height: 100%; overflow-y: auto; }
@media (max-width: 599px) {
  .flash { grid-template-columns: 1fr; gap: 10px; align-content: start; }
  .flash__pet { justify-content: flex-start; }
  .flash__pet .pet { flex-direction: row-reverse; align-items: center; gap: 8px; }
  .flash__pet .pet__bubble { margin-bottom: 0; font-size: 17px; }
  .flash__pet .pet__bubble::after { left: -7px; bottom: auto; top: 50%; transform: translateY(-50%) rotate(135deg); }
  .flash__main { gap: 12px; }
  .choices { gap: 10px; }
  .bottombar { padding: 10px 12px; }
  .bottombar .btn { min-width: 0; padding: 10px 22px; font-size: 22px; }
  .bottombar__title { font-size: 20px; }
  .bottombar__detail { font-size: 16px; }
  .bottombar__detail .hanzi { font-size: 28px; }
}
@media (orientation: landscape) and (min-height: 600px) {
  .bottombar { align-self: flex-end; max-width: 62%; }
  .bottombar--neutral { max-width: none; align-self: stretch; justify-content: flex-end; }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/app src/ui src/styles.test.ts`
Expected: PASS.

- [ ] **Step 5: Sweep the flashcards and placement flows**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t4.txt 2>&1; grep -E "flashcards|placement" -A4 .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t4.txt | grep -B1 -A4 FAIL | head -60`
Expected: no `FAIL` for `flashcards*` or `placement*` at any size. Tune and ledger as needed.

Look at `fit-shots/iphone-se/flashcards-*.png` and `fit-shots/ipad-landscape/flashcards-*.png`:
- the ground must show under the 继续 button and around the feedback card;
- the intro card (the new-word card, the tallest) must fit, and may scroll inside itself on the SE.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass.

```bash
git add -A src/app/SessionScreen.tsx src/app/LangduScreen.tsx src/ui/worlds src/styles.css src/styles.test.ts src/app/SessionScreen.test.tsx
git commit -m "feat: lessons sit on the whole world; 继续 and feedback float; 认一认 in three arrangements"
```

---

### Task 5: 写一写, 钓鱼 and the celebration fit every arrangement

**Files:**
- Create: `src/activities/writing/size.ts`, `src/activities/writing/size.test.ts`
- Modify: `src/activities/writing/WritingStep.tsx:49`, `src/styles.css` (adaptive section)
- Test: `src/activities/writing/size.test.ts`

**Interfaces:**
- Produces: `export function writingBoxSize(width: number, height: number): number`, the side of the square writing box in px.

- [ ] **Step 1: Write the failing test**

Create `src/activities/writing/size.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { writingBoxSize } from './size';

describe('writingBoxSize', () => {
  it('fills an iPhone SE without pushing the page: room for the bar, the cue and 继续', () => {
    const s = writingBoxSize(375, 667);
    expect(s).toBeLessThanOrEqual(375 - 48);
    expect(s).toBeLessThanOrEqual(667 - 360);
    expect(s).toBeGreaterThanOrEqual(240); // still big enough for a child's finger strokes
  });
  it('is the old 320px on an upright iPad', () => {
    expect(writingBoxSize(768, 1024)).toBe(320);
  });
  it('in iPad landscape the box sits in the right column and fits the height', () => {
    const s = writingBoxSize(1024, 768);
    expect(s).toBeLessThanOrEqual(768 - 240);
    expect(s).toBeLessThanOrEqual(1024 / 2);
    expect(s).toBeGreaterThanOrEqual(320);
  });
  it('never goes below 220px', () => {
    expect(writingBoxSize(320, 480)).toBe(220);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/activities/writing/size.test.ts`
Expected: FAIL with "Failed to resolve import './size'".

- [ ] **Step 3: Implement**

Create `src/activities/writing/size.ts`:

```ts
/** Side of the 田字格 writing box: as big as fits beside the cue, Truffle and 继续 without the page scrolling (spec §18). */
export function writingBoxSize(width: number, height: number): number {
  const landscape = width > height && height >= 600;
  const fit = landscape ? Math.min(400, height - 240, width / 2 - 64) : Math.min(320, width - 48, height - 360);
  return Math.max(220, Math.round(fit));
}
```

In `src/activities/writing/WritingStep.tsx:49`, replace `const size = Math.min(320, window.innerWidth - 64);` with `const size = writingBoxSize(window.innerWidth, window.innerHeight);` and import `writingBoxSize` from `'./size'`.

Append to the adaptive section of `src/styles.css`:

```css
/* 写一写 */
.write { min-height: 0; gap: 10px; }
.write__head .truffle { width: calc(var(--pet) * 0.8); height: auto; }
@media (max-width: 599px) {
  .write__head { gap: 10px; flex-wrap: nowrap; }
  .write__prompt { font-size: 28px; }
}
@media (orientation: landscape) and (min-height: 600px) {
  .write { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto 1fr; align-items: center; column-gap: 32px; }
  .write__head { grid-row: 1 / span 2; flex-direction: column; }
  .write .dots { grid-column: 2; }
  .write .tianzige { grid-column: 2; }
}

/* 钓鱼 */
.pond { gap: 12px; }
.fishtile { min-height: clamp(var(--tap-main), 11dvh, 110px); }
.fishtile__char { font-size: clamp(40px, 6dvh, 58px); }
.whichpart__char { font-size: var(--hanzi-xl); }
.bubble-opt { width: clamp(96px, 14dvh, 140px); height: clamp(96px, 14dvh, 140px); font-size: clamp(44px, 6.5dvh, 66px); }
@media (max-width: 599px) { .pond { grid-template-columns: repeat(3, minmax(0, 1fr)); } .pond-q { font-size: 22px; } .pond-q__part { font-size: 40px; } }

/* Celebration and the chest */
.celebrate { gap: clamp(10px, 2dvh, 22px); min-height: 0; }
.celebrate h1 { font-size: clamp(36px, 6dvh, 56px); }
.stars { font-size: clamp(48px, 8dvh, 72px); min-height: 0; }
.prize { font-size: clamp(84px, 13dvh, 130px); }
.chest svg { width: clamp(150px, 26dvh, 240px); height: auto; }
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/activities/writing src/app/celebration.test.tsx`
Expected: PASS.

- [ ] **Step 5: Sweep 写一写, 钓鱼 and the celebration**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t5.txt 2>&1; grep -E "writing|components" -A4 .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t5.txt | grep -B1 -A4 FAIL | head -60`
Expected: no `FAIL` for `writing*` or `components*` at any size. The celebration and chest are reached at the end of the `components` and `flashcards` walks.

Check `fit-shots/*/writing-*.png`: the 田字格 must be whole and square, with Truffle and the cue beside or above it.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass.

```bash
git add src/activities/writing/size.ts src/activities/writing/size.test.ts src/activities/writing/WritingStep.tsx src/styles.css
git commit -m "feat: 写一写, 钓鱼 and the celebration fit iPhone and iPad"
```

---

### Task 6: 朗读 and 看图说话 fit every arrangement

**Files:**
- Modify: `src/styles.css` (adaptive section)
- Test: `src/styles.test.ts`

**Interfaces:**
- Consumes: the Task 1 tokens and media queries, and the Task 4 floating bottom bar.
- Produces: `.passage` and `.langdu__passage` scroll inside themselves. `.kantu__words` becomes a single scrolling row on phones.

- [ ] **Step 1: Write the failing test**

Append to the `adaptive layouts (spec §18)` describe in `src/styles.test.ts`:

```ts
  it('朗读: a long passage scrolls inside its card; 看图说话: theme words never push the page, and stay tappable', () => {
    expect(adaptive).toMatch(/\.passage, \.langdu__passage \{[^}]*min-height: 0;[^}]*overflow-y: auto;/);
    expect(adaptive).toMatch(/\.kantu__word \{[^}]*min-height: 44px;/);
    expect(adaptive).toMatch(/@media \(max-width: 599px\) \{[^@]*\.kantu__words \{[^}]*flex-wrap: nowrap;[^}]*overflow-x: auto;/);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/styles.test.ts`
Expected: FAIL on the new test.

- [ ] **Step 3: Implement**

Read `src/activities/langdu/LangduStep.tsx` first so the selectors match its markup. The passage element is `.passage` with `.langdu__passage`; the warm-up uses `.langdu__script`/`.langdu__line`; the meter is `.meter`. Then append to the adaptive section:

```css
/* 朗读 */
.langdu { min-height: 0; gap: clamp(8px, 1.6dvh, 18px); }
.passage, .langdu__passage { min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.langdu .passage { flex: 0 1 auto; max-height: 46dvh; font-size: clamp(24px, 3.6dvh, 36px); padding: 14px 22px; }
.langdu__phrase { font-size: clamp(34px, 5.4dvh, 52px); }
.langdu__line { font-size: clamp(24px, 3.6dvh, 34px); }
.mic-btn { min-height: var(--tap-main); padding: 12px 24px; }
@media (max-width: 599px) {
  .langdu .passage { padding: 10px 14px; max-height: 40dvh; }
  .meter__msg { font-size: 18px; }
}
@media (orientation: landscape) and (min-height: 600px) {
  .langdu { display: grid; grid-template-columns: 1.3fr 1fr; align-items: center; column-gap: 28px; text-align: left; }
  .langdu > .passage, .langdu > .langdu__script, .langdu > .langdu__phrase { grid-column: 1; grid-row: 1 / span 4; max-height: 70dvh; }
  .langdu > :not(.passage):not(.langdu__script):not(.langdu__phrase) { grid-column: 2; justify-self: center; }
}

/* 看图说话 */
.kantu { min-height: 0; gap: clamp(6px, 1.4dvh, 14px); }
.kantu__pic { height: min(30dvh, 420px); }
.kantu__pic--small { height: min(18dvh, 220px); }
.kantu__q { font-size: clamp(20px, 3dvh, 28px); }
.kantu__starter { font-size: clamp(20px, 3dvh, 30px); }
.kantu__word { min-height: 44px; font-size: 18px; }
.kantu__model { font-size: clamp(18px, 2.6dvh, 24px); max-height: 18dvh; overflow-y: auto; }
.kantu__ask .truffle { width: calc(var(--pet) * 0.8); height: auto; }
@media (max-width: 599px) {
  .kantu__frame, .kantu__pic { width: 100%; height: auto; }
  .kantu__words { flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; max-width: 100%; padding-bottom: 4px; }
  .kantu__word { flex: none; }
}
@media (orientation: landscape) and (min-height: 600px) {
  .kantu { display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; column-gap: 28px; }
  .kantu > .kantu__frame, .kantu > .kantu__ask { grid-column: 1; grid-row: 1 / span 6; }
  .kantu > :not(.kantu__frame):not(.kantu__ask) { grid-column: 2; }
  .kantu__pic { height: auto; width: 100%; max-height: 60dvh; }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/styles.test.ts src/activities src/app/langduSession.test.tsx src/app/kantuSession.test.tsx`
Expected: PASS.

- [ ] **Step 5: Sweep 朗读, 看图说话 and 多读一遍**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t6.txt 2>&1; grep -E "langdu|kantu" -A4 .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t6.txt | grep -B1 -A4 FAIL | head -80`
Expected: no `FAIL` for `langdu*`, `kantu*` or `langdu-extra*` at any size.

On the iPhone SE screenshots:
- the long parent passage scrolls inside its card;
- the 看图说话 screen with the model shown (`.kantu__model`) still fits, with 继续 on screen.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass.

```bash
git add src/styles.css src/styles.test.ts
git commit -m "feat: 朗读 and 看图说话 fit iPhone and iPad; long passages scroll in their card"
```

---

### Task 7: The other child screens: 字卡, 松露's room, setup, placement, PIN pad, close-ups, error

**Files:**
- Modify: `src/app/CollectionScreen.tsx`, `src/app/Wardrobe.tsx`, `src/app/ErrorScreen.tsx`, `src/styles.css` (adaptive section)
- Test: `src/app/home.test.tsx` (the collection and wardrobe describes), `src/styles.test.ts`

**Interfaces:**
- Consumes: `.scroll-panel` from Task 1.
- Produces: the 字卡 cards, badges and 我的字 sit inside one `.scroll-panel` under the filters. Each 松露's-room tabpanel is a `.scroll-panel`, while Truffle and the tabs stay put.

- [ ] **Step 1: Write the failing tests**

Add to `describe('找到的动物 and the gem jar', …)` in `src/app/home.test.tsx`:

```tsx
  it('字卡 and 松露的房间 scroll inside a panel; the bar, filters and tabs stay put', async () => {
    const app = await makeAppData();
    const { unmount } = renderWithApp(<CollectionScreen />, app);
    await screen.findByRole('group', { name: '筛选' });
    expect(document.querySelector('.screen > .scroll-panel .zika-grid')).toBeTruthy();
    expect(document.querySelector('.scroll-panel .filters')).toBeNull();
    unmount();
    renderWithApp(<Wardrobe />, app);
    for (const name of ['服装', '能力', '地方']) {
      fireEvent.click(await screen.findByRole('tab', { name }));
      expect(document.querySelector('[role="tabpanel"]')!.classList.contains('scroll-panel')).toBe(true);
    }
    expect(document.querySelector('.scroll-panel .room__tabs, .scroll-panel .pet')).toBeNull();
  });
```

Append to the adaptive describe in `src/styles.test.ts`:

```ts
  it('the parent area never overflows sideways on a phone: wide tables scroll inside their panel', () => {
    expect(adaptive).toMatch(/\.parent \.panel \{[^}]*min-width: 0;[^}]*overflow-x: auto;/);
    expect(adaptive).toMatch(/\.parent__body \{[^}]*min-width: 0;/);
  });
  it('the PIN pad and setup shrink on a phone instead of scrolling', () => {
    expect(adaptive).toMatch(/@media \(max-width: 599px\) \{[^@]*\.pinpad \{[^}]*grid-template-columns: repeat\(3, 72px\);/);
    expect(adaptive).toMatch(/\.room \{[^}]*min-height: 0;/);
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/app/home.test.tsx src/styles.test.ts`
Expected: FAIL. There's no `.scroll-panel` yet, and the style tests fail.

- [ ] **Step 3: Implement the markup**

`src/app/CollectionScreen.tsx`: wrap everything after the `.filters` div and before `<TabBar>` in `<div class="scroll-panel">…</div>`. That covers both `.zika-grid`s, the 徽章 heading, `.badges`, 我的字 and the `.animals` section. Leave the `.zika-big` dialog outside the panel, since it's fixed.

`src/app/Wardrobe.tsx`: add `scroll-panel` to the class of each of the three `role="tabpanel"` elements:
- `class="outfits scroll-panel"`;
- `class="places scroll-panel"`;
- `class="powers scroll-panel"`.

`src/app/ErrorScreen.tsx`: wrap the message text in `<pre class="error__msg">…</pre>` if it isn't already in an element, so long messages can scroll inside it.

Append to the adaptive section:

```css
/* 字卡 and 松露's room: the lists scroll, the bars stay */
.scroll-panel { width: 100%; }
.room { min-height: 0; flex: 1; justify-content: flex-start; }
.room .pet { position: static; background: none; }
.room .pet .truffle { width: var(--pet); height: auto; }
.room [role="tabpanel"] { align-content: start; padding: 4px 4px 12px; }
.zika-grid { grid-template-columns: repeat(auto-fill, minmax(clamp(84px, 22vw, 104px), 1fr)); }
.error__msg { max-height: 40dvh; overflow: auto; white-space: pre-wrap; font-size: 14px; }

/* Parent area: may scroll down, never sideways */
.parent__body { min-width: 0; }
.parent .panel { min-width: 0; overflow-x: auto; }

/* First run and the PIN pad */
.setup { min-height: 0; }
.setup__pet .truffle { width: var(--pet); height: auto; }
.pinpad button { height: clamp(56px, 8dvh, 76px); }
@media (max-width: 599px) {
  .pinpad { grid-template-columns: repeat(3, 72px); gap: 10px; }
  .setup { gap: 12px; align-content: center; }
  .seal--big { font-size: 48px; gap: 6px; padding: 12px 10px; }
  .room__tabs .chip { min-width: 0; padding: 6px 14px; font-size: 18px; }
  .zika--big { min-height: 0; }
  .zika--big .zika__char { font-size: 120px; }
}
@media (orientation: landscape) and (min-height: 600px) {
  .room { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto 1fr; column-gap: 24px; align-items: start; }
  .room > .pet { grid-row: 1 / span 2; align-self: center; }
  .room > .room__tabs { grid-column: 2; }
  .room > [role="tabpanel"] { grid-column: 2; height: 100%; }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/app src/styles.test.ts`
Expected: PASS.

- [ ] **Step 5: Sweep the remaining screens**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t7.txt 2>&1; grep -E "collection|room|setup-pin|pet-setup|pin-gate|placement" -A4 .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-t7.txt | grep -B1 -A4 FAIL | head -80`
Expected: no `FAIL` for those flows at any size.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass.

```bash
git add src/app/CollectionScreen.tsx src/app/Wardrobe.tsx src/app/ErrorScreen.tsx src/styles.css src/styles.test.ts src/app/home.test.tsx
git commit -m "feat: 字卡, 松露's room, setup and the PIN pad fit one screen; lists scroll in their panel"
```

---

### Task 8: Full sweep, screenshot review, and the build report

**Files:**
- Modify: any file needing a final fit fix; `docs/superpowers/2026-10-03-truffle-build-report.md`

- [ ] **Step 1: Run the full sweep**

Run: `npm run fit > .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-final.txt 2>&1; tail -3 .superpowers/sdd/2026-10-03-ziji-adaptive-layouts/fit-final.txt`
Expected: `… screens checked, 0 with problems.` and exit code 0.

- [ ] **Step 2: Review the screenshots**

Open the screenshots for `iphone-se`, `ipad-portrait`, `ipad-landscape` and `iphone-sideways`. For every flow, check what the numbers can't catch:
- text on busy scenery without paper behind it;
- Truffle clipped or overlapping a card or path label;
- the `flashcards-evening-*` character readable on the evening wash;
- the ground visible under 继续;
- nothing visually cramped.

Fix each problem with CSS, re-run `npm run fit`, and ledger each fix as a ruling.

- [ ] **Step 3: Gallery for the parent**

Copy one representative screenshot per screen × size into the visual companion's content directory as one HTML page (`fit-gallery.html`) so the parent can look through it. The page shows Home, Home done, a lesson, feedback, writing, 朗读 and 看图说话, for iPhone SE, iPad upright, iPad sideways and the sideways phone.

- [ ] **Step 4: Run the whole suite and the build**

Run: `npm test && npm run build`
Expected: all tests pass; the build succeeds.

- [ ] **Step 5: Write the build report section and commit**

Append a `## Plan 10 — adaptive layouts` section to `docs/superpowers/2026-10-03-truffle-build-report.md` with the ledger's rulings and deferred minors, in the format of the earlier sections.

```bash
git add -A src docs scripts
git commit -m "fix: final fit pass across iPhone and iPad; build report for plan 10"
```
