import { describe, expect, it } from 'vitest';
import { DEFAULT_KID } from '../types';
import { currentWorld, reachedWorlds, timeOfDay, updateWorlds, WORLD_LINES, WORLDS, worldLine } from './worlds';

const kid = (over = {}) => ({ ...DEFAULT_KID, ...over });

describe('worlds catalog', () => {
  it('has the eight worlds in unlock order with their thresholds', () => {
    expect(WORLDS.map((w) => [w.id, w.at])).toEqual([
      ['yard', 0], ['grass', 30], ['race', 60], ['blocks', 100], ['dino', 150], ['sea', 200], ['space', 300], ['pirate', 400],
    ]);
  });
  it('reaches worlds by known count, always including the backyard', () => {
    expect(reachedWorlds(0)).toEqual(['yard']);
    expect(reachedWorlds(29)).toEqual(['yard']);
    expect(reachedWorlds(75)).toEqual(['yard', 'grass', 'race']);
    expect(reachedWorlds(600)).toHaveLength(8);
  });
});

describe('updateWorlds', () => {
  it('an existing install at 75 records three worlds and announces only the newest', () => {
    const u = updateWorlds(kid(), 75);
    expect(u.kid.worldsSeen).toEqual(['yard', 'grass', 'race']);
    expect(u.arrived).toBe('race');
    expect(u.changed).toBe(true);
  });
  it('announces nothing the second time', () => {
    const once = updateWorlds(kid(), 75).kid;
    expect(updateWorlds(once, 75)).toMatchObject({ arrived: null, changed: false });
  });
  it('never announces the backyard', () => {
    expect(updateWorlds(kid(), 0)).toMatchObject({ arrived: null, changed: true });
    expect(updateWorlds(kid(), 0).kid.worldsSeen).toEqual(['yard']);
  });
  it('keeps reached worlds after a lapse', () => {
    const u = updateWorlds(kid({ worldsSeen: ['yard', 'grass', 'race'] }), 55);
    expect(u).toMatchObject({ arrived: null, changed: false });
    expect(u.kid.worldsSeen).toEqual(['yard', 'grass', 'race']);
  });
  it('an arrival resets the pick so the new world shows', () => {
    const u = updateWorlds(kid({ worldsSeen: ['yard', 'grass'], world: 'yard' }), 61);
    expect(u.arrived).toBe('race');
    expect(u.kid.world).toBeNull();
  });
});

describe('currentWorld', () => {
  it('is the newest reached when nothing is picked', () => {
    expect(currentWorld(kid({ worldsSeen: ['yard', 'grass', 'race'] }))).toBe('race');
    expect(currentWorld(kid())).toBe('yard');
  });
  it('is the pick when it has been reached', () => {
    expect(currentWorld(kid({ worldsSeen: ['yard', 'grass', 'race'], world: 'grass' }))).toBe('grass');
  });
  it('ignores a pick that is unknown or not reached', () => {
    expect(currentWorld(kid({ worldsSeen: ['yard', 'grass'], world: 'space' }))).toBe('grass');
    expect(currentWorld(kid({ worldsSeen: ['yard'], world: 'bogus' }))).toBe('yard');
  });
});

describe('timeOfDay', () => {
  it('morning before noon, afternoon until 18:00, evening after', () => {
    const at = (h: number, m = 0) => timeOfDay(new Date(2026, 9, 3, h, m));
    expect([at(7), at(11, 59), at(12), at(17, 59), at(18), at(21)]).toEqual(['morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening']);
  });
});

describe('Truffle world lines', () => {
  it('has 2–3 short Chinese lines per world, picked steadily by date', () => {
    for (const w of WORLDS) {
      const lines = WORLD_LINES[w.id];
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.length).toBeLessThanOrEqual(3);
      for (const l of lines) expect(l).toMatch(/^[\p{Script=Han}，。！？…、]+$/u);
    }
    expect(worldLine('grass', '2026-10-03')).toBe(worldLine('grass', '2026-10-03'));
    expect(WORLD_LINES.grass).toContain(worldLine('grass', '2026-10-04'));
  });
});
