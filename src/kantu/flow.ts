import { SCENES_KT, type Scene } from './scenes';

export type SpeakingKind = 'langdu' | 'story';

/** 看图说话 is parked (settings.story off): the speaking step is 朗读, or nothing when there's nothing to read.
 *  Switched on, it alternates 朗读 and 看图说话, starting with a story; 朗读 with nothing to read hands over to a story. */
export function nextSpeaking(last: SpeakingKind | null, langduAvailable: boolean, storyOn = false): SpeakingKind | null {
  if (!storyOn) return langduAvailable ? 'langdu' : null;
  if (!langduAvailable) return 'story';
  return last === 'story' ? 'langdu' : 'story';
}

export const sceneFor = (story: { next: number }): Scene => SCENES_KT[((story.next % SCENES_KT.length) + SCENES_KT.length) % SCENES_KT.length]!;

export const afterStory = (story: { next: number; told: number }) => ({ next: story.next + 1, told: story.told + 1 });

export const STARTERS_UNTIL = 8;
export const showStarters = (told: number) => told < STARTERS_UNTIL;
