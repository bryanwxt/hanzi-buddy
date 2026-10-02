import type { StepKind } from '../types';

const ICONS: Record<StepKind, string> = { flashcards: '字', writing: '✍️', components: '🎣', speaking: '🎤' };

export function ProgressBar({ steps, stepIndex, fraction }: { steps: StepKind[]; stepIndex: number; fraction: number }) {
  const pct = Math.round(fraction * 100);
  return (
    <div class="progressbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div class="progressbar__track">
        <div class="progressbar__fill" style={{ width: `${pct}%` }} />
      </div>
      {steps.map((s, i) => (
        <span
          key={s}
          class={`progressbar__cp ${i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : ''}`}
          style={{ left: `${((i + 1) / steps.length) * 100}%` }}
          aria-hidden="true"
        >
          {ICONS[s]}
        </span>
      ))}
    </div>
  );
}
