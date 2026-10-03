import { LOUD_ENOUGH, QUIET_HINT_MS } from '../../langdu/loudness';
import { Label } from '../../ui/Label';

const FULL = LOUD_ENOUGH * 3; // the bar's top; the target tick sits a third of the way up

/** How loud he is reading: a fill bar with a target tick, and a gentle 大声一点！ after 2 s of quiet. Never scored. */
export function LoudnessMeter({ level, quietMs }: { level: number; quietMs: number }) {
  const pct = Math.round(Math.min(1, level / FULL) * 100);
  const loud = level >= LOUD_ENOUGH;
  return (
    <div class={`meter${loud ? ' is-loud' : ''}`} role="meter" aria-label="声音" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div class="meter__bar">
        <div class="meter__fill" style={{ width: `${pct}%` }} />
        <div class="meter__target" style={{ left: `${Math.round((LOUD_ENOUGH / FULL) * 100)}%` }} />
      </div>
      {loud ? <span class="meter__msg meter__msg--good"><Label zh="真棒！" /></span> : quietMs >= QUIET_HINT_MS ? <span class="meter__msg"><Label zh="大声一点！" /></span> : null}
    </div>
  );
}
