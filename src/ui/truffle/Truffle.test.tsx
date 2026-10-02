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

describe('Truffle powers', () => {
  it('draws a power by tier: mark, then aura, then cape with the power character', () => {
    const t1 = render(<Truffle power="fire" powerTier={1} />);
    expect(t1.container.querySelector('svg.truffle')?.getAttribute('data-power')).toBe('fire');
    expect(t1.container.querySelector('.truffle__power-front')?.textContent).toContain('🔥');
    expect(t1.container.querySelector('.truffle__power-back')?.innerHTML).toBe('');
    t1.unmount();
    const t3 = render(<Truffle power="fire" powerTier={3} />);
    expect(t3.container.querySelectorAll('.truffle__power-back circle').length).toBe(2);
    expect(t3.container.querySelector('.truffle__power-back .truffle__cape')).toBeTruthy();
    expect(t3.container.querySelector('.truffle__power-front .truffle__emblem')?.textContent).toBe('火');
  });
  it('draws nothing for tier 0 or no power', () => {
    const { container } = render(<Truffle power="fire" powerTier={0} />);
    expect(container.querySelector('.truffle__power-front')).toBeNull();
    expect(container.querySelector('svg.truffle')?.getAttribute('data-tier')).toBe('0');
  });
});

describe('Truffle costumes', () => {
  it('renders every costume with body and head layers', async () => {
    const { COSTUMES } = await import('../../fun/costumes');
    for (const c of COSTUMES) {
      const { container, unmount } = render(<Truffle outfit={c.id} />);
      expect(container.querySelector('svg.truffle')?.getAttribute('data-outfit')).toBe(c.id);
      expect(container.querySelector('.truffle__outfit-body')?.innerHTML.length).toBeGreaterThan(10);
      expect(container.querySelector('.truffle__outfit-head')?.innerHTML.length).toBeGreaterThan(10);
      unmount();
    }
  });
  it('ignores unknown outfits', () => {
    const { container } = render(<Truffle outfit="bogus" />);
    expect(container.querySelector('.truffle__outfit-body')).toBeNull();
    expect(container.querySelector('svg.truffle')?.hasAttribute('data-outfit')).toBe(false);
  });
});

describe('Truffle onesie hood', () => {
  it("hides Truffle's own ears under a onesie hood (and only then)", () => {
    const hooded = render(<Truffle outfit="tiger" />);
    expect(hooded.container.querySelector('.truffle__head')!.innerHTML).not.toContain('M74 92');
    hooded.unmount();
    const chef = render(<Truffle outfit="chef" />);
    expect(chef.container.querySelector('.truffle__head')!.innerHTML).toContain('M74 92');
  });
});
