import { describe, expect, it } from 'vitest';
import { hashPin } from './hash';

describe('hashPin', () => {
  it('returns a stable 64-character hex digest that differs per PIN', async () => {
    const a = await hashPin('1234');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPin('1234')).toBe(a);
    expect(await hashPin('4321')).not.toBe(a);
  });
});
