import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { builtinWords } from '../../content';
import { DEFAULT_KID } from '../../types';
import { FlashcardStep } from './FlashcardStep';

vi.mock('../../audio/speech', () => ({ speak: vi.fn() }));
vi.mock('../../audio/sfx', () => ({ playSfx: vi.fn() }));

const pool = builtinWords(0);
const he = pool.find((w) => w.text === '河')!;
const base = { word: he, pool, kid: DEFAULT_KID, known: 0 };
const review = { wordId: he.id, isNew: false, retry: false };

describe('FlashcardStep', () => {
  it('introduces a new word before quizzing it', () => {
    render(<FlashcardStep {...base} item={{ ...review, isNew: true }} voice={false} onDone={vi.fn()} />);
    fireEvent.click(screen.getByText('我记住了！'));
    expect(document.querySelectorAll('.choice')).toHaveLength(4);
  });

  it('read mode: a correct pinyin answer reports correct with timings', () => {
    const onDone = vi.fn();
    render(<FlashcardStep {...base} item={review} voice={false} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: he.pinyin }));
    fireEvent.click(screen.getByText('下一个'));
    expect(onDone).toHaveBeenCalledWith({ correct: true, responseMs: expect.any(Number), elapsedMs: expect.any(Number) });
  });

  it('a wrong answer reveals the right one', () => {
    const onDone = vi.fn();
    render(<FlashcardStep {...base} item={review} voice={false} onDone={onDone} />);
    const wrong = [...document.querySelectorAll<HTMLButtonElement>('.choice')].find((b) => b.textContent !== he.pinyin)!;
    fireEvent.click(wrong);
    expect(document.querySelector('.answer-reveal')?.textContent).toContain(he.pinyin);
    fireEvent.click(screen.getByText('下一个'));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it('listen mode offers single characters including the answer', () => {
    render(<FlashcardStep {...base} item={review} voice onDone={vi.fn()} />);
    const options = [...document.querySelectorAll('.choice')].map((b) => b.textContent ?? '');
    expect(options).toContain('河');
    expect(options.every((o) => Array.from(o).length === 1)).toBe(true);
  });

  it('falls back to read mode when no same-length look-alikes exist', () => {
    const target = { ...he, id: 'p:x', text: '河马河', pinyin: 'hé mǎ hé' };
    render(<FlashcardStep {...base} word={target} item={{ ...review, wordId: 'p:x' }} voice onDone={vi.fn()} />);
    expect(document.querySelector('.hanzi--xl')?.textContent).toBe('河马河');
    expect(new Set([...document.querySelectorAll('.choice')].map((b) => b.textContent)).size).toBe(4);
  });
});

describe('intro meanings', () => {
  it('labels only the radical with a meaning', () => {
    const ri = pool.find((w) => w.text === '日')!;
    render(<FlashcardStep {...base} word={ri} item={{ wordId: ri.id, isNew: true, retry: false }} voice={false} onDone={vi.fn()} />);
    expect(document.querySelector('.intro')!.textContent).not.toContain('👄');
    cleanup();
    render(<FlashcardStep {...base} item={{ wordId: he.id, isNew: true, retry: false }} voice={false} onDone={vi.fn()} />);
    expect(document.querySelector('.intro')!.textContent).toContain('💧');
  });
});
