import { describe, expect, it, vi } from 'vitest';
import { prefetchStrokes, strokeAvailability, strokeUrl } from './strokes';

const res = (status: number) => ({ ok: status === 200, status }) as Response;

describe('stroke data', () => {
  it('builds the pinned CDN URL', () => {
    expect(strokeUrl('河')).toBe('https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/%E6%B2%B3.json');
  });
  it('reports availability', async () => {
    expect(await strokeAvailability('河', async () => res(200))).toBe('yes');
    expect(await strokeAvailability('河', async () => res(404))).toBe('no');
    expect(await strokeAvailability('河', async () => res(503))).toBe('unknown');
    expect(await strokeAvailability('河', async () => { throw new TypeError('offline'); })).toBe('unknown');
  });
  it('prefetches each character once', async () => {
    const f = vi.fn(async () => res(200));
    await prefetchStrokes(['河', '河', '大'], f);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
