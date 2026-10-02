import type { KidState } from '../types';
import { Label } from './Label';
import { Truffle, type TruffleMood } from './truffle/Truffle';

export type PetMood = TruffleMood;

interface Props {
  kid: KidState;
  mood?: PetMood;
  bubble?: string | null;
  size?: number;
  lookAt?: number;
  bounce?: boolean;
}

/** Truffle with an optional speech bubble, wearing the child's chosen accessory. */
export function Pet({ kid, mood = 'sulk', bubble = null, size = 120, lookAt = 0, bounce = false }: Props) {
  return (
    <div class="pet">
      {bubble && (
        <div class="pet__bubble" key={bubble}>
          <Label zh={bubble} />
        </div>
      )}
      <Truffle
        mood={mood}
        accessory={kid.wearing}
        lookAt={lookAt}
        size={size}
        bounce={bounce}
        power={kid.activePower}
        powerTier={kid.activePower ? (kid.powerTiersSeen[kid.activePower] ?? 0) : 0}
      />
    </div>
  );
}
