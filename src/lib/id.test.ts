import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from './id';

describe('newId', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('works over plain http on the home network, where crypto.randomUUID is missing', () => {
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: (a: Uint8Array) => real.getRandomValues(a) });
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
