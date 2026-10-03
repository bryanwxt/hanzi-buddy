// Ink icons on a 48×48 grid: 3px ink outlines, flat palette fills — the app's own style, used instead of emoji.
const INK = '#2a2630';
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const L = `fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
const CREAM = '#fffdf7';
const GOLD = '#ffc94a';

const starPath = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.46 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};
const HEART = 'M24 41 C8 30 4 22 7 15 C10 8 19 7 24 14 C29 7 38 8 41 15 C44 22 40 30 24 41 Z';

export const ICONS = {
  // Power marks
  drop: `<path d="M24 5 C17 16 10 23 10 30 a14 14 0 0 0 28 0 C38 23 31 16 24 5 Z" fill="#4aa3ff" ${S}/><path d="M17 31 a7 7 0 0 0 5 7" ${L} stroke="${CREAM}"/>`,
  flame: `<path d="M24 4 C31 14 39 19 37 31 C36 39 30 44 24 44 C17 44 11 39 11 31 C11 23 17 20 18 12 C21 17 22 20 24 22 C26 16 26 10 24 4 Z" fill="#ff6a3d" ${S}/><path d="M24 26 C28 31 30 34 29 38 C28 41 26 42 24 42 C21 42 19 40 19 37 C19 33 22 31 24 26 Z" fill="${GOLD}"/>`,
  leaf: `<path d="M7 41 C7 19 22 6 42 6 C42 27 30 41 7 41 Z" fill="#46b06a" ${S}/><path d="M9 39 L33 15 M20 28 L19 20 M26 22 L33 23" ${L}/>`,
  sparkle: `<path d="M22 5 L26 19 L40 23 L26 27 L22 41 L18 27 L4 23 L18 19 Z" fill="${GOLD}" ${S}/><path d="M38 34 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" fill="${GOLD}" ${S} stroke-width="2"/>`,
  rock: `<path d="M7 35 L13 19 L27 10 L40 17 L43 33 L31 40 L14 40 Z" fill="#b8b3b6" ${S}/><path d="M22 18 L26 26 L22 31 M34 22 L31 28" ${L} stroke-width="2.4"/>`,
  shout: `<path d="M7 19 L19 19 L35 8 L35 40 L19 29 L7 29 Z" fill="#ff8fb1" ${S}/><path d="M40 17 C44 21 44 27 40 31 M13 29 L15 38 L21 38 L20 30" ${L}/>`,
  hands: `<circle cx="16" cy="15" r="7" fill="#7b8cff" ${S}/><circle cx="32" cy="15" r="7" fill="${GOLD}" ${S}/><path d="M4 42 C4 30 10 25 16 25 C21 25 24 28 24 31 C24 28 27 25 32 25 C38 25 44 30 44 42 Z" fill="${CREAM}" ${S}/><path d="M17 36 C20 33 28 33 31 36" ${L}/>`,
  speech: `<path d="M8 8 H40 a4 4 0 0 1 4 4 V30 a4 4 0 0 1 -4 4 H22 L13 42 V34 H8 a4 4 0 0 1 -4 -4 V12 a4 4 0 0 1 4 -4 Z" fill="#2fbfb0" ${S}/><circle cx="15" cy="21" r="2.6" fill="${CREAM}"/><circle cx="24" cy="21" r="2.6" fill="${CREAM}"/><circle cx="33" cy="21" r="2.6" fill="${CREAM}"/>`,
  wind: `<path d="M5 18 H30 a6 6 0 1 0 -6 -6 M5 26 H38 a6 6 0 1 1 -6 6 M5 34 H20" ${L} stroke-width="3.4"/><path d="M5 18 H30 a6 6 0 1 0 -6 -6 M5 26 H38 a6 6 0 1 1 -6 6" fill="none" stroke="#bfe0ff" stroke-width="1.2"/>`,
  heart: `<path d="${HEART}" fill="#ff5a7a" ${S}/><path d="M13 16 C14 13 17 12 19 13" ${L} stroke="${CREAM}"/>`,
  sun: `<circle cx="24" cy="24" r="10" fill="#ffb020" ${S}/><path d="M24 3 V8 M24 40 V45 M3 24 H8 M40 24 H45 M9 9 L12.5 12.5 M35.5 35.5 L39 39 M39 9 L35.5 12.5 M12.5 35.5 L9 39" ${L}/>`,
  // UI
  star: `<path d="${starPath(24, 25, 20)}" fill="${GOLD}" ${S}/>`,
  starOutline: `<path d="${starPath(24, 25, 20)}" fill="${CREAM}" ${S}/>`,
  medal: `<path d="M14 4 L22 22 L26 22 L18 4 Z M34 4 L26 22 L22 22 L30 4 Z" fill="#4aa3ff" ${S} stroke-width="2.4"/><circle cx="24" cy="32" r="12" fill="${GOLD}" ${S}/><path d="${starPath(24, 32.5, 7)}" fill="${CREAM}" ${S} stroke-width="2"/>`,
  lock: `<path d="M15 21 V15 a9 9 0 0 1 18 0 V21" ${L}/><rect x="9" y="21" width="30" height="22" rx="5" fill="${GOLD}" ${S}/><circle cx="24" cy="30" r="3" fill="${INK}"/><path d="M24 31 V36" ${L}/>`,
  pen: `<path d="M9 39 L12 29 L33 8 L40 15 L19 36 Z" fill="${GOLD}" ${S}/><path d="M9 39 L12 29 L19 36 Z" fill="#f4e2c6" ${S}/><path d="M28 13 L35 20" ${L}/><path d="M9 39 L11 34 L14 37 Z" fill="${INK}"/>`,
  fish: `<path d="M5 24 C12 13 28 11 37 24 C28 37 12 35 5 24 Z" fill="#4aa3ff" ${S}/><path d="M37 24 L45 15 L45 33 Z" fill="#4aa3ff" ${S}/><circle cx="14" cy="22" r="2.4" fill="${INK}"/><path d="M22 18 C25 22 25 26 22 30" ${L} stroke-width="2.4"/>`,
  mic: `<rect x="17" y="4" width="14" height="24" rx="7" fill="#ff8fb1" ${S}/><path d="M10 22 C10 31 16 36 24 36 C32 36 38 31 38 22 M24 36 V43 M16 43 H32" ${L}/>`,
  gift: `<rect x="7" y="20" width="34" height="23" rx="3" fill="#ff5532" ${S}/><rect x="5" y="13" width="38" height="9" rx="2" fill="#ff5532" ${S}/><path d="M24 13 V43" stroke="${GOLD}" stroke-width="6"/><path d="M24 13 C18 3 9 6 13 12 C15 14 20 14 24 13 C28 14 33 14 35 12 C39 6 30 3 24 13 Z" fill="${GOLD}" ${S}/>`,
  party: `<path d="M6 42 L16 14 L34 32 Z" fill="${GOLD}" ${S}/><path d="M12 30 L22 36 M10 36 L15 39" ${L} stroke="#ff5532"/><circle cx="34" cy="9" r="3" fill="#ff5532"/><circle cx="41" cy="20" r="3" fill="#4aa3ff"/><circle cx="26" cy="6" r="2.4" fill="#7fdc7a"/><path d="M28 18 C32 12 36 14 40 10" ${L}/>`,
  paw: `<ellipse cx="24" cy="32" rx="11" ry="9" fill="#b8b3b6" ${S}/><circle cx="11" cy="21" r="5" fill="#b8b3b6" ${S}/><circle cx="19" cy="13" r="5" fill="#b8b3b6" ${S}/><circle cx="29" cy="13" r="5" fill="#b8b3b6" ${S}/><circle cx="37" cy="21" r="5" fill="#b8b3b6" ${S}/>`,
  sleepyCat: `<path d="M9 18 L11 5 L20 12 M39 18 L37 5 L28 12" fill="#b8b3b6" ${S}/><ellipse cx="24" cy="27" rx="17" ry="15" fill="#b8b3b6" ${S}/><path d="M15 26 C17 28 20 28 22 26 M26 26 C28 28 31 28 33 26" ${L}/><path d="M22 32 L26 32 L24 34 Z" fill="#ff9fa0"/><path d="M38 6 h5 l-5 5 h5" ${L} stroke-width="2"/>`,
  check: `<circle cx="24" cy="24" r="19" fill="#7fdc7a" ${S}/><path d="M15 24 L21 30 L33 17" ${L} stroke-width="4"/>`,
  think: `<circle cx="24" cy="24" r="19" fill="${CREAM}" ${S}/><path d="M18 18 C18 12 30 12 30 18 C30 23 24 23 24 28" ${L} stroke-width="3.4"/><circle cx="24" cy="34" r="2.4" fill="${INK}"/>`,
  none: `<circle cx="24" cy="24" r="17" fill="${CREAM}" ${S}/><path d="M12 12 L36 36" ${L} stroke="#ff5532" stroke-width="4"/>`,
  // Radical meanings (水 火 心 日 言 reuse drop / flame / heart / sun / speech; 石 reuses rock)
  hand: `<path d="M15 44 V22 a3 3 0 0 1 6 0 V11 a3 3 0 0 1 6 0 V9 a3 3 0 0 1 6 0 V13 a3 3 0 0 1 6 0 V30 C39 39 33 44 25 44 Z" fill="#ffd9b8" ${S}/><path d="M15 31 L9 25 a3 3 0 0 1 4 -4 L15 24" fill="#ffd9b8" ${S}/>`,
  person: `<circle cx="24" cy="12" r="8" fill="#ffd9b8" ${S}/><path d="M11 44 C11 30 17 23 24 23 C31 23 37 30 37 44 Z" fill="#7b8cff" ${S}/>`,
  mouth: `<path d="M5 24 C13 13 35 13 43 24 C35 37 13 37 5 24 Z" fill="#ff5a7a" ${S}/><path d="M8 24 C18 28 30 28 40 24" ${L}/>`,
  tree: `<rect x="20" y="27" width="8" height="17" rx="2" fill="#a8703f" ${S}/><circle cx="24" cy="18" r="14" fill="#46b06a" ${S}/><path d="M17 15 C19 12 22 11 25 12" ${L} stroke="${CREAM}"/>`,
  moon: `<path d="M30 5 A19 19 0 1 0 43 33 A15 15 0 1 1 30 5 Z" fill="${GOLD}" ${S}/>`,
  girl: `<circle cx="24" cy="15" r="11" fill="#3a2a20" ${S}/><circle cx="24" cy="17" r="7" fill="#ffd9b8"/><circle cx="11" cy="17" r="4" fill="#3a2a20" ${S}/><circle cx="37" cy="17" r="4" fill="#3a2a20" ${S}/><path d="M11 45 L24 27 L37 45 Z" fill="#ff8fb1" ${S}/>`,
  grass: `<path d="M9 43 C9 31 6 23 4 16 C12 22 16 31 16 43 Z M20 43 C20 28 22 16 24 5 C28 16 28 28 28 43 Z M32 43 C32 31 37 23 44 18 C40 26 38 33 38 43 Z" fill="#46b06a" ${S}/>`,
  walk: `<circle cx="27" cy="8" r="5" fill="#ffd9b8" ${S}/><path d="M26 14 L22 28 L13 43 M22 28 L31 43 M24 18 L35 24 M24 18 L13 23" ${L} stroke-width="4"/>`,
  earth: `<path d="M3 36 C9 25 17 21 24 21 C31 21 39 25 45 36 Z" fill="#b07a4a" ${S}/><rect x="3" y="36" width="42" height="7" rx="2" fill="#8a5a3c" ${S}/><path d="M24 21 V12 M24 15 C20 10 16 12 16 12 M24 13 C28 8 32 10 32 10" ${L} stroke="#46b06a"/>`,
  metal: `<path d="M7 35 L14 21 H34 L41 35 Z" fill="#c9ced8" ${S}/><path d="M14 21 L18 15 H30 L34 21" fill="${GOLD}" ${S}/><path d="M19 27 L23 27" ${L} stroke="${CREAM}"/>`,
  thread: `<rect x="15" y="10" width="18" height="28" fill="#ff8fb1" ${S}/><rect x="11" y="5" width="26" height="6" rx="2" fill="#c98a52" ${S}/><rect x="11" y="37" width="26" height="6" rx="2" fill="#c98a52" ${S}/><path d="M15 16 H33 M15 22 H33 M15 28 H33 M33 30 C40 32 42 38 38 44" ${L} stroke-width="2"/>`,
  roof: `<rect x="11" y="23" width="26" height="20" fill="${CREAM}" ${S}/><path d="M3 25 L24 7 L45 25 Z" fill="#ff5532" ${S}/><rect x="20" y="31" width="8" height="12" fill="#a8703f" ${S}/>`,
  eye: `<path d="M3 24 C11 11 37 11 45 24 C37 37 11 37 3 24 Z" fill="${CREAM}" ${S}/><circle cx="24" cy="24" r="8" fill="#4aa3ff" ${S}/><circle cx="24" cy="24" r="3.5" fill="${INK}"/>`,
  rice: `<path d="M8 22 C10 12 38 12 40 22 Z" fill="${CREAM}" ${S}/><path d="M5 22 H43 C43 34 35 43 24 43 C13 43 5 34 5 22 Z" fill="#4aa3ff" ${S}/><path d="M14 30 H34" ${L} stroke="${CREAM}"/>`,
  grain: `<path d="M24 45 V8" ${L}/>${[12, 19, 26].map((y) => `<ellipse cx="18" cy="${y}" rx="5" ry="3" transform="rotate(-30 18 ${y})" fill="${GOLD}" ${S} stroke-width="2"/><ellipse cx="30" cy="${y}" rx="5" ry="3" transform="rotate(30 30 ${y})" fill="${GOLD}" ${S} stroke-width="2"/>`).join('')}`,
  bamboo: `<rect x="18" y="4" width="10" height="40" rx="3" fill="#7fdc7a" ${S}/><path d="M18 17 H28 M18 31 H28" ${L}/><path d="M28 17 C36 12 42 13 44 15 C38 19 33 19 28 17 Z" fill="#46b06a" ${S} stroke-width="2"/>`,
  animal: `<path d="M9 14 C5 22 6 32 11 34 L15 20 Z M39 14 C43 22 42 32 37 34 L33 20 Z" fill="#a8703f" ${S}/><circle cx="24" cy="26" r="14" fill="#d9a066" ${S}/><circle cx="19" cy="23" r="2.2" fill="${INK}"/><circle cx="29" cy="23" r="2.2" fill="${INK}"/><ellipse cx="24" cy="30" rx="4" ry="3" fill="${INK}"/>`,
  insect: `<circle cx="10" cy="34" r="6" fill="#7fdc7a" ${S}/><circle cx="20" cy="30" r="6.5" fill="#7fdc7a" ${S}/><circle cx="30" cy="26" r="7" fill="#7fdc7a" ${S}/><circle cx="38" cy="18" r="7" fill="#46b06a" ${S}/><circle cx="40" cy="17" r="1.8" fill="${INK}"/><path d="M36 11 L34 5 M41 11 L43 5" ${L} stroke-width="2"/>`,
  bird: `<path d="M7 28 C7 16 17 10 27 12 C36 14 40 22 38 30 C34 40 17 42 7 28 Z" fill="#4aa3ff" ${S}/><path d="M37 18 L45 20 L38 24 Z" fill="${GOLD}" ${S} stroke-width="2"/><circle cx="31" cy="19" r="2.2" fill="${INK}"/><path d="M14 26 C20 30 26 30 30 26" ${L}/>`,
  rain: `<path d="M12 26 a8 8 0 0 1 2 -15.5 a11 11 0 0 1 21 1 a7 7 0 0 1 1 14.5 Z" fill="${CREAM}" ${S}/><path d="M15 32 L12 40 M24 32 L21 42 M33 32 L30 40" ${L} stroke="#4aa3ff" stroke-width="4"/>`,
  door: `<rect x="11" y="5" width="26" height="38" rx="3" fill="#c98a52" ${S}/><rect x="16" y="10" width="16" height="12" rx="2" fill="none" ${S} stroke-width="2"/><circle cx="31" cy="28" r="2.5" fill="${GOLD}" ${S} stroke-width="1.6"/>`,
  clothes: `<path d="M17 6 L7 12 L4 22 L11 24 L12 43 H36 L37 24 L44 22 L41 12 L31 6 C29 10 19 10 17 6 Z" fill="#4aa3ff" ${S}/>`,
  food: `<path d="M30 4 L22 22 M38 6 L26 22" ${L} stroke="#a8703f" stroke-width="3.4"/><path d="M5 22 H43 C43 34 35 43 24 43 C13 43 5 34 5 22 Z" fill="#ff5532" ${S}/><path d="M10 22 C14 16 18 24 22 18 C26 24 30 16 34 22" ${L} stroke="${GOLD}"/>`,
  sick: `<circle cx="22" cy="24" r="17" fill="#ffd9b8" ${S}/><path d="M15 21 L19 23 M29 21 L25 23 M17 31 C20 29 24 29 27 31" ${L}/><path d="M30 30 L44 16" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M30 30 L44 16" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="30" r="3" fill="#ff5532"/>`,
  jade: `<path d="M12 8 H36 L44 20 L24 43 L4 20 Z" fill="#46b06a" ${S}/><path d="M4 20 H44 M16 8 L20 20 L24 43 L28 20 L32 8" ${L} stroke-width="2"/>`,
  money: `<circle cx="24" cy="24" r="19" fill="${GOLD}" ${S}/><rect x="18" y="18" width="12" height="12" fill="${CREAM}" ${S}/><circle cx="24" cy="24" r="14" fill="none" ${S} stroke-width="1.6"/>`,
  car: `<path d="M5 32 V25 L11 15 H33 L41 25 H43 V32 Z" fill="#ff5532" ${S}/><path d="M14 18 H31 L36 25 H11 Z" fill="#bfe0ff" ${S} stroke-width="2"/><circle cx="14" cy="34" r="5" fill="${INK}"/><circle cx="34" cy="34" r="5" fill="${INK}"/>`,
  strength: `<path d="M8 40 C6 30 10 22 18 20 L22 10 C24 6 30 6 31 10 L28 20 C36 20 42 26 42 34 C42 40 36 44 28 42 Z" fill="#ffd9b8" ${S}/><path d="M28 20 C26 26 22 28 18 28" ${L}/>`,
  knife: `<path d="M6 42 L30 18 C36 12 42 8 44 6 C44 14 40 24 32 30 Z" fill="#c9ced8" ${S}/><path d="M6 42 L14 34 L18 38 L10 46 Z" fill="#a8703f" ${S}/>`,
  ice: `<rect x="9" y="9" width="30" height="30" rx="6" fill="#bfe0ff" ${S} transform="rotate(8 24 24)"/><path d="M24 15 V33 M16 20 L32 28 M32 20 L16 28" ${L} stroke="${CREAM}" stroke-width="2.6"/>`,
  foot: `<path d="M16 44 C10 44 10 34 13 27 C16 20 26 19 28 26 C30 33 26 44 16 44 Z" fill="#ffd9b8" ${S}/><circle cx="15" cy="15" r="3.5" fill="#ffd9b8" ${S} stroke-width="2"/><circle cx="22" cy="11" r="3.2" fill="#ffd9b8" ${S} stroke-width="2"/><circle cx="28" cy="12" r="2.8" fill="#ffd9b8" ${S} stroke-width="2"/><circle cx="33" cy="16" r="2.5" fill="#ffd9b8" ${S} stroke-width="2"/>`,
  horse: `<path d="M14 44 L18 28 C12 26 8 20 12 14 L22 6 L26 10 C34 10 40 18 38 30 L34 44 Z" fill="#c98a52" ${S}/><path d="M22 6 C26 12 30 14 36 16" ${L} stroke="#7a4a2a" stroke-width="4"/><circle cx="17" cy="16" r="2" fill="${INK}"/>`,
  mountain: `<path d="M3 42 L18 12 L26 26 L32 18 L45 42 Z" fill="#7fdc7a" ${S}/><path d="M13 22 L18 12 L23 22 L20 20 L16 23 Z" fill="${CREAM}"/>`,
  field: `<rect x="6" y="6" width="36" height="36" rx="3" fill="#7fdc7a" ${S}/><path d="M24 6 V42 M6 24 H42" ${L}/>`,
  head: `<circle cx="24" cy="24" r="19" fill="#ffd9b8" ${S}/><circle cx="18" cy="21" r="2.4" fill="${INK}"/><circle cx="30" cy="21" r="2.4" fill="${INK}"/><path d="M17 30 C21 34 27 34 31 30" ${L}/>`,
  town: `<path d="M4 43 V24 L13 16 L22 24 V43 Z" fill="${CREAM}" ${S}/><path d="M22 43 V18 L33 9 L44 18 V43 Z" fill="${GOLD}" ${S}/><rect x="10" y="32" width="6" height="11" fill="#a8703f" ${S} stroke-width="2"/><rect x="30" y="30" width="7" height="7" fill="#bfe0ff" ${S} stroke-width="2"/>`,
  shelter: `<path d="M4 22 L28 8 L44 18" ${L} stroke-width="4"/><path d="M4 22 L28 8 L44 18 L44 22 L28 13 L4 26 Z" fill="#ff5532" ${S}/><path d="M10 24 V43 M38 21 V43 M6 43 H42" ${L}/>`,
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** The icon as a nested <svg> for use inside another SVG (e.g. Truffle's power mark). */
export function iconMarkup(name: IconName, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 48 48">${ICONS[name]}</svg>`;
}
