# 字己 Truffle — Plan 4: Ink icons + Accessories v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Replace every child-facing emoji with ink-style art.
- Redesign the 16 accessories as add-ons in four slots (face, neck, held, back) that combine with every costume.

**Architecture:**
- **Accessory catalog:** a pure module, `src/fun/accessories.ts`, holding the catalog and the legacy-emoji map, with migration in `normalizeKid`.
- **Accessory art:** `src/ui/truffle/accessories.ts` draws each accessory as layers on Truffle.
- **Icons:** a single icon registry, `src/ui/icons/icons.ts`, holds SVG inner markup on a 48×48 grid. `InkIcon` renders it in JSX, and `iconMarkup(name, x, y, size)` embeds the same markup inside Truffle's SVG.
- **Emoji guard:** a contract test scans child-facing source files so no emoji creeps back in.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §13 (and §3 tokens).

## Global Constraints

- **Ink style:**
  - outline `#2a2630`, 3px on the 48 grid (3.2px on Truffle), round joins;
  - fills from the palette: green `#7fdc7a`, marigold `#ffc94a`, red `#ff5532`, water `#4aa3ff`, cream `#fffdf7`, plus each power's colour;
  - no gradients, no filters inside icons.
- **Accessories (exact ids, names, pinyin, slots):**
  - face:
    - `sunglasses` 墨镜 mòjìng
    - `starglasses` 星星眼镜 xīngxing yǎnjìng
    - `heartglasses` 爱心眼镜 àixīn yǎnjìng
    - `moustache` 小胡子 xiǎo húzi
  - neck:
    - `scarf` 围巾 wéijīn
    - `bowtie` 领结 lǐngjié
    - `medal` 金牌 jīnpái
    - `headphones` 耳机 ěrjī
  - held:
    - `brush` 毛笔 máobǐ
    - `lantern` 红灯笼 hóng dēnglong
    - `kite` 风筝 fēngzheng
    - `balloon` 气球 qìqiú
    - `wand` 魔法棒 mófǎbàng
  - back:
    - `backpack` 书包 shūbāo
    - `wings` 翅膀 chìbǎng
    - `jetpack` 喷气背包 pēnqì bēibāo
- **Legacy map (one-to-one):**
  - 🎩 → moustache, 👑 → medal, 🕶️ → sunglasses, 🎀 → bowtie
  - 🧢 → backpack, 🎓 → brush, ⛑️ → jetpack, 🌸 → heartglasses
  - ⭐ → starglasses, 🎈 → balloon, 🍀 → lantern, 🦋 → wings
  - 🌈 → wand, 🎧 → headphones, 🧣 → scarf, 🪁 → kite
- **Visibility:** accessories are always visible with any costume. Unknown accessory values are dropped.
- **Parent area** (`src/parent/**`) keeps its emoji.
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **A dragon-era or plan-3 profile** with emoji accessories must keep every accessory it owned (mapped) and keep wearing the mapped one. A backup restore must do the same.
2. **Each accessory with each costume and power tier** must look intentional: no clipping, held items in the paw, back items behind the body and power cape.
3. **No emoji left on child screens.** That includes text built at runtime (the combo banner, celebration stars).
4. **Icons stay legible at small sizes:** the path tile (40px), chips (20px) and the progress bar (24px).
5. **The chest after migration** must still never repeat and still end in stars.

---

### Task 1: Accessory catalog + migration (pure)

**Files:**
- Create: `src/fun/accessories.ts`, `src/fun/accessories.test.ts`
- Modify:
  - `src/fun/pet.ts` (`ACCESSORIES` becomes the id list, re-exported from accessories);
  - `src/fun/costumes.ts` (`visibleAccessory` = the known id or null);
  - `src/store/repo.ts` (`normalizeKid` maps legacy values);
  - `src/fun/costumes.test.ts`, `src/store/repo.test.ts`.

**Interfaces:**
- Produces:

```ts
export type AccessorySlot = 'face' | 'neck' | 'held' | 'back';
export interface AccessoryDef { id: string; zh: string; py: string; slot: AccessorySlot }
export const ACCESSORY_DEFS: AccessoryDef[]; export const ACCESSORY_IDS: string[];
export const LEGACY_ACCESSORY: Record<string, string>;
export function accessoryById(id: string | null | undefined): AccessoryDef | undefined;
export function migrateAccessory(v: string | null | undefined): string | null; // id → id, legacy emoji → id, else null
```

- [ ] **Step 1: Failing tests:**
  - 16 defs, 4 slots, unique ids;
  - every legacy emoji maps to a distinct id;
  - `migrateAccessory('🕶️') === 'sunglasses'`, `migrateAccessory('bogus') === null`;
  - `normalizeKid` on `{ownedAccessories: ['👑','🎓','x'], wearing: '🎓'}` gives `ownedAccessories: ['medal','brush']` and `wearing: 'brush'`;
  - `visibleAccessory` returns the accessory with a onesie or an outfit;
  - the chest never-repeats test still passes with ids.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Update existing tests that use emoji accessories to use ids (or rely on migration).
- [ ] **Step 4: Run** `npm test`. Expected: green. **Commit.**

### Task 2: Accessory art on Truffle (+ gallery for the parent)

**Files:**
- Create: `src/ui/truffle/accessories.ts`
- Modify: `src/ui/truffle/Truffle.tsx` (the `accessory` prop is an id; `accessoryPlacement` emoji text is removed), `src/ui/truffle/parts.ts`
- Test: `src/ui/truffle/Truffle.test.tsx`

**Interfaces:**
- Produces: `accessoryLayer(id): { back: string; front: string } | null`.
  - `back` is drawn after the power-back and outfit-back layers, before the body.
  - `front` is drawn last, above the outfit head, inside the head tilt group for face items and outside it for neck, held and back items.
  - The root svg gets `data-accessory`.

**Anchors** (Truffle viewBox `30 20 260 270`):
- face: eyes at (118,118) and (202,118); mouth at (160,166);
- neck: y ≈ 194–206;
- held: right paw at (182,262), with the item rising up the right side x ≈ 190–270;
- back: behind the body, y 186–276.

- [ ] **Step 1: Failing tests:**
  - every `ACCESSORY_IDS` entry renders a non-empty layer and `data-accessory`;
  - back items have non-empty `back`;
  - an unknown id renders nothing.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the art.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Gallery.** Render all 16 accessories, plus combinations (tiger onesie + scarf, astronaut + jetpack, wizard + wand, a tier-3 power + wings), to the mockup server, and show the parent. Iterate the art on feedback.
- [ ] **Step 6: Commit.**

### Task 3: InkIcon set (UI icons)

**Files:**
- Create: `src/ui/icons/icons.ts`, `src/ui/icons/InkIcon.tsx`, `src/ui/icons/icons.test.tsx`

**Interfaces:**
- Produces:
  - `ICONS: Record<IconName, string>`;
  - `InkIcon({ name, size = 32, label })` renders `svg.inkicon` with `role=img` when labelled, `aria-hidden` otherwise;
  - `iconMarkup(name, x, y, size)` returns a nested `<svg>` string for use inside other SVGs.
- `IconName` covers:
  - **power marks:** `drop`, `flame`, `leaf`, `sparkle`, `rock`, `shout`, `hands`, `speech`, `wind`, `heart`, `sun`;
  - **UI:** `star`, `starOutline`, `medal`, `lock`, `pen`, `fish`, `mic`, `gift`, `party`, `paw`, `sleepyCat`, `check`, `think`, `none`.

- [ ] **Step 1: Failing test:** every name in `ICON_NAMES` has markup containing `stroke="#2a2630"`, and `InkIcon` renders it; an unknown name renders nothing.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the drawings.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Gallery check** at 20, 32 and 48px. **Commit.**

### Task 4: Replace UI emoji (child-facing)

**Files:**
- Modify:
  - `src/fun/powers.ts` (`mark` is now an `IconName`);
  - `src/ui/truffle/powers.ts` (the mark is drawn via `iconMarkup`);
  - `src/app/TodayPath.tsx`, `src/ui/ProgressBar.tsx`, `src/app/SessionScreen.tsx` (combo banner), `src/app/Celebration.tsx`, `src/app/HomeScreen.tsx`, `src/app/CollectionScreen.tsx`, `src/app/Wardrobe.tsx`, `src/app/PlacementScreen.tsx`, `src/app/ErrorScreen.tsx`, `src/App.tsx`;
  - `src/activities/components/ComponentsStep.tsx` (fish badge, burst glyphs).
- Test: `src/childEmoji.test.ts` (contract), plus the existing tests updated.

- [ ] **Step 1: Failing contract test.** Scan `src/**/*.{ts,tsx}`, excluding `src/parent/**`, tests, `fun/accessories.ts` (the legacy map) and `content/radicals.ts` (handled in Task 5). Fail on any emoji character (`\p{Extended_Pictographic}`).
- [ ] **Step 2: Run.** Expected: FAIL, listing the files.
- [ ] **Step 3: Replace each use** with `InkIcon`, or with `iconMarkup` inside SVG. Keep the existing `aria-label`s.
- [ ] **Step 4: Run** `npm test`. Expected: green. **Commit.**

### Task 5: Radical icons

**Files:**
- Modify:
  - `src/content/radicals.ts` (`emoji` becomes `icon: IconName`, removing radicals.ts from the scan exclusions);
  - `src/ui/icons/icons.ts` (adds the radical icons);
  - uses in `FlashcardStep` (intro parts), `ComponentsStep` (pond question), `CollectionScreen` (badges), `Celebration` (badges, power intro).
- Test: `src/content/radicals.test.ts`, `src/childEmoji.test.ts`

- [ ] **Step 1: Failing tests:**
  - every `RADICALS` entry has an `icon` present in `ICONS`;
  - the contract test no longer excludes radicals.ts.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Draw the icons:**
  - hand, person, mouth, tree, moon, girl, grass, walk, earth, metal;
  - thread, roof, eye, rice, grain, bamboo, animal, insect, bird, rain;
  - door, clothes, food, sick, jade, stone, money, car, strength, knife;
  - ice, foot, horse, mountain, field, head, town, shelter.

  Reuse `drop`, `flame`, `heart`, `sun` and `speech` from Task 3. Wire them into the uses listed above.
- [ ] **Step 4: Run** `npm test`. Expected: green. Then the gallery check. **Commit.**

### Task 6: Walkthrough + docs

- [ ] In the browser, at 768×1024 and 1024×768, walk through:
  - Home: path, word of the day, stats;
  - a lesson: progress bar, fishing, combo banner;
  - the celebration: stars, chest, power, badges;
  - the collection;
  - the room (accessories by slot);
  - placement and the error screen.

  Use a migrated legacy profile (dev IndexedDB edits, restored afterwards). Fix findings. Update README/CREDITS. `npm test && npm run build`. **Commit.**
