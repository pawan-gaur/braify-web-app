import { Link } from 'react-router-dom'

/**
 * Breadcrumbs
 *
 * Props:
 *   items   – array of { label, to? }
 *             Last item should have no `to` (it's the current page).
 *   dark    – set true for use on dark backgrounds (builder top bar)
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: 'Home',      to: '/' },
 *     { label: 'Templates', to: '/' },
 *     { label: 'New Template' },
 *   ]} />
 */
export default function Breadcrumbs({ items = [], dark = false }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          const isFirst = i === 0

          return (
            <li key={i} className="flex items-center gap-1">
              {/* Separator — skip before first item */}
              {!isFirst && (
                <svg
                  className={`w-3 h-3 shrink-0 ${
                    dark ? 'text-sidebar-label' : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                </svg>
              )}

              {/* Home icon on first item */}
              {isFirst && (
                <svg
                  className={`w-3.5 h-3.5 mr-0.5 shrink-0 ${
                    dark ? 'text-sidebar-muted' : 'text-gray-400 dark:text-gray-500'
                  }`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              )}

              {/* Label */}
              {isLast || !item.to ? (
                /* Current page — not a link */
                <span
                  className={`text-xs font-semibold leading-none ${
                    dark
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                /* Ancestor — clickable link */
                <Link
                  to={item.to}
                  className={`text-xs font-medium leading-none transition-colors duration-150 no-underline ${
                    dark
                      ? 'text-sidebar-muted hover:text-white'
                      : 'text-gray-400 hover:text-brand dark:text-gray-500 dark:hover:text-brand-400'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
