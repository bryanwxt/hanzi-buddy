import { useState } from 'preact/hooks';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinPad({ onComplete, error = null }: { onComplete: (pin: string) => void; error?: string | null }) {
  const [digits, setDigits] = useState('');
  const press = (key: string) => {
    if (key === '⌫') return setDigits((d) => d.slice(0, -1));
    const next = (digits + key).slice(0, 4);
    if (next.length === 4) {
      setDigits('');
      onComplete(next);
    } else {
      setDigits(next);
    }
  };
  return (
    <div class="center" style={{ flex: 0 }}>
      <div class="pin-dots" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <span key={i} class={i < digits.length ? 'is-filled' : ''} />)}
      </div>
      {error && <p class="pin-error" role="alert">{error}</p>}
      <div class="pinpad">
        {KEYS.map((k, i) =>
          k ? (
            <button key={k} type="button" aria-label={k === '⌫' ? 'Delete' : k} onClick={() => press(k)}>
              {k}
            </button>
          ) : (
            <span key={`gap-${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
