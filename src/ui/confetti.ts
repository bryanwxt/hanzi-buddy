import confetti from 'canvas-confetti';

export function celebrate(): void {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  void confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
}
