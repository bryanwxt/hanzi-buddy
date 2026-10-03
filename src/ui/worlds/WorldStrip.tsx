import type { WorldId } from '../../fun/worlds';
import { SCENES, STRIP_VIEW } from './scenes';

/** A slim band of the world's ground for lesson screens. Decorative, behind the bottom bar. */
export function WorldStrip({ world }: { world: WorldId }) {
  return (
    <div class="world-strip" data-world={world} aria-hidden="true">
      <svg viewBox={STRIP_VIEW[world]} preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: SCENES[world] }} />
    </div>
  );
}
