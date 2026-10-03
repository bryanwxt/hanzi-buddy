import { DEFAULT_KID, type KidState } from '../types';
import { Label } from './Label';
import { Pet } from './Pet';

/** Shown (by CSS) only on a phone turned sideways: too short for a lesson. Drawn beside the screen, so nothing underneath resets. */
export function RotateHint({ kid }: { kid: KidState | null }) {
  return (
    <div class="rotate-hint" role="dialog" aria-label="请把手机竖过来">
      <Pet kid={kid ?? DEFAULT_KID} mood="content" size={120} />
      <p class="rotate-hint__msg"><Label zh="请把手机竖过来" /></p>
    </div>
  );
}
