import { useId } from 'react'

/**
 * The single source of truth for the Braify brand mark.
 *
 * The same spark/sun glyph used by /favicon.svg. Every logo across the app
 * (navbar, sidebar, login, get-started, e-sign, auth pages) renders THIS —
 * do not hand-roll another logo mark. Pass `withWordmark` to show the "Braify"
 * lockup, or render just the mark for compact spots.
 */
export default function BrandLogo({
  size = 36,
  className = '',
  withWordmark = false,
  wordmark = 'Braify',
  wordmarkClass = '',
}) {
  const gid = useId()
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Braify"
      className={withWordmark ? '' : className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F5BF0" />
          <stop offset="1" stopColor="#6D52E8" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${gid})`} />
      <path d="M13 20c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="20" r="2.5" fill="white" />
      <path d="M20 13v-3M20 30v-3M13 20h-3M30 20h-3"
            stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.1 15.1l-2.1-2.1M24.9 24.9l2.1 2.1M24.9 15.1l2.1-2.1M15.1 24.9l-2.1 2.1"
            stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )

  if (!withWordmark) return mark

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
      <span className={wordmarkClass || 'font-extrabold tracking-tight text-gray-900 dark:text-white'}>
        {wordmark}
      </span>
    </span>
  )
}
