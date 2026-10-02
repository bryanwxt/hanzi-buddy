import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('./audio/speech', () => ({
  loadChineseVoice: vi.fn(async () => null),
  setSpeechRate: vi.fn(),
  speak: vi.fn(),
  primeSpeech: vi.fn(),
}));
vi.mock('./audio/sfx', () => ({ setSfxEnabled: vi.fn(), playSfx: vi.fn() }));
vi.mock('./ui/confetti', () => ({ celebrate: vi.fn() }));

const type = (pin: string) => [...pin].forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

describe('App', () => {
  it('walks a first launch from PIN to pet to placement to home', async () => {
    render(<App dbName={`test-${crypto.randomUUID()}`} now={() => new Date(2026, 9, 2, 9)} />);
    await screen.findByText('For parents: choose a 4-digit PIN');
    type('1234');
    await screen.findByText('Enter the same PIN again');
    type('1234');
    fireEvent.click(await screen.findByRole('button', { name: '叫醒松露' }));
    fireEvent.click(await screen.findByText('好！'));
    fireEvent.click(await screen.findByText('不认识'));
    fireEvent.click(await screen.findByText('开始！'));
    expect(await screen.findByText('今天的练习')).toBeTruthy();
    expect(screen.getByText('认识 0 个字')).toBeTruthy();
  });
});
