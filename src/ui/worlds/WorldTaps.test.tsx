import { act, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FINDS } from '../../fun/finds';
import { WORLDS } from '../../fun/worlds';
import { DEFAULT_KID, type KidState } from '../../types';
import { WorldTaps } from './WorldTaps';

vi.mock('../../audio/speech', () => ({ speak: vi.fn(), stopSpeaking: vi.fn() }));
import { speak } from '../../audio/speech';

const LABEL: Record<string, string> = { yard: '洒水器', grass: '草丛', race: '赛车', blocks: '宝石', dino: '恐龙蛋', sea: '潜水艇', space: '火箭', pirate: '宝藏' };
const kid = (over: Partial<KidState> = {}): KidState => ({ ...DEFAULT_KID, finds: { ...DEFAULT_FINDS }, ...over });
const tap = (label: string) => fireEvent.click(document.querySelector(`.world-taps [aria-label="${label}"]`)!);

beforeEach(() => vi.useFakeTimers());

describe('WorldTaps', () => {
  it('every world has one thing to tap, labelled', () => {
    for (const w of WORLDS) {
      const { unmount } = render(<WorldTaps world={w.id} kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
      expect(document.querySelector(`.world-taps[data-world="${w.id}"] [role="button"][aria-label="${LABEL[w.id]}"]`), w.id).toBeTruthy();
      unmount();
    }
  });
  it('the tall grass reveals the next animal once a day', () => {
    const onKid = vi.fn();
    const onSay = vi.fn();
    const { rerender } = render(<WorldTaps world="grass" kid={kid()} today="2026-10-06" onKid={onKid} onSay={onSay} />);
    tap('草丛');
    expect(onKid).toHaveBeenCalledWith(expect.objectContaining({ finds: expect.objectContaining({ animals: ['rat'] }) }));
    expect(document.querySelector('.tap-pop[data-animal="rat"]')).toBeTruthy();
    expect(onSay).toHaveBeenCalledWith('找到了！');
    act(() => { vi.advanceTimersByTime(2500); });
    const after = onKid.mock.calls[0]![0] as KidState;
    onKid.mockClear();
    rerender(<WorldTaps world="grass" kid={after} today="2026-10-06" onKid={onKid} onSay={onSay} />);
    tap('草丛');
    expect(onKid).not.toHaveBeenCalled(); // nothing new today; the rat just waves
    expect(document.querySelector('.tap-pop[data-animal="rat"]')).toBeTruthy();
  });
  it('a tap during an animation is ignored', () => {
    const onKid = vi.fn();
    render(<WorldTaps world="pirate" kid={kid()} today="2026-10-06" onKid={onKid} onSay={vi.fn()} />);
    tap('宝藏');
    tap('宝藏');
    expect(onKid).toHaveBeenCalledTimes(1);
  });
  it('the X gives one bonus star a day', () => {
    const onKid = vi.fn();
    render(<WorldTaps world="pirate" kid={kid({ bonusStars: 2 })} today="2026-10-06" onKid={onKid} onSay={vi.fn()} />);
    tap('宝藏');
    expect(onKid).toHaveBeenCalledWith(expect.objectContaining({ bonusStars: 3, finds: expect.objectContaining({ lastDigDate: '2026-10-06' }) }));
  });
  it('the gem block cracks three times, then pops a gem', () => {
    const onKid = vi.fn();
    render(<WorldTaps world="blocks" kid={kid()} today="2026-10-06" onKid={onKid} onSay={vi.fn()} />);
    for (let i = 1; i <= 3; i++) {
      tap('宝石');
      act(() => { vi.advanceTimersByTime(600); });
      expect(document.querySelectorAll('.tap-crack')).toHaveLength(i);
    }
    expect(onKid).not.toHaveBeenCalled();
    tap('宝石');
    expect(onKid).toHaveBeenCalledWith(expect.objectContaining({ finds: expect.objectContaining({ gems: 1 }) }));
  });
  it('the egg remembers the tap; a hatched dino is drawn by the nest', () => {
    const onKid = vi.fn();
    const { unmount } = render(<WorldTaps world="dino" kid={kid()} today="2026-10-06" onKid={onKid} onSay={vi.fn()} />);
    tap('恐龙蛋');
    expect(onKid).toHaveBeenCalledWith(expect.objectContaining({ finds: expect.objectContaining({ eggTapped: true }) }));
    unmount();
    render(<WorldTaps world="dino" kid={kid({ finds: { ...DEFAULT_FINDS, eggTapped: true, dinoHatched: true } })} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    expect(document.querySelector('.tap-baby-dino')).toBeTruthy();
  });
  it('the rocket counts down in Chinese', () => {
    render(<WorldTaps world="space" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    tap('火箭');
    expect(speak).toHaveBeenCalledWith('三，二，一！');
  });
  it("every target sits in the open sides of the scene, clear of Home's path and Truffle (scene x 110–290)", () => {
    for (const w of WORLDS) {
      const { unmount } = render(<WorldTaps world={w.id} kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
      const shape = document.querySelector(`.world-taps .tap`)!.firstElementChild!;
      const x = shape.tagName === 'circle' ? Number(shape.getAttribute('cx')) : Number(shape.getAttribute('x')) + Number(shape.getAttribute('width')) / 2;
      const half = shape.tagName === 'circle' ? Number(shape.getAttribute('r')) : Number(shape.getAttribute('width')) / 2;
      expect(x + half <= 110 || x - half >= 290, `${w.id} target spans ${x - half}–${x + half}`).toBe(true);
      unmount();
    }
  });
  it('the popped gem stays up even if he keeps tapping in rhythm', () => {
    render(<WorldTaps world="blocks" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    for (let i = 0; i < 4; i++) {
      tap('宝石');
      act(() => { vi.advanceTimersByTime(550); });
    }
    tap('宝石'); // a 5th tap half a second after the pop
    expect(document.querySelector('.tap-gem')).toBeTruthy();
  });
  it('each effect plays in a fresh animation layer (no reliance on rewinding the SVG clock)', () => {
    render(<WorldTaps world="yard" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    expect(document.querySelector('.world-taps__fx')).toBeNull();
    tap('洒水器');
    const first = document.querySelector('.world-taps__fx');
    expect(first).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1300); });
    tap('洒水器');
    expect(document.querySelector('.world-taps__fx')).not.toBe(first);
  });
  it('once hatched, tapping the nest makes the baby hop instead of drawing an egg over it', () => {
    render(<WorldTaps world="dino" kid={kid({ finds: { ...DEFAULT_FINDS, eggTapped: true, dinoHatched: true } })} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    tap('恐龙蛋');
    expect(document.querySelector('.tap-egg')).toBeNull();
    expect(document.querySelector('.tap-baby-dino.is-hopping')).toBeTruthy();
  });
  it('the rocket waits for the countdown before it lifts off', () => {
    render(<WorldTaps world="space" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    tap('火箭');
    expect(document.querySelector('.tap-rocket animateTransform')?.getAttribute('begin')).toBe('1500ms');
  });
  it('tapping the red car starts the race too', () => {
    render(<WorldTaps world="race" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    const shapes = document.querySelectorAll('.world-taps .tap > *');
    expect(shapes.length).toBe(2); // the flag and the red car's near half
    fireEvent.click(shapes[1]!);
    expect(document.querySelector('.tap-car')).toBeTruthy();
  });
  it("yesterday's taps don't count toward today's gem (Home left open past midnight)", () => {
    const onKid = vi.fn();
    const { rerender } = render(<WorldTaps world="blocks" kid={kid()} today="2026-10-06" onKid={onKid} onSay={vi.fn()} />);
    for (let i = 0; i < 4; i++) {
      tap('宝石');
      act(() => { vi.advanceTimersByTime(1500); });
    }
    const after = onKid.mock.calls[0]![0] as KidState;
    onKid.mockClear();
    rerender(<WorldTaps world="blocks" kid={after} today="2026-10-07" onKid={onKid} onSay={vi.fn()} />);
    tap('宝石');
    expect(onKid).not.toHaveBeenCalled(); // the first tap of a new day is a crack, not a gem
  });
  it('the dig throws sand around the X, inside the island outline', () => {
    render(<WorldTaps world="pirate" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    tap('宝藏');
    // the island's top edge (M24 434 C34 398 110 386 180 388) is at y ≈ 399 at x 71, 396.6 at x 80, 394.6 at x 89
    const edge = (x: number) => 399.1 + ((x - 71) * (394.6 - 399.1)) / 18;
    const puffs = [...document.querySelectorAll('.world-taps__fx circle')];
    expect(puffs.length).toBeGreaterThan(0);
    for (const c of puffs) {
      const [x, y, r] = ['cx', 'cy', 'r'].map((a) => Number(c.getAttribute(a)));
      expect(y - r, `puff at ${x},${y}`).toBeGreaterThan(edge(x) + 2); // clear of the outline
      expect(Math.abs(x - 80)).toBeLessThanOrEqual(16); // beside the X (x 73–87)
    }
  });
});
