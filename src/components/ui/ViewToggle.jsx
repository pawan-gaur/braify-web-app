import { useState } from 'react'

/**
 * Persisted view-mode hook.
 * storageKey – unique localStorage key per page
 * defaultView – 'grid' | 'table'
 */
export function useView(storageKey, defaultView = 'grid') {
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(storageKey) || defaultView }
    catch { return defaultView }
  })
  const onChange = v => {
    setView(v)
    try { localStorage.setItem(storageKey, v) } catch {}
  }
  return [view, onChange]
}

/**
 * Toggle button pair — Grid (cards) vs Table (rows).
 * Drop it in any header row next to the "+ New" button.
 */
export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center bg-ink-8 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
      {/* Card / Grid */}
      <button
        onClick={() => onChange('grid')}
        title="Card view"
        className={`p-1.5 rounded-md transition-all ${
          view === 'grid'
            ? 'bg-gradient-accent text-white shadow-soft'
            : 'text-ink-4 hover:text-ink dark:hover:text-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z
               M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z
               M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z
               M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
      </button>

      {/* Table / List */}
      <button
        onClick={() => onChange('table')}
        title="Table view"
        className={`p-1.5 rounded-md transition-all ${
          view === 'table'
            ? 'bg-gradient-accent text-white shadow-soft'
            : 'text-ink-4 hover:text-ink dark:hover:text-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
      </button>
    </div>
  )
}
