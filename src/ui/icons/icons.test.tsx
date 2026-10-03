import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { ICON_NAMES, ICONS, iconMarkup } from './icons';
import { InkIcon } from './InkIcon';

describe('ink icons', () => {
  it('every icon is ink-outlined art', () => {
    const planned = ['drop', 'flame', 'leaf', 'sparkle', 'rock', 'shout', 'hands', 'speech', 'wind', 'heart', 'sun',
      'star', 'starOutline', 'medal', 'lock', 'pen', 'fish', 'mic', 'gift', 'party', 'paw', 'sleepyCat', 'check', 'think', 'none'];
    for (const n of planned) expect(ICON_NAMES).toContain(n);
    for (const n of ICON_NAMES) {
      expect(ICONS[n]).toContain('stroke="#2a2630"');
      expect(ICONS[n]).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
  it('InkIcon renders labelled or decorative', () => {
    const a = render(<InkIcon name="star" label="星" size={20} />);
    expect(a.container.querySelector('svg.inkicon')?.getAttribute('role')).toBe('img');
    expect(a.container.querySelector('svg.inkicon')?.getAttribute('aria-label')).toBe('星');
    a.unmount();
    const b = render(<InkIcon name="lock" />);
    expect(b.container.querySelector('svg.inkicon')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('unknown names render nothing; markup nests inside other SVGs', () => {
    const { container } = render(<InkIcon name={'nope' as never} />);
    expect(container.innerHTML).toBe('');
    expect(iconMarkup('flame', 10, 20, 30)).toMatch(/^<svg x="10" y="20" width="30" height="30" viewBox="0 0 48 48"/);
  });
});
