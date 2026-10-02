import { describe, expect, it } from 'vitest';
import { pathNodes } from './path';

const ALL = ['flashcards', 'writing', 'components', 'speaking'] as const;
const states = (n: ReturnType<typeof pathNodes>) => n.map((x) => `${x.kind}:${x.state}`);

describe('pathNodes', () => {
  it('starts at the first step, chest last', () => {
    expect(states(pathNodes([...ALL], [], false, false))).toEqual([
      'flashcards:current', 'writing:upcoming', 'components:upcoming', 'speaking:upcoming', 'chest:upcoming',
    ]);
  });
  it('moves the current node past finished steps', () => {
    expect(states(pathNodes([...ALL], ['flashcards'], false, false))[1]).toBe('writing:current');
  });
  it('makes the chest current when the day is done but it is still closed', () => {
    expect(states(pathNodes([...ALL], [...ALL], false, true))).toEqual([
      'flashcards:done', 'writing:done', 'components:done', 'speaking:done', 'chest:current',
    ]);
  });
  it('is all done once the chest is opened', () => {
    expect(pathNodes([...ALL], [...ALL], true, true).every((n) => n.state === 'done')).toBe(true);
  });
  it('only shows switched-on steps', () => {
    expect(states(pathNodes(['flashcards', 'speaking'], [], false, false))).toEqual(['flashcards:current', 'speaking:upcoming', 'chest:upcoming']);
  });
});
