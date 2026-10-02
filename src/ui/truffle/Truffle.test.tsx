import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { TRUFFLE_MOODS, accessoryPlacement } from './parts';
import { Truffle } from './Truffle';

const svg = (c: Element) => c.querySelector('svg.truffle')!;

describe('Truffle', () => {
  it('is an image labelled 松露 with body, head and the requested face', () => {
    const { container } = render(<Truffle mood="wow" />);
    expect(svg(container).getAttribute('role')).toBe('img');
    expect(svg(container).getAttribute('aria-label')).toBe('松露');
    expect(svg(container).getAttribute('data-mood')).toBe('wow');
    expect(container.querySelector('.truffle__body')).toBeTruthy();
    expect(container.querySelector('.truffle__head')).toBeTruthy();
    expect(container.querySelector('.truffle__face--wow')).toBeTruthy();
  });
  it('has a face for every mood', () => {
    for (const mood of TRUFFLE_MOODS) {
      const { container, unmount } = render(<Truffle mood={mood} />);
      expect(container.querySelector(`.truffle__face--${mood}`)?.innerHTML.length).toBeGreaterThan(20);
      unmount();
    }
  });
  it('wears an accessory where it belongs', () => {
    const { container } = render(<Truffle accessory="🕶️" />);
    const t = container.querySelector('.truffle__accessory')!;
    expect(t.textContent).toBe('🕶️');
    expect(t.getAttribute('y')).toBe(String(accessoryPlacement('🕶️').y));
    expect(accessoryPlacement('👑').y).toBeLessThan(accessoryPlacement('🧣').y);
  });
  it('gives each instance its own grain filter id', () => {
    const { container } = render(<><Truffle /><Truffle /></>);
    const ids = [...container.querySelectorAll('filter')].map((f) => f.id);
    expect(new Set(ids).size).toBe(2);
  });
  it('can be decorative', () => {
    const { container } = render(<Truffle label={null} />);
    expect(svg(container).getAttribute('aria-hidden')).toBe('true');
  });
});
