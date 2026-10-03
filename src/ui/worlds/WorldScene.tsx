import type { TimeOfDay, WorldId } from '../../fun/worlds';
import { SCENE_VIEWBOX, SCENES, timeLayers } from './scenes';

/** The journey world behind Home: time-of-day wash, the world, then evening extras. Decorative. */
export function WorldScene({ world, time }: { world: WorldId; time: TimeOfDay }) {
  const { wash, over } = timeLayers(time, world);
  return (
    <div class="world-scene" data-world={world} data-time={time} aria-hidden="true">
      <svg viewBox={SCENE_VIEWBOX} preserveAspectRatio="xMidYMax slice" dangerouslySetInnerHTML={{ __html: wash + SCENES[world] + over }} />
    </div>
  );
}
