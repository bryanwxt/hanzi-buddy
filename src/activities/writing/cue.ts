import type { Word } from '../../types';

export interface WritingCue {
  meaning: string | null; // first sense only: "son, child" → "son"
  blanked: string | null; // an example word with the target hidden: 儿子 → ＿子
  blankedPy: string | null; // its remaining syllables as said in that word: zi, not zǐ
  speech: string; // 儿，儿子的儿 — how a teacher names the character in 听写
}

/** What tells a child which character to write when several share the same sound. */
export function writingCue(word: Word): WritingCue {
  const meaning = word.meaning?.split(/[,;]/)[0]?.trim() || null;
  const example = word.examples?.find((e) => e.text.length > word.text.length && e.text.includes(word.text));
  if (!example) return { meaning, blanked: null, blankedPy: null, speech: word.text };
  return {
    meaning,
    blanked: example.text.split(word.text).join('＿'.repeat(word.text.length)),
    blankedPy: blankedSyllables(example.text, example.pinyin, word.text),
    speech: `${word.text}，${example.text}的${word.text}`,
  };
}

/** The example's syllables minus the hidden character's, or null when they don't line up one per character. */
function blankedSyllables(text: string, py: string, target: string): string | null {
  const chars = [...text];
  const syl = py.trim().split(/\s+/);
  if (syl.length !== chars.length) return null;
  const hidden = new Set<number>();
  for (let i = text.indexOf(target); i >= 0; i = text.indexOf(target, i + target.length)) {
    for (let j = 0; j < target.length; j++) hidden.add(i + j);
  }
  return syl.filter((_, i) => !hidden.has(i)).join(' ');
}
