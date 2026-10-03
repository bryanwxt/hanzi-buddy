import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_KID } from '../types';
import { Label } from './Label';
import { Pet } from './Pet';
import { PinPad } from './PinPad';
import { SpeakButton } from './SpeakButton';

vi.mock('../audio/speech', () => ({ speak: vi.fn() }));
import { speak } from '../audio/speech';

describe('widgets', () => {
  it('Label shows pinyin above the Chinese', () => {
    const { container } = render(<Label zh="你好" />);
    expect(container.querySelector('.label__py')?.textContent).toBe('nǐ hǎo');
    expect(screen.getByText('你好')).toBeTruthy();
  });

  it("Pet is Truffle wearing the kid's accessory, with a bubble", () => {
    const { container } = render(<Pet kid={{ ...DEFAULT_KID, ownedAccessories: ['medal'], wearing: 'medal' }} mood="pleased" bubble="加油！" />);
    expect(screen.getByRole('img', { name: '松露' }).getAttribute('data-mood')).toBe('pleased');
    expect(container.querySelector('.truffle__accessory')).toBeTruthy();
    expect(screen.getByText('加油！')).toBeTruthy();
  });

  it('PinPad reports a 4-digit PIN and resets', () => {
    const onComplete = vi.fn();
    render(<PinPad onComplete={onComplete} />);
    for (const d of ['1', '2', '3', '4']) fireEvent.click(screen.getByRole('button', { name: d }));
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(document.querySelectorAll('.pin-dots .is-filled')).toHaveLength(0);
  });

  it('SpeakButton speaks its text', () => {
    render(<SpeakButton text="河" />);
    fireEvent.click(screen.getByRole('button', { name: '听' }));
    expect(speak).toHaveBeenCalledWith('河');
  });
});

describe('Label digits', () => {
  it('keeps numbers together in the pinyin line', () => {
    const { container } = render(<Label zh="我认识 45 个字" />);
    expect(container.querySelector('.label__py')?.textContent).toBe('wǒ rèn shi 45 gè zì');
  });
});

describe('Pet bubble', () => {
  it('shows pinyin above the bubble words', () => {
    const { container } = render(<Pet kid={DEFAULT_KID} bubble="再想想" />);
    expect(container.querySelector('.pet__bubble .label__py')?.textContent).toBe('zài xiǎng xiǎng');
  });
});

describe('Pet power', () => {
  it('shows the chosen power at the tier the child has seen', () => {
    const { container } = render(<Pet kid={{ ...DEFAULT_KID, activePower: 'water', powerTiersSeen: { water: 2 } }} />);
    expect(container.querySelector('svg.truffle')?.getAttribute('data-tier')).toBe('2');
    expect(container.querySelector('svg.truffle')?.getAttribute('data-power')).toBe('water');
  });
});

describe('Pet costume', () => {
  it('accessories go with a onesie', () => {
    const { container } = render(<Pet kid={{ ...DEFAULT_KID, outfit: 'tiger', wearing: 'scarf' }} />);
    expect(container.querySelector('svg.truffle')?.getAttribute('data-outfit')).toBe('tiger');
    expect(container.querySelector('.truffle__accessory')).toBeTruthy();
  });
});
