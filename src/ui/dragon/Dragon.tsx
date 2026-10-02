import { useEffect, useId, useState } from 'preact/hooks';
import type { PetColor } from '../../types';
import { reducedMotion } from '../motion';
import { accessoryAnchor, blobPath, faceGeometry, nextBlinkDelay, paletteVars, stageParts, type Blob, type Face } from './parts';

export type DragonMood = 'determined' | 'happy' | 'munch' | 'comfort' | 'cheer' | 'sleepy' | null;

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
const INK = '#1f2937';

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

/** Expressions are CSS-driven: every face part is always drawn and the mood class picks what shows. */
export function Dragon({ stage, color, mood = null, accessory = null, lookAt = 0, size = 160, label = '小龙' }: Props) {
  const parts = stageParts(stage);
  const blinking = useBlink(!parts.egg);
  const anchor = accessoryAnchor(parts);
  const look = Math.max(-1, Math.min(1, lookAt));
  const cls = `dragon dragon--stage${stage}${mood ? ` dragon--${mood}` : ''}${blinking ? ' is-blinking' : ''}`;
  const a11y = label === null ? { 'aria-hidden': 'true' as const } : { role: 'img' as const, 'aria-label': label };
  const b = parts.blob;
  const uid = useId();
  const clipId = `dragon-clip-${uid}`;
  const auraId = `dragon-aura-${uid}`;
  return (
    <svg class={cls} viewBox="0 0 200 200" width={size} height={size} data-stage={String(stage)} style={paletteVars(color)} {...a11y}>
      <defs>
        <radialGradient id={auraId}>
          <stop offset="0" stop-color="#fff1bf" stop-opacity="1" />
          <stop offset="0.6" stop-color="#ffd76a" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffd76a" stop-opacity="0" />
        </radialGradient>
        {b && (
          <clipPath id={clipId}>
            <path d={blobPath(b)} />
          </clipPath>
        )}
      </defs>
      <ellipse class="dragon__shadow" cx="100" cy="190" rx="54" ry="7" />
      {parts.aura && (
        <g class="dragon__aura">
          <circle cx="100" cy="112" r="96" fill={`url(#${auraId})`} />
        </g>
      )}
      <g class="dragon__all">
        {parts.egg || !b ? (
          <Egg />
        ) : (
          <g class="dragon__sway">
            <g class="dragon__body-group">
              {parts.tail && <Tail b={b} />}
              {parts.wingScale > 0 && <Wings b={b} scale={parts.wingScale} />}
              {parts.horns && <Horns b={b} />}
              <path class="dragon__body" d={blobPath(b)} fill="var(--d-body)" />
              <g clip-path={`url(#${clipId})`}>
                <ellipse cx={100 + b.hw * 0.5} cy={b.bottom + 4} rx={b.hw * 1.15} ry={(b.bottom - b.top) * 0.3} fill="var(--d-wing)" opacity="0.45" />
                <ellipse cx={100 - b.hw * 0.42} cy={b.top + (b.bottom - b.top) * 0.16} rx={b.hw * 0.34} ry={(b.bottom - b.top) * 0.1} fill="#fff" opacity="0.22" />
              </g>
              <Belly f={faceGeometry(b)} />
              <Feet b={b} />
              <FaceParts f={faceGeometry(b)} look={look} />
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
          <Sparkle x={30} y={60} s={9} />
          <Sparkle x={172} y={70} s={7} />
          <Sparkle x={164} y={150} s={8} />
        </>
      )}
      <g class="dragon__zzz" fill="var(--d-dark)" font-weight="800">
        <text x="146" y="58" font-size="22">z</text>
        <text x="160" y="38" font-size="16">z</text>
      </g>
    </svg>
  );
}

function Egg() {
  return (
    <g class="dragon__egg">
      <ellipse cx="100" cy="122" rx="56" ry="68" fill="var(--d-belly)" stroke="var(--d-body)" stroke-width="4" />
      <circle cx="74" cy="92" r="10" fill="var(--d-body)" opacity="0.5" />
      <circle cx="130" cy="150" r="13" fill="var(--d-body)" opacity="0.5" />
      <circle cx="80" cy="162" r="7" fill="var(--d-body)" opacity="0.5" />
      <circle cx="132" cy="86" r="7" fill="var(--d-body)" opacity="0.5" />
      <ellipse cx="80" cy="80" rx="8" ry="15" fill="#fff" opacity="0.6" transform="rotate(-20 80 80)" />
      <path class="dragon__egg-eye" d="M82 120 Q88 127 94 120" fill="none" stroke={INK} stroke-width="3.5" stroke-linecap="round" />
      <path class="dragon__egg-eye" d="M106 120 Q112 127 118 120" fill="none" stroke={INK} stroke-width="3.5" stroke-linecap="round" />
      <ellipse cx="78" cy="131" rx="7" ry="4" fill="var(--d-cheek)" opacity="0.7" />
      <ellipse cx="122" cy="131" rx="7" ry="4" fill="var(--d-cheek)" opacity="0.7" />
    </g>
  );
}

function Tail({ b }: { b: Blob }) {
  const x = 100 + b.hw * 0.72;
  const y = b.bottom - 18;
  return (
    <g class="dragon__tail">
      <path d={`M${x} ${y} C${x + 30} ${y + 4} ${x + 42} ${y - 14} ${x + 36} ${y - 38} C${x + 31} ${y - 24} ${x + 22} ${y - 12} ${x - 4} ${y - 12} Z`} fill="var(--d-body)" />
      <path d={`M${x + 36} ${y - 50} L${x + 46} ${y - 34} L${x + 30} ${y - 32} Z`} fill="var(--d-wing)" stroke="var(--d-wing)" stroke-width="4" stroke-linejoin="round" />
    </g>
  );
}

function wingPath(x: number, y: number, f: number, dir: -1 | 1): string {
  const p = (dx: number, dy: number) => `${x + dir * dx * f} ${y + dy * f}`;
  return `M${p(0, 0)} C${p(24, -34)} ${p(40, -6)} ${p(30, 12)} C${p(22, 8)} ${p(12, 16)} ${p(0, 12)} Z`;
}

function Wings({ b, scale }: { b: Blob; scale: number }) {
  const y = b.top + (b.bottom - b.top) * 0.55;
  return (
    <>
      <path class="dragon__wing dragon__wing--l" d={wingPath(100 - b.hw * 0.86, y, scale, -1)} fill="var(--d-wing)" />
      <path class="dragon__wing dragon__wing--r" d={wingPath(100 + b.hw * 0.86, y, scale, 1)} fill="var(--d-wing)" />
    </>
  );
}

function Horns({ b }: { b: Blob }) {
  const y = b.top + 8;
  const dx = b.hw * 0.42;
  return (
    <>
      <ellipse class="dragon__horn" cx={100 - dx} cy={y - 8} rx="7" ry="14" fill="var(--d-wing)" transform={`rotate(-22 ${100 - dx} ${y - 8})`} />
      <ellipse class="dragon__horn" cx={100 + dx} cy={y - 8} rx="7" ry="14" fill="var(--d-wing)" transform={`rotate(22 ${100 + dx} ${y - 8})`} />
    </>
  );
}

function Belly({ f }: { f: Face }) {
  return (
    <g class="dragon__belly">
      <ellipse cx="100" cy={f.bellyY} rx={f.bellyRx} ry={f.bellyRy} fill="var(--d-belly)" />
      <path
        d={`M${100 - f.bellyRx * 0.5} ${f.bellyY - 2} h${f.bellyRx} M${100 - f.bellyRx * 0.55} ${f.bellyY + f.bellyRy * 0.45} h${f.bellyRx * 1.1}`}
        stroke="var(--d-wing)"
        stroke-opacity="0.3"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
  );
}

function Feet({ b }: { b: Blob }) {
  return (
    <>
      <ellipse cx={100 - b.hw * 0.42} cy={b.bottom - 1} rx={b.hw * 0.25} ry="8" fill="var(--d-wing)" />
      <ellipse cx={100 + b.hw * 0.42} cy={b.bottom - 1} rx={b.hw * 0.25} ry="8" fill="var(--d-wing)" />
    </>
  );
}

function FaceParts({ f, look }: { f: Face; look: number }) {
  const pupilY = f.eyeY + f.eyeRy * 0.12;
  const eye = (side: -1 | 1) => {
    const cx = 100 + side * f.eyeDx;
    return (
      <g key={side}>
        <g class="dragon__eyes-open">
          <ellipse cx={cx} cy={f.eyeY} rx={f.eyeRx} ry={f.eyeRy} fill="#fff" />
          <g class="dragon__pupil" style={{ transform: `translateX(${look * f.eyeRx * 0.35}px)` }}>
            <circle cx={cx} cy={pupilY} r={f.pupilR} fill={INK} />
            <circle cx={cx - f.pupilR * 0.35} cy={pupilY - f.pupilR * 0.42} r={f.pupilR * 0.4} fill="#fff" />
            <circle cx={cx + f.pupilR * 0.42} cy={pupilY + f.pupilR * 0.38} r={f.pupilR * 0.17} fill="#fff" />
          </g>
          <ellipse class="dragon__eyelid" cx={cx} cy={f.eyeY} rx={f.eyeRx + 1.5} ry={f.eyeRy + 1.5} fill="var(--d-body)" />
        </g>
        <path
          class="dragon__eyes-happy"
          d={`M${cx - f.eyeRx * 0.8} ${f.eyeY + 4} Q${cx} ${f.eyeY - f.eyeRy * 0.9} ${cx + f.eyeRx * 0.8} ${f.eyeY + 4}`}
          fill="none"
          stroke={INK}
          stroke-width="5.5"
          stroke-linecap="round"
        />
        <path
          class={`dragon__brow dragon__brow--${side < 0 ? 'l' : 'r'}`}
          d={`M${cx - f.eyeRx * 0.7} ${f.browY} Q${cx} ${f.browY - 6} ${cx + f.eyeRx * 0.7} ${f.browY}`}
          fill="none"
          stroke="var(--d-dark)"
          stroke-width="5"
          stroke-linecap="round"
        />
      </g>
    );
  };
  const { muzzleY: my, muzzleRx: mrx, muzzleRy: mry } = f;
  return (
    <g class="dragon__face">
      {eye(-1)}
      {eye(1)}
      <ellipse cx={100 - f.eyeDx * 1.5} cy={f.cheekY} rx={f.eyeRx * 0.5} ry={f.eyeRx * 0.28} fill="var(--d-cheek)" opacity="0.75" />
      <ellipse cx={100 + f.eyeDx * 1.5} cy={f.cheekY} rx={f.eyeRx * 0.5} ry={f.eyeRx * 0.28} fill="var(--d-cheek)" opacity="0.75" />
      <ellipse cx="100" cy={my} rx={mrx} ry={mry} fill="var(--d-belly)" />
      <circle cx={100 - mrx * 0.3} cy={my - mry * 0.3} r="2.4" fill="var(--d-dark)" />
      <circle cx={100 + mrx * 0.3} cy={my - mry * 0.3} r="2.4" fill="var(--d-dark)" />
      <path
        class="dragon__smile"
        d={`M${100 - mrx * 0.35} ${my + mry * 0.2} Q100 ${my + mry * 0.75} ${100 + mrx * 0.35} ${my + mry * 0.2}`}
        fill="none"
        stroke="var(--d-dark)"
        stroke-width="3.5"
        stroke-linecap="round"
      />
      <path class="dragon__mouth-big" d={`M${100 - mrx * 0.42} ${my + mry * 0.05} Q100 ${my + mry * 1.35} ${100 + mrx * 0.42} ${my + mry * 0.05} Z`} fill="var(--d-dark)" />
      <ellipse class="dragon__mouth-open" cx="100" cy={my + mry * 0.4} rx={mrx * 0.22} ry={mry * 0.42} fill="var(--d-dark)" />
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
