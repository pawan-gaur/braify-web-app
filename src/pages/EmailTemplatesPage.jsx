import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmailTemplates, deleteEmailTemplate, sendEmailTemplate } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import VersionHistoryModal from '../components/ui/VersionHistoryModal'
import EmailPreviewModal from '../components/ui/EmailPreviewModal'
import EmailLibraryModal from '../components/ui/EmailLibraryModal'
import { fmtDate } from '../utils/date'

const CRUMBS = [
  { label: 'Dashboard',       to: '/' },
  { label: 'Email Templates' },
]

function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy full ID'}
      className="p-0.5 rounded text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors shrink-0"
    >
      {copied ? (
        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      )}
    </button>
  )
}

function SortTh({ label, field, sortKey, onSort }) {
  const [f, d] = (sortKey || '').split('_')
  const active = f === field
  return (
    <th
      onClick={() => onSort(active && d === 'asc' ? `${field}_desc` : `${field}_asc`)}
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none
                 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
    >
      <span className="flex items-center gap-1.5">
        {label}
        {active ? (
          d === 'asc'
            ? <svg className="w-3 h-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/></svg>
            : <svg className="w-3 h-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
        ) : (
          <svg className="w-3 h-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        )}
      </span>
    </th>
  )
}

export default function EmailTemplatesPage() {
  useDocumentTitle('Email Templates')
  const navigate = useNavigate()
  const { can }  = useAuth()
  const toast    = useToast()

  const [view,     setView]     = useView('braify-view-email-templates')
  const [templates,       setTemplates]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [activeCategory,  setActiveCategory]  = useState('all')
  const [search,          setSearch]          = useState('')
  const [activeTags,      setActiveTags]      = useState([])
  const [showLibrary,     setShowLibrary]     = useState(false)
  const [versionTemplate, setVersionTemplate] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [sendTemplate,    setSendTemplate]    = useState(null)

  const [tableSortKey, setTableSortKey] = useState('updatedAt_desc')

  const load = useCallback(() => {
    setLoading(true)
    getEmailTemplates()
      .then(setTemplates)
      .catch(err => toast.error(err.message || 'Could not load email templates.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete email template "${name}"?`)) return
    await deleteEmailTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const CATEGORY_TABS = [
    { key: 'all',            label: 'All' },
    { key: 'transactional',  label: 'Transactional' },
    { key: 'marketing',      label: 'Marketing' },
    { key: 'onboarding',     label: 'Onboarding' },
    { key: 'notification',   label: 'Notification' },
    { key: 'custom',         label: 'Custom' },
  ]

  /* Compute all unique tags across templates */
  const allTags = useMemo(() => {
    const set = new Set()
    templates.forEach(t => {
      (t.tags || '').split(',').map(s => s.trim()).filter(Boolean).forEach(tag => set.add(tag))
    })
    return [...set].sort()
  }, [templates])

  const toggleTag = (tag) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const visibleTemplates = templates.filter(t => {
    if (activeCategory !== 'all' && (t.category || '') !== activeCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName    = t.name?.toLowerCase().includes(q)
      const matchSubject = t.subject?.toLowerCase().includes(q)
      const matchTags    = (t.tags || '').toLowerCase().includes(q)
      if (!matchName && !matchSubject && !matchTags) return false
    }
    if (activeTags.length > 0) {
      const tTags = (t.tags || '').split(',').map(s => s.trim())
      if (!activeTags.every(at => tTags.includes(at))) return false
    }
    return true
  })

  const tableSorted = useMemo(() => {
    const [field, dir] = tableSortKey.split('_')
    return [...visibleTemplates].sort((a, b) => {
      const av = field === 'name' ? (a.name || '') : field === 'subject' ? (a.subject || '') : (a.updatedAt || '')
      const bv = field === 'name' ? (b.name || '') : field === 'subject' ? (b.subject || '') : (b.updatedAt || '')
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [visibleTemplates, tableSortKey])

  /* Navigate to builder with a library template pre-loaded */
  const handleLibrarySelect = (libTmpl) => {
    if (!libTmpl) { navigate('/email-builder'); return }
    navigate('/email-builder', { state: { libraryTemplate: libTmpl } })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {/* Mail icon */}
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Email Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          {/* Split button: quick blank OR from library */}
          <div className="flex rounded-xl overflow-hidden shadow-sm">
            <button
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              onClick={() => navigate('/email-builder')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              New Template
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-2 text-sm font-semibold text-white border-l border-white/20 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              onClick={() => setShowLibrary(true)}
              title="Start from library"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              Library
            </button>
          </div>
        </div>
      </div>

      {/* Search + tag filter bar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, subject or tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-400 mr-1">Tags:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all font-medium ${
                  activeTags.includes(tag)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                #{tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1 underline">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {CATEGORY_TABS.map(tab => {
          const count = tab.key === 'all'
            ? templates.length
            : templates.filter(t => (t.category || '') === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                          transition-all border ${
                activeCategory === tab.key
                  ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeCategory === tab.key
                  ? 'bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-300'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>{count}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading email templates…
        </div>
      ) : templates.length === 0 ? (
        <EmptyState onNew={() => navigate('/email-builder')} />
      ) : visibleTemplates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No templates in the <strong>{activeCategory}</strong> category yet.
          </p>
          <button
            onClick={() => navigate('/email-builder')}
            className="mt-3 text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline"
          >
            Create one →
          </button>
        </div>
      ) : view === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

          {/* ── Table Toolbar ── */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30">
            <select
              value={tableSortKey}
              onChange={e => setTableSortKey(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="updatedAt_desc">Updated: Newest</option>
              <option value="updatedAt_asc">Updated: Oldest</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
              <option value="subject_asc">Subject: A → Z</option>
              <option value="subject_desc">Subject: Z → A</option>
            </select>
            <span className="ml-auto text-xs text-gray-400">
              {tableSorted.length} template{tableSorted.length !== 1 ? 's' : ''}
              {tableSorted.length !== templates.length && ` (filtered from ${templates.length})`}
            </span>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                <SortTh label="Name"    field="name"      sortKey={tableSortKey} onSort={setTableSortKey} />
                <SortTh label="Subject" field="subject"   sortKey={tableSortKey} onSort={setTableSortKey} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">From</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Placeholders</th>
                <SortTh label="Updated" field="updatedAt" sortKey={tableSortKey} onSort={setTableSortKey} />
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tableSorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
                    No templates match your filters.
                  </td>
                </tr>
              ) : tableSorted.map(t => {
                const date = fmtDate(t.updatedAt)
                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                          …{t.id.slice(-6)}
                        </span>
                        <CopyIdButton id={t.id} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                      {t.subject || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {t.fromName || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {t.placeholders?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.placeholders.slice(0, 3).map(p => (
                            <span key={p} className="ph-chip">{`{{${p}}}`}</span>
                          ))}
                          {t.placeholders.length > 3 && (
                            <span className="text-xs text-gray-400">+{t.placeholders.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{date}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/email-builder/${t.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
                          title="Edit">Edit</button>
                        <button onClick={() => setSendTemplate(t)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Send email">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                          </svg>
                        </button>
                        <button onClick={() => setPreviewTemplate(t)}
                          className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 text-gray-400 hover:text-sky-600 transition-colors"
                          title="Preview">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button onClick={() => setVersionTemplate(t)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Version history">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                        </button>
                        {can('delete') && (
                          <button onClick={() => handleDelete(t.id, t.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            {tableSorted.length} template{tableSorted.length !== 1 ? 's' : ''}
            {tableSorted.length !== templates.length && ` (filtered from ${templates.length})`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleTemplates.map(t => (
            <EmailTemplateCard
              key={t.id}
              template={t}
              onEdit={() => navigate(`/email-builder/${t.id}`)}
              onDelete={can('delete') ? () => handleDelete(t.id, t.name) : null}
              onVersions={() => setVersionTemplate(t)}
              onPreview={() => setPreviewTemplate(t)}
              onSend={() => setSendTemplate(t)}
            />
          ))}
        </div>
      )}

      {/* Library modal */}
      {showLibrary && (
        <EmailLibraryModal
          onClose={() => setShowLibrary(false)}
          onSelect={handleLibrarySelect}
        />
      )}

      {/* Version history modal */}
      {versionTemplate && (
        <VersionHistoryModal
          template={versionTemplate}
          kind="email"
          onClose={() => setVersionTemplate(null)}
          onRestored={() => { setVersionTemplate(null); load() }}
        />
      )}

      {/* Email preview modal */}
      {previewTemplate && (
        <EmailPreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Send email modal */}
      {sendTemplate && (
        <SendEmailModal
          template={sendTemplate}
          onClose={() => setSendTemplate(null)}
        />
      )}
    </div>
  )
}

/* ── Email Template Card ─────────────────────────────────────────────────── */
function EmailTemplateCard({ template, onEdit, onDelete = null, onVersions, onPreview, onSend }) {
  const date = fmtDate(template.updatedAt)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card hover:shadow-card-hover
                    transition-shadow duration-200 flex flex-col overflow-hidden
                    border border-gray-100 dark:border-gray-700">

      {/* ── Clickable preview thumbnail ── */}
      <button
        onClick={onPreview}
        className="group relative h-28 w-full overflow-hidden bg-gradient-to-br
                   from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40
                   flex items-center justify-center focus:outline-none"
        title="Preview email"
      >
        {/* Faint envelope icon */}
        <svg className="w-14 h-14 text-sky-100 dark:text-sky-900/60 transition-transform
                        duration-200 group-hover:scale-110"
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9
                   2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-sky-600/0 group-hover:bg-sky-600/10
                        transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-md
                           text-sky-600 dark:text-sky-400 text-xs font-bold
                           px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Preview
          </span>
        </div>

        {/* Gradient bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-6
                        bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
      </button>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title + type badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7
                     a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <h3 className="font-bold text-navy dark:text-gray-100 truncate text-base leading-snug">
                {template.name}
              </h3>
            </div>
            {template.subject && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Subject: <span className="font-medium">{template.subject}</span>
              </p>
            )}
            {template.fromName && (
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                From: {template.fromName}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="badge bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-[10px]">
              Email
            </span>
            {template.category && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize
                               bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                {template.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
            …{template.id.slice(-6)}
          </span>
          <CopyIdButton id={template.id} />
        </div>

        {/* Placeholder chips */}
        {template.placeholders?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.placeholders.slice(0, 3).map(p => (
              <span key={p} className="ph-chip">{`{{${p}}}`}</span>
            ))}
            {template.placeholders.length > 3 && (
              <span className="text-xs text-gray-400 self-center">
                +{template.placeholders.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mt-auto pt-2
                        border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-300 dark:text-gray-500">Updated {date}</p>
          {template.currentVersion > 0 && (
            <button
              onClick={onVersions}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                         bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400
                         hover:bg-indigo-100 transition-colors flex items-center gap-1"
              title="View version history"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              v{template.currentVersion}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm flex-1 justify-center" onClick={onEdit}>
            Edit Template
          </button>
          {/* Send */}
          <button
            className="btn btn-ghost btn-sm px-2 text-emerald-500 hover:bg-emerald-50
                       hover:text-emerald-600 dark:hover:bg-emerald-900/20"
            onClick={onSend}
            title="Send email"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
          {/* Preview */}
          <button className="btn btn-ghost btn-sm px-2 text-sky-500 hover:bg-sky-50
                             hover:text-sky-600 dark:hover:bg-sky-900/20"
            onClick={onPreview} title="Preview email">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          {/* Versions */}
          <button className="btn btn-ghost btn-sm px-2" onClick={onVersions} title="Version history">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581
                   m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          {/* Delete — hidden for USER role */}
          {onDelete && (
            <button className="btn btn-ghost btn-sm px-2 text-red-400 hover:bg-red-50 hover:text-red-600"
              onClick={onDelete} title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                     m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Send Email Modal ────────────────────────────────────────────────────── */
function SendEmailModal({ template, onClose }) {
  const toast = useToast()
  const [to,           setTo]           = useState('')
  const [subject,      setSubject]      = useState(template.subject || '')
  const [placeholders, setPlaceholders] = useState(
    Object.fromEntries((template.placeholders || []).map(p => [p, '']))
  )
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSend = async () => {
    if (!to.trim()) { toast.error('Recipient email is required'); return }
    setSending(true)
    try {
      await sendEmailTemplate(template.id, {
        to: to.trim(),
        subject: subject.trim() || undefined,
        placeholders,
      })
      setSent(true)
      toast.success(`Email sent to ${to.trim()}`)
      setTimeout(onClose, 1500)
    } catch (err) {
      toast.error(err.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const setPlaceholder = (key, val) =>
    setPlaceholders(prev => ({ ...prev, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md
                      border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Send Email</h2>
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{template.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              To <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input w-full"
              placeholder="recipient@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
              disabled={sending || sent}
              autoFocus
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Subject
              <span className="ml-1 font-normal text-gray-400">(leave blank to use template default)</span>
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder={template.subject || 'Email subject…'}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={sending || sent}
            />
          </div>

          {/* Placeholder values */}
          {template.placeholders?.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Placeholder Values
              </label>
              <div className="space-y-2.5">
                {template.placeholders.map(key => (
                  <div key={key}>
                    <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 font-mono">
                      {`{{${key}}}`}
                    </label>
                    <input
                      type="text"
                      className="input w-full text-sm"
                      placeholder={`Value for ${key}…`}
                      value={placeholders[key] || ''}
                      onChange={e => setPlaceholder(key, e.target.value)}
                      disabled={sending || sent}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success state */}
          {sent && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20
                            text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-2"
            onClick={handleSend}
            disabled={sending || sent || !to.trim()}
          >
            {sending ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #eef2ff 100%)' }}>
        <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No email templates yet</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">
        Design beautiful, responsive email templates with the drag-and-drop builder.
      </p>
      <button className="btn btn-primary" onClick={onNew}>Create Email Template</button>
    </div>
  )
}

