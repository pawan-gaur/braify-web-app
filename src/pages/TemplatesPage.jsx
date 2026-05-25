import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTemplates, deleteTemplate } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import VersionHistoryModal from '../components/ui/VersionHistoryModal'
import TemplatePreviewModal from '../components/ui/TemplatePreviewModal'
import { STARTER_CATEGORIES } from '../data/starterTemplates'
import { fmtDate } from '../utils/date'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'PDF Templates' },
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
      className="p-0.5 rounded text-gray-300 hover:text-primary dark:hover:text-primary transition-colors shrink-0"
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
                 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
    >
      <span className="flex items-center gap-1.5">
        {label}
        {active ? (
          d === 'asc'
            ? <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/></svg>
            : <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
        ) : (
          <svg className="w-3 h-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        )}
      </span>
    </th>
  )
}

const PAGE_TABS = [
  { id: 'mine',    label: 'My Templates' },
  { id: 'samples', label: 'Sample Gallery' },
]

export default function TemplatesPage() {
  useDocumentTitle('PDF Templates')
  const navigate = useNavigate()
  const { can }  = useAuth()
  const toast    = useToast()
  const [view,     setView]     = useView('braify-view-templates')
  const [pageTab,  setPageTab]  = useState('mine')
  const [templates,        setTemplates]        = useState([])
  const [versionTemplate,  setVersionTemplate]  = useState(null)
  const [previewTemplate,  setPreviewTemplate]  = useState(null)
  const [loading,   setLoading]   = useState(true)

  const [tableSearch,    setTableSearch]    = useState('')
  const [pageSizeFilter, setPageSizeFilter] = useState('')
  const [tableSortKey,   setTableSortKey]   = useState('updatedAt_desc')

  const tableVisible = useMemo(() => {
    let list = [...templates]
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase()
      list = list.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.placeholders?.some(p => p.toLowerCase().includes(q))
      )
    }
    if (pageSizeFilter) {
      list = list.filter(t => (t.pageSize || 'A4') === pageSizeFilter)
    }
    const [field, dir] = tableSortKey.split('_')
    list.sort((a, b) => {
      const av = field === 'name' ? (a.name || '') : (a.updatedAt || '')
      const bv = field === 'name' ? (b.name || '') : (b.updatedAt || '')
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return list
  }, [templates, tableSearch, pageSizeFilter, tableSortKey])

  const pageSizes = useMemo(
    () => [...new Set(templates.map(t => t.pageSize || 'A4'))].sort(),
    [templates]
  )

  const load = useCallback(() => {
    setLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch(err => toast.error(err.message || 'Could not load templates.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete template "${name}"?`)) return
    await deleteTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const openFromSample = (template, category) => {
    navigate('/builder', {
      state: {
        starterTemplate: {
          name:        template.name,
          description: template.description,
          htmlContent: template.html,
          cssContent:  template.css,
          pageSize:    category.pageSize,
          orientation: category.orientation,
        },
      },
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Breadcrumbs */}
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">PDF Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button className="btn btn-primary" onClick={() => navigate('/builder')}>
            + New PDF Template
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {PAGE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPageTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              pageTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.id === 'samples' && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                {STARTER_CATEGORIES.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── My Templates tab ── */}
      {pageTab === 'mine' && (
        loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <EmptyState onNew={() => navigate('/builder')} onBrowse={() => setPageTab('samples')} />
        ) : view === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

            {/* ── Table Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30">
              <div className="relative flex-1 min-w-[160px] max-w-sm">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search templates…"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <select
                value={pageSizeFilter}
                onChange={e => setPageSizeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                           focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Sizes</option>
                {pageSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={tableSortKey}
                onChange={e => setTableSortKey(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                           focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="updatedAt_desc">Updated: Newest</option>
                <option value="updatedAt_asc">Updated: Oldest</option>
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
              </select>
              {(tableSearch || pageSizeFilter) && (
                <button
                  onClick={() => { setTableSearch(''); setPageSizeFilter('') }}
                  className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {tableVisible.length === templates.length
                  ? `${templates.length} template${templates.length !== 1 ? 's' : ''}`
                  : `${tableVisible.length} of ${templates.length}`}
              </span>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                  <SortTh label="Name"    field="name"      sortKey={tableSortKey} onSort={setTableSortKey} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Page Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Placeholders</th>
                  <SortTh label="Updated" field="updatedAt" sortKey={tableSortKey} onSort={setTableSortKey} />
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tableVisible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
                      No templates match your search.
                    </td>
                  </tr>
                ) : tableVisible.map(t => {
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
                        {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="badge badge-indigo">{t.pageSize || 'A4'}</span>
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
                          <button
                            onClick={() => navigate(`/generate?templateId=${t.id}`)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
                            title="Generate PDF"
                          >Generate</button>
                          <button onClick={() => setPreviewTemplate(t)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 transition-colors"
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
                          <button onClick={() => navigate(`/builder/${t.id}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
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
              {tableVisible.length} template{tableVisible.length !== 1 ? 's' : ''}
              {tableVisible.length !== templates.length && ` (filtered from ${templates.length})`}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {templates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => navigate(`/builder/${t.id}`)}
                onGenerate={() => navigate(`/generate?templateId=${t.id}`)}
                onDelete={can('delete') ? () => handleDelete(t.id, t.name) : null}
                onVersions={() => setVersionTemplate(t)}
                onPreview={() => setPreviewTemplate(t)}
              />
            ))}
          </div>
        )
      )}

      {/* ── Sample Gallery tab ── */}
      {pageTab === 'samples' && (
        <SampleGallery view={view} onOpen={openFromSample} />
      )}

      {/* Version history modal */}
      {versionTemplate && (
        <VersionHistoryModal
          template={versionTemplate}
          onClose={() => setVersionTemplate(null)}
          onRestored={() => { setVersionTemplate(null); load() }}
        />
      )}

      {/* PDF preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}

/* ── Sample Gallery ──────────────────────────────────────────────────────── */
function SampleGallery({ view, onOpen }) {
  // Flatten all templates for list view
  const allTemplates = STARTER_CATEGORIES.flatMap(cat =>
    cat.templates.map(tpl => ({ ...tpl, category: cat }))
  )

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Choose a pre-built template to start with. It will open in the builder so you can customise it.
      </p>

      {view === 'table' ? (
        /* ── List / Table view ── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Template', 'Category', 'Tags', 'Page', 'Fields', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {allTemplates.map(tpl => (
                <tr key={tpl.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {/* Template name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: tpl.category.bg }}
                      >
                        {tpl.category.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{tpl.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{tpl.description}</p>
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: tpl.category.bg, color: tpl.category.color }}
                    >
                      {tpl.category.label}
                    </span>
                  </td>
                  {/* Tags */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* Page size + orientation */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="badge badge-indigo">{tpl.category.pageSize}</span>
                    <span className="ml-1 text-[10px] text-gray-400">{tpl.category.orientation}</span>
                  </td>
                  {/* Field count */}
                  <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {tpl.placeholders.length}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onOpen(tpl, tpl.category)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                      style={{ background: `linear-gradient(135deg,${tpl.category.color},${tpl.category.color}cc)` }}
                    >
                      Use Template
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            {allTemplates.length} sample template{allTemplates.length !== 1 ? 's' : ''}
          </div>
        </div>
      ) : (
        /* ── Grid / Card view — grouped by category ── */
        STARTER_CATEGORIES.map(cat => (
          <div key={cat.id} className="mb-8">
            {/* Category header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                style={{ background: cat.bg }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy dark:text-white text-base">{cat.label}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: cat.bg, color: cat.color }}
                  >
                    {cat.templates.length} template{cat.templates.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{cat.description}</span>
              </div>
            </div>

            {/* Template cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.templates.map(tpl => (
                <StarterCard
                  key={tpl.id}
                  template={tpl}
                  category={cat}
                  onOpen={() => onOpen(tpl, cat)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/* ── StarterCard ─────────────────────────────────────────────────────────── */
function StarterCard({ template, category, onOpen }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col group"
    >
      {/* Thumbnail */}
      <div
        className="h-32 flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${category.bg} 0%, #fff 100%)` }}
      >
        <span className="text-5xl group-hover:scale-110 transition-transform duration-200 select-none">
          {category.icon}
        </span>
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />

        {/* Orientation badge */}
        <div
          className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: category.bg, color: category.color }}
        >
          {category.orientation === 'landscape' ? '↔ Landscape' : '↕ Portrait'} · {category.pageSize}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-bold text-navy dark:text-white text-sm leading-snug">{template.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{template.description}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: category.bg, color: category.color }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Placeholder count */}
        <div className="text-[11px] text-gray-400 mt-auto">
          {template.placeholders.length} dynamic fields
        </div>

        <button
          onClick={onOpen}
          className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 mt-1"
          style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)` }}
        >
          Use This Template →
        </button>
      </div>
    </div>
  )
}

/* ── My Templates: TemplateCard ──────────────────────────────────────────── */
function TemplateCard({ template, onEdit, onGenerate, onDelete = null, onVersions, onPreview }) {
  const date = fmtDate(template.updatedAt)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card hover:shadow-card-hover
                    transition-shadow duration-200 flex flex-col overflow-hidden
                    border border-gray-100 dark:border-gray-700">

      {/* Clickable preview thumbnail area */}
      <button
        onClick={onPreview}
        className="group relative h-28 w-full overflow-hidden bg-gradient-to-br
                   from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40
                   flex items-center justify-center focus:outline-none"
        title="Preview template"
      >
        <svg className="w-14 h-14 text-indigo-100 dark:text-indigo-900/60 transition-transform
                        duration-200 group-hover:scale-110"
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="1"
            fill="none" strokeLinecap="round"/>
        </svg>

        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10
                        transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-md
                           text-indigo-600 dark:text-indigo-400 text-xs font-bold
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

        <div className="absolute bottom-0 inset-x-0 h-6
                        bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
      </button>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-navy dark:text-gray-100 truncate text-base leading-snug">
              {template.name}
            </h3>
            {template.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{template.description}</p>
            )}
          </div>
          <span className="badge badge-indigo shrink-0">{template.pageSize || 'A4'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
            …{template.id.slice(-6)}
          </span>
          <CopyIdButton id={template.id} />
        </div>

        {template.placeholders?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.placeholders.slice(0, 4).map(p => (
              <span key={p} className="ph-chip">{`{{${p}}}`}</span>
            ))}
            {template.placeholders.length > 4 && (
              <span className="text-xs text-gray-400 self-center">+{template.placeholders.length - 4} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
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

        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm flex-1 justify-center" onClick={onGenerate}>
            Generate PDF
          </button>
          <button className="btn btn-ghost btn-sm px-2 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600
                             dark:hover:bg-indigo-900/20"
            onClick={onPreview} title="Preview template">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button className="btn btn-ghost btn-sm px-2" onClick={onVersions} title="Version history">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button className="btn btn-ghost btn-sm px-2" onClick={onEdit} title="Edit template">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {onDelete && (
            <button className="btn btn-ghost btn-sm px-2 text-red-400 hover:bg-red-50 hover:text-red-600"
              onClick={onDelete} title="Delete template">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                     m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew, onBrowse }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)' }}>
        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No templates yet</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-sm">
        Design your first PDF template from scratch, or pick one of our ready-made samples.
      </p>
      <div className="flex gap-3">
        <button className="btn btn-primary" onClick={onNew}>Start from Blank</button>
        <button className="btn btn-secondary" onClick={onBrowse}>Browse Samples</button>
      </div>
    </div>
  )
}
