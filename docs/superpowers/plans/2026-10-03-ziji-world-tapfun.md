# 字己 Plan 7 — World tap fun — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each journey world on Home gets one thing to tap (spec §15 "Tap fun"). The collectible ones persist:
- zodiac animals found in the tall grass, shown on a 找到的动物 ("animals found") page in 字卡;
- gems dug in the block world, kept in a jar in Truffle's room;
- a dino egg that hatches after his next lesson;
- a daily pirate bonus star.

**Architecture:**
- **Pure rules** in `src/fun/finds.ts`: daily limits, the egg/hatch state and the dig star, all over `kid.finds`.
- **Art:**
  - `src/ui/worlds/tapArt.ts`: animal faces, gem, baby dino, sprays;
  - `src/ui/worlds/WorldTaps.tsx`: an SVG layer with the world's same viewBox and `preserveAspectRatio`, so every hit target sits exactly on its drawing at any screen size.
- **Taps reach the scene:** Home's layout containers let taps through to the scene, and only their visible children take taps.
- **Animations:** CSS classes toggled for a moment, with plain fades under reduced motion.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §15 (tap fun table and saved state).

## Global Constraints

- **`kid.finds`:** `{ animals: string[]; gems: number; eggTapped: boolean; dinoHatched: boolean; lastAnimalDate: string | null; lastGemDate: string | null; lastDigDate: string | null }`. The defaults are empty or false/null. `eggTapped` is added to the spec's shape to drive the hatch.
- **Zodiac animal ids** are the onesie ids in zodiac order: `rat ox tiger rabbit dragon snake horse goat monkey rooster dog pig` (`ONESIES` in `src/fun/costumes.ts`).
- **Daily limits** (local date key):
  - one new animal a day; on later taps that day, a found one waves;
  - one gem a day: three taps crack it, the fourth pops the gem; after that the block shows its crack and does nothing;
  - one bonus star a day from the pirate X.
- **Hatch:** tapping the egg sets `eggTapped`. When a daily lesson completes (`SessionScreen` completion) and `eggTapped && !dinoHatched`, it sets `dinoHatched = true`. The hatched baby then stays in the scene.
- **Taps never block practice:** hit targets sit only on scenery. Panels, path tiles and buttons always win taps.
- **Reduced motion** (`prefers-reduced-motion`): animations become short fades.
- **Art:** §13 ink rules (outline `#2a2630`, flat palette fills, no gradients or filters). No IP: the zodiac animals are simple original ink faces.
- **Child-facing Chinese** goes through `Label`. No emoji in child source.
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **Taps through to the scene:** the path tiles, the word-of-the-day card, 多读一遍 and the tab bar still take their own taps everywhere; nothing in the scene steals them, in portrait 768×1024 and landscape 1024×768.
2. **Repeat taps within one day** never give a second new animal, gem or star. The first tap on a new day does.
3. **Old kid data** without `finds`, or with malformed `finds`, gets defaults; no crash on Home, in the room or in 字卡.
4. **The hatch** happens only after a lesson *completes* after the egg was tapped. A free-play round doesn't hatch it; neither does reopening the app.
5. **Reduced motion** shows no movement beyond fades. A tap during a running animation is ignored, not queued.

---

### Task 1: Finds state + rules

**Files:**
- Create: `src/fun/finds.ts`, `src/fun/finds.test.ts`
- Modify: `src/types.ts` (`KidState.finds` + default), `src/store/repo.ts` (normalise), `src/store/repo.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Finds { animals: string[]; gems: number; eggTapped: boolean; dinoHatched: boolean; lastAnimalDate: string | null; lastGemDate: string | null; lastDigDate: string | null }
export const DEFAULT_FINDS: Finds;
export const ZODIAC_ORDER: string[]; // rat … pig
export function findAnimal(f: Finds, today: string): { finds: Finds; animal: string; isNew: boolean };
// new: the first unfound animal in zodiac order, once per day; otherwise the most recently found one waves.
// All 12 found: one waves, isNew false. Before any find, on the same day as a find: the found one waves.
export function tapGem(f: Finds, today: string, taps: number): { finds: Finds; cracks: number; gem: boolean };
// taps is this visit's tap count (1–4). Cracks = min(taps, 3). On tap 4, if lastGemDate !== today: gems+1, gem=true.
export function tapEgg(f: Finds): Finds;           // eggTapped = true (no-op once hatched)
export function hatchAfterLesson(f: Finds): Finds; // eggTapped && !dinoHatched → dinoHatched = true
export function dig(f: Finds, today: string): { finds: Finds; star: boolean }; // a star once per date
```

- [ ] **Step 1: Failing tests** for:
  - each rule above, including two taps on the same day (no second new animal, gem or star) and the next day (a new one);
  - all 12 animals found;
  - `hatchAfterLesson` without an egg tap (nothing happens);
  - `normalizeKid({})` → `DEFAULT_FINDS`;
  - malformed `finds` (a string, a negative gem count, unknown animal ids) → cleaned up.
- [ ] **Step 2: Run** `npx vitest run src/fun/finds.test.ts src/store`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(worlds): finds — animals, gems, the dino egg and the pirate star, with daily limits`.

### Task 2: Tap art

**Files:**
- Create: `src/ui/worlds/tapArt.ts`, `src/ui/worlds/tapArt.test.ts`

**Interfaces:**
- Produces:
  - `ANIMAL_FACES: Record<string, string>` (12 ink faces, each drawn inside a 48×48 box centred on 0,0);
  - `GEM: string`;
  - `BABY_DINO: string`;
  - `SPRAY: string` (water arcs).

**Drawing notes:**
- Simple round ink faces with each animal's key feature:
  - rat: round ears and whiskers;
  - ox: horns and a nose ring;
  - tiger: stripes and 王 on the forehead;
  - rabbit: long ears;
  - dragon: small horns and whiskers;
  - snake: a long head with a forked tongue;
  - horse: a mane;
  - goat: curled horns and a beard;
  - monkey: a heart-shaped face;
  - rooster: a red comb;
  - dog: floppy ears;
  - pig: a snout.
- Palette colours like the onesies.

- [ ] **Step 1: Failing test:** every zodiac id has a face longer than 200 characters, with `#2a2630`, no gradients or filters, and no `NaN`; `GEM`, `BABY_DINO` and `SPRAY` are non-empty.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Draw.**
- [ ] **Step 4: Gallery** (a temporary vitest file in `src/tmpgallery/` that writes HTML to `$OUT`, rendered to the visual companion, deleted afterwards): all 12 faces at 48 and 96 px, plus the gem and the baby dino. Iterate until each animal is recognisable.
- [ ] **Step 5: Commit** `feat(worlds): ink faces for the 12 zodiac animals, gem, baby dino, spray`.

### Task 3: WorldTaps layer + Home pass-through

**Files:**
- Create: `src/ui/worlds/WorldTaps.tsx`, `src/ui/worlds/WorldTaps.test.tsx`
- Modify: `src/app/HomeScreen.tsx`, `src/styles.css`, `src/styles.test.ts`

**Interfaces:**
- Consumes: Task 1 rules, Task 2 art, `WorldId`.
- Produces: `WorldTaps({ world, kid, today, onKid })`. It renders `svg.world-taps[data-world]`:
  - `viewBox="0 0 360 480"`, `preserveAspectRatio="xMidYMax slice"` (the same box as `WorldScene`);
  - it sits above the scene and below Home's content.
  - Each world has one `<g class="tap" role="button" aria-label="…">` hit target over its drawing. It calls `onKid(nextKid)` when finds change.

**Per world** (coordinates from `src/ui/worlds/scenes.ts`):

| world | target | label | effect |
|---|---|---|---|
| yard | sprinkler, around (229, 400) | 洒水器 | `.is-spraying` on SPRAY arcs for 1.2 s; Truffle's bubble says 哇！ via a callback |
| grass | the rustling tuft, around (100, 360) | 草丛 | `findAnimal`; the face pops up above the tuft for 2 s; if new, bubble 找到了！ |
| race | the red car, around (120, 418) | 赛车 | the car follows the track path (`offset-path` with the track's d), 1.6 s |
| blocks | the gem block, (156–208, 400–426) | 宝石 | `tapGem` with a visit tap counter; cracks drawn 1–3, GEM pops on 4 |
| dino | the egg nest, around (173, 432) | 恐龙蛋 | `tapEgg`, wobble for 0.8 s; when `dinoHatched`, BABY_DINO is drawn by the nest instead of the second egg |
| sea | the submarine, around (263, 360) | 潜水艇 | dives 20 units and returns; fish shift after it, 1.5 s |
| space | the rocket, around (62, 330) | 火箭 | `speak('三，二，一！')`, then rises off-screen and drops back after 3 s |
| pirate | the X, around (147, 411) | 宝藏 | `dig`; a star pops if `star`; `onKid` adds `bonusStars + 1` |

- **Pass-through CSS:**
  - `.home .home__main, .home .path, .home .path__row { pointer-events: none; }`;
  - `.home .home__main > *:not(.path), .home .path__row > * { pointer-events: auto; }`;
  - `.world-taps { position: fixed; inset: 0 0 80px 0; z-index: 0; } .world-taps .tap { cursor: pointer; pointer-events: auto; }`.
  - `.screen` content stays at its z-index above it. With this, empty layout space passes taps through, and real elements keep them.
- **Busy guard:** a running animation ignores taps.

- [ ] **Step 1: Failing tests:**
  - per world, the target exists with its aria-label;
  - tapping grass on a fresh kid calls `onKid` with `finds.animals: ['rat']` and shows the rat face;
  - tapping again the same day doesn't add one;
  - the pirate X adds one bonus star once per day;
  - the gem needs 4 taps;
  - a styles contract for the pass-through rules.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Home renders `<WorldTaps … onKid={async (k) => { await saveKid(db, k); setJourneyKid(k); }} />` after `WorldScene`.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(worlds): one thing to tap in every world`.

### Task 4: 找到的动物 page in 字卡 + the gem jar in the room

**Files:**
- Modify: `src/app/CollectionScreen.tsx` (a `找到的动物` filter chip showing a 12-slot grid; found animals drawn with their name `Label`, unfound ones as `？`), `src/app/Wardrobe.tsx` (on the 地方 tab, a jar showing `gems` gem drawings, capped at 30, with the count `Label` `{n} 颗宝石`)
- Test: `src/app/home.test.tsx`

- [ ] **Step 1: Failing tests:**
  - with `finds.animals = ['rat', 'ox']`, the animals page shows 2 named slots (鼠, 牛) and 10 `？`;
  - with `gems: 3`, the room jar shows `3 颗宝石` and 3 gem drawings.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(worlds): 找到的动物 in 字卡, gem jar in Truffle's room`.

### Task 5: Hatch after a completed lesson

**Files:**
- Modify: `src/app/SessionScreen.tsx` (or wherever a daily session is marked completed; find where `rec.completed` becomes true)
- Test: `src/app/kantuSession.test.tsx` (a daily speaking-only session; it has the recorder mock)

- [ ] **Step 1: Failing test:**
  - a kid with `finds.eggTapped = true` completes a daily session → `finds.dinoHatched === true`;
  - the same kid in free play → stays false.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** On daily completion only: re-read the kid, `finds = hatchAfterLesson(finds)`, save.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(worlds): the dino egg hatches after his next finished lesson`.

### Task 6: Walkthrough + docs

- [ ] In the browser at 768×1024 and 1024×768:
  - switch the test profile through each world (room 地方 tab, after temporarily marking all worlds reached in the dev DB; restore afterwards);
  - tap each target and screenshot the effect;
  - use `document.elementFromPoint` to confirm path tiles, the word card and buttons win taps;
  - emulate reduced motion if available; otherwise check the CSS media rule.
- [ ] Check Review Focus 1–5. Fix findings with TDD.
- [ ] README: the worlds have tap fun.
- [ ] `npm test && npm run build`. Expected: green, then built. **Commit** `docs: world tap fun in README`.
