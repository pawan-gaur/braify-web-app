import { useState, useMemo } from 'react'
import { EMAIL_LIBRARY, LIBRARY_CATEGORIES } from '../../data/emailLibraryTemplates'

const ACCENT_COLORS = {
  transactional: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  marketing:     { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  onboarding:    { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  notification:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-200 dark:border-amber-800'  },
}

/**
 * EmailLibraryModal
 *
 * Props:
 *   onClose   – close the modal
 *   onSelect  – called with the chosen library template object
 */
export default function EmailLibraryModal({ onClose, onSelect }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search,         setSearch]         = useState('')
  const [selected,       setSelected]       = useState(null)  // preview panel
  const [showPreview,    setShowPreview]     = useState(false)

  const visible = useMemo(() => {
    let list = EMAIL_LIBRARY
    if (activeCategory !== 'all') list = list.filter(t => t.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
      )
    }
    return list
  }, [activeCategory, search])

  const handleUse = (tmpl) => {
    onSelect(tmpl)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex overflow-hidden
                   border border-gray-200 dark:border-gray-700"
        style={{ width: '90vw', maxWidth: 1100, height: '88vh' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Left sidebar — categories ─────────────────────────────────── */}
        <div className="w-56 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700
                        flex flex-col shrink-0">
          <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Template Library</h2>
            <p className="text-xs text-gray-500 mt-0.5">{EMAIL_LIBRARY.length} ready-made templates</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {LIBRARY_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium
                            transition-colors text-left ${
                  activeCategory === cat.key
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat.key
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>{cat.count}</span>
              </button>
            ))}
          </nav>

          {/* Start blank shortcut */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              onClick={() => handleUse(null)}
              className="w-full py-2 text-sm font-medium rounded-xl border border-dashed
                         border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400
                         hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              + Start blank
            </button>
          </div>
        </div>

        {/* ── Main content area ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar + close */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search templates by name, category or tag…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Template grid */}
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 overflow-y-auto p-5 transition-all ${showPreview ? 'hidden md:block md:w-1/2' : ''}`}>
              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm font-medium">No templates match your search</p>
                  <button onClick={() => { setSearch(''); setActiveCategory('all') }}
                    className="mt-2 text-sm text-indigo-500 hover:underline">Clear filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {visible.map(tmpl => (
                    <LibraryCard
                      key={tmpl.id}
                      template={tmpl}
                      isSelected={selected?.id === tmpl.id}
                      onClick={() => { setSelected(tmpl); setShowPreview(true) }}
                      onUse={() => handleUse(tmpl)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Preview panel */}
            {showPreview && selected && (
              <div className="w-full md:w-1/2 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
                <PreviewPanel
                  template={selected}
                  onClose={() => { setShowPreview(false); setSelected(null) }}
                  onUse={() => handleUse(selected)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Library Card ─────────────────────────────────────────────────────────── */
function LibraryCard({ template, isSelected, onClick, onUse }) {
  const accent = ACCENT_COLORS[template.category] || ACCENT_COLORS.transactional

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
      }`}
    >
      {/* Mini HTML preview */}
      <div className="relative bg-gray-100 dark:bg-gray-800 overflow-hidden" style={{ height: 160 }}>
        <div style={{ width: 600, transformOrigin: 'top left', transform: 'scale(0.333)', pointerEvents: 'none' }}>
          <div dangerouslySetInnerHTML={{ __html: template.htmlContent }} />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors
                        flex items-center justify-center">
          <button
            onClick={e => { e.stopPropagation(); onUse() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity
                       px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg
                       hover:bg-indigo-700"
          >
            Use this template
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{template.name}</p>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0
                            ${accent.bg} ${accent.text}`}>
            {template.category}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{template.description}</p>
      </div>
    </div>
  )
}

/* ── Preview Panel ────────────────────────────────────────────────────────── */
function PreviewPanel({ template, onClose, onUse }) {
  const accent = ACCENT_COLORS[template.category] || ACCENT_COLORS.transactional

  return (
    <>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{template.name}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${accent.bg} ${accent.text}`}>
            {template.category}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Live HTML preview — scaled iframe */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800/50 relative">
        <iframe
          title={`Preview: ${template.name}`}
          srcDoc={`<!DOCTYPE html><html><head>
            <meta charset="UTF-8"/>
            <style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#e5e5e5;}
            * {max-width:100%!important;}</style>
          </head><body>${template.htmlContent}</body></html>`}
          className="w-full h-full border-none"
          sandbox="allow-same-origin"
        />
      </div>

      {/* Panel footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.map(tag => (
            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                       bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              #{tag}
            </span>
          ))}
        </div>

        <button
          onClick={onUse}
          className="w-full py-2.5 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          Use this template →
        </button>
      </div>
    </>
  )
}
