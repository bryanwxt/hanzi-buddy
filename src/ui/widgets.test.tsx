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

  it('Pet shows the dragon for its stage, with accessory and bubble', () => {
    const kid = { ...DEFAULT_KID, wearing: '🎩' };
    const { rerender } = render(<Pet kid={kid} known={0} />);
    expect(screen.getByRole('img', { name: '小龙' }).getAttribute('data-stage')).toBe('0');
    expect(screen.getByText('🎩')).toBeTruthy();
    rerender(<Pet kid={kid} known={80} bubble="加油！" />);
    expect(screen.getByRole('img', { name: '小龙' }).getAttribute('data-stage')).toBe('2');
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

describe('Pet never shrinks', () => {
  it('keeps the highest stage the child has seen even if the known count dips', () => {
    render(<Pet kid={{ ...DEFAULT_KID, lastStageSeen: 2 }} known={10} />);
    expect(screen.getByRole('img', { name: '小龙' }).getAttribute('data-stage')).toBe('2');
  });
});
