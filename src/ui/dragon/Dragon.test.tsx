import { act, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dragon } from './Dragon';
import { accessoryAnchor, DRAGON_PALETTES, faceGeometry, stageParts } from './parts';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const svgOf = (c: Element) => c.querySelector('svg.dragon') as SVGSVGElement;

describe('Dragon', () => {
  it('draws a sleeping egg at stage 0', () => {
    const { container } = render(<Dragon stage={0} color="green" />);
    expect(container.querySelector('.dragon__egg')).toBeTruthy();
    expect(container.querySelectorAll('.dragon__egg-eye')).toHaveLength(2);
    expect(svgOf(container).getAttribute('data-stage')).toBe('0');
  });

  it('draws a horned, tailed blob with a full expression kit at stage 3', () => {
    const { container } = render(<Dragon stage={3} color="green" />);
    expect(container.querySelector('.dragon__body')).toBeTruthy();
    expect(container.querySelector('.dragon__tail')).toBeTruthy();
    expect(container.querySelectorAll('.dragon__horn')).toHaveLength(2);
    expect(container.querySelectorAll('.dragon__brow')).toHaveLength(2);
    expect(container.querySelectorAll('.dragon__eyes-open')).toHaveLength(2);
    expect(container.querySelectorAll('.dragon__eyes-happy')).toHaveLength(2);
    expect(container.querySelector('.dragon__mouth-big')).toBeTruthy();
    expect(container.querySelector('.dragon__zzz')).toBeTruthy();
    expect(container.querySelector('.dragon__egg')).toBeNull();
  });

  it('switches expression by mood class', () => {
    for (const mood of ['determined', 'happy', 'munch', 'comfort', 'cheer', 'sleepy'] as const) {
      const { container, unmount } = render(<Dragon stage={2} color="blue" mood={mood} />);
      expect(svgOf(container).getAttribute('class')).toContain(`dragon--${mood}`);
      unmount();
    }
  });

  it('uses the palette variables', () => {
    const { container } = render(<Dragon stage={2} color="blue" />);
    expect(svgOf(container).style.getPropertyValue('--d-body')).toBe(DRAGON_PALETTES.blue.body);
  });

  it('anchors the accessory above the face', () => {
    const { container } = render(<Dragon stage={2} color="green" accessory="🎩" />);
    const hat = container.querySelector('.dragon__accessory')!;
    expect(hat.textContent).toBe('🎩');
    expect(Number(hat.getAttribute('y'))).toBe(accessoryAnchor(stageParts(2)).y);
  });

  it('looks toward the answers', () => {
    const { container } = render(<Dragon stage={2} color="green" lookAt={1} />);
    const f = faceGeometry(stageParts(2).blob!);
    expect((container.querySelector('.dragon__pupil') as SVGGElement).style.transform).toBe(`translateX(${f.eyeRx * 0.35}px)`);
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
