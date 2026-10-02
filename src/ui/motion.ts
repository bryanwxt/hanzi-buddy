import type { Rng } from '../lib/random';

export interface Pt {
  x: number;
  y: number;
}

export interface BurstVector {
  dx: number;
  dy: number;
  rotate: number;
  scale: number;
}

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

const canAnimate = () => typeof document !== 'undefined' && typeof document.body?.animate === 'function' && !reducedMotion();

/** Points along a quadratic arc from `from` to `to`, bowing `lift` px above the higher end. */
export function arcPoints(from: Pt, to: Pt, lift = 120, steps = 12): Pt[] {
  const c = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return { x: u * u * from.x + 2 * u * t * c.x + t * t * to.x, y: u * u * from.y + 2 * u * t * c.y + t * t * to.y };
  });
}

export function burstVectors(count: number, rng: Rng, minDist = 40, maxDist = 90): BurstVector[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.6;
    const dist = minDist + rng() * (maxDist - minDist);
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, rotate: (rng() - 0.5) * 180, scale: 0.6 + rng() * 0.8 };
  });
}

/** A short burst of sparkles at a viewport point. No-op without Web Animations or under reduced motion. */
export function burst(x: number, y: number, opts: { count?: number; glyphs?: string[] } = {}): void {
  if (!canAnimate()) return;
  const glyphs = opts.glyphs ?? ['✦', '★', '•'];
  const layer = document.createElement('div');
  layer.className = 'particles';
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  document.body.appendChild(layer);
  const vectors = burstVectors(opts.count ?? 10, Math.random);
  let remaining = vectors.length;
  vectors.forEach((v, i) => {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = glyphs[i % glyphs.length]!;
    layer.appendChild(p);
    const anim = p.animate(
      [
        { transform: 'translate(0, 0) scale(0.3)', opacity: 1 },
        { transform: `translate(${v.dx}px, ${v.dy}px) rotate(${v.rotate}deg) scale(${v.scale})`, opacity: 0 },
      ],
      { duration: 650, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' },
    );
    anim.onfinish = () => {
      if (--remaining === 0) layer.remove();
    };
  });
}

/** Moves an element along an upward arc to a viewport point. Resolves immediately when animation is unavailable. */
export function flyAlong(el: HTMLElement, to: Pt, opts: { lift?: number; duration?: number; endScale?: number; fade?: boolean } = {}): Promise<void> {
  if (!canAnimate() || typeof el.animate !== 'function') return Promise.resolve();
  const r = el.getBoundingClientRect();
  const from = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const pts = arcPoints(from, to, opts.lift ?? 120);
  const last = pts.length - 1;
  const endScale = opts.endScale ?? 0.3;
  el.style.position = 'relative';
  el.style.zIndex = '40';
  const frames = pts.map((p, i) => ({
    transform: `translate(${p.x - from.x}px, ${p.y - from.y}px) scale(${1 + (endScale - 1) * (i / last)})`,
    opacity: opts.fade && i === last ? 0 : 1,
  }));
  return el
    .animate(frames, { duration: opts.duration ?? 650, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' })
    .finished.then(
      () => undefined,
      () => undefined,
    );
}

type TransitionDoc = Document & { startViewTransition?: (cb: () => unknown) => unknown };

/** Runs a state update inside a view transition when supported; otherwise just runs it. */
export function withViewTransition(update: () => void): void {
  const doc = typeof document !== 'undefined' ? (document as TransitionDoc) : null;
  if (!doc?.startViewTransition || reducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(() => {
    update();
    // Preact renders on the next tick; resolve after it so the new screen is captured.
    return new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}
