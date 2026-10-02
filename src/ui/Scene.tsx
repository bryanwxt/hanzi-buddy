export type SceneKind = 'home' | 'sky' | 'desk' | 'pond' | 'stage' | 'night';

const CLOUDS = [
  { top: '7%', w: 180, dur: 70, delay: -10 },
  { top: '17%', w: 120, dur: 95, delay: -55 },
  { top: '29%', w: 150, dur: 82, delay: -30 },
];
const WAVE = 'M0 60 Q75 20 150 60 T300 60 T450 60 T600 60 T750 60 T900 60 T1050 60 T1200 60 V120 H0 Z';
const STARS = Array.from({ length: 24 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 60, d: (i % 6) * 0.4 }));

/** Decorative full-screen background with slow ambient motion. */
export function Scene({ kind }: { kind: SceneKind }) {
  return (
    <div class={`scene scene--${kind}`} aria-hidden="true">
      {(kind === 'home' || kind === 'sky') &&
        CLOUDS.map((c, i) => (
          <svg
            key={i}
            class="scene__cloud"
            viewBox="0 0 120 60"
            style={{ top: c.top, width: `${c.w}px`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
          >
            <path d="M20 50 a18 18 0 0 1 4 -35 a24 24 0 0 1 44 -6 a20 20 0 0 1 34 14 a16 16 0 0 1 -2 27 Z" />
          </svg>
        ))}
      {kind === 'home' && (
        <svg class="scene__hills" viewBox="0 0 1000 300" preserveAspectRatio="none">
          <path d="M0 180 Q250 90 500 170 T1000 150 V300 H0 Z" fill="#b8e6a0" />
          <path d="M0 230 Q300 160 620 230 T1000 220 V300 H0 Z" fill="#8fd47a" />
        </svg>
      )}
      {kind === 'pond' && (
        <>
          <svg class="scene__waves scene__waves--back" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d={WAVE} fill="#5bb6dd" />
          </svg>
          <svg class="scene__waves" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d={WAVE} fill="#3fa4d1" />
          </svg>
        </>
      )}
      {kind === 'desk' && <div class="scene__desk" />}
      {kind === 'night' &&
        STARS.map((s, i) => <span key={i} class="scene__star" style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s` }} />)}
    </div>
  );
}
