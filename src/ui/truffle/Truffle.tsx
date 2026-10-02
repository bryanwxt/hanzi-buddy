import { useId } from 'preact/hooks';
import { POWERS, type PowerId } from '../../fun/powers';
import { BODY, FACES, HEAD, accessoryPlacement, type TruffleMood } from './parts';
import { powerLayer } from './powers';

export type { TruffleMood } from './parts';

interface Props {
  mood?: TruffleMood;
  accessory?: string | null;
  size?: number;
  lookAt?: number; // -1 (left) … 1 (right): tilts the head
  label?: string | null; // null → decorative
  bounce?: boolean;
  power?: string | null;
  powerTier?: number;
}

/** Truffle 松露, drawn in layers; the face layer is swapped per mood. */
export function Truffle({ mood = 'sulk', accessory = null, size = 160, lookAt = 0, label = '松露', bounce = false, power = null, powerTier = 0 }: Props) {
  const grain = `truffle-grain-${useId()}`;
  const a11y = label === null ? { 'aria-hidden': 'true' as const } : { role: 'img' as const, 'aria-label': label };
  const tilt = Math.max(-1, Math.min(1, lookAt)) * 4;
  const acc = accessory ? accessoryPlacement(accessory) : null;
  const tier = Math.max(0, Math.min(3, Math.floor(powerTier))) as 0 | 1 | 2 | 3;
  const layer = power && tier > 0 && isPower(power) ? powerLayer(power, tier as 1 | 2 | 3) : null;
  return (
    <svg
      class={`truffle${bounce ? ' truffle--bounce' : ''}`}
      viewBox="30 20 260 270"
      width={size}
      height={Math.round((size * 270) / 260)}
      data-mood={mood}
      data-power={layer ? power! : undefined}
      data-tier={String(layer ? tier : 0)}
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
        {layer && <g class="truffle__power-back" dangerouslySetInnerHTML={{ __html: layer.back }} />}
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
        {layer && <g class="truffle__power-front" dangerouslySetInnerHTML={{ __html: layer.front }} />}
      </g>
    </svg>
  );
}

const isPower = (id: string): id is PowerId => POWERS.some((p) => p.id === id);
