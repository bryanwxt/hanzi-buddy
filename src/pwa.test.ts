import { describe, expect, it, vi } from 'vitest';
import { applyUpdateIfPending, enterSafeScreen, initPwa } from './pwa';

describe('pwa updates', () => {
  it('waits for the child to reach Home before reloading into a new version', () => {
    let onNeedRefresh: (() => void) | undefined;
    const update = vi.fn(async () => {});
    initPwa((opts) => { onNeedRefresh = opts.onNeedRefresh; return update; });
    applyUpdateIfPending();
    expect(update).not.toHaveBeenCalled();
    onNeedRefresh!();
    expect(update).not.toHaveBeenCalled();
    applyUpdateIfPending();
    expect(update).toHaveBeenCalledWith(true);
  });
});

describe('pwa updates on Home', () => {
  it('applies straight away when an update arrives while Home is showing', () => {
    let onNeedRefresh: (() => void) | undefined;
    const update = vi.fn(async () => {});
    initPwa((opts) => { onNeedRefresh = opts.onNeedRefresh; return update; });
    const leave = enterSafeScreen();
    onNeedRefresh!();
    expect(update).toHaveBeenCalledWith(true);
    leave();
  });
});
