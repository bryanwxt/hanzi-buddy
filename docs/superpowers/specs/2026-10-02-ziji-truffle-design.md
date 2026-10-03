# 字己 ZiJi — Truffle redesign: design spec

**Date:** 2026-10-02
**Status:** Draft for review
**Builds on:** `2026-10-02-hanzi-buddy-design.md` (the shipped app). Everything
not changed here stays as that spec describes it.
**Reference art:** `assets/2026-10-02-truffle-reference.html` (approved mascot:
bean body, face, six moods).

## 1. Purpose

Make 字己 more design-forward, so that it is something the parent is proud to
share publicly, while making it more fun for the 8-year-old who uses it daily.
Two moves do this:

1. A new visual system: "ink panels on warm paper".
2. A new mascot, **Truffle 松露**, the family's real cat, replacing the dragon.
   His grumpy face becomes a game mechanic, and he gains powers and costumes
   instead of growing.

### What the parent said (decisions made in brainstorming)

- **Appeal:** the app should appeal to adults when shared publicly, and stay
  appealing to the child.
- **Visual direction:** the path went watercolour → manga ink → "less Japanese".
  The result is bold ink panels with chunky offset shadows on warm cream paper,
  soft colour swashes, and no manga effects (speed lines, screentone,
  sweat drops, anime sparkles). Some outline is fine; scratchy dry-brush
  outlines are not.
- **Mascot:** the family's grey-and-white cat, Truffle, drawn cute and young.
  - Face: round chubby head, big low-set green eyes, tiny pink nose, small pout.
  - The grump is shown only by a flat-topped eyelid and two brow dashes.
  - Body: the "bean" (big head, small round body, nub paws, curly tail).
  - He does not grow.
- **Rewards:** borrow mechanics from Pokémon and Minecraft, never their names,
  characters or art (the repo and site are public).
  - Element powers, from 五行 plus big radical families.
  - A character collection.
  - Costumes, including 12 zodiac onesies.
  - The crafting table (combine components into characters) is parked as a
    future enhancement.
- **Delivery:** build as three plans, each released on its own (approach A).

### Success criteria

- The child meets Truffle on first run and recognises him as his cat.
- Truffle's face visibly warms up over a session in response to the child's
  answers.
- Learning a radical family powers Truffle up. The collection fills as
  characters are learned. Costumes arrive from the daily chest.
- No earned power, card or costume is ever lost, including after a lapse in
  memory or a backup restore.
- Every child screen uses the new visual system at iPad portrait (768×1024)
  and landscape.
- The learning engine is untouched: FSRS, session plans and activity rules
  behave exactly as before.

## 2. Constraints

- Same stack and hosting: Vite, Preact, TypeScript, an offline PWA on GitHub
  Pages at `/ziji/`. No new runtime dependencies, except a font if §3 needs one.
- Database schema version stays 1. New kid-state fields are optional and are
  filled with defaults when read.
- The backup format version stays 1. Old backups restore; unknown fields are
  ignored.
- Truffle is drawn in code as vector layers, like the dragon was. No bitmap
  art, and no photos of the cat anywhere in the repo or the app.
- No Pokémon or Minecraft names, characters, art, sounds or lookalikes. Only
  generic mechanics: types, a collection, skins.
- Child-facing meanings stay radical-only (existing rule).
- 64px minimum touch targets, WCAG AA text contrast, and the reduced-motion
  setting respected.

## 3. Visual system

### Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#fbf6ea` | page background, with a fine grain (a tiny tiled texture, not a filter on large areas) |
| `--ink` | `#2a2630` | outlines, text, offset shadows, primary dark button |
| `--green` | `#7fdc7a` | spot colour: current step, correct, primary accents (text on it is `--ink`) |
| `--green-soft` | `#c9efc6` | completed steps, correct sheet |
| `--red` | `#ff5532` | celebration and treasure blocks (only large text on it, with an ink shadow) |
| `--marigold` | `#ffc94a` | stars, streak flame, highlights |
| `--orange-soft` | `#ffe0cc` | "try again" sheet |
| swash colours | `#ffd56a` and `#bfe0ff` at ~55% | soft round brush swashes behind content |
| fur | `#b8b3b6`, shade `#a29ca1`, white `#fffdf7` | Truffle |
| eye / nose / blush | `#a9c96a` / `#ff9fa0` / `#ffb3a0` | Truffle |

Status always pairs colour with an icon and a word.

### Type

- Hanzi: LXGW WenKai (bundled).
- UI text: Nunito (bundled).
- Small labels such as 今日一字 ("character of the day"): a condensed display
  face. Prefer a bundled `@fontsource` package (e.g. Bebas Neue, OFL, Latin
  only). Use Nunito 900 uppercase if no suitable font is available.
- Pinyin: Nunito italic.

### Components

- **Ink panel:** cream fill, 3px ink border, radius 14–16, a 4–5px solid ink
  offset shadow down-right. Used for cards, path tiles, answer tiles, the PIN
  pad and the parent panels.
- **Primary button:** ink fill with cream text and a green offset shadow.
  Variants: green (ink text, ink shadow) and red (celebration).
- **Word of the day:** an ink panel tilted −3°, with a 田字格 grid and a
  condensed green label tag.
- **Path tiles:**
  - done = `--green-soft`;
  - current = `--green`, lifted 6px and rotated −4°;
  - locked = cream.
- **Feedback sheet:** the existing bottom sheet, coloured `--green-soft` for
  right and `--orange-soft` for try again, with an ink top rule.
- **Stat pills:** cream with a 2.5px ink border.
- **Tab bar:** ink icons with the active tab on a green chip.

### Layout

Unchanged from the bold & flat spec (§5c): today's-path home, lesson bar with
progress, bottom sheet, tab bar. Only the skin changes.

### Motion

- The existing spring curves and view transitions stay.
- Truffle reacts with face and pose swaps plus a small squash-and-bounce.
- **Press-and-hold** (`HoldButton`) is used for the chest and power-ups:
  - A round ink button with a ring that fills over 1.2 s while pressed.
  - Releasing early drains the ring back over 0.3 s. Completion fires once.
  - Keyboard: holding Space or Enter fills it.
  - With reduced motion, the ring still fills (it is the progress
    indicator), but bursts are replaced by a fade.

## 4. Truffle 松露

### Identity and first run

- Truffle is a fixed character. The pet-setup screen becomes **Meet Truffle**:
  - he sits dozing;
  - a tap wakes him into 哼 with a speech bubble introducing him
    (哼……我是松露。来吧！, "Hmph… I'm Truffle. Let's go!");
  - one line repeats the 字己 = 自己学汉字 explanation;
  - one button continues to placement.
- Existing installs skip Meet Truffle if a kid record exists, and show him on
  Home.

### Drawing (`src/ui/truffle/`)

`Truffle` component props: `mood`, `power` (id or null), `powerTier` (0–3),
`outfit` (id or null), `accessory` (emoji or null), `size`, `lookAt`.

Layers, bottom to top:
1. tail
2. bean body
3. outfit body layer
4. head
5. face (mood)
6. outfit head layer (hood or hat) / accessory
7. power effect

Rendering rules:

- Geometry, proportions, palette and expressions follow the reference art. The
  build may refine curves.
- Outlines: 3.2px ink, round joins. No dry-brush filters.
- The fur grain uses one shared SVG filter definition per page, and only on
  Truffle.
- Clip/filter ids are made unique per instance (`useId`), as the dragon's
  were.
- Accessible: `role="img"`, labelled "松露".

### Moods (`src/fun/mood.ts`, pure)

| Mood | Face | When |
|---|---|---|
| `sulk` 哼 | flat-topped lids, brow dashes, small pout | resting, 0–2 correct this session |
| `neutral` | lids lifted, no brows, small mouth | resting, 3–7 correct |
| `pleased` | soft squint, blush | resting, 8+ correct |
| `side` 嗯？ | side-eye, "?" bubble | for ~1 s after a wrong answer |
| `content` 呼噜 | closed happy arcs, blush | for ~1 s at a combo of 3+ |
| `wow` 咦！ | wide eyes, exclamation ticks | for ~1.2 s after a hard one is right |
| `cheer` 喵！ | happy arcs, open smile, confetti | celebration |
| `sleepy` zzz | closed eyes | Home, idle 25 s (existing timer); a tap wakes him |

- `neutral` and `pleased` are not in the reference art. They are in-between
  faces (sulk → content), drawn in the same style during plan 1.
- **`restingMood(correctThisSession)`** returns `sulk`, `neutral` or `pleased`.
- **`reactionMood(event)`** maps answer events to the transient moods. Priority:
  `wow` > `content` > `side`.
- **A "hard one" is any of:**
  - a recognition card answered correctly whose card was in Relearning;
  - a recognition card answered correctly whose previous review was rated
    Again;
  - a writing word finished with 0 misses whose card was new.
- **The 咦！ close-up:**
  - On a hard one, a full-width overlay of his face on a soft green sunburst
    shows for 0.9 s.
  - At most once every 5 cards. Never under reduced motion; the small `wow`
    face still shows.
- **Speech bubbles** (with pinyin via `Label`): 哼，来吧！ / 再想想 / 咦！好厉害 /
  呼噜～ / 喵！
- A correct answer's tile still flies into Truffle, and he does a catch-bounce.

## 5. Powers (replacing growth stages)

`src/fun/powers.ts` (pure).

| Id | Name | Radicals (built-in `radical` field) |
|---|---|---|
| `water` | 水 | 氵 水 |
| `fire` | 火 | 火 灬 |
| `wood` | 木 | 木 |
| `metal` | 金 | 金 钅 |
| `earth` | 土 | 土 |
| `roar` | 口 | 口 |
| `friends` | 亻 | 亻 人 |
| `voice` | 讠 | 讠 言 |
| `dash` | 辶 | 辶 |
| `heart` | 心 | 心 忄 |
| `sun` | 日 | 日 |

**Family and progress:**

- **Family** = built-in characters whose `radical` is in the list, excluding
  the radical character itself. (`冫` is not water; the ice radical is left
  out.) Families are built from content at runtime, like sticker families.
- **Known** = the "earned" rule from the review fixes (card state Review or
  Relearning).
- **Tiers:**
  - 1 at `min(3, size)` known;
  - 2 at `ceil(size / 2)`;
  - 3 at all known.

**Tiers never go down.** The tier shown is
`max(computed, kid.powerTiersSeen[id])`.

**Visuals per tier:**
- tier 1: a small mark, e.g. flame ear-tips, a water droplet on the cheek, a
  leaf on the head;
- tier 2: an aura or effect around Truffle;
- tier 3: the full form, i.e. effect plus a cape or pattern in the power's
  colours.

Effects sit on layer 7, so they combine with any outfit.

**New-tier moment:** Celebration gains a `power` phase, between `chest` and
`badges`, when any tier is newly reached.
- It shows "新能力！" and the power's radical with its meaning
  (氵 = 水, "water").
- The child holds the HoldButton to power Truffle up.
- Then `powerTiersSeen` is saved. This replaces the `evolve` phase and the
  `lastStageSeen` logic.

**Choosing:** the chosen power is `kid.activePower`. It defaults to the most
recently unlocked power, and the child can change it in Truffle's room.

## 6. Character collection 字卡 (replacing the sticker book)

`src/fun/collection.ts` (pure); `CollectionScreen` replaces `StickerBook` on
the tab bar.

**One card per built-in single character.**

- **Uncaught:** face-down, showing only its power icon (or a plain back if it
  belongs to no power).
- **Caught** (known, by the earned rule) shows:
  - the character and its pinyin;
  - its first example word, if any;
  - its power icon;
  - 1–3 stars.

**Stars** come from the recognition card's FSRS stability: under 7 days = 1,
7–29 days = 2, 30+ days = 3. Stars may drop with a lapse; being caught never
does.

**Other card details:**
- **Gold foil:** the write card is also known (earned rule).
- **Rarity frame:** HSK level 1 = common, level 2 = rare.

**Screen:**
- Filter chips: all / each power / gold.
- A caught counter, e.g. "62 / 600".
- Tapping a card flips it to a larger view and speaks it.
- Parent-added words appear in a separate 我的字 section, as now.

**Badges:** a family badge (the existing `badgesSeen`) becomes "power
mastered" (tier 3) for power families. For other radical families it remains
a collection badge. The Celebration `badges` phase is kept.

## 7. Costumes, chest and Truffle's room

`src/fun/costumes.ts` (pure).

### Catalog

- **Zodiac onesies (12):** 鼠 牛 虎 兔 龙 蛇 马 羊 猴 鸡 狗 猪.
  - Each is a hood with that animal's ears or horns, plus colours and
    markings; the body layer is tinted.
  - The name is shown as the character with pinyin.
- **Outfits (8):** astronaut, chef, wizard, explorer, pirate, superhero cape,
  pixel (a blocky skin made of crisp squares; generic, not a Minecraft
  lookalike) and rain mac. Each has a Chinese name with pinyin, e.g.
  宇航员 yǔhángyuán.
- **Accessories:** the existing 16 emoji (`ACCESSORIES`) carry over unchanged,
  including any already owned.

### Wearing

- **One outfit slot** (a onesie or an outfit) and **one accessory slot**.
- A onesie hides the accessory slot while worn.
- The power effect always shows.

### Chest

Once per day after a completed (non-free) session with at least one step, as
now.

- Opening uses HoldButton.
- **First chest ever:** the child's zodiac onesie (`settings.zodiac`, default
  龙).
- **After that:** a seeded-random item from the unowned outfits, onesies and
  accessories (seeded by the session date, as now).
- **When everything is owned:** bonus stars, as now.
- The prize card flips with a burst.
- The day rule is unchanged: a chest is only openable once per day, however
  fast it is tapped (the existing fixes).

### Parent setting

Settings gains **Zodiac**: a 12-option picker labelled in English and Chinese,
optional.

### Truffle's room

Replaces the wardrobe tab (same tab position, labelled 松露).

- A big live Truffle preview, which shows `content` when an item is chosen.
- **服装 (outfits) tab:** a grid of onesies, outfits and accessories. Locked
  ones are silhouettes. Tap to wear; tap again to take off.
- **能力 (powers) tab:** the 11 powers with tier pips, their radical, and
  "n / size". Tap a power at tier ≥ 1 to show it.

## 8. Data model changes

`KidState`. All new fields are optional when read; defaults are applied by a
`normalizeKid()` used by `getKid`.

- New fields:
  - `ownedCostumes: string[]` (default `[]`);
  - `outfit: string | null` (`null`);
  - `activePower: string | null` (`null`);
  - `powerTiersSeen: Record<string, number>` (`{}`).
- Kept, with unchanged meaning: `ownedAccessories`, `wearing` (now the
  accessory slot), `badgesSeen`, `bonusStars`, `lastChestDate`.
- Kept but no longer read by the UI: `petName`, `petColor`, `lastStageSeen`.
  They are not deleted, so old and new backups round-trip.

`Settings` gains `zodiac: ZodiacId | null` (default `null`).

Unknown costume or power ids in stored data are ignored when rendering and are
never offered as worn.

## 9. Delivery: three plans

1. **Look + Truffle:**
   - tokens, components and the restyle of every child screen (the parent area
     gets tokens only);
   - the `Truffle` component with all moods;
   - `mood.ts` and its wiring into flashcards, writing, fishing, speaking, Home
     and Celebration;
   - Meet Truffle, `HoldButton`, and the chest on HoldButton (existing prizes);
   - the dragon component and dragon-only code removed.

   Ships Truffle.
2. **Powers + collection:**
   - `powers.ts`, `collection.ts`, and the power effect art (11 × 3 tiers);
   - the Celebration `power` phase;
   - `CollectionScreen` (sticker book removed);
   - the powers tab in Truffle's room;
   - `lastStageSeen` and growth-stage code removed.
3. **Costumes:**
   - `costumes.ts`, 12 onesies + 8 outfits art;
   - chest prizes and the first-chest zodiac;
   - the zodiac setting and the outfits tab.

Each plan ends with:
- a full test run;
- a browser walkthrough at 768×1024 and landscape, with reduced motion on and
  off;
- a whole-branch review and fix pass;
- release to `main` (auto-deploys).

## 10. Testing

**Pure units (TDD):**
- `restingMood` thresholds and `reactionMood` priority;
- the hard-one definition;
- power families from content: `冫` excluded, the radical character itself
  excluded, sizes;
- tier thresholds, including tiny families;
- tiers never decreasing via `powerTiersSeen`;
- collection card state: caught, stars bands, gold, rarity;
- the chest: first-chest zodiac, default 龙, unowned-only, seeded, stars when
  complete;
- wearing rules: a onesie hides the accessory; unknown ids are ignored;
- `normalizeKid` defaults;
- old-backup restore.

**Components:**
- `Truffle` renders the requested mood, power tier and outfit (via `data-*`
  attributes);
- HoldButton:
  - completes after the hold;
  - an early release cancels;
  - completion fires once;
  - the keyboard hold works;
  - reduced motion;
- Meet Truffle flow → placement;
- Celebration `power` phase saves `powerTiersSeen`;
- collection filters and counter;
- Truffle's room wear/unwear and choosing a power persist.

**Visual:** the browser walkthrough per plan (see §9). Check that hanzi always
sit on clean space, and the contrast of text on `--red` and `--green`.

## 11. Out of scope

- The crafting table (future enhancement).
- Changes to FSRS, session planning, activity rules, the parent area structure
  or sounds.
- New content.
- Renaming 字己 or moving the site address.

## 12. Review focus

The input classes and failure modes most likely to bite, for the plans to pin
with tests:

1. **A lapse after a tier, card or badge was earned** must not remove it
   (earned rule plus `*Seen` maxima).
2. **Existing installs:**
   - dragon-era kid state with owned emoji accessories and `wearing` set must
     show Truffle wearing that accessory;
   - no Meet Truffle screen;
   - nothing lost.
3. **Rapid or overlapping input:**
   - double-tap or multi-touch on HoldButton must not double-fire;
   - a release at exactly 1.2 s fires once;
   - leaving mid-hold cancels.
4. **Tiny or unusual families:**
   - 金 has 5 characters, so tier maths must be sensible;
   - characters in no power family still get a card;
   - parent words containing power radicals do not affect built-in families.
5. **Reduced motion and older iPads:**
   - no flashing close-ups;
   - the grain filter is not applied to large areas;
   - smooth on Home with Truffle plus the swashes.

## 13. Ink icons and accessories v2 (added 2026-10-03 at the parent's request)

The parent asked for the remaining emoji to be replaced with art in the app's
style, and for the accessories to be "cooler and coherent with the costume
options".

### Accessories v2: add-ons in four slots

Every costume already has its own hat, so accessories become add-ons that
combine with any onesie or outfit. Nothing is ever hidden: this replaces the
§7 "a onesie hides the accessory" rule and the plan-3 "no hat on a hat" rule.
There are still 16, so the chest economy is unchanged.

| Slot | Accessories |
|---|---|
| face | 墨镜 sunglasses, 星星眼镜 star glasses, 爱心眼镜 heart glasses, 小胡子 moustache |
| neck | 围巾 scarf, 领结 bow tie, 金牌 gold medal, 耳机 headphones |
| held (in a paw) | 毛笔 calligraphy brush, 红灯笼 red lantern, 风筝 kite, 气球 balloon, 魔法棒 magic wand |
| back | 书包 backpack, 翅膀 wings, 喷气背包 jetpack |

- **Stored values:** accessories are stored by id. Legacy emoji in
  `ownedAccessories` and `wearing` are mapped one-to-one by `normalizeKid`:
  - 🎩 moustache, 👑 medal, 🕶️ sunglasses, 🎀 bow tie;
  - 🧢 backpack, 🎓 brush, ⛑️ jetpack, 🌸 heart glasses;
  - ⭐ star glasses, 🎈 balloon, 🍀 lantern, 🦋 wings;
  - 🌈 wand, 🎧 headphones, 🧣 scarf, 🪁 kite.

  Nothing earned is lost, and unknown values are dropped.
- **Room:** shows each accessory's ink art and its name with pinyin, grouped
  by slot.

### Ink icon set

`InkIcon` draws icons in the app's ink style: 3px outlines and flat palette
fills on a 48×48 grid. The same markup is reused inside Truffle's SVG. It
replaces every child-facing emoji:
- power marks;
- path and progress-bar step icons;
- stars, the medal, the lock and sparkles;
- the fishing fish;
- the placement buttons and the combo flame;
- the loading paw and the error screen;
- the radical meaning icons used in intro cards, fishing, badges and the power
  intro.

The parent area keeps its emoji, including the reward-goal emoji the parent
chooses.

## 14. Fairer placement and clearer writing prompts (added 2026-10-03 at the parent's request)

### Placement by difficulty bands

The old check showed 40 characters from easiest to hardest and stopped at the
first "不认识"; one slip on an easy character sank everything after it. It is
replaced by:

- **Bands:** the built-in characters, in rank order, are split into bands of
  60 (10 bands).
- **Questions:** 8 characters are asked from each band, evenly spaced through
  it, easiest band first.
- **Each question is a quiz, not self-report:**
  - the character with 4 pinyin options (the flashcard distractor rules);
  - plus a 不知道 ("don't know") button, which counts as wrong.
  - No right/wrong feedback is shown, and Truffle stays neutral.
- **A band passes at 6 of 8.** The check stops at the 3rd wrong answer in a
  band (the moment 6/8 becomes impossible), or after the last band.
- **Credit:**
  - every character in a passed band is seeded as known;
  - in the band where it stopped, only the characters answered correctly are
    seeded.
  - Characters he missed are not seeded, so they come up early as new words.
  - Seeded characters get their first recheck spread evenly over days 7–28,
    hardest (rarest) first, so a big placement never lands on one day and
    pauses new words (the 40-due pause).
- The parent can re-run placement from Settings, as now.

### Writing (听写) prompts

Under the pinyin and the speak button, the writing step shows:

1. **The meaning:** the word's own meaning, first sense only (text before the
   first comma or semicolon). Parent words show their meaning if the parent
   entered one.
2. **The source word, for a single built-in character with an example word:**
   that word with the character blanked, e.g. ＿子 for 儿. The speak button
   reads "儿，儿子的儿", the way teachers dictate 听写.

This relaxes the earlier rule that child-facing meanings come only from
radicals, for writing prompts only.
