// @vitest-environment node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILTIN, PASSAGES } from '../src/content';
import { checkContent } from './check-content';

const dataDir = join(process.cwd(), 'node_modules', 'hanzi-writer-data');
const hasStrokeFile = (ch: string) => existsSync(join(dataDir, `${ch}.json`));

describe('built-in content', () => {
  it('has no problems', () => {
    expect(checkContent(BUILTIN, PASSAGES, hasStrokeFile)).toEqual([]);
  });
  it('flags a passage that uses a character outside levels 1–2', () => {
    const problems = checkContent(BUILTIN, [{ id: 'x', title: 't', text: '我'.repeat(29) + '澡' }], hasStrokeFile);
    expect(problems).toContain('x: uses 澡 outside levels 1–2');
  });
});
