import { petStage } from '../fun/pet';
import type { KidState } from '../types';
import { Dragon, type DragonMood } from './dragon/Dragon';

export type PetMood = DragonMood;

interface Props {
  kid: KidState;
  known: number;
  mood?: PetMood;
  bubble?: string | null;
  size?: number;
  stage?: number; // override, e.g. to show the previous stage during evolution
  lookAt?: number;
}

export function Pet({ kid, known, mood = null, bubble = null, size = 120, stage, lookAt = 0 }: Props) {
  return (
    <div class="pet">
      {bubble && (
        <div class="pet__bubble" key={bubble}>
          {bubble}
        </div>
      )}
      <Dragon
        stage={stage ?? Math.max(petStage(known), kid.lastStageSeen)}
        color={kid.petColor}
        mood={mood}
        accessory={kid.wearing}
        lookAt={lookAt}
        size={size}
        label={kid.petName}
      />
    </div>
  );
}
