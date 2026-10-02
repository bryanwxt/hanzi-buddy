import { getCharInfo } from '../../content';
import { RADICALS } from '../../content/radicals';
import { shuffle, type Rng } from '../../lib/random';

export const MIN_KNOWN = 12;
export const ROUND_SIZE = 6;
export const GRID_SIZE = 8;

export interface TapAllQuestion {
  kind: 'tapAll';
  component: string;
  grid: string[];
  answers: string[];
}

export interface WhichPartQuestion {
  kind: 'whichPart';
  char: string;
  component: string; // the correct option
  options: string[];
}

export type ComponentQuestion = TapAllQuestion | WhichPartQuestion;

/** True when `component` is `char`'s radical — the only part whose meaning we teach. */
export function charHasComponent(char: string, component: string): boolean {
  const info = getCharInfo(char);
  return !!info && char !== component && info.radical === component;
}

/** True when `part` appears anywhere in `char`'s decomposition, nested parts included. */
export function containsPart(char: string, part: string, seen = new Set<string>()): boolean {
  if (seen.has(char)) return false;
  seen.add(char);
  const info = getCharInfo(char);
  if (!info) return false;
  return [info.radical, ...info.components].some((p) => p !== char && (p === part || containsPart(p, part, seen)));
}

export function buildComponentRound(known: string[], rng: Rng): ComponentQuestion[] | null {
  const chars = [...new Set(known.filter((c) => getCharInfo(c)))];
  if (chars.length < MIN_KNOWN) return null;

  const families = Object.keys(RADICALS)
    .map((component) => ({ component, members: chars.filter((c) => charHasComponent(c, component)) }))
    .filter((f) => f.members.length >= 2);

  const tapAll: TapAllQuestion[] = shuffle(families, rng).flatMap((f) => {
    const answers = shuffle(f.members, rng).slice(0, 4);
    const others = shuffle(chars.filter((c) => c !== f.component && !containsPart(c, f.component)), rng).slice(0, GRID_SIZE - answers.length);
    if (answers.length + others.length < GRID_SIZE) return [];
    return [{ kind: 'tapAll' as const, component: f.component, answers, grid: shuffle([...answers, ...others], rng) }];
  });

  const whichPart: WhichPartQuestion[] = shuffle(chars, rng).flatMap((char) => {
    const info = getCharInfo(char)!;
    const component = info.radical;
    const meaning = RADICALS[component];
    const parts = info.components.filter((p) => p !== char);
    if (!meaning || component === char || !parts.includes(component)) return [];
    const others = parts.filter((p) => p !== component && RADICALS[p]?.zh !== meaning.zh);
    if (!others.length) return [];
    return [{ kind: 'whichPart' as const, char, component, options: shuffle([component, ...shuffle(others, rng).slice(0, 2)], rng) }];
  });

  const out: ComponentQuestion[] = [];
  for (let i = 0; out.length < ROUND_SIZE && (i < tapAll.length || i < whichPart.length); i++) {
    if (tapAll[i]) out.push(tapAll[i]!);
    if (out.length < ROUND_SIZE && whichPart[i]) out.push(whichPart[i]!);
  }
  return out.length ? out : null;
}
