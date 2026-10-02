import { act, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dragon } from './Dragon';
import { accessoryAnchor, DRAGON_PALETTES, stageParts } from './parts';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const svgOf = (c: Element) => c.querySelector('svg.dragon') as SVGSVGElement;

describe('Dragon', () => {
  it('draws an egg at stage 0 and a horned, tailed dragon at stage 3', () => {
    const egg = render(<Dragon stage={0} color="green" />);
    expect(egg.container.querySelector('.dragon__egg')).toBeTruthy();
    expect(svgOf(egg.container).getAttribute('data-stage')).toBe('0');
    const big = render(<Dragon stage={3} color="green" />);
    expect(big.container.querySelector('.dragon__tail')).toBeTruthy();
    expect(big.container.querySelectorAll('.dragon__horn')).toHaveLength(2);
    expect(big.container.querySelector('.dragon__egg')).toBeNull();
  });

  it('applies the mood class and palette variables', () => {
    const { container } = render(<Dragon stage={2} color="blue" mood="munch" />);
    const svg = svgOf(container);
    expect(svg.getAttribute('class')).toContain('dragon--munch');
    expect(svg.style.getPropertyValue('--d-body')).toBe(DRAGON_PALETTES.blue.body);
  });

  it('anchors the accessory above the head', () => {
    const { container } = render(<Dragon stage={2} color="green" accessory="🎩" />);
    const hat = container.querySelector('.dragon__accessory')!;
    expect(hat.textContent).toBe('🎩');
    expect(Number(hat.getAttribute('y'))).toBe(accessoryAnchor(stageParts(2)).y);
  });

  it('looks toward the answers', () => {
    const { container } = render(<Dragon stage={2} color="green" lookAt={1} />);
    const r = stageParts(2).head!.r;
    expect((container.querySelector('.dragon__pupil') as SVGGElement).style.transform).toBe(`translateX(${0.12 * r}px)`);
  });

  it('blinks on a timer', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { container } = render(<Dragon stage={2} color="green" />);
    act(() => { vi.advanceTimersByTime(2500); });
    expect(svgOf(container).getAttribute('class')).toContain('is-blinking');
    act(() => { vi.advanceTimersByTime(150); });
    expect(svgOf(container).getAttribute('class')).not.toContain('is-blinking');
  });

  it('can be decorative', () => {
    const { container } = render(<Dragon stage={2} color="green" label={null} />);
    expect(svgOf(container).getAttribute('aria-hidden')).toBe('true');
    expect(svgOf(container).getAttribute('role')).toBeNull();
  });
});
