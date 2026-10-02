import type { BuiltinChar, Example, Level } from '../src/types';

export interface MmahEntry {
  character: string;
  definition?: string;
  pinyin: string[];
  decomposition: string;
  radical: string;
  matches: unknown[];
}

export interface BuildInput {
  hskChars: Map<string, string[]>;
  hskWords: Map<string, string[]>;
  dictionary: Map<string, MmahEntry>;
  pinyinOf: (text: string) => string;
}

export const CHAR_SECTIONS = ['一级汉字表', '二级汉字表'] as const;
export const WORD_SECTIONS = ['一级词汇表', '二级词汇表', '三级词汇表'] as const;
export const HANDWRITING_SECTION = '初等手写字表';
export const LEVEL_SIZE = 200;

const IDC = /[⿰-⿿]/u; // ideographic description characters (⿰, ⿱, …)

/** Parses Pleco's hsk30 charlist/wordlist into section header -> entries, in file order. */
export function parseHskSections(text: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^\d+\s+(.+)$/);
    if (m) {
      current?.push(m[1]!.trim());
    } else {
      current = [];
      sections.set(line, current);
    }
  }
  return sections;
}

/** '爸爸｜爸' -> '爸爸'; '白（形）' -> '白'. */
export function cleanHskWord(raw: string): string {
  return raw.split('｜')[0]!.replace(/（[^）]*）|\([^)]*\)/g, '').replace(/[^\p{Script=Han}]/gu, '');
}

export function extractComponents(decomposition: string): string[] {
  const out: string[] = [];
  for (const ch of decomposition) {
    if (IDC.test(ch) || ch === '？' || out.includes(ch)) continue;
    out.push(ch);
  }
  return out;
}

export function firstSenses(definition: string | undefined, n = 2): string {
  if (!definition) return '';
  return definition.split(/[;,]/).map((s) => s.trim()).filter(Boolean).slice(0, n).join(', ');
}

export function buildBuiltin(input: BuildInput): BuiltinChar[] {
  const handwriting = new Set(input.hskChars.get(HANDWRITING_SECTION) ?? []);
  const seen = new Set<string>();
  const pool: { char: string; hsk: number; index: number; strokes: number; entry: MmahEntry }[] = [];

  CHAR_SECTIONS.forEach((section, s) => {
    const chars = input.hskChars.get(section);
    if (!chars) throw new Error(`Missing section ${section}`);
    chars.forEach((char, index) => {
      if (seen.has(char)) return;
      const entry = input.dictionary.get(char);
      if (!entry) throw new Error(`No Make Me a Hanzi entry for ${char}`);
      seen.add(char);
      pool.push({ char, hsk: s + 1, index, strokes: entry.matches.length, entry });
    });
  });
  pool.sort((a, b) => a.hsk - b.hsk || a.strokes - b.strokes || a.index - b.index);

  const levelOf = new Map<string, Level>();
  pool.forEach((p, rank) => levelOf.set(p.char, Math.min(3, Math.floor(rank / LEVEL_SIZE) + 1) as Level));

  const words = WORD_SECTIONS.flatMap((s) => input.hskWords.get(s) ?? [])
    .map(cleanHskWord)
    .filter((w) => w.length >= 2 && w.length <= 3);

  return pool.map((p, rank) => {
    const level = levelOf.get(p.char)!;
    const examples: Example[] = [];
    for (const w of words) {
      if (examples.length >= 2) break;
      if (!w.includes(p.char) || examples.some((e) => e.text === w)) continue;
      if (![...w].every((c) => (levelOf.get(c) ?? 99) <= level)) continue;
      examples.push({ text: w, pinyin: input.pinyinOf(w) });
    }
    return {
      char: p.char,
      pinyin: input.pinyinOf(p.char),
      meaning: firstSenses(p.entry.definition),
      level,
      rank,
      radical: p.entry.radical,
      components: extractComponents(p.entry.decomposition),
      strokes: p.strokes,
      writeable: handwriting.has(p.char),
      examples,
    };
  });
}
