import { describe, expect, it } from 'vitest';
import { addExtraDay, CYCLE_DAYS, finishDay, pickPassage, readingPool, type ReadingPassage } from './cycle';
const R0 = { passageId: null, days: 0, extra: 0, lastDay: null, lastRead: {}, warmups: 0 };
const P = (id: string, source: 'parent' | 'builtin' = 'builtin'): ReadingPassage => ({ id, title: id, text: '我。', source });
describe('reading cycle', () => {
  it('parent passages come first, in the order added, then eligible built-ins', () => {
    const pool = readingPool([{ id: 'pp:b', title: 'b', text: '我。', createdAt: 2 }, { id: 'pp:a', title: 'a', text: '我。', createdAt: 1 }], [{ id: 'p01', title: 'x', text: '我。' }, { id: 'p02', title: 'y', text: '鬱。' }], new Set(['我']));
    expect(pool.map((p) => p.id)).toEqual(['pp:a', 'pp:b', 'p01']);
  });
  it('keeps a passage for 3 practice days, counting each date once, then moves on', () => {
    const pool = [P('pp:a', 'parent'), P('p01')];
    let r = { ...R0 };
    expect(pickPassage(r, pool, '2026-10-05')?.id).toBe('pp:a');
    r = finishDay(r, 'pp:a', '2026-10-05');
    r = finishDay(r, 'pp:a', '2026-10-05'); // same day twice
    expect(r.days).toBe(1);
    r = finishDay(finishDay(r, 'pp:a', '2026-10-06'), 'pp:a', '2026-10-07');
    expect(r.days).toBe(CYCLE_DAYS);
    expect(pickPassage(r, pool, '2026-10-08')?.id).toBe('p01');
  });
  it('an extra day keeps the current passage one more day, at most twice', () => {
    let r = finishDay(finishDay(finishDay({ ...R0 }, 'pp:a', '2026-10-05'), 'pp:a', '2026-10-06'), 'pp:a', '2026-10-07');
    r = addExtraDay(addExtraDay(addExtraDay(r, 'pp:a'), 'pp:a'), 'pp:a');
    expect(r.extra).toBe(2);
    expect(pickPassage(r, [P('pp:a', 'parent'), P('p01')], '2026-10-08')?.id).toBe('pp:a');
    expect(addExtraDay(r, 'p01')).toBe(r); // not the current passage: no change
  });
  it('skips built-ins read in the last 30 days, and falls back to the least recently read', () => {
    const r = { ...R0, lastRead: { p01: '2026-10-01', p02: '2026-09-01' } };
    expect(pickPassage(r, [P('p01'), P('p02')], '2026-10-05')?.id).toBe('p02');
    const all = { ...R0, lastRead: { p01: '2026-10-01', p02: '2026-10-02' } };
    expect(pickPassage(all, [P('p01'), P('p02')], '2026-10-05')?.id).toBe('p01');
  });
  it('a deleted current passage moves the cycle on; an empty pool gives nothing', () => {
    const r = { ...R0, passageId: 'pp:gone', days: 1, lastDay: '2026-10-04' };
    expect(pickPassage(r, [P('p01')], '2026-10-05')?.id).toBe('p01');
    expect(pickPassage(R0, [], '2026-10-05')).toBeNull();
  });
});
