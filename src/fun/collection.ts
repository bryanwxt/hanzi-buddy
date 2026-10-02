import { builtinWordId } from '../content';
import { isEarned } from '../srs/scheduler';
import type { Knowledge } from '../stats/stats';
import type { BuiltinChar } from '../types';
import { powerOf, type PowerId } from './powers';

export interface CharCard {
  char: string;
  pinyin: string;
  example: string | null;
  power: PowerId | null;
  caught: boolean;
  stars: 0 | 1 | 2 | 3;
  gold: boolean; // can read *and* write it
  rarity: 'common' | 'rare';
}

/** Memory strength from FSRS stability (days). */
export function starsFor(stability: number): 1 | 2 | 3 {
  if (stability < 7) return 1;
  if (stability < 30) return 2;
  return 3;
}

/** One card per built-in character, in learning order. Caught never goes back (earned rule); stars may. */
export function collectionCards(builtin: BuiltinChar[], know: Knowledge): CharCard[] {
  return [...builtin]
    .sort((a, b) => a.rank - b.rank)
    .map((c) => {
      const id = builtinWordId(c.char);
      const caught = know.knownChars.has(c.char);
      const rec = know.cardsById.get(`${id}:recognise`);
      const write = know.cardsById.get(`${id}:write`);
      return {
        char: c.char,
        pinyin: c.pinyin,
        example: c.examples[0]?.text ?? null,
        power: powerOf(c),
        caught,
        stars: caught && rec ? starsFor(rec.fsrs.stability) : 0,
        gold: caught && !!write && isEarned(write.fsrs),
        rarity: c.level === 1 ? 'common' : 'rare',
      };
    });
}
