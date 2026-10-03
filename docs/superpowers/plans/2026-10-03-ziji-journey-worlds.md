# 字己 Plan 6 — The journey: ink worlds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home gets an ink-drawn world behind it that changes as the child learns more characters (8 worlds, unlocked by the known count), plus a time-of-day wash, a week strip with a seal, a richer word of the day, Truffle's world lines, a 地方 tab in Truffle's room, and a slim world strip on lesson screens.

**Architecture:**
- **`src/fun/worlds.ts`** is pure logic:
  - the catalog;
  - which worlds are reached;
  - the monotonic `worldsSeen` update that also names the arrival;
  - the current world, the time of day, and Truffle's lines.
- **`src/ui/worlds/`** holds the art:
  - `scenes.ts` holds the SVG markup strings;
  - `WorldScene.tsx` draws the full background with its time-of-day layers;
  - `WorldStrip.tsx` draws the lesson strip.
- **Home, the room and the session screen** consume these. The pure parts get unit tests; the screens get render tests through `renderWithApp`.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4 (jsdom, fake-indexeddb).

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §15 (the Plan 6 scope only; the tap fun is Plan 7). The art reference is `docs/superpowers/mockups/2026-10-03-journey.html` (eight worlds) and `2026-10-03-landscapes.html` (the 月夜 evening layer), both approved by the parent.

## Global Constraints

- **World ids, names, pinyin and thresholds (exact):**

  | id | name | pinyin | unlocks at |
  |---|---|---|---|
  | `yard` | 后院 | hòuyuàn | 0 |
  | `grass` | 草丛 | cǎocóng | 30 |
  | `race` | 赛车山 | sàichē shān | 60 |
  | `blocks` | 方块世界 | fāngkuài shìjiè | 100 |
  | `dino` | 恐龙谷 | kǒnglóng gǔ | 150 |
  | `sea` | 海底 | hǎidǐ | 200 |
  | `space` | 月球基地 | yuèqiú jīdì | 300 |
  | `pirate` | 海盗岛 | hǎidào dǎo | 400 |

- **Known** = `Knowledge.known`, the Home count 认识 N 个字.
- **Unlocks never go back.** `kid.worldsSeen` is a union and is never pruned by a lower count. `kid.world` is the child's pick; null means the newest reached.
- **Arrival card:**
  - shown only for the newest of the newly reached worlds;
  - never for `yard`;
  - shown once: `worldsSeen` is saved before the card shows.
- **Truffle keeps his own outfit.** Worlds never change `kid.outfit`.
- **Art (§13 ink rules):**
  - outline `#2a2630`;
  - flat palette fills: `#7fdc7a #a8dfa4 #c9efc6 #5fbf5a #ffc94a #ffe7a3 #ff5532 #ff9b3d #ffb3c1 #4aa3ff #cfe4ff #dfe9f7 #e4efff #e4e1f5 #dcd9ef #d4c7ae #e6dcc8 #c98a4b #fffaf0 #fff1c9 #dcdde6 #c7c8d6 #5d5864 #8f8a93`;
  - no gradients, no filters inside scene markup.
  - **No IP:** no names, characters or art from any show or game.
- **Contrast:** scenery keeps to the edges and the bottom. Panels stay opaque, and Home text sits on panels or plain paper.
- **Time of day by device clock:** `morning` before 12:00, `afternoon` 12:00–17:59, `evening` from 18:00.
- **No emoji** in child-facing source (the `src/childEmoji.test.ts` contract).
- **Every child-facing Chinese string** renders through `Label` (pinyin above each character).
- **Publishing:** never push or deploy without the parent's go-ahead in chat. A push to `main` deploys the live site.

## Review Focus

1. **An existing install** with 75 known and no `worldsSeen` field:
   - the first Home visit shows one arrival card (赛车山), not three;
   - it records yard, grass and race;
   - it never shows again after a reload.
2. **A lapse** (known drops from 65 to 55): the race world stays reached and stays selectable in the room. The current world does not change.
3. **Malformed or old kid data:** `worldsSeen` is not an array, contains unknown ids, or `world` names an unknown or unreached world. Home still renders, falling back to the newest reached.
4. **Evening:** at 18:00 or later the moon, stars and lanterns show, and Home text and panels stay readable (no dark ink on dark wash).
5. **Lesson screens:** the strip sits behind the bottom bar and never covers or intercepts taps on answers, the writing square or the bottom-bar button, in portrait 768×1024 and landscape 1024×768.

---

### Task 1: World catalog and unlock logic (pure) + kid fields

**Files:**
- Create: `src/fun/worlds.ts`, `src/fun/worlds.test.ts`
- Modify: `src/types.ts` (`KidState` gains `worldsSeen: string[]` and `world: string | null`; `DEFAULT_KID` gets `worldsSeen: []` and `world: null`), `src/store/repo.ts` (`normalizeKid`), `src/store/repo.test.ts`

**Interfaces:**
- Produces:

```ts
export type WorldId = 'yard' | 'grass' | 'race' | 'blocks' | 'dino' | 'sea' | 'space' | 'pirate';
export interface WorldDef { id: WorldId; zh: string; py: string; at: number }
export const WORLDS: WorldDef[]; // in unlock order, exactly the Global Constraints table
export function worldById(id: string | null | undefined): WorldDef | undefined;
export function reachedWorlds(known: number): WorldId[]; // in unlock order; always includes 'yard'
export interface WorldUpdate { kid: KidState; arrived: WorldId | null; changed: boolean }
export function updateWorlds(kid: KidState, known: number): WorldUpdate;
export function currentWorld(kid: KidState): WorldId;
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export function timeOfDay(d: Date): TimeOfDay;
export const WORLD_LINES: Record<WorldId, string[]>;
export function worldLine(id: WorldId, dateKey: string): string;
```

- [ ] **Step 1: Write the failing tests** (`src/fun/worlds.test.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_KID } from '../types';
import { currentWorld, reachedWorlds, timeOfDay, updateWorlds, WORLD_LINES, WORLDS, worldLine } from './worlds';

const kid = (over = {}) => ({ ...DEFAULT_KID, ...over });

describe('worlds catalog', () => {
  it('has the eight worlds in unlock order with their thresholds', () => {
    expect(WORLDS.map((w) => [w.id, w.at])).toEqual([
      ['yard', 0], ['grass', 30], ['race', 60], ['blocks', 100], ['dino', 150], ['sea', 200], ['space', 300], ['pirate', 400],
    ]);
  });
  it('reaches worlds by known count, always including the backyard', () => {
    expect(reachedWorlds(0)).toEqual(['yard']);
    expect(reachedWorlds(29)).toEqual(['yard']);
    expect(reachedWorlds(75)).toEqual(['yard', 'grass', 'race']);
    expect(reachedWorlds(600)).toHaveLength(8);
  });
});

describe('updateWorlds', () => {
  it('an existing install at 75 records three worlds and announces only the newest', () => {
    const u = updateWorlds(kid(), 75);
    expect(u.kid.worldsSeen).toEqual(['yard', 'grass', 'race']);
    expect(u.arrived).toBe('race');
    expect(u.changed).toBe(true);
  });
  it('announces nothing the second time', () => {
    const once = updateWorlds(kid(), 75).kid;
    expect(updateWorlds(once, 75)).toMatchObject({ arrived: null, changed: false });
  });
  it('never announces the backyard', () => {
    expect(updateWorlds(kid(), 0)).toMatchObject({ arrived: null, changed: true });
    expect(updateWorlds(kid(), 0).kid.worldsSeen).toEqual(['yard']);
  });
  it('keeps reached worlds after a lapse', () => {
    const u = updateWorlds(kid({ worldsSeen: ['yard', 'grass', 'race'] }), 55);
    expect(u).toMatchObject({ arrived: null, changed: false });
    expect(u.kid.worldsSeen).toEqual(['yard', 'grass', 'race']);
  });
  it('an arrival resets the pick so the new world shows', () => {
    const u = updateWorlds(kid({ worldsSeen: ['yard', 'grass'], world: 'yard' }), 61);
    expect(u.arrived).toBe('race');
    expect(u.kid.world).toBeNull();
  });
});

describe('currentWorld', () => {
  it('is the newest reached when nothing is picked', () => {
    expect(currentWorld(kid({ worldsSeen: ['yard', 'grass', 'race'] }))).toBe('race');
    expect(currentWorld(kid())).toBe('yard');
  });
  it('is the pick when it has been reached', () => {
    expect(currentWorld(kid({ worldsSeen: ['yard', 'grass', 'race'], world: 'grass' }))).toBe('grass');
  });
  it('ignores a pick that is unknown or not reached', () => {
    expect(currentWorld(kid({ worldsSeen: ['yard', 'grass'], world: 'space' }))).toBe('grass');
    expect(currentWorld(kid({ worldsSeen: ['yard'], world: 'bogus' }))).toBe('yard');
  });
});

describe('timeOfDay', () => {
  it('morning before noon, afternoon until 18:00, evening after', () => {
    const at = (h: number, m = 0) => timeOfDay(new Date(2026, 9, 3, h, m));
    expect([at(7), at(11, 59), at(12), at(17, 59), at(18), at(21)]).toEqual(['morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening']);
  });
});

describe('Truffle world lines', () => {
  it('has 2–3 short Chinese lines per world, picked steadily by date', () => {
    for (const w of WORLDS) {
      const lines = WORLD_LINES[w.id];
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.length).toBeLessThanOrEqual(3);
      for (const l of lines) expect(l).toMatch(/^[\p{Script=Han}，。！？…、]+$/u);
    }
    expect(worldLine('grass', '2026-10-03')).toBe(worldLine('grass', '2026-10-03'));
    expect(WORLD_LINES.grass).toContain(worldLine('grass', '2026-10-04'));
  });
});
```

Add to `src/store/repo.test.ts`:

```ts
it('normalizes world fields from old or malformed data', () => {
  expect(normalizeKid({ petName: '松露' } as never)).toMatchObject({ worldsSeen: [], world: null });
  expect(normalizeKid({ worldsSeen: 'race', world: 7 } as never)).toMatchObject({ worldsSeen: [], world: null });
  expect(normalizeKid({ worldsSeen: ['race', 'bogus', 'yard', 'race'], world: 'bogus' } as never)).toMatchObject({ worldsSeen: ['yard', 'race'], world: null });
  expect(normalizeKid({ worldsSeen: ['yard', 'grass'], world: 'grass' } as never)?.world).toBe('grass');
});
```

- [ ] **Step 2: Run.** `npx vitest run src/fun/worlds.test.ts src/store/repo.test.ts`. Expected: FAIL (`./worlds` cannot be resolved; the normalize test fails).
- [ ] **Step 3: Implement** `src/fun/worlds.ts`:

```ts
import { mulberry32, seedFromString } from '../lib/random';
import type { KidState } from '../types';

export type WorldId = 'yard' | 'grass' | 'race' | 'blocks' | 'dino' | 'sea' | 'space' | 'pirate';
export interface WorldDef { id: WorldId; zh: string; py: string; at: number }

/** The journey, in unlock order. "at" is the known-character count (认识 N 个字). */
export const WORLDS: WorldDef[] = [
  { id: 'yard', zh: '后院', py: 'hòuyuàn', at: 0 },
  { id: 'grass', zh: '草丛', py: 'cǎocóng', at: 30 },
  { id: 'race', zh: '赛车山', py: 'sàichē shān', at: 60 },
  { id: 'blocks', zh: '方块世界', py: 'fāngkuài shìjiè', at: 100 },
  { id: 'dino', zh: '恐龙谷', py: 'kǒnglóng gǔ', at: 150 },
  { id: 'sea', zh: '海底', py: 'hǎidǐ', at: 200 },
  { id: 'space', zh: '月球基地', py: 'yuèqiú jīdì', at: 300 },
  { id: 'pirate', zh: '海盗岛', py: 'hǎidào dǎo', at: 400 },
];

const ORDER = new Map(WORLDS.map((w, i) => [w.id as string, i]));
export const worldById = (id: string | null | undefined) => WORLDS.find((w) => w.id === id);
const inOrder = (ids: Iterable<string>) => [...new Set(ids)].filter((id) => ORDER.has(id)).sort((a, b) => ORDER.get(a)! - ORDER.get(b)!) as WorldId[];

export function reachedWorlds(known: number): WorldId[] {
  return WORLDS.filter((w) => known >= w.at).map((w) => w.id);
}

export interface WorldUpdate { kid: KidState; arrived: WorldId | null; changed: boolean }

/** Record newly reached worlds (never removes any). Only the newest new one is announced, never the backyard. */
export function updateWorlds(kid: KidState, known: number): WorldUpdate {
  const seen = new Set(kid.worldsSeen);
  const fresh = reachedWorlds(known).filter((id) => !seen.has(id));
  if (!fresh.length) return { kid, arrived: null, changed: false };
  const worldsSeen = inOrder([...kid.worldsSeen, ...fresh]);
  const newest = fresh[fresh.length - 1]!;
  const arrived = newest === 'yard' ? null : newest;
  return { kid: { ...kid, worldsSeen, world: arrived ? null : kid.world }, arrived, changed: true };
}

export function currentWorld(kid: KidState): WorldId {
  const seen = inOrder(['yard', ...kid.worldsSeen]);
  return kid.world && seen.includes(kid.world as WorldId) ? (kid.world as WorldId) : seen[seen.length - 1]!;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export function timeOfDay(d: Date): TimeOfDay {
  const h = d.getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

/** What Truffle says on Home in each world. */
export const WORLD_LINES: Record<WorldId, string[]> = {
  yard: ['下雨了？不是，是水！', '我们去荡秋千！', '球在哪儿？'],
  grass: ['嘘……草里有什么？', '我听见声音了！', '小心，别吓跑它！'],
  race: ['三，二，一，出发！', '好快的车！', '我们去比赛！'],
  blocks: ['挖！挖！挖！', '这里有宝石！', '我们来盖房子！'],
  dino: ['哇，好大的恐龙！', '火山在冒烟！', '蛋里有什么？'],
  sea: ['咕噜咕噜……', '小鱼，你好！', '我们去海底！'],
  space: ['我们在月亮上！', '火箭要飞了！', '星星好亮！'],
  pirate: ['宝藏在哪儿？', '船来了！', '我们去挖宝！'],
};

export function worldLine(id: WorldId, dateKey: string): string {
  const lines = WORLD_LINES[id];
  return lines[Math.floor(mulberry32(seedFromString(`${id}:${dateKey}`))() * lines.length)]!;
}
```

In `src/types.ts`, add the fields to `KidState` (after `outfit`):

```ts
  worldsSeen: string[]; // journey worlds reached; never shrinks
  world: string | null; // the child's pick in the room; null = newest reached
```

…and `worldsSeen: [], world: null,` to `DEFAULT_KID`.

In `normalizeKid` (`src/store/repo.ts`), before the return, validate them against `worldById`, sort them into unlock order, and drop a pick that is unknown or not seen:

```ts
  const worldList = Array.isArray(kid.worldsSeen) ? kid.worldsSeen.filter((w): w is string => typeof w === 'string' && !!worldById(w)) : [];
  const worldsSeen = WORLDS.map((w) => w.id).filter((id) => worldList.includes(id));
  const world = typeof kid.world === 'string' && worldsSeen.includes(kid.world as never) ? kid.world : null;
```

Then spread `worldsSeen` and `world` into the returned object (import `WORLDS, worldById` from `../fun/worlds`).

- [ ] **Step 4: Run** the same command. Expected: PASS. Then run `npm test`. Expected: green. (Existing tests that compare whole `KidState` objects may need the two new default fields; update them to include `worldsSeen: [], world: null`.)
- [ ] **Step 5: Commit** `feat(worlds): journey catalog, unlocks that never go back, time of day, Truffle's world lines`.

### Task 2: Scene art + WorldScene + WorldStrip

**Files:**
- Create: `src/ui/worlds/scenes.ts`, `src/ui/worlds/WorldScene.tsx`, `src/ui/worlds/WorldStrip.tsx`, `src/ui/worlds/worlds.test.tsx`
- Modify: `src/styles.css`, `src/styles.test.ts`

**Interfaces:**
- Consumes: `WorldId`, `WORLDS`, `TimeOfDay` (Task 1).
- Produces:

```ts
// scenes.ts — inner SVG markup on a 360×480 canvas; ground lives at y ≥ 300.
export const SCENE_VIEWBOX = '0 0 360 480';
export const SCENES: Record<WorldId, string>;
export function timeLayers(t: TimeOfDay): { wash: string; over: string }; // wash: drawn under the scene; over: drawn above it (evening moon/stars/lanterns)
// WorldScene.tsx
export function WorldScene({ world, time }: { world: WorldId; time: TimeOfDay }): JSX.Element; // div.world-scene[data-world][data-time] > svg
// WorldStrip.tsx
export function WorldStrip({ world }: { world: WorldId }): JSX.Element; // div.world-strip[data-world] > svg cropped to the ground band
```

**Art source:**
- Port each world's markup from the approved mockup `docs/superpowers/mockups/2026-10-03-journey.html`. That is the inner content of the `<svg class="scene" viewBox="0 0 360 480">` inside each `figure[data-choice="<id>"]`; the ids match the world ids.
- Take the evening layer (`over`) from the `figure[data-choice="night"]` scene in `2026-10-03-landscapes.html`: the moon, the four sparkle stars, the lantern-string path and the four lanterns. Leave out its hills and sky rects.
- Clean up while porting:
  - every scene follows the palette;
  - no `<filter>`, no gradients;
  - the grass scene's "!" marks and the dino neck read clearly at iPad size. The mockup's dino neck reads as a plain green arc: give it a head with an eye and a smile, and a spot or two.

- [ ] **Step 1: Write the failing tests** (`src/ui/worlds/worlds.test.tsx`):

```tsx
import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../fun/worlds';
import { SCENES, timeLayers } from './scenes';
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
    expect(el.querySelector('svg')!.getAttribute('viewBox')).toBe('0 300 360 180');
  });
});
```

Add to `src/styles.test.ts`:

```ts
describe('world layers never get in the way', () => {
  it('scene and strip ignore taps and sit behind content', () => {
    expect(css).toMatch(/\.world-scene \{[^}]*pointer-events: none[^}]*z-index: -1/);
    expect(css).toMatch(/\.world-strip \{[^}]*pointer-events: none/);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/ui/worlds src/styles.test.ts`. Expected: FAIL (missing modules and CSS).
- [ ] **Step 3: Implement.**

`timeLayers`:
- `morning`: wash `<rect width="360" height="300" fill="#eef5ff" opacity=".6"/>`, over `''`.
- `afternoon`: wash `<rect width="360" height="300" fill="#fff1c9" opacity=".55"/>`, over `''`.
- `evening`: wash `<rect width="360" height="220" fill="#dcd9ef"/>`. The over layer is the moon group `<g data-part="moon">…</g>`, the star paths, and the lantern string with four `<g data-part="lantern">…</g>`.

`WorldScene.tsx`:

```tsx
import type { TimeOfDay, WorldId } from '../../fun/worlds';
import { SCENE_VIEWBOX, SCENES, timeLayers } from './scenes';

/** The journey world behind Home: time-of-day wash, the world, then evening extras. Decorative. */
export function WorldScene({ world, time }: { world: WorldId; time: TimeOfDay }) {
  const { wash, over } = timeLayers(time);
  return (
    <div class="world-scene" data-world={world} data-time={time} aria-hidden="true">
      <svg viewBox={SCENE_VIEWBOX} preserveAspectRatio="xMidYMax slice" dangerouslySetInnerHTML={{ __html: wash + SCENES[world] + over }} />
    </div>
  );
}
```

`WorldStrip.tsx`:

```tsx
import type { WorldId } from '../../fun/worlds';
import { SCENES } from './scenes';

/** A slim band of the world's ground for lesson screens. Decorative, behind the bottom bar. */
export function WorldStrip({ world }: { world: WorldId }) {
  return (
    <div class="world-strip" data-world={world} aria-hidden="true">
      <svg viewBox="0 300 360 180" preserveAspectRatio="xMidYMax slice" dangerouslySetInnerHTML={{ __html: SCENES[world] }} />
    </div>
  );
}
```

CSS, in the ink layer section of `src/styles.css`:

```css
.world-scene { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.world-scene svg { width: 100%; height: 100%; display: block; }
.world-strip { position: absolute; left: 0; right: 0; bottom: 0; height: 190px; z-index: -1; pointer-events: none; overflow: hidden; }
.world-strip svg { width: 100%; height: 100%; display: block; }
```

- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Gallery.**
  - Render all 8 worlds × 3 times of day, and each world's strip, to the visual companion. Use a temporary vitest file in `src/tmpgallery/` that writes HTML to `$OUT`, and delete it afterwards.
  - Check the drawings at a 768×1024 frame. Iterate on any that look broken; the parent already approved the direction.
- [ ] **Step 6: Run** `npm test`. Expected: green. **Commit** `feat(worlds): ink art for the eight worlds, time-of-day layers, lesson strip`.

### Task 3: Home: world background, Truffle's line, arrival card

**Files:**
- Modify: `src/app/HomeScreen.tsx`, `src/styles.css`
- Test: `src/app/home.test.tsx`

**Interfaces:**
- Consumes: `updateWorlds`, `currentWorld`, `timeOfDay`, `worldLine`, `worldById` (Task 1); `WorldScene`, `SCENES`, `SCENE_VIEWBOX` (Task 2); `saveKid` (`src/store/repo.ts`); `refresh` (`useApp()`).
- Produces: Home markup:
  - `.world-scene` replaces `<Scene kind="home" band />`;
  - the Pet bubble shows `worldLine(world, today)` when Truffle is awake;
  - `div.arrival[role=dialog][aria-label="新地方"]` holds a scene thumbnail, `Label` "到{zh}了！" and a `走吧！` button.

- [ ] **Step 1: Write the failing tests** (add to `src/app/home.test.tsx`; `seedKnown(app, n)` is a new local helper that puts `n` built-in words with known recognise cards into `app.db`, using `makeCard(id, 'recognise', due, true)` from `src/test/fixtures`):

```tsx
describe('HomeScreen journey', () => {
  it('draws the newest reached world and Truffle says a line from it', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, worldsSeen: ['yard', 'grass'] } });
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect(document.querySelector('.world-scene')?.getAttribute('data-world')).toBe('grass');
    expect(WORLD_LINES.grass).toContain(document.querySelector('.pet__bubble .sr-only')?.textContent); // every line is several characters, so the label carries one readable copy
  });
  it('an existing install at 61 known announces 赛车山 once and remembers it', async () => {
    const app = await makeAppData();
    await seedKnown(app, 61);
    const first = renderWithApp(<HomeScreen />, app);
    const card = await screen.findByRole('dialog', { name: '新地方' });
    expect(card.textContent).toContain('到赛车山了！');
    expect((await getKid(app.db))?.worldsSeen).toEqual(['yard', 'grass', 'race']);
    fireEvent.click(screen.getByText('走吧！'));
    expect(screen.queryByRole('dialog', { name: '新地方' })).toBeNull();
    first.unmount();
    renderWithApp(<HomeScreen />, { ...app, kid: await getKid(app.db) });
    await screen.findByText('今天的练习');
    expect(screen.queryByRole('dialog', { name: '新地方' })).toBeNull();
  });
  it('a lapse keeps the reached world', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, worldsSeen: ['yard', 'grass', 'race'] } });
    await seedKnown(app, 40);
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect(document.querySelector('.world-scene')?.getAttribute('data-world')).toBe('race');
    expect(screen.queryByRole('dialog', { name: '新地方' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/app/home.test.tsx`. Expected: FAIL (there is no `.world-scene` and no dialog).
- [ ] **Step 3: Implement** in `HomeScreen.tsx`:
  - after `data` loads, compute `const u = updateWorlds(k, data.know.known)`;
  - if `u.changed`, then `await saveKid(db, u.kid)`, `await refresh()`, and `setArrival(u.arrived)`. Do this in a `useEffect` keyed on `data`, so it runs once per load;
  - `const world = currentWorld(k)`;
  - replace `<Scene kind="home" band />` with `<WorldScene world={world} time={timeOfDay(now())} />`;
  - pass `bubble={sleepy ? null : worldLine(world, today)}` to the Home `Pet`;
  - render the arrival dialog when `arrival` is set:

```tsx
{arrival && (
  <div class="arrival" role="dialog" aria-label="新地方">
    <div class="arrival__card">
      <svg class="arrival__scene" viewBox={SCENE_VIEWBOX} aria-hidden="true" dangerouslySetInnerHTML={{ __html: SCENES[arrival] }} />
      <h2><Label zh={`到${worldById(arrival)!.zh}了！`} /></h2>
      <button type="button" class="btn btn--primary btn--big" onClick={() => setArrival(null)}><Label zh="走吧！" /></button>
    </div>
  </div>
)}
```

CSS:

```css
.arrival { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgba(42, 38, 48, 0.35); }
.arrival__card { background: var(--surface); border: var(--panel-border); box-shadow: var(--panel-shadow); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 12px; width: min(420px, 88vw); }
.arrival__scene { width: 100%; aspect-ratio: 3 / 4; max-height: 52vh; border: var(--panel-border); border-radius: var(--radius); background: var(--paper); }
```

  - Remove the `Scene` import if it is now unused in Home.
- [ ] **Step 4: Run** `npx vitest run src/app/home.test.tsx`. Expected: PASS. Then `npm test`. Expected: green. (An older Home test may assert the bubble is absent; update it to the world line.)
- [ ] **Step 5: Commit** `feat(home): journey world behind Home, Truffle's world line, arrival card`.

### Task 4: Home: week strip + seal, word-of-the-day example

**Files:**
- Modify: `src/stats/stats.ts` (`weekDays`), `src/stats/stats.test.ts`, `src/activities/writing/cue.ts` (extract `pickExample`), `src/activities/writing/cue.test.ts`, `src/app/HomeScreen.tsx`, `src/styles.css`, `src/app/home.test.tsx`
- Create: `src/app/WeekStrip.tsx`

**Interfaces:**
- Produces:

```ts
// stats.ts
export interface WeekDay { label: string; date: string; done: boolean; today: boolean }
export function weekDays(sessions: SessionRecord[], today: string): WeekDay[]; // Monday-first, 7 entries, labels 一二三四五六日
// cue.ts
export function pickExample(word: Word): { example: Example; once: boolean } | null; // the rules writingCue already uses
// WeekStrip.tsx
export function WeekStrip({ days }: { days: WeekDay[] }): JSX.Element; // div.week[aria-label="这个星期练了 N 天"] with 7 .week__day (.is-done / .is-today)
```

- [ ] **Step 1: Write the failing tests.**

`src/stats/stats.test.ts`:

```ts
describe('weekDays', () => {
  it('Monday to Sunday of this week, filled where a lesson was finished', () => {
    const s = (date: string, over = {}) => ({ ...makeSession(date), completed: true, ...over });
    const days = weekDays([s('2026-09-28'), s('2026-09-29'), s('2026-10-01'), s('2026-10-02', { free: true }), s('2026-09-30', { completed: false }), s('2026-09-27')], '2026-10-03');
    expect(days.map((d) => d.label).join('')).toBe('一二三四五六日');
    expect(days.map((d) => d.done)).toEqual([true, true, false, true, false, false, false]);
    expect(days.findIndex((d) => d.today)).toBe(5);
  });
  it('a Sunday is the end of its week', () => {
    expect(weekDays([], '2026-10-04').findIndex((d) => d.today)).toBe(6);
  });
});
```

(`makeSession` is a local helper building a minimal `SessionRecord` for a date. Reuse the existing session fixture in `stats.test.ts` if there is one.)

`src/activities/writing/cue.test.ts`:

```ts
describe('pickExample', () => {
  it('shares the writing rules: matching reading, one occurrence preferred', () => {
    const nai = makeWord('奶', { pinyin: 'nǎi', examples: [{ text: '奶奶', pinyin: 'nǎi nai' }, { text: '牛奶', pinyin: 'niú nǎi' }] });
    expect(pickExample(nai)).toEqual({ example: { text: '牛奶', pinyin: 'niú nǎi' }, once: true });
    expect(pickExample(makeWord('八', { examples: [] }))).toBeNull();
  });
});
```

`src/app/home.test.tsx`:

```tsx
describe('HomeScreen week and word of the day', () => {
  it('shows this week with the seal, and an example word under the word of the day', async () => {
    const app = await makeAppData();
    await seedKnownWithExample(app); // 他 known, with example 他们 tā men
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect(document.querySelectorAll('.week__day')).toHaveLength(7);
    expect(document.querySelector('.seal')?.textContent).toBe('字己');
    expect(document.querySelector('.wotd__example .label')?.getAttribute('data-py')).toBe('tā men');
  });
});
```

(`seedKnownWithExample` puts only the built-in word `他` with `examples: [{ text: '他们', pinyin: 'tā men' }]` and a known recognise card, so the word of the day is 他.)

- [ ] **Step 2: Run** `npx vitest run src/stats src/activities/writing src/app/home.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **`weekDays`:** find Monday with `day = parseDateKey(today)` and `offset = (day.getDay() + 6) % 7`, then step through 7 days with `addDays`. A day is `done` when there is a session with that date where `completed && !free`.
  - **`pickExample`:** move the `usable`/`once` selection out of `writingCue` into `pickExample`, and make `writingCue` call it, with no behaviour change. The cue tests stay green.
  - **`WeekStrip`:** a row of 7 cells, each a small ink circle (`.is-done` fills it with `#ff5532`) above its weekday `Label`.
  - **Home:**
    - the header becomes two rows: the stats row as now, and a second row with `<span class="seal" aria-hidden="true">字己</span>` followed by `<WeekStrip days={weekDays(data.sessions, today)} />`;
    - the word-of-the-day card becomes a `div.card.wotd` holding a `button` (aria-label `今日一字：{wotd}`, speaks the character) for the character and its pinyin;
    - when `pickExample(data.know.wordsById.get('b:' + wotd))` returns a value, add a second `button.wotd__example` (aria-label `听：{text}`) showing `<Label zh={text} py={pinyin} />` and an `InkIcon` speaker. It speaks the example.
  - **CSS:** the seal is a red square with vertical cream text, slightly rotated, as in the mockup. `.week` is a panel chip with 7 cells, and `.week__day.is-today` gets an ink underline.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then `npm test`. Expected: green. (The existing word-of-the-day test may query the old button; keep its aria-label `今日一字：…`.)
- [ ] **Step 5: Commit** `feat(home): this week's strip with the 字己 seal; example word under the word of the day`.

### Task 5: Truffle's room 地方 tab

**Files:**
- Modify: `src/app/Wardrobe.tsx`, `src/styles.css`
- Test: `src/app/home.test.tsx` (room tests live there)

**Interfaces:**
- Consumes: `WORLDS`, `currentWorld` (Task 1); `SCENES`, `SCENE_VIEWBOX` (Task 2).
- Produces:
  - `RoomTab` gains `'places'`, with a third tab chip `地方`;
  - the panel `div.places[role=tabpanel]` holds one `button.place` per world (`aria-pressed` is true for the current world; locked ones are `disabled` and show `{at} 个字`).

- [ ] **Step 1: Write the failing test:**

```tsx
describe("Truffle's room places", () => {
  it('lists all eight worlds, picks a reached one, and shows how far the locked ones are', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, worldsSeen: ['yard', 'grass', 'race'] } });
    renderWithApp(<Wardrobe />, app);
    fireEvent.click(await screen.findByRole('tab', { name: '地方' }));
    const places = [...document.querySelectorAll('button.place')];
    expect(places).toHaveLength(8);
    expect(places.filter((p) => (p as HTMLButtonElement).disabled)).toHaveLength(5);
    expect(places[2]!.getAttribute('aria-pressed')).toBe('true'); // newest by default
    expect(places[3]!.textContent).toContain('100');
    fireEvent.click(places[1]!);
    await waitFor(async () => expect((await getKid(app.db))?.world).toBe('grass'));
    expect(places[1]!.getAttribute('aria-pressed')).toBe('true');
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/app/home.test.tsx -t "places"`. Expected: FAIL (there is no 地方 tab).
- [ ] **Step 3: Implement.**
  - Add the tab chip `地方` after `能力`.
  - In the panel, map over `WORLDS`. A world is reached when `id === 'yard' || k.worldsSeen.includes(id)`.
  - Each button holds:
    - `<svg class="place__thumb" viewBox="0 160 360 320" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SCENES[id] }} />`;
    - `<Label zh={zh} />`;
    - for a locked world, `<InkIcon name="lock" size={20} />` and `<Label zh={`${at} 个字`} />`.
  - On click: `save({ ...k, world: id })`.
  - `aria-pressed={currentWorld(k) === id}`.
  - CSS: a grid of tiles like `.outfits`. Locked thumbnails get `filter: grayscale(1); opacity: .45` (this filter is on the HTML element, not inside the SVG, so it does not break the scene-markup rule).
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(room): 地方 tab — pick any reached world, see what unlocks next`.

### Task 6: Lesson strip

**Files:**
- Modify: `src/app/SessionScreen.tsx`
- Test: `src/app/SessionScreen.test.tsx` (its `setup()` helper builds an app with words and flash-only settings)

**Interfaces:**
- Consumes: `currentWorld` (Task 1), `WorldStrip` (Task 2).

- [ ] **Step 1: Write the failing test** in the SessionScreen test file:

```tsx
it('shows a strip of the current world behind the lesson', async () => {
  const app = { ...(await setup()), kid: { ...DEFAULT_KID, worldsSeen: ['yard', 'grass'] } };
  renderWithApp(<SessionScreen free={false} />, app);
  await waitFor(() => expect(document.querySelector('.world-strip')?.getAttribute('data-world')).toBe('grass'));
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Render `<WorldStrip world={currentWorld(kid ?? DEFAULT_KID)} />` as the first child of the session's `div.screen`. `.screen` is already `position: relative; z-index: 1` (a stacking context), so the strip's `z-index: -1` paints above the page background and below the lesson content. Import `DEFAULT_KID` from `../types` if the file doesn't already.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(lessons): slim strip of the current world behind each lesson`.

### Task 7: Walkthrough + docs

- [ ] In the browser at 768×1024 and 1024×768, with the seed profile (localhost:4173; clear the service worker after each build):
  - Home in each of the 3 reached worlds via the room;
  - the arrival card (dev IndexedDB: clear `worldsSeen`, reload, then restore);
  - evening: there is no clock override, so check it with the Task 2 gallery's evening frames, which use the same `WorldScene`. Read panel text over the indigo wash at 768×1024;
  - a lesson with the strip: tap answers near the bottom, the writing square and the bottom-bar button;
  - the room 地方 tab.
- [ ] Check the Review Focus items 1–5 explicitly, and fix findings with TDD.
- [ ] Update `README.md` (feature list) and `CREDITS.md` if new art credits apply (none expected: all art is original).
- [ ] `npm test && npm run build`. Expected: green, then built. **Commit** `docs: journey worlds in README`.
