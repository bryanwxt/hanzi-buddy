import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Credits } from './Credits';

describe('Credits', () => {
  it('credits the lucide icons the app ships (ISC licence requires attribution)', () => {
    render(<Credits />);
    expect(screen.getByText(/Lucide icons — ISC License/)).toBeTruthy();
  });
});
