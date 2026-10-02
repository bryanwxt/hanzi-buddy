import { act, fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { makeWord } from '../../test/fixtures';
import { DEFAULT_KID } from '../../types';
import { WritingStep } from './WritingStep';

type QuizOpts = { onComplete: (s: { totalMistakes: number }) => void };
const quizzes: QuizOpts[] = [];
let loadError: (() => void) | undefined;

vi.mock('hanzi-writer', () => ({
  default: {
    create: vi.fn((_el: unknown, _ch: string, opts: { onLoadCharDataError?: () => void }) => {
      loadError = opts.onLoadCharDataError;
      return { quiz: (o: QuizOpts) => { quizzes.push(o); return Promise.resolve(); }, cancelQuiz: vi.fn() };
    }),
  },
}));
vi.mock('../../audio/speech', () => ({ speak: vi.fn() }));
vi.mock('../../audio/sfx', () => ({ playSfx: vi.fn() }));

describe('WritingStep', () => {
  it('writes each character in turn and reports the total misses', () => {
    quizzes.length = 0;
    const onDone = vi.fn();
    render(<WritingStep word={makeWord('大人', { pinyin: 'dà rén' })} kid={DEFAULT_KID} known={0} onDone={onDone} />);
    act(() => quizzes.at(-1)!.onComplete({ totalMistakes: 1 }));
    fireEvent.click(screen.getByText('下一个字'));
    act(() => quizzes.at(-1)!.onComplete({ totalMistakes: 2 }));
    fireEvent.click(screen.getByText('完成'));
    expect(onDone).toHaveBeenCalledWith({ totalMisses: 3, elapsedMs: expect.any(Number) });
  });

  it('skips the word when its stroke data cannot load', () => {
    const onDone = vi.fn();
    render(<WritingStep word={makeWord('大')} kid={DEFAULT_KID} known={0} onDone={onDone} />);
    act(() => loadError!());
    expect(onDone).toHaveBeenCalledWith(null);
  });
});
