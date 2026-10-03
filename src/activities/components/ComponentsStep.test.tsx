import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_KID } from '../../types';
import { ComponentsStep } from './ComponentsStep';
import type { ComponentQuestion } from './game';

vi.mock('../../audio/speech', () => ({ stopSpeaking: vi.fn(), speak: vi.fn() }));
vi.mock('../../audio/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../../ui/motion', () => ({ burst: vi.fn(), reducedMotion: () => false }));
import { burst } from '../../ui/motion';

const questions: ComponentQuestion[] = [
  { kind: 'tapAll', component: '氵', answers: ['河', '汉'], grid: ['河', '汉', '大', '人', '口', '一', '二', '三'] },
  { kind: 'whichPart', char: '妈', component: '女', options: ['马', '女'] },
];

describe('ComponentsStep', () => {
  it('runs a fishing question, then a which-part question, then finishes', () => {
    const onDone = vi.fn();
    render(<ComponentsStep questions={questions} kid={DEFAULT_KID} resting="sulk" onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: '河' }));
    fireEvent.click(screen.getByRole('button', { name: '汉' }));
    fireEvent.click(screen.getByText('检查'));
    expect(screen.getByText('全对了！')).toBeTruthy();
    fireEvent.click(screen.getByText('继续'));
    fireEvent.click(screen.getByRole('button', { name: '女' }));
    fireEvent.click(screen.getByText('继续'));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows the fish that were missed', () => {
    render(<ComponentsStep questions={questions} kid={DEFAULT_KID} resting="sulk" onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '河' }));
    fireEvent.click(screen.getByText('检查'));
    expect(screen.getByText('看看绿色的！')).toBeTruthy();
    expect(screen.getByRole('button', { name: '汉' }).className).toContain('is-missed');
  });
});

describe('fishing effects', () => {
  it('splashes when a fish is caught and when the catch is all right', () => {
    vi.mocked(burst).mockClear();
    render(<ComponentsStep questions={questions} kid={DEFAULT_KID} resting="sulk" onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '河' }));
    expect(burst).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '汉' }));
    fireEvent.click(screen.getByText('检查'));
    expect(burst).toHaveBeenCalledTimes(4);
  });
});
