# 字己 Truffle — Plan 2: Powers + 字卡 Collection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Give Truffle 11 radical-family powers in three tiers. They never go down, and they are unlocked with a press-and-hold "新能力！" moment.
- Replace the sticker book with a 字卡 character collection.
- Add a powers tab to Truffle's room.

**Architecture:**
- New pure modules: `src/fun/powers.ts`, `src/fun/collection.ts`, and `normalizeKid` in `src/store/repo.ts`.
- Power art is procedural SVG markup in `src/ui/truffle/powers.ts`, drawn as Truffle's layer 7. It combines a per-power mark (tier 1), an aura in the power colour (tier 2), and a cape printed with the power's character (tier 3).
- `Pet` reads `kid.activePower` and `kid.powerTiersSeen` (the shown tier is the celebrated tier).
- Celebration gains a `power` phase.
- `CollectionScreen` replaces `StickerBook` on the `stickers` route.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4, ts-fsrs 5.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §5, §6, §8, §9 plan 2 (plan 1 is merged into this branch).

## Global Constraints

- **Powers (exact):** each id has a Chinese name and its radicals.

  | id | name | radicals |
  |---|---|---|
  | water | 水 | 氵 水 |
  | fire | 火 | 火 灬 |
  | wood | 木 | 木 |
  | metal | 金 | 金 钅 |
  | earth | 土 | 土 |
  | roar | 口 | 口 |
  | friends | 亻 | 亻 人 |
  | voice | 讠 | 讠 言 |
  | dash | 辶 | 辶 |
  | heart | 心 | 心 忄 |
  | sun | 日 | 日 |

  `冫` is not water.
- **Family:** built-in characters whose `radical` is in the list, excluding characters that are themselves one of the radicals.
- **Tiers:** 1 at `min(3, size)` known; 2 at `ceil(size / 2)`; 3 at all known.
- **"Known"** is the earned rule: card state Review or Relearning, i.e. `Knowledge.knownChars`.
- **The shown tier** is `kid.powerTiersSeen[id] ?? 0`. It is saved as a maximum and never decreases.
- **Collection stars** come from recognise-card stability: under 7 = 1, 7–29 = 2, 30+ = 3.
  - Gold = the write card is earned (Review or Relearning).
  - Rarity: level 1 = common, level 2 = rare.
- **`KidState` new fields:**
  - `activePower: string | null` (default `null`);
  - `powerTiersSeen: Record<string, number>` (default `{}`);
  - `normalizeKid` fills them on read. `lastStageSeen` stays in the type but is unused.
- **No new dependencies.** Child-facing meanings are radical-only (from `RADICALS`).
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **Power tiers never go down.** A lapse that drops `known` below a threshold must keep the celebrated tier on Truffle and in the room.
2. **Tiny families:** 金 (5) and 火 (7) must give sensible tiers. A family of size ≤ 3 reaches tier 1 only when all are known. Tier 2 must never come before tier 1.
3. **Old installs:** a kid record without the new fields must load with defaults, and its backups must restore.
4. **Several tiers unlocked in one session** must all be saved. The power phase shows the highest new one, and Truffle shows it straight after.
5. **Collection with zero known characters**, and parent words that contain power radicals: the built-in power families must not change.

---

### Task 1: Power rules (pure)

**Files:**
- Create: `src/fun/powers.ts`
- Test: `src/fun/powers.test.ts`

**Interfaces:**
- Produces:

```ts
export type PowerId = 'water' | 'fire' | 'wood' | 'metal' | 'earth' | 'roar' | 'friends' | 'voice' | 'dash' | 'heart' | 'sun';
export interface PowerDef { id: PowerId; name: string; radicals: string[]; color: string; mark: string }
export const POWERS: PowerDef[]; // order as in Global Constraints
export function powerFamilies(builtin: BuiltinChar[]): Record<PowerId, string[]>; // chars by rank
export function tierFor(size: number, known: number): 0 | 1 | 2 | 3;
export interface PowerProgress { id: PowerId; known: number; size: number; tier: 0 | 1 | 2 | 3 }
export function powerProgress(families: Record<PowerId, string[]>, knownChars: Set<string>): PowerProgress[];
export function newTiers(progress: PowerProgress[], seen: Record<string, number>): { id: PowerId; tier: number }[]; // tier > seen
export function powerOf(char: BuiltinChar): PowerId | null;
```

Colours and marks (used by the art):

| Power | Colour | Mark |
|---|---|---|
| water | `#4aa3ff` | 💧 |
| fire | `#ff6a3d` | 🔥 |
| wood | `#46b06a` | 🍃 |
| metal | `#b9a46a` | ✨ |
| earth | `#b07a4a` | 🪨 |
| roar | `#ff8fb1` | 📣 |
| friends | `#7b8cff` | 🤝 |
| voice | `#2fbfb0` | 💬 |
| dash | `#ffc94a` | 💨 |
| heart | `#ff5a7a` | 💗 |
| sun | `#ffb020` | ☀️ |

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { BUILTIN } from '../content';
import { newTiers, powerFamilies, powerOf, powerProgress, POWERS, tierFor } from './powers';

describe('powers', () => {
  const fam = powerFamilies(BUILTIN);
  it('builds families from content, leaving out 冫 and the radicals themselves', () => {
    expect(POWERS).toHaveLength(11);
    expect(fam.water).toContain('河');
    expect(fam.water).not.toContain('冷');
    expect(fam.water).not.toContain('水');
    expect(fam.fire).not.toContain('火');
    expect(fam.metal.length).toBeGreaterThanOrEqual(5);
  });
  it('tiers: 3 known, half, all — sensible for tiny families', () => {
    expect([0, 2, 3, 9, 10, 19, 20].map((k) => tierFor(20, k))).toEqual([0, 0, 1, 1, 2, 2, 3]);
    // size 5: t1 = 3, t2 = max(ceil(5/2), t1) = 3, t3 = 5 → the higher tier wins when thresholds coincide
    expect([0, 2, 3, 4, 5].map((k) => tierFor(5, k))).toEqual([0, 0, 2, 2, 3]);
    // size 2: t1 = t2 = t3 = 2 → nothing until both are known, then mastered
    expect([0, 1, 2].map((k) => tierFor(2, k))).toEqual([0, 0, 3]);
    expect(tierFor(0, 0)).toBe(0);
  });
  it('reports only tiers above what the child has already seen', () => {
    const p = powerProgress({ ...fam, water: ['河', '海', '湖', '洗'] }, new Set(['河', '海', '湖', '洗']));
    const w = p.find((x) => x.id === 'water')!;
    expect(w.tier).toBe(3);
    expect(newTiers(p, { water: 3 }).find((n) => n.id === 'water')).toBeUndefined();
    expect(newTiers(p, { water: 1 }).find((n) => n.id === 'water')?.tier).toBe(3);
  });
  it('knows a character’s power', () => {
    expect(powerOf(BUILTIN.find((c) => c.char === '河')!)).toBe('water');
    expect(powerOf(BUILTIN.find((c) => c.char === '大')!)).toBeNull();
  });
});
```

- [ ] **Step 2: Run.** `npx vitest run src/fun/powers.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement.**
  - `tierFor`: `t1 = min(3, size)`, `t2 = max(ceil(size / 2), t1)`, `t3 = size`. If `size === 0`, return 0. Otherwise return 3 if known ≥ t3, else 2 if ≥ t2, else 1 if ≥ t1, else 0.
  - `powerFamilies`: for each power, the `BUILTIN` characters with `radical ∈ radicals` and `char ∉ radicals`, sorted by rank.
  - `powerOf`: the first power whose `radicals` include `char.radical` and not `char.char`.
- [ ] **Step 4: Run.** Expected: PASS (4/4).
- [ ] **Step 5: Commit.** `git add src/fun/powers.ts src/fun/powers.test.ts && git commit -m "feat(powers): radical-family powers with never-lower tiers"`

---

### Task 2: Kid state defaults (`normalizeKid`)

**Files:**
- Modify: `src/types.ts`, `src/store/repo.ts`
- Test: `src/store/repo.test.ts`, `src/store/backup.test.ts`

**Interfaces:**
- Produces:
  - `KidState` gains `activePower: string | null` and `powerTiersSeen: Record<string, number>`;
  - `DEFAULT_KID` gains `activePower: null, powerTiersSeen: {}`;
  - `normalizeKid(raw: Partial<KidState> | null | undefined): KidState | null`, i.e. `null` → `null`, otherwise `{ ...DEFAULT_KID, ...raw }`;
  - `getKid` returns `normalizeKid(...)`.

- [ ] **Step 1: Write the failing tests**

```ts
it('fills new kid fields with defaults for dragon-era records', async () => {
  const db = await freshDb();
  await db.put('kid', { petName: '小龙', petColor: 'green', ownedAccessories: ['👑'], wearing: '👑', bonusStars: 2, lastChestDate: null, lastStageSeen: 3, badgesSeen: [] } as never, 'main');
  const kid = await getKid(db);
  expect(kid).toMatchObject({ wearing: '👑', activePower: null, powerTiersSeen: {} });
});
```

  In `backup.test.ts`: restoring a backup whose `kid` has no new fields, then calling `getKid`, gives the defaults.
- [ ] **Step 2: Run.** Expected: FAIL (`activePower` undefined).
- [ ] **Step 3: Implement**, as above.
- [ ] **Step 4: Run.** `npm test`. Expected: green. Update any `toEqual(DEFAULT_KID)`-style tests if needed.
- [ ] **Step 5: Commit.** `git commit -am "feat(kid): normalizeKid fills power fields for old records"`

---

### Task 3: Power art on Truffle

**Files:**
- Create: `src/ui/truffle/powers.ts`
- Modify: `src/ui/truffle/Truffle.tsx`, `src/ui/Pet.tsx`, `src/styles.css`
- Test: `src/ui/truffle/Truffle.test.tsx`, `src/ui/widgets.test.tsx`

**Interfaces:**
- Consumes: `POWERS`, `PowerId` from Task 1.
- Produces:
  - `powerLayer(id: PowerId, tier: 1 | 2 | 3): { back: string; front: string }`
    - `back` is drawn before the body: the tier ≥ 2 aura, and the tier-3 cape;
    - `front` is drawn after the face: the per-power mark at its anchor;
    - all coordinates are in the Truffle viewBox `30 20 260 270`.
  - `Truffle` gains `power?: PowerId | null` and `powerTier?: 0 | 1 | 2 | 3`.
    - The root svg gets `data-power` and `data-tier`.
    - The layers are `.truffle__power-back` and `.truffle__power-front`.
  - `Pet` passes `power={kid.activePower}` and `powerTier={kid.powerTiersSeen[kid.activePower] ?? 0}`. Nothing is drawn at tier 0.

**Art (procedural):**
- **Aura:**
  `<circle cx="160" cy="170" r="128" fill="{color}" opacity=".18"/>`
  `<circle cx="160" cy="170" r="112" fill="none" stroke="{color}" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round" opacity=".7"/>`
- **Cape:**
  `<path d="M96 206 C80 240 78 270 92 288 L228 288 C242 270 240 240 224 206 Z" fill="{color}" stroke="#2a2630" stroke-width="3.2" stroke-linejoin="round"/>`
  plus `<text x="160" y="266" text-anchor="middle" font-family="WenKai, serif" font-size="40" fill="#fffdf7">{name}</text>`
- **Mark:** the emoji at x=236, y=64, size 34 for most powers. Exceptions:
  - 💗 and 💧 go on the cheek at (226,150), size 22;
  - 💨 goes behind at (72,214), size 34.

- [ ] **Step 1: Write the failing tests**

```tsx
it('draws a power by tier: mark, then aura, then cape with the power character', () => {
  const t1 = render(<Truffle power="fire" powerTier={1} />);
  expect(t1.container.querySelector('svg.truffle')?.getAttribute('data-power')).toBe('fire');
  expect(t1.container.querySelector('.truffle__power-front')?.textContent).toContain('🔥');
  expect(t1.container.querySelector('.truffle__power-back')?.innerHTML).toBe('');
  t1.unmount();
  const t3 = render(<Truffle power="fire" powerTier={3} />);
  expect(t3.container.querySelector('.truffle__power-back')?.textContent).toContain('火');
  expect(t3.container.querySelectorAll('.truffle__power-back circle').length).toBe(2);
});
it('draws nothing for tier 0 or no power', () => {
  const { container } = render(<Truffle power="fire" powerTier={0} />);
  expect(container.querySelector('.truffle__power-front')).toBeNull();
});
```

  and in `widgets.test.tsx`:

```tsx
it('Pet shows the chosen power at the tier the child has seen', () => {
  const { container } = render(<Pet kid={{ ...DEFAULT_KID, activePower: 'water', powerTiersSeen: { water: 2 } }} />);
  expect(container.querySelector('svg.truffle')?.getAttribute('data-tier')).toBe('2');
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Back layers render before `.truffle__body`; front layers render inside the head group after the face.
- [ ] **Step 4: Run.** `npx vitest run src/ui`. Expected: PASS.
- [ ] **Step 5: Visual check.** Render tiers 1–3 for fire, water and dash in the browser at 768×1024, via a temporary dev-only override of the kid record in IndexedDB, restored afterwards.
- [ ] **Step 6: Commit.** `git commit -am "feat(powers): power marks, auras and capes on Truffle"` (add the new file).

---

### Task 4: "新能力！" celebration phase

**Files:**
- Modify: `src/app/Celebration.tsx`, `src/app/celebration.test.tsx`

**Interfaces:**
- Consumes: Tasks 1–3, plus `HoldButton`.
- Produces:
  - Phase order: `stars` → `chest` (if allowed) → `power` (if `newTiers` is non-empty) → `badges` (if new badges).
  - The power phase:
    - shows the highest new tier, ties broken by `POWERS` order;
    - shows the radical (the first in the list), its `RADICALS` meaning and "新能力！";
    - shows Truffle at the old tier, with a `HoldButton` labelled `按住，变身！`.
  - On completion:
    - save `powerTiersSeen` as the per-id max of old and all new tiers;
    - set `activePower` to the shown power;
    - Truffle re-renders at the new tier with `cheer`, a burst and `levelUp` sfx;
    - the `继续` button appears.

- [ ] **Step 1: Write the failing test**

```tsx
it('powers Truffle up when a tier is newly reached, and remembers it', async () => {
  const app = await makeAppData();
  const water = powerFamilies(BUILTIN).water.slice(0, 3);
  await putWords(app.db, builtinWords(0));
  await putCards(app.db, water.map((c) => makeCard(`b:${c}`, 'recognise', new Date(2026, 9, 20), true)));
  await saveKid(app.db, { ...DEFAULT_KID, lastChestDate: '2026-10-02' });
  renderWithApp(<Celebration rec={finished('2026-10-02', ['flashcards'])} />, app);
  await screen.findByText('太棒了！');
  fireEvent.click(screen.getByText('继续'));
  expect(await screen.findByText('新能力！')).toBeTruthy();
  fireEvent(screen.getByRole('button', { name: '按住，变身！' }), new Event('pointerdown', { bubbles: true }));
  await hold();
  await waitFor(async () => expect((await getKid(app.db))?.powerTiersSeen.water).toBe(1));
  expect((await getKid(app.db))?.activePower).toBe('water');
});
```

  Imports: `powerFamilies` from `../fun/powers`, `BUILTIN` and `builtinWords` from `../content`, `putWords` and `putCards` from `../store/repo`, `makeCard` from `../test/fixtures`.
- [ ] **Step 2: Run.** Expected: FAIL (no power phase).
- [ ] **Step 3: Implement**, as above.
- [ ] **Step 4: Run.** `npx vitest run src/app/celebration.test.tsx`. Expected: PASS. Then `npm test`.
- [ ] **Step 5: Commit.** `git commit -am "feat(powers): 新能力 celebration phase with hold-to-power-up"`

---

### Task 5: 字卡 collection (pure + screen)

**Files:**
- Create: `src/fun/collection.ts`, `src/fun/collection.test.ts`, `src/app/CollectionScreen.tsx`
- Modify: `src/App.tsx` (the `stickers` route renders `CollectionScreen`), `src/ui/TabBar.tsx` (label `字卡`), `src/app/home.test.tsx` (the StickerBook tests move to the collection), `src/styles.css`
- Delete: `src/app/StickerBook.tsx`

**Interfaces:**
- Produces:

```ts
export interface CharCard { char: string; pinyin: string; example: string | null; power: PowerId | null; caught: boolean; stars: 0 | 1 | 2 | 3; gold: boolean; rarity: 'common' | 'rare' }
export function starsFor(stability: number): 1 | 2 | 3; // <7 → 1, <30 → 2, else 3
export function collectionCards(builtin: BuiltinChar[], know: Knowledge): CharCard[];
```

- **Caught** = `know.knownChars.has(char)`.
- **Stars:** from the recognise card's `fsrs.stability`; 0 when not caught.
- **Gold** = the write card for `b:${char}` is earned (state Review or Relearning).

**Screen:**
- **Header:** 字卡 and the counter `caught / total`.
- **Filter chips:** 全部 (all) / one per power (its mark and name) / 金卡 (gold).
- **Grid:**
  - an uncaught card shows its power mark only (class `card--back`), or `?` if it has no power;
  - a caught card shows the character, its pinyin, stars and the mark, with `card--gold` and `card--rare` classes as they apply.
- **Tapping a caught card** opens a large flipped view (a dialog) with the example word and a speak button, and speaks the character.
- **Below the grid:**
  - the badges row (the existing `completedBadges` ∪ `badgesSeen` logic, unchanged);
  - the 我的字 section for parent words (the existing logic).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { BUILTIN, builtinWords } from '../content';
import { summarize } from '../stats/stats';
import { makeCard } from '../test/fixtures';
import { collectionCards, starsFor } from './collection';

describe('collection', () => {
  it('stars by memory strength', () => {
    expect([0.5, 6.9, 7, 29, 30, 200].map(starsFor)).toEqual([1, 1, 2, 2, 3, 3]);
  });
  it('one card per built-in character; caught, gold and rarity', () => {
    const now = new Date(2026, 9, 2);
    const words = builtinWords(0);
    const rec = { ...makeCard('b:河', 'recognise', new Date(2026, 9, 20), true) };
    rec.fsrs = { ...rec.fsrs, stability: 40 };
    const wr = makeCard('b:河', 'write', new Date(2026, 9, 20), true);
    const cards = collectionCards(BUILTIN, summarize(words, [rec, wr]));
    expect(cards).toHaveLength(BUILTIN.length);
    const he = cards.find((c) => c.char === '河')!;
    expect(he).toMatchObject({ caught: true, stars: 3, gold: true, power: 'water' });
    expect(cards.find((c) => c.char === '大')).toMatchObject({ caught: false, stars: 0, gold: false });
    expect(new Set(cards.map((c) => c.rarity))).toEqual(new Set(['common', 'rare']));
    void now;
  });
});
```

  and in `home.test.tsx`, replacing the StickerBook family test:

```tsx
describe('CollectionScreen', () => {
  it('counts caught cards and filters by power', async () => {
    const app = await makeAppData();
    await putWords(app.db, builtinWords(0));
    await putCards(app.db, [makeCard('b:河', 'recognise', new Date(2026, 9, 20), true)]);
    renderWithApp(<CollectionScreen />, app);
    expect(await screen.findByText(`1 / ${BUILTIN.length}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /水/ }));
    expect(screen.getByRole('button', { name: '河' })).toBeTruthy();
    expect(document.querySelectorAll('.zika:not(.card--back)')).toHaveLength(1);
  });
  it('keeps earned badges', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, badgesSeen: ['氵'] } });
    renderWithApp(<CollectionScreen />, app);
    expect(await screen.findByText('🏅 氵')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Cards are `button.zika`, with `aria-label` = the character for caught cards and "未收集" (not collected) for uncaught ones.
- [ ] **Step 4: Run.** `npm test`. Expected: green.
- [ ] **Step 5: Commit.** `git add -A src && git commit -m "feat(collection): 字卡 character collection replaces the sticker book"`

---

### Task 6: Truffle's room — powers tab

**Files:**
- Modify: `src/app/Wardrobe.tsx` (gains tabs 服装 | 能力), `src/app/home.test.tsx`

**Interfaces:**
- Produces:
  - `role="tablist"` with tabs `服装` and `能力`.
  - The 能力 panel lists all 11 powers as `button.power-row`, each with `aria-label="{name} {known}/{size}"`. Each row shows the mark, the radical(s), the name, three tier pips (filled = shown tier) and "known/size".
  - Tapping a row at shown tier ≥ 1 sets `activePower` and saves it. The preview Truffle shows it with `content`.
  - Rows at tier 0 are disabled.

- [ ] **Step 1: Write the failing test**

```tsx
it("Truffle's room: choose a power the child has unlocked", async () => {
  const app = await makeAppData({ kid: { ...DEFAULT_KID, powerTiersSeen: { water: 1 } } });
  renderWithApp(<Wardrobe />, app);
  fireEvent.click(screen.getByRole('tab', { name: '能力' }));
  const rows = await screen.findAllByRole('button', { name: /\d+\/\d+/ });
  expect(rows).toHaveLength(11);
  const fire = rows.find((r) => r.getAttribute('aria-label')!.startsWith('火'))!;
  expect((fire as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(rows.find((r) => r.getAttribute('aria-label')!.startsWith('水'))!);
  await waitFor(async () => expect((await getKid(app.db))?.activePower).toBe('water'));
  expect(document.querySelector('svg.truffle')?.getAttribute('data-power')).toBe('water');
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Known counts come from `loadKnowledge` + `powerProgress`; the shown tier comes from `powerTiersSeen`.
- [ ] **Step 4: Run.** `npm test`. Expected: green.
- [ ] **Step 5: Commit.** `git commit -am "feat(room): powers tab in Truffle's room"`

---

### Task 7: Walkthrough + docs

- [ ] **Step 1:** `npm test && npm run build`.
- [ ] **Step 2:** In the browser, at 768×1024 and 1024×768, walk through:
  - the collection: counter, filters, flip view, gold and rare;
  - the room's powers tab;
  - a celebration with a forced new tier (dev IndexedDB edits, restored afterwards);
  - Truffle with tier 1/2/3 on Home and in a lesson.

  Check that hanzi sit on clean space and that the cape doesn't clip.
- [ ] **Step 3:** Fix findings. Logic fixes are test-first.
- [ ] **Step 4:** Update the README rewards paragraph.
- [ ] **Step 5:** `npm test && npm run build`, then commit: `chore: plan 2 walkthrough fixes and docs`.
