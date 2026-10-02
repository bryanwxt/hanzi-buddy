import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Chest } from './Chest';
import { ProgressBar } from './ProgressBar';
import { Scene } from './Scene';

describe('Scene (ink layer)', () => {
  it('draws paper with two soft swashes and no old scenery', () => {
    const { container } = render(<Scene kind="home" />);
    expect(container.querySelectorAll('.scene__swash')).toHaveLength(2);
    expect(container.querySelector('.scene__cloud, .scene__hills, .scene__waves, .scene__star')).toBeNull();
    expect(container.querySelector('.scene')!.getAttribute('aria-hidden')).toBe('true');
  });
  it('uses the red celebration block for night', () => {
    const { container } = render(<Scene kind="night" />);
    expect(container.querySelector('.scene')?.className).toContain('scene--night');
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

describe('Chest', () => {
  it('is art only and shows open', () => {
    const { container } = render(<Chest open />);
    expect(container.querySelector('.chest')!.className).toContain('is-open');
    expect(container.querySelector('button')).toBeNull();
  });
});
