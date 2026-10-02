import { Check, Lightbulb } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { Label } from './Label';

export type BarTone = 'neutral' | 'good' | 'oops';

interface Props {
  tone?: BarTone;
  title?: string;
  detail?: ComponentChildren;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

/** The lesson's single action spot; after an answer it becomes a coloured feedback sheet. */
export function BottomBar({ tone = 'neutral', title, detail, actionLabel, onAction, disabled = false }: Props) {
  return (
    <div class={`bottombar bottombar--${tone}`} role={tone === 'neutral' ? undefined : 'status'}>
      {tone === 'neutral' ? (
        <span class="spacer" />
      ) : (
        <div class="bottombar__msg">
          <span class="bottombar__badge" aria-hidden="true">
            {tone === 'good' ? <Check size={34} strokeWidth={3.5} /> : <Lightbulb size={30} strokeWidth={3} />}
          </span>
          <div>
            {title && <div class="bottombar__title"><Label zh={title} /></div>}
            {detail && <div class="bottombar__detail">{detail}</div>}
          </div>
        </div>
      )}
      <button type="button" class={`btn btn--big ${tone === 'oops' ? 'btn--oops' : 'btn--primary'}`} disabled={disabled} onClick={() => { if (!disabled) onAction(); }}>
        <Label zh={actionLabel} />
      </button>
    </div>
  );
}
