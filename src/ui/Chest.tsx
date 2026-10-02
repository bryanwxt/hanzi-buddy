/** The treasure chest art; opening is done with a HoldButton. */
export function Chest({ open }: { open: boolean }) {
  return (
    <div class={`chest ${open ? 'is-open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 160 140" width="210" height="184" aria-hidden="true">
        <defs>
          <radialGradient id="chest-glow">
            <stop offset="0" stop-color="#ffe9a6" stop-opacity="0.95" />
            <stop offset="1" stop-color="#ffe9a6" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="80" cy="132" rx="60" ry="6" fill="rgba(31,41,55,0.14)" />
        <circle class="chest__glow" cx="80" cy="58" r="62" fill="url(#chest-glow)" />
        <rect x="20" y="62" width="120" height="66" rx="12" fill="#c77b30" />
        <rect x="20" y="62" width="120" height="14" fill="#a8611f" />
        <rect x="72" y="62" width="16" height="66" fill="#f6c343" />
        <rect x="70" y="80" width="20" height="18" rx="5" fill="#f6c343" stroke="#b8860b" stroke-width="2" />
        <g class="chest__lid">
          <path d="M20 62 V46 Q20 18 80 18 Q140 18 140 46 V62 Z" fill="#d98a3d" />
          <rect x="72" y="18" width="16" height="44" fill="#f6c343" />
          <path d="M30 40 Q80 24 130 40" stroke="rgba(255,255,255,0.35)" stroke-width="4" fill="none" stroke-linecap="round" />
        </g>
      </svg>
    </div>
  );
}
