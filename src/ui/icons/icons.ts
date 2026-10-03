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
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** The icon as a nested <svg> for use inside another SVG (e.g. Truffle's power mark). */
export function iconMarkup(name: IconName, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 48 48">${ICONS[name]}</svg>`;
}
