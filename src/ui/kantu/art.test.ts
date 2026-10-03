import { describe, expect, it } from 'vitest';
import { SCENE_ART, SCENE_IDS } from './art';

describe('看图说话 scene art', () => {
  it('has the eight scenes in order', () => {
    expect(SCENE_IDS).toEqual(['vase', 'wallet', 'grandma', 'queue', 'litter', 'share', 'fall', 'spill']);
  });
  it('every scene is ink-outlined art with no gradients or filters', () => {
    for (const id of SCENE_IDS) {
      const s = SCENE_ART[id];
      expect(s.length).toBeGreaterThan(600);
      expect(s).toContain('#2a2630');
      expect(s).not.toMatch(/Gradient|<filter|url\(#/);
    }
  });
});
