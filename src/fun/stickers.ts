import { RADICALS, type RadicalMeaning } from '../content/radicals';
import type { BuiltinChar } from '../types';

export const MIN_FAMILY_SIZE = 3;

export interface StickerFamily {
  component: string;
  meaning: RadicalMeaning;
  chars: string[];
}

export function stickerFamilies(builtin: BuiltinChar[]): StickerFamily[] {
  return Object.entries(RADICALS)
    .map(([component, meaning]) => ({
      component,
      meaning,
      chars: builtin
        .filter((c) => c.char !== component && c.radical === component)
        .sort((a, b) => a.rank - b.rank)
        .map((c) => c.char),
    }))
    .filter((f) => f.chars.length >= MIN_FAMILY_SIZE)
    .sort((a, b) => b.chars.length - a.chars.length || a.component.localeCompare(b.component));
}

export function familyProgress(f: StickerFamily, knownChars: Set<string>): { known: number; total: number; complete: boolean } {
  const known = f.chars.filter((c) => knownChars.has(c)).length;
  return { known, total: f.chars.length, complete: known === f.chars.length };
}

export function completedBadges(families: StickerFamily[], knownChars: Set<string>): string[] {
  return families.filter((f) => familyProgress(f, knownChars).complete).map((f) => f.component);
}

export function newBadges(families: StickerFamily[], knownChars: Set<string>, seen: string[]): string[] {
  return completedBadges(families, knownChars).filter((c) => !seen.includes(c));
}
