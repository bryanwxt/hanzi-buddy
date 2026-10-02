import { useId } from 'preact/hooks';
import { BODY, FACES, HEAD, accessoryPlacement, type TruffleMood } from './parts';

export type { TruffleMood } from './parts';

interface Props {
  mood?: TruffleMood;
  accessory?: string | null;
  size?: number;
  lookAt?: number; // -1 (left) … 1 (right): tilts the head
  label?: string | null; // null → decorative
  bounce?: boolean;
}

/** Truffle 松露, drawn in layers; the face layer is swapped per mood. */
export function Truffle({ mood = 'sulk', accessory = null, size = 160, lookAt = 0, label = '松露', bounce = false }: Props) {
  const grain = `truffle-grain-${useId()}`;
  const a11y = label === null ? { 'aria-hidden': 'true' as const } : { role: 'img' as const, 'aria-label': label };
  const tilt = Math.max(-1, Math.min(1, lookAt)) * 4;
  const acc = accessory ? accessoryPlacement(accessory) : null;
  return (
    <svg
      class={`truffle${bounce ? ' truffle--bounce' : ''}`}
      viewBox="30 20 260 270"
      width={size}
      height={Math.round((size * 270) / 260)}
      data-mood={mood}
      {...a11y}
    >
      <defs>
        <filter id={grain} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={1} seed={2} result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g" result="l">
            <feFuncR type="linear" slope={0.3} intercept={0.76} />
            <feFuncG type="linear" slope={0.3} intercept={0.76} />
            <feFuncB type="linear" slope={0.3} intercept={0.76} />
          </feComponentTransfer>
          <feComposite in="l" in2="SourceGraphic" operator="in" result="m" />
          <feBlend in="SourceGraphic" in2="m" mode="multiply" />
        </filter>
      </defs>
      <g filter={`url(#${grain})`}>
        <g class="truffle__body" dangerouslySetInnerHTML={{ __html: BODY }} />
        <g transform={`rotate(${tilt} 160 120)`}>
          <g class="truffle__head" dangerouslySetInnerHTML={{ __html: HEAD }} />
          <g class={`truffle__face truffle__face--${mood}`} dangerouslySetInnerHTML={{ __html: FACES[mood] }} />
          {acc && (
            <text class="truffle__accessory" x={acc.x} y={acc.y} font-size={acc.size} text-anchor="middle" dominant-baseline="middle">
              {accessory}
            </text>
          )}
        </g>
      </g>
    </svg>
  );
}
