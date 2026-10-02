import { PET_COLORS, petStage, STAGE_LOOKS } from '../fun/pet';
import type { KidState } from '../types';

export type PetMood = 'happy' | 'comfort' | 'munch' | null;

interface Props {
  kid: KidState;
  known: number;
  mood?: PetMood;
  bubble?: string | null;
  size?: number;
  stage?: number; // override, e.g. to show the previous stage during evolution
}

export function Pet({ kid, known, mood = null, bubble = null, size = 120, stage }: Props) {
  const s = stage ?? petStage(known);
  const look = STAGE_LOOKS[s]!;
  return (
    <div class={`pet ${mood ? `pet--${mood}` : ''} ${look.glow ? 'pet--glow' : ''}`}>
      {bubble && <div class="pet__bubble">{bubble}</div>}
      <div style={{ fontSize: `${Math.round(size * look.scale)}px`, position: 'relative' }}>
        <span class="pet__body" role="img" aria-label={kid.petName} style={{ filter: `hue-rotate(${PET_COLORS[kid.petColor].hue}deg)` }}>
          {look.emoji}
        </span>
        {kid.wearing && <span class="pet__hat">{kid.wearing}</span>}
      </div>
    </div>
  );
}
