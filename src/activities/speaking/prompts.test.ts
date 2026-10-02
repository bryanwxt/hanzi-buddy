import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../lib/random';
import { chooseSpeakingPrompt, eligiblePassages } from './prompts';

const passages = [
  { id: 'a', title: 'A', text: '大人，大人。大人大人大人！' },
  { id: 'b', title: 'B', text: '大人大人大人大人大河' },
];

describe('speaking prompts', () => {
  it('offers passages only when at least 90% of their characters are known', () => {
    expect(eligiblePassages(passages, new Set(['大', '人'])).map((p) => p.id)).toEqual(['a', 'b']);
    expect(eligiblePassages(passages, new Set(['大']))).toEqual([]);
  });

  it('alternates pictures and passages, falling back when one kind is missing', () => {
    const pic = { id: 'p', createdAt: 0, blob: new Blob(), mime: 'image/png' };
    const rng = mulberry32(1);
    expect(chooseSpeakingPrompt({ pictures: [pic], passages, recordingCount: 0, rng })?.kind).toBe('picture');
    expect(chooseSpeakingPrompt({ pictures: [pic], passages, recordingCount: 1, rng })?.kind).toBe('passage');
    expect(chooseSpeakingPrompt({ pictures: [], passages, recordingCount: 0, rng })?.kind).toBe('passage');
    expect(chooseSpeakingPrompt({ pictures: [], passages: [], recordingCount: 0, rng })).toBeNull();
  });
});
