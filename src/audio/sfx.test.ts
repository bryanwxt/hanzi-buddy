import { describe, expect, it } from 'vitest';
import { playSfx, setSfxEnabled } from './sfx';

describe('sfx', () => {
  it('is silent and safe without Web Audio or when switched off', () => {
    setSfxEnabled(true);
    expect(() => playSfx('correct')).not.toThrow();
    setSfxEnabled(false);
    expect(() => playSfx('levelUp')).not.toThrow();
  });
});
