import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAll } from '../../services/api'

const GROUPS = [
  ['documents', 'E-sign documents'], ['templates', 'PDF templates'], ['emailTemplates', 'Email templates'],
  ['files', 'Files'], ['users', 'People'],
]

/**
 * Top-bar search across templates, e-sign documents, files and people. Results come from
 * GET /api/search, which applies the same visibility rules as each list page.
 * ⌘K still opens the command palette for navigation.
 */
export default function GlobalSearch() {
  const navigate = useNavigate()
  const [q, setQ]           = useState('')
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({})
  const [active, setActive] = useState(-1)
  const boxRef = useRef(null)
  const seq = useRef(0)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setResults({}); setLoading(false); return }
    setLoading(true)
    const id = ++seq.current
    const t = setTimeout(() => {
      searchAll(term)
        .then(r => { if (id === seq.current) { setResults(r || {}); setActive(-1) } })
        .catch(() => { if (id === seq.current) setResults({}) })
        .finally(() => { if (id === seq.current) setLoading(false) })
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const flat = GROUPS.flatMap(([k]) => results[k] || [])
  const go = (item) => { setOpen(false); setQ(''); navigate(item.link) }

  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (!flat.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % flat.length) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => (i - 1 + flat.length) % flat.length) }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); go(flat[active]) }
  }

  const showPanel = open && q.trim().length >= 2
  let idx = -1

  return (
    <div className="flex-1 max-w-xl relative" ref={boxRef}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      </span>
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search documents, templates, files, people…"
        role="combobox" aria-expanded={showPanel} aria-controls="global-search-results" aria-autocomplete="list"
        aria-label="Search"
        className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-ink-8 dark:bg-gray-800 border border-ink-7 dark:border-gray-700
                   text-ink-2 dark:text-gray-200 placeholder-ink-4 dark:placeholder-gray-500 outline-none
                   focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all duration-150"
      />
      {q && (
        <button onClick={() => { setQ(''); setResults({}) }} aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2 dark:hover:text-gray-200">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      )}

      {showPanel && (
        <div id="global-search-results" role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-ink-7 dark:border-gray-700 max-h-[70vh] overflow-y-auto py-2">
          {loading && !flat.length && <p className="px-4 py-3 text-sm text-ink-4">Searching…</p>}
          {!loading && !flat.length && <p className="px-4 py-3 text-sm text-ink-4">No matches for “{q.trim()}”.</p>}
          {GROUPS.map(([key, label]) => {
            const items = results[key] || []
            if (!items.length) return null
            return (
              <div key={key} className="py-1">
                <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-4">{label}</p>
                {items.map(item => {
                  idx++
                  const i = idx
                  return (
                    <button key={key + item.id} role="option" aria-selected={active === i}
                      onMouseEnter={() => setActive(i)} onClick={() => go(item)}
                      className={`w-full text-left px-4 py-2 flex items-center justify-between gap-3 text-sm ${active === i ? 'bg-ink-8 dark:bg-gray-700' : ''}`}>
                      <span className="truncate text-ink-2 dark:text-gray-200">{item.title}</span>
                      <span className="text-[11px] text-ink-4 shrink-0">{item.kind}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
