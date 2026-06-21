/**
 * Shared inline SVG icons (Lucide-style, stroke, 24×24 viewBox).
 *
 * Use these instead of unicode glyphs (✗ ✓ × « » ↗ ↘ ↑ ↓ → ←) so icons render
 * consistently across platforms/fonts. Each accepts a `className` (default w-4 h-4)
 * and inherits color via `currentColor`.
 *
 *   import { IconX, IconCheck, IconArrowRight } from '../components/ui/icons'
 *   <IconX className="w-4 h-4" />
 */
function Svg({ className = 'w-4 h-4', children }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

/** Close / cancel / clear — replaces ✗ ✕ ✖ × */
export const IconX = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>

/** Success / done / signed — replaces ✓ ✔ */
export const IconCheck = (p) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>

/** Forward affordance — replaces → in links/buttons */
export const IconArrowRight = (p) => <Svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>

/** Back affordance — replaces ← in links/buttons */
export const IconArrowLeft = (p) => <Svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Svg>

/** Trend up — replaces ↗ ↑ */
export const IconTrendUp = (p) => <Svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Svg>

/** Trend down — replaces ↘ ↓ */
export const IconTrendDown = (p) => <Svg {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></Svg>

/** Pagination: first page — replaces « */
export const IconChevronsLeft = (p) => <Svg {...p}><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></Svg>

/** Pagination: last page — replaces » */
export const IconChevronsRight = (p) => <Svg {...p}><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></Svg>

/** Pagination: previous — replaces ‹ */
export const IconChevronLeft = (p) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>

/** Pagination: next — replaces › */
export const IconChevronRight = (p) => <Svg {...p}><path d="M9 18l6-6-6-6" /></Svg>
