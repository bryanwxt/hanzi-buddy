import { wordComponents } from '../../content';
import { shuffle, type Rng } from '../../lib/random';
import type { Word } from '../../types';

const MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};
const UNMARK = new Map<string, [string, number]>(
  Object.entries(MARKS).flatMap(([vowel, marked]) => marked.map((m, i): [string, [string, number]] => [m, [vowel, i + 1]])),
);

export function syllableTone(s: string): { base: string; tone: number } {
  let base = '';
  let tone = 5;
  for (const ch of s) {
    const hit = UNMARK.get(ch);
    if (hit) {
      base += hit[0];
      tone = hit[1];
    } else {
      base += ch;
    }
  }
  return { base, tone };
}

export function toneless(pinyin: string): string {
  return pinyin.trim().toLowerCase().split(/\s+/).map((s) => syllableTone(s).base).join(' ');
}

/** Standard placement: a, else e, else the o of "ou", else the last of i/o/u/ü. */
export function withTone(base: string, tone: number): string {
  if (tone < 1 || tone > 4) return base;
  const idx = base.includes('a')
    ? base.indexOf('a')
    : base.includes('e')
      ? base.indexOf('e')
      : base.includes('ou')
        ? base.indexOf('o')
        : Math.max(...['i', 'o', 'u', 'ü'].map((v) => base.lastIndexOf(v)));
  if (idx < 0) return base;
  return base.slice(0, idx) + MARKS[base[idx]!]![tone - 1] + base.slice(idx + 1);
}

const lengthOf = (w: Word) => Array.from(w.text).length;

function sharesComponent(a: Word, b: Word): boolean {
  const parts = new Set(wordComponents(a.text));
  return wordComponents(b.text).some((p) => parts.has(p));
}

export function pickCharacterDistractors(target: Word, pool: Word[], rng: Rng, n = 3): Word[] {
  const sound = toneless(target.pinyin);
  const eligible = pool.filter((w) => lengthOf(w) === lengthOf(target) && w.text !== target.text && toneless(w.pinyin) !== sound);
  const tiers = [
    eligible.filter((w) => sharesComponent(target, w)),
    eligible.filter((w) => w.level !== null && w.level === target.level),
    eligible,
  ];
  const picked: Word[] = [];
  const usedText = new Set([target.text]);
  for (const tier of tiers) {
    for (const w of shuffle(tier, rng)) {
      if (picked.length >= n) return picked;
      if (usedText.has(w.text)) continue;
      picked.push(w);
      usedText.add(w.text);
    }
  }
  return picked;
}

export function pickPinyinDistractors(target: Word, pool: Word[], rng: Rng, n = 3): string[] {
  const used = new Set([target.pinyin]);
  const out: string[] = [];
  const add = (p: string) => {
    if (out.length < n && p && !used.has(p)) {
      used.add(p);
      out.push(p);
    }
  };

  const syllables = target.pinyin.split(' ');
  const toneVariants: string[] = [];
  syllables.forEach((s, i) => {
    const { base, tone } = syllableTone(s);
    for (const t of [1, 2, 3, 4]) {
      if (t === tone) continue;
      const copy = [...syllables];
      copy[i] = withTone(base, t);
      toneVariants.push(copy.join(' '));
    }
  });
  const variants = shuffle(toneVariants, rng);

  // Tier 1: up to two tone changes (so options are not all the same syllable).
  variants.slice(0, 2).forEach(add);
  // Tier 2: pinyin of look-alike words; tier 3: any word of the same length.
  const sameLength = pool.filter((w) => w.pinyin.split(' ').length === syllables.length && w.text !== target.text);
  shuffle(sameLength.filter((w) => sharesComponent(target, w)), rng).forEach((w) => add(w.pinyin));
  shuffle(sameLength, rng).forEach((w) => add(w.pinyin));
  // Tiny pools: fill with the remaining tone variants.
  variants.forEach(add);
  return out;
}
