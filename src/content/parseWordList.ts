import { pinyin } from 'pinyin-pro';
import type { Word } from '../types';
import { newId as uuid } from '../lib/id';

export interface ParsedWord {
  text: string;
  pinyin: string;
}

export interface ParseResult {
  words: ParsedWord[];
  rejected: string[];
}

export const MAX_WORD_LENGTH = 4;
const WORD = new RegExp(`^\\p{Script=Han}{1,${MAX_WORD_LENGTH}}$`, 'u');

export function parseWordList(input: string): ParseResult {
  const words: ParsedWord[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.replace(/^\s*\d+\s*[.、)）:：]?/, '').replace(/[\s　]+/g, '');
    if (!line) continue;
    if (!WORD.test(line)) {
      rejected.push(raw.trim());
      continue;
    }
    if (seen.has(line)) continue;
    seen.add(line);
    words.push({ text: line, pinyin: pinyin(line, { type: 'array' }).join(' ') });
  }
  return { words, rejected };
}

export interface ListOptions {
  listName: string;
  writeable: boolean;
  existing: Word[];
  now: number;
  newId?: () => string;
}

export interface ListResult {
  added: Word[];
  promoted: Word[];
  duplicates: string[];
}

/**
 * Turns parsed lines into words. Built-in words not yet on any list are pulled to the front
 * (given this list's name and time) rather than duplicated; words already on a list are reported.
 */
export function makeParentWords(parsed: ParsedWord[], opts: ListOptions): ListResult {
  const byText = new Map(opts.existing.map((w) => [w.text, w]));
  const newId = opts.newId ?? (() => uuid());
  const result: ListResult = { added: [], promoted: [], duplicates: [] };
  parsed.forEach((p, i) => {
    const listedAt = opts.now + i;
    const existing = byText.get(p.text);
    if (existing?.source === 'builtin' && existing.listName === undefined) {
      result.promoted.push({ ...existing, listName: opts.listName, listedAt, writeable: existing.writeable || opts.writeable, paused: false });
    } else if (existing) {
      result.duplicates.push(p.text);
    } else {
      result.added.push({
        id: `p:${newId()}`, text: p.text, pinyin: p.pinyin, level: null, rank: null, source: 'parent',
        listName: opts.listName, listedAt, writeable: opts.writeable, paused: false, createdAt: listedAt,
      });
    }
  });
  return result;
}
