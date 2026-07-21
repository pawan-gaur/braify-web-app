/**
 * Decorative brand-art panel shown beside the auth forms (login / get-started).
 * Pure inline SVG in Braify's palette — no external assets, fully responsive
 * (fills its container via preserveAspectRatio slice).
 */

// 8-point star / burst path
function starPath(cx, cy, outer, inner, points = 8) {
  let d = ''
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / points) * i - Math.PI / 2
    d += (i === 0 ? 'M' : 'L') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)
  }
  return d + 'Z'
}

export default function AuthArtPanel({
  tagline = 'Document automation, e-signatures & analytics — all in one workspace.',
}) {
  // Dandelion rays (radiating lines with dot tips)
  const dcx = 372, dcy = 486, dlen = 58
  const rays = Array.from({ length: 11 }, (_, i) => {
    const a = (-104 + i * 20) * (Math.PI / 180)
    return { x2: dcx + dlen * Math.cos(a), y2: dcy + dlen * Math.sin(a) }
  })

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#211862]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 480 780"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="auth-bg" x1="0" y1="0" x2="0.6" y2="1">
            <stop stopColor="#2E2188" />
            <stop offset="1" stopColor="#150E3C" />
          </linearGradient>
        </defs>

        {/* Background + soft ambient circles */}
        <rect width="480" height="780" fill="url(#auth-bg)" />
        <circle cx="380" cy="150" r="175" fill="#5B45D6" opacity="0.45" />
        <circle cx="60" cy="610" r="200" fill="#4F7DF9" opacity="0.26" />
        <circle cx="440" cy="650" r="130" fill="#22D3C5" opacity="0.20" />

        {/* Tulip petals (top-left) */}
        <g transform="translate(112 120)">
          <path d="M0,-58 C30,-30 30,30 0,58 C-30,30 -30,-30 0,-58 Z"
                transform="rotate(-17)" fill="#8B79FF" />
          <path d="M0,-58 C30,-30 30,30 0,58 C-30,30 -30,-30 0,-58 Z"
                transform="rotate(17)" fill="#7C63F5" opacity="0.92" />
        </g>

        {/* Diamond accent pair (top area) */}
        <rect x="292" y="58" width="26" height="26" rx="4" transform="rotate(45 305 71)" fill="#FBBF24" />
        <rect x="320" y="58" width="26" height="26" rx="4" transform="rotate(45 333 71)" fill="#F87171" />

        {/* Concentric arcs (upper-right) */}
        {[26, 40, 54].map((r, i) => (
          <circle key={r} cx="426" cy="112" r={r} stroke="#A99BFF" strokeWidth="3" opacity={0.4 - i * 0.08} fill="none" />
        ))}

        {/* Yellow burst star */}
        <path d={starPath(150, 322, 44, 18, 8)} fill="#FBBF24" />
        <circle cx="150" cy="322" r="8" fill="#211862" />

        {/* Stacked triangles */}
        <g fill="#6C8CFF" opacity="0.9">
          <path d="M78 452 L118 452 L98 418 Z" />
          <path d="M78 496 L118 496 L98 462 Z" />
        </g>

        {/* Teal rounded rectangle */}
        <rect x="266" y="238" width="92" height="146" rx="16" transform="rotate(-8 312 311)" fill="#22D3C5" />

        {/* Dandelion — radiating lines with dot tips */}
        <g stroke="#CDBFFF" strokeWidth="1.6" strokeLinecap="round">
          {rays.map((r, i) => <line key={i} x1={dcx} y1={dcy} x2={r.x2} y2={r.y2} opacity="0.8" />)}
        </g>
        {rays.map((r, i) => <circle key={i} cx={r.x2} cy={r.y2} r="3.2" fill="#CDBFFF" />)}
        <circle cx={dcx} cy={dcy} r="4" fill="#FBBF24" />

        {/* Big quarter-circle (bottom-right) */}
        <path d="M480 560 A200 200 0 0 0 280 760 L480 760 Z" fill="#141033" opacity="0.85" />
        <path d="M480 640 A120 120 0 0 0 360 760 L480 760 Z" fill="#22D3C5" opacity="0.9" />

        {/* Dot grid (mid-right) */}
        {Array.from({ length: 5 }).flatMap((_, row) =>
          Array.from({ length: 4 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={372 + col * 24} cy={606 + row * 22} r="3" fill="#FFFFFF" opacity="0.45" />
          )),
        )}

        {/* Wavy lines (lower-left) */}
        <path d="M-10 686 Q40 666 90 686 T190 686 T290 686" stroke="#22D3C5" strokeWidth="3" opacity="0.5" fill="none" />
        <path d="M-10 706 Q40 686 90 706 T190 706 T290 706" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" fill="none" />

        {/* Large translucent brand spark (ties to the logo) */}
        <g transform="translate(232 402)" stroke="#FFFFFF" opacity="0.10">
          <path d="M-52 0a52 52 0 1 1 104 0" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M0,-74 V-52 M0,74 V52 M-74,0 H-52 M74,0 H52" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Tagline + brand chips */}
      {tagline && (
        <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-[#120b30]/80 to-transparent">
          <p className="text-white text-2xl font-bold leading-snug max-w-sm">{tagline}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {['PDF Templates', 'Email', 'E-Sign', 'Analytics'].map(t => (
              <span key={t} className="text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-sm
                                       border border-white/15 rounded-full px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
