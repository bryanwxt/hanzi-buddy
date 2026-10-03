import { describe, expect, it } from 'vitest';
import { eligiblePassages } from './prompts';

const passages = [
  { id: 'a', title: 'A', text: '大人，大人。大人大人大人！' },
  { id: 'b', title: 'B', text: '大人大人大人大人大河' },
];

describe('speaking prompts', () => {
  it('offers passages only when at least 90% of their characters are known', () => {
    expect(eligiblePassages(passages, new Set(['大', '人'])).map((p) => p.id)).toEqual(['a', 'b']);
    expect(eligiblePassages(passages, new Set(['大']))).toEqual([]);
  });
});
