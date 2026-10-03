import { useEffect, useRef, useState } from 'preact/hooks';
import { speak } from '../../audio/speech';
import { dig, findAnimal, tapEgg, tapGem } from '../../fun/finds';
import type { WorldId } from '../../fun/worlds';
import type { KidState } from '../../types';
import { reducedMotion } from '../motion';
import { SCENE_VIEWBOX } from './scenes';
import { ANIMAL_FACES, BABY_DINO, GEM, SPRAY } from './tapArt';

interface Props {
  world: WorldId;
  kid: KidState;
  today: string;
  onKid: (kid: KidState) => void; // finds (or stars) changed: save it
  onSay: (line: string) => void; // Truffle reacts in his bubble
}

type Effect =
  | { kind: 'spray' }
  | { kind: 'animal'; animal: string }
  | { kind: 'lap' }
  | { kind: 'crack'; cracks: number; gem: boolean }
  | { kind: 'wobble' }
  | { kind: 'bubbles' }
  | { kind: 'launch' }
  | { kind: 'dig'; star: boolean };

const INK = '#2a2630';
const TRACK = 'M-20 460 C80 470 140 380 220 380 C300 380 330 300 290 270 C250 240 210 290 250 320 C300 360 340 330 380 300';
const STAR = 'M0 -12 l3.5 7.5 8 1 -6 5.5 1.6 8 -7.1 -4 -7.1 4 1.6 -8 -6 -5.5 8 -1Z';
const CAR = `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"><path d="M-26 6 L-24 -6 L-10 -8 L-2 -18 L14 -18 L22 -8 L28 -6 L28 6Z" fill="#ffc94a"/><path d="M-4 -9 L1 -15 L12 -15 L17 -9Z" fill="#e4efff"/><circle cx="-14" cy="7" r="6" fill="${INK}"/><circle cx="17" cy="7" r="6" fill="${INK}"/></g>`;
const ROCKET = `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"><path d="M42 370 C42 330 52 300 62 288 C72 300 82 330 82 370Z" fill="#fffaf0"/><path d="M52 288 C56 280 68 280 72 288" fill="#ff5532"/><circle cx="62" cy="324" r="7" fill="#4aa3ff"/><path d="M42 352 l-12 18 h12 M82 352 l12 18 h-12" fill="#ff5532"/><path d="M50 372 q12 26 24 0" fill="#ffc94a"/></g>`;
const EGG = `<ellipse cx="0" cy="0" rx="9" ry="12" fill="#ffe7a3" stroke="${INK}" stroke-width="2.4"/><path d="M-4 -4 l4 4 3 -3" fill="none" stroke="${INK}" stroke-width="2"/>`;

/** Where each world's one tappable thing sits, in scene units (the same 360×480 box as WorldScene). */
const TARGET: Record<WorldId, { label: string; shape: string }> = {
  yard: { label: '洒水器', shape: '<circle cx="68" cy="392" r="30"/>' },
  grass: { label: '草丛', shape: '<rect x="60" y="312" width="50" height="84" rx="10"/>' },
  race: { label: '赛车', shape: '<rect x="26" y="326" width="60" height="80" rx="10"/>' }, // the chequered flag starts the race
  blocks: { label: '宝石', shape: '<rect x="306" y="368" width="54" height="38" rx="6"/>' },
  dino: { label: '恐龙蛋', shape: '<rect x="54" y="408" width="54" height="48" rx="10"/>' },
  sea: { label: '潜水艇', shape: '<rect x="22" y="320" width="86" height="70" rx="12"/>' },
  space: { label: '火箭', shape: '<rect x="30" y="282" width="66" height="96" rx="10"/>' },
  pirate: { label: '宝藏', shape: '<rect x="74" y="392" width="34" height="36" rx="8"/>' },
};

const DURATION: Record<Effect['kind'], number> = { spray: 1200, animal: 2200, lap: 1700, crack: 500, wobble: 800, bubbles: 1600, launch: 3200, dig: 1400 };

/** One thing to tap in each journey world, drawn over the scene in its own coordinates. Never blocks practice: only the target takes taps. */
export function WorldTaps({ world, kid, today, onKid, onSay }: Props) {
  const [effect, setEffect] = useState<Effect | null>(null);
  const busy = useRef(false);
  const gemTaps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const svg = useRef<SVGSVGElement>(null);
  const still = reducedMotion();
  useEffect(() => () => clearTimeout(timer.current), []);

  const play = (e: Effect) => {
    busy.current = true;
    setEffect(e);
    // SVG animations run on the <svg>'s own clock, which started at page load: rewind it so this effect plays from its start
    svg.current?.setCurrentTime?.(0);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      busy.current = false;
      if (e.kind !== 'crack') setEffect(null); // cracks stay on the block for this visit
    }, DURATION[e.kind]);
  };

  const onTap = () => {
    if (busy.current) return; // a running animation ignores taps
    const f = kid.finds;
    switch (world) {
      case 'yard':
        play({ kind: 'spray' });
        onSay('哇！');
        return;
      case 'grass': {
        const r = findAnimal(f, today);
        if (r.isNew) {
          onKid({ ...kid, finds: r.finds });
          onSay('找到了！');
        }
        play({ kind: 'animal', animal: r.animal });
        return;
      }
      case 'race':
        play({ kind: 'lap' });
        return;
      case 'blocks': {
        gemTaps.current += 1;
        const r = tapGem(f, today, gemTaps.current);
        if (r.gem) {
          onKid({ ...kid, finds: r.finds });
          onSay('宝石！');
        }
        play({ kind: 'crack', cracks: r.cracks, gem: r.gem });
        return;
      }
      case 'dino': {
        const next = tapEgg(f);
        if (next !== f) onKid({ ...kid, finds: next });
        play({ kind: 'wobble' });
        return;
      }
      case 'sea':
        play({ kind: 'bubbles' });
        return;
      case 'space':
        speak('三，二，一！');
        play({ kind: 'launch' });
        return;
      case 'pirate': {
        const r = dig(f, today);
        if (r.star) {
          onKid({ ...kid, finds: r.finds, bonusStars: kid.bonusStars + 1 });
          onSay('找到星星了！');
        }
        play({ kind: 'dig', star: r.star });
      }
    }
  };

  const t = TARGET[world];
  const fade = (dur: number) => `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="${dur}ms" fill="freeze"/>`;
  const rise = (from: number, dur: number) => (still ? fade(dur) : `<animateTransform attributeName="transform" type="translate" additive="sum" values="0 ${from};0 0;0 0" keyTimes="0;0.3;1" dur="${dur}ms" fill="freeze"/>${fade(dur)}`);

  let fx = '';
  if (effect?.kind === 'spray') fx = `<g transform="translate(68 396)">${SPRAY}${fade(1200)}</g>`;
  if (effect?.kind === 'animal') fx = `<g class="tap-pop" data-animal="${effect.animal}" transform="translate(88 298) scale(1.1)"><circle r="24" fill="#fffaf0" stroke="${INK}" stroke-width="2.4"/>${ANIMAL_FACES[effect.animal] ?? ''}${rise(40, 2200)}</g>`;
  if (effect?.kind === 'lap') fx = still ? `<g transform="translate(220 380)">${CAR}${fade(1700)}</g>` : `<g>${CAR}<animateMotion dur="1700ms" path="${TRACK}" rotate="auto" fill="freeze"/></g>`;
  if (effect?.kind === 'crack') {
    const lines = ['M316 378 l8 8 -4 6', 'M334 376 l-6 10 5 6', 'M320 396 l6 -6 6 2'];
    fx = lines.slice(0, effect.cracks).map((d) => `<path class="tap-crack" d="${d}" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round"/>`).join('');
    if (effect.gem) fx += `<g transform="translate(325 358)">${GEM}${rise(24, 1400)}</g>`;
  }
  if (effect?.kind === 'wobble') fx = `<g transform="translate(90 428)">${EGG}${still ? '' : '<animateTransform attributeName="transform" type="rotate" additive="sum" values="0;-14;12;-8;6;0" dur="800ms"/>'}</g>`;
  if (effect?.kind === 'bubbles') {
    fx = [0, 1, 2, 3].map((i) => `<circle cx="${50 + i * 12}" cy="340" r="${3 + (i % 2)}" fill="none" stroke="${INK}" stroke-width="1.6">${still ? fade(1600) : `<animate attributeName="cy" values="340;296" dur="${900 + i * 200}ms" fill="freeze"/>${fade(1600)}`}</circle>`).join('');
    fx += `<g transform="translate(-30 410)"><path d="M0 0 c10 -10 30 -10 40 0 c-10 10 -30 10 -40 0Z M0 0 l-10 -6 v12Z" fill="#7fdc7a" stroke="${INK}" stroke-width="2"/>${still ? fade(1600) : `<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;420 -10" dur="1600ms" fill="freeze"/>`}</g>`;
  }
  if (effect?.kind === 'launch') {
    fx = `<path d="M26 278 H100 V374 H26Z" fill="#e4e1f5"/>` + (still ? `<g>${ROCKET}${fade(3200)}</g>` : `<g>${ROCKET}<animateTransform attributeName="transform" type="translate" values="0 0;0 -420;0 -420;0 0" keyTimes="0;0.4;0.55;1" dur="3200ms" fill="freeze"/></g>`);
  }
  if (effect?.kind === 'dig') {
    fx = `<g fill="#ffe7a3" stroke="${INK}" stroke-width="1.6"><circle cx="82" cy="400" r="4"/><circle cx="100" cy="398" r="3.5"/><circle cx="91" cy="394" r="3"/></g>`;
    if (effect.star) fx += `<g transform="translate(91 384)"><path d="${STAR}" fill="#ffc94a" stroke="${INK}" stroke-width="2"/>${rise(20, 1400)}</g>`;
  }
  const baby = world === 'dino' && kid.finds.dinoHatched ? `<g class="tap-baby-dino" transform="translate(94 424) scale(0.9)">${BABY_DINO}</g>` : '';

  return (
    <svg ref={svg} class="world-taps" data-world={world} viewBox={SCENE_VIEWBOX} preserveAspectRatio="xMidYMax slice">
      <g dangerouslySetInnerHTML={{ __html: baby + fx }} />
      <g class="tap" role="button" aria-label={t.label} tabIndex={0} onClick={onTap} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTap()} dangerouslySetInnerHTML={{ __html: t.shape.replace('/>', ' fill="#000" fill-opacity="0"/>') }} />
    </svg>
  );
}
