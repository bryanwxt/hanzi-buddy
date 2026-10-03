import { hanChars } from '../../content';
import type { Passage } from '../../types';

export const PASSAGE_KNOWN_RATIO = 0.9;
/** Kept for the picture story builder (next plan). */
export const HELPER_QUESTIONS = ['谁？', '什么时候？', '在哪里？', '做什么？', '心情怎么样？'];

export function eligiblePassages(passages: Passage[], knownChars: Set<string>): Passage[] {
  return passages.filter((p) => {
    const han = hanChars(p.text);
    return han.length > 0 && han.filter((c) => knownChars.has(c)).length / han.length >= PASSAGE_KNOWN_RATIO;
  });
}
