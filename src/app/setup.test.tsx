import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { builtinWords } from '../content';
import { hashPin } from '../lib/hash';
import { getKid, getSettings, putWords } from '../store/repo';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_SETTINGS } from '../types';
import { PetSetup } from './PetSetup';
import { PlacementScreen } from './PlacementScreen';
import { SetupPin } from './SetupPin';

const type = (pin: string) => [...pin].forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

describe('first launch', () => {
  it('SetupPin asks twice and saves a hashed PIN', async () => {
    const app = await makeAppData({ settings: { ...DEFAULT_SETTINGS } });
    renderWithApp(<SetupPin />, app);
    type('1234');
    await screen.findByText('Enter the same PIN again');
    type('9999');
    expect(await screen.findByText('The PINs did not match. Please start again.')).toBeTruthy();
    type('1234');
    await screen.findByText('Enter the same PIN again');
    type('1234');
    await waitFor(() => expect(app.go).toHaveBeenCalledWith({ name: 'petSetup' }));
    expect((await getSettings(app.db)).pinHash).toBe(await hashPin('1234'));
  });

  it('PetSetup welcomes him to 字己 and spells out the pun, so 自己 stays right at school', async () => {
    renderWithApp(<PetSetup />, await makeAppData({ kid: null }));
    expect(screen.getByRole('heading', { name: /字己/ })).toBeTruthy();
    expect(document.querySelector('.pun')?.textContent).toContain('字己 = 自己学汉字');
  });

  it('Meet Truffle: wake him, then continue to placement', async () => {
    const app = await makeAppData({ kid: null });
    renderWithApp(<PetSetup />, app);
    expect(document.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('sleepy');
    expect((screen.getByText('好！').closest('button') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '叫醒松露' }));
    expect(document.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('sulk');
    expect(screen.getByText(/我是松露/)).toBeTruthy();
    fireEvent.click(screen.getByText('好！'));
    await waitFor(() => expect(app.go).toHaveBeenCalledWith({ name: 'placement' }));
    expect((await getKid(app.db))?.petName).toBe('松露');
  });

  it('Placement seeds everything ranked before the first unknown sample', async () => {
    const app = await makeAppData();
    await putWords(app.db, builtinWords(0));
    renderWithApp(<PlacementScreen />, app);
    for (let i = 0; i < 3; i++) fireEvent.click(await screen.findByText('认识'));
    fireEvent.click(screen.getByText('不认识'));
    expect(await screen.findByText('你已经认识 45 个字了！')).toBeTruthy();
    expect((await getSettings(app.db)).placementDone).toBe(true);
    fireEvent.click(screen.getByText('开始！'));
    await waitFor(() => expect(app.go).toHaveBeenCalledWith({ name: 'home' }));
  });
});
