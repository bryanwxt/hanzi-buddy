import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { LOUD_ENOUGH, QUIET_HINT_MS } from '../../langdu/loudness';
import { LoudnessMeter } from './LoudnessMeter';
describe('LoudnessMeter', () => {
  it('fills with the level and marks loud enough', () => {
    const { container } = render(<LoudnessMeter level={LOUD_ENOUGH * 2} quietMs={0} />);
    expect(container.querySelector('.meter')?.classList.contains('is-loud')).toBe(true);
    expect(screen.queryByText('大声一点！')).toBeNull();
  });
  it('asks for a louder voice only after 2 s of quiet', () => {
    const { rerender } = render(<LoudnessMeter level={LOUD_ENOUGH / 3} quietMs={QUIET_HINT_MS - 100} />);
    expect(screen.queryByText('大声一点！')).toBeNull();
    rerender(<LoudnessMeter level={LOUD_ENOUGH / 3} quietMs={QUIET_HINT_MS} />);
    expect(screen.getByText('大声一点！')).toBeTruthy();
  });
});
