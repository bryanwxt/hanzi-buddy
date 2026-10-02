import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';
import { Scene } from './Scene';

describe('Scene', () => {
  it('renders the requested scene with its decorations', () => {
    const { container } = render(<Scene kind="pond" />);
    expect(container.querySelector('.scene--pond')).toBeTruthy();
    expect(container.querySelectorAll('.scene__waves')).toHaveLength(2);
    expect(container.querySelector('.scene')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('ProgressBar', () => {
  it('fills to the fraction and marks finished checkpoints', () => {
    const { container } = render(<ProgressBar steps={['flashcards', 'writing', 'components']} stepIndex={1} fraction={0.5} />);
    expect(container.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('50');
    expect((container.querySelector('.progressbar__fill') as HTMLElement).style.width).toBe('50%');
    expect(container.querySelectorAll('.progressbar__cp.is-done')).toHaveLength(1);
    expect(container.querySelectorAll('.progressbar__cp.is-current')).toHaveLength(1);
  });
});
