import { useEffect, useState } from 'preact/hooks';
import type { PetColor } from '../../types';
import { reducedMotion } from '../motion';
import { accessoryAnchor, nextBlinkDelay, paletteVars, stageParts, type Body, type Circle } from './parts';

export type DragonMood = 'happy' | 'munch' | 'comfort' | 'cheer' | null;

interface Props {
  stage: number;
  color: PetColor;
  mood?: DragonMood;
  accessory?: string | null;
  lookAt?: number; // -1 (left) … 1 (right)
  size?: number;
  label?: string | null; // null → decorative
}

const BLINK_MS = 140;

function useBlink(enabled: boolean): boolean {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (!enabled || reducedMotion()) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        timer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, BLINK_MS);
      }, nextBlinkDelay(Math.random));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [enabled]);
  return blinking;
}

export function Dragon({ stage, color, mood = null, accessory = null, lookAt = 0, size = 160, label = '小龙' }: Props) {
  const parts = stageParts(stage);
  const blinking = useBlink(!parts.egg);
  const look = Math.max(-1, Math.min(1, lookAt)) * 0.12;
  const anchor = accessoryAnchor(parts);
  const cls = `dragon dragon--stage${stage}${mood ? ` dragon--${mood}` : ''}${blinking ? ' is-blinking' : ''}`;
  const a11y = label === null ? { 'aria-hidden': 'true' as const } : { role: 'img' as const, 'aria-label': label };
  return (
    <svg class={cls} viewBox="0 0 200 200" width={size} height={size} data-stage={String(stage)} style={paletteVars(color)} {...a11y}>
      <defs>
        <radialGradient id="dragon-aura">
          <stop offset="0" stop-color="#fff1bf" stop-opacity="1" />
          <stop offset="0.6" stop-color="#ffd76a" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffd76a" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse class="dragon__shadow" cx="100" cy="190" rx="52" ry="7" />
      {parts.aura && (
        <g class="dragon__aura">
          <circle cx="100" cy="112" r="94" fill="url(#dragon-aura)" />
        </g>
      )}
      <g class="dragon__all">
        {parts.egg ? (
          <Egg />
        ) : (
          <g class="dragon__body-group">
            {parts.tail && parts.body && <Tail body={parts.body} />}
            {parts.wingScale > 0 && parts.body && <Wings body={parts.body} scale={parts.wingScale} />}
            {parts.body && <Torso body={parts.body} />}
            {parts.head && <Head head={parts.head} horns={parts.horns} look={look} />}
            {parts.shell && (
              <path
                class="dragon__shell"
                d="M46 136 L58 124 L70 138 L84 122 L100 138 L116 122 L130 138 L142 124 L154 136 C158 172 134 192 100 192 C66 192 42 172 46 136 Z"
                fill="var(--d-belly)"
                stroke="var(--d-body)"
                stroke-width="4"
                stroke-linejoin="round"
              />
            )}
          </g>
        )}
        {accessory && (
          <text class="dragon__accessory" x={anchor.x} y={anchor.y} font-size={anchor.size} text-anchor="middle">
            {accessory}
          </text>
        )}
      </g>
      {parts.aura && (
        <>
          <Sparkle x={34} y={60} s={9} />
          <Sparkle x={170} y={72} s={7} />
          <Sparkle x={160} y={150} s={8} />
        </>
      )}
    </svg>
  );
}

function Egg() {
  return (
    <g class="dragon__egg">
      <ellipse cx="100" cy="122" rx="56" ry="68" fill="var(--d-belly)" stroke="var(--d-body)" stroke-width="4" />
      <circle cx="78" cy="98" r="11" fill="var(--d-body)" opacity="0.55" />
      <circle cx="124" cy="128" r="14" fill="var(--d-body)" opacity="0.55" />
      <circle cx="94" cy="156" r="8" fill="var(--d-body)" opacity="0.55" />
      <circle cx="128" cy="90" r="7" fill="var(--d-body)" opacity="0.55" />
      <ellipse cx="80" cy="84" rx="9" ry="16" fill="#fff" opacity="0.6" transform="rotate(-20 80 84)" />
    </g>
  );
}

function Tail({ body }: { body: Body }) {
  const x = 100 + body.rx - 10;
  const y = body.cy + body.ry - 14;
  return (
    <path
      class="dragon__tail"
      d={`M${x} ${y} C${x + 30} ${y + 6} ${x + 44} ${y - 18} ${x + 36} ${y - 44} C${x + 32} ${y - 26} ${x + 22} ${y - 14} ${x - 4} ${y - 16} Z`}
      fill="var(--d-body)"
    />
  );
}

function wingPath(x: number, y: number, f: number, dir: -1 | 1): string {
  const p = (dx: number, dy: number) => `${x + dir * dx * f} ${y + dy * f}`;
  return `M${p(0, 0)} C${p(28, -34)} ${p(40, 2)} ${p(26, 18)} C${p(18, 12)} ${p(10, 18)} ${p(0, 14)} Z`;
}

function Wings({ body, scale }: { body: Body; scale: number }) {
  const y = body.cy - body.ry * 0.45;
  return (
    <>
      <path class="dragon__wing dragon__wing--l" d={wingPath(100 - body.rx + 8, y, scale, -1)} fill="var(--d-wing)" />
      <path class="dragon__wing dragon__wing--r" d={wingPath(100 + body.rx - 8, y, scale, 1)} fill="var(--d-wing)" />
    </>
  );
}

function Torso({ body }: { body: Body }) {
  const { cy, rx, ry } = body;
  return (
    <g class="dragon__torso">
      <ellipse cx="100" cy={cy} rx={rx} ry={ry} fill="var(--d-body)" />
      <ellipse cx="100" cy={cy + 6} rx={rx * 0.62} ry={ry * 0.72} fill="var(--d-belly)" />
      <path
        d={`M${100 - rx * 0.4} ${cy - 2} h${rx * 0.8} M${100 - rx * 0.45} ${cy + 12} h${rx * 0.9}`}
        stroke="var(--d-body)"
        stroke-opacity="0.25"
        stroke-width="3"
        stroke-linecap="round"
      />
      <ellipse cx={100 - rx * 0.5} cy={cy + ry - 4} rx="13" ry="8" fill="var(--d-wing)" />
      <ellipse cx={100 + rx * 0.5} cy={cy + ry - 4} rx="13" ry="8" fill="var(--d-wing)" />
    </g>
  );
}

function Head({ head, horns, look }: { head: Circle; horns: boolean; look: number }) {
  const { cy, r } = head;
  const eye = (side: -1 | 1) => {
    const ex = 100 + side * r * 0.38;
    const ey = cy - r * 0.05;
    const rx = r * 0.24;
    const ry = r * 0.28;
    return (
      <g key={side}>
        <ellipse cx={ex} cy={ey} rx={rx} ry={ry} fill="#fff" />
        <g class="dragon__pupil" style={{ transform: `translateX(${look * r}px)` }}>
          <circle cx={ex} cy={ey + ry * 0.12} r={r * 0.14} fill="#1f2937" />
          <circle cx={ex - r * 0.05} cy={ey - ry * 0.18} r={r * 0.05} fill="#fff" />
        </g>
        <ellipse class="dragon__eyelid" cx={ex} cy={ey} rx={rx + 1} ry={ry + 1} fill="var(--d-body)" />
      </g>
    );
  };
  const horn = (side: -1 | 1) => (
    <path
      key={`h${side}`}
      class="dragon__horn"
      d={`M${100 + side * r * 0.62} ${cy - r * 0.55} q${side * r * 0.08} ${-r * 0.8} ${-side * r * 0.3} ${-r * 0.78} q${side * r * 0.12} ${r * 0.32} ${-side * r * 0.08} ${r * 0.64} Z`}
      fill="var(--d-wing)"
    />
  );
  return (
    <g class="dragon__head">
      {horns && [horn(-1), horn(1)]}
      <circle cx="100" cy={cy} r={r} fill="var(--d-body)" />
      <ellipse cx="100" cy={cy + r * 0.42} rx={r * 0.5} ry={r * 0.32} fill="var(--d-belly)" />
      {eye(-1)}
      {eye(1)}
      <ellipse cx={100 - r * 0.62} cy={cy + r * 0.3} rx={r * 0.16} ry={r * 0.1} fill="var(--d-cheek)" opacity="0.7" />
      <ellipse cx={100 + r * 0.62} cy={cy + r * 0.3} rx={r * 0.16} ry={r * 0.1} fill="var(--d-cheek)" opacity="0.7" />
      <circle cx={100 - r * 0.12} cy={cy + r * 0.32} r={r * 0.035} fill="var(--d-dark)" />
      <circle cx={100 + r * 0.12} cy={cy + r * 0.32} r={r * 0.035} fill="var(--d-dark)" />
      <path
        class="dragon__smile"
        d={`M${100 - r * 0.16} ${cy + r * 0.5} Q100 ${cy + r * 0.64} ${100 + r * 0.16} ${cy + r * 0.5}`}
        fill="none"
        stroke="var(--d-dark)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <ellipse class="dragon__mouth-open" cx="100" cy={cy + r * 0.56} rx={r * 0.14} ry={r * 0.12} fill="var(--d-dark)" />
    </g>
  );
}

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      class="dragon__sparkle"
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`}
      fill="#ffd54a"
    />
  );
}
