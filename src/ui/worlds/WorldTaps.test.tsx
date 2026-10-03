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
  it("restarts the SVG's animation clock for each effect (SVG animations time from page load, so a late tap would play already finished)", () => {
    const setCurrentTime = vi.fn();
    (SVGSVGElement.prototype as unknown as { setCurrentTime: (t: number) => void }).setCurrentTime = setCurrentTime;
    render(<WorldTaps world="yard" kid={kid()} today="2026-10-06" onKid={vi.fn()} onSay={vi.fn()} />);
    tap('洒水器');
    expect(setCurrentTime).toHaveBeenCalledWith(0);
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
});
