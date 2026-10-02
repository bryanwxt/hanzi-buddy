import { mulberry32, seedFromString } from '../lib/random';

/** Today's featured character: the first new single character planned today, else a known one fixed for the date. */
export function wordOfTheDay({ plannedNew, knownChars, date }: { plannedNew: string[]; knownChars: Set<string>; date: string }): string | null {
  const fresh = plannedNew.find((t) => Array.from(t).length === 1);
  if (fresh) return fresh;
  const known = [...knownChars].sort();
  if (!known.length) return null;
  return known[Math.floor(mulberry32(seedFromString(date))() * known.length)]!;
}
