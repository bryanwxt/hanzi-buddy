import { render } from '@testing-library/preact';
import type { ComponentChild } from 'preact';
import { vi } from 'vitest';
import { AppContext, type AppData } from '../app/AppContext';
import { openAppDb } from '../store/db';
import { DEFAULT_KID, DEFAULT_SETTINGS } from '../types';

export async function makeAppData(over: Partial<AppData> = {}): Promise<AppData> {
  return {
    db: await openAppDb(`test-${crypto.randomUUID()}`),
    settings: { ...DEFAULT_SETTINGS, placementDone: true },
    kid: { ...DEFAULT_KID },
    voice: false,
    now: () => new Date(2026, 9, 2, 9, 0),
    go: vi.fn(),
    refresh: vi.fn(async () => {}),
    ...over,
  };
}

export function renderWithApp(ui: ComponentChild, app: AppData) {
  return render(<AppContext.Provider value={app}>{ui}</AppContext.Provider>);
}
