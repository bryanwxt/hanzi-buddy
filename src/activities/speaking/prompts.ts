import { hanChars } from '../../content';
import type { Rng } from '../../lib/random';
import type { Passage, PicturePrompt } from '../../types';

export const PASSAGE_KNOWN_RATIO = 0.9;
export const HELPER_QUESTIONS = ['谁？', '什么时候？', '在哪里？', '做什么？', '心情怎么样？'];

export type SpeakingChoice = { kind: 'picture'; prompt: PicturePrompt } | { kind: 'passage'; passage: Passage } | null;

export function eligiblePassages(passages: Passage[], knownChars: Set<string>): Passage[] {
  return passages.filter((p) => {
    const han = hanChars(p.text);
    return han.length > 0 && han.filter((c) => knownChars.has(c)).length / han.length >= PASSAGE_KNOWN_RATIO;
  });
}

export function chooseSpeakingPrompt(opts: {
  pictures: PicturePrompt[];
  passages: Passage[];
  recordingCount: number;
  rng: Rng;
}): SpeakingChoice {
  const pick = <T,>(list: T[]) => (list.length ? list[Math.floor(opts.rng() * list.length)]! : null);
  const prompt = pick(opts.pictures);
  const passage = pick(opts.passages);
  const picture: SpeakingChoice = prompt ? { kind: 'picture', prompt } : null;
  const reading: SpeakingChoice = passage ? { kind: 'passage', passage } : null;
  return opts.recordingCount % 2 === 0 ? (picture ?? reading) : (reading ?? picture);
}
