import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  esignListDocuments,
  esignCancelDocument,
  esignResendDocument,
  esignListBatches,
  esignGetBatchDocuments,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import { fmtDateTimeGB as fmtDate } from '../utils/date'
import { IconChevronsLeft, IconChevronsRight, IconChevronLeft, IconChevronRight } from '../components/ui/icons'

// ── Constants ──────────────────────────────────────────────────────────────────

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'E-Sign Documents' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const BATCH_STATUS_COLORS = {
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  PARTIAL:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  FAILED:     'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_COLORS = {
  DRAFT:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  PENDING:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PARTIALLY_SIGNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  SIGNED:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  EXPIRED:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
}

// ── Small shared components ────────────────────────────────────────────────────

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
      className="p-0.5 rounded text-gray-300 hover:text-accent dark:hover:text-accent-400 transition-colors shrink-0"
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

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"/>
    </div>
  )
}

/** Pagination bar — zero-based `page`, `totalPages` count. */
function PaginationBar({ page, totalPages, totalElements, size, onPage, onSize, label = 'records' }) {
  if (totalPages <= 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3
                    border-t border-gray-100 dark:border-gray-700
                    text-sm text-gray-500 dark:text-gray-400">
      {/* total count + page size selector */}
      <div className="flex items-center gap-2">
        <span>{totalElements} {label}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <label className="flex items-center gap-1.5 text-xs">
          Show
          <select
            value={size}
            onChange={e => onSize(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          per page
        </label>
      </div>

      {/* page navigator */}
      <div className="flex items-center gap-1">
        <button
          disabled={page === 0}
          onClick={() => onPage(0)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="First page"
        ><IconChevronsLeft className="w-4 h-4" /></button>
        <button
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Previous page"
        ><IconChevronLeft className="w-4 h-4" /></button>

        {/* page number pills */}
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          // Show pages around current
          let p
          if (totalPages <= 7) {
            p = i
          } else if (page < 4) {
            p = i < 5 ? i : i === 5 ? -1 : totalPages - 1
          } else if (page >= totalPages - 4) {
            p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i
          } else {
            p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2)
          }
          if (p === -1) return <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors
                ${page === p
                  ? 'bg-accent border-accent text-white'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {p + 1}
            </button>
          )
        })}

        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Next page"
        ><IconChevronRight className="w-4 h-4" /></button>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPage(totalPages - 1)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Last page"
        ><IconChevronsRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// ── Documents tab ──────────────────────────────────────────────────────────────

function DocumentsTab() {
  const [view, setView]             = useView('braify-view-esign', 'grid')
  const [data, setData]             = useState(null)          // PageResponse
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]             = useState(0)
  const [size, setSize]             = useState(20)
  const [resending, setResending]   = useState(null)
  const navigate                    = useNavigate()
  const { showToast }               = useToast()

  const fetchDocs = useCallback(() => {
    setLoading(true)
    esignListDocuments({ page, size, status: statusFilter || undefined })
      .then(setData)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [page, size, statusFilter])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Reset to page 0 when filter/size changes
  function applyStatusFilter(v) { setStatusFilter(v); setPage(0) }
  function applySize(v)         { setSize(v);          setPage(0) }

  const docs = data?.content ?? []

  // Client-side text search within the current page
  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    return !q ||
      d.title?.toLowerCase().includes(q) ||
      d.clientEmail?.toLowerCase().includes(q) ||
      d.clientName?.toLowerCase().includes(q)
  })

  async function handleCancel(id, e) {
    e.stopPropagation()
    if (!confirm('Cancel this document? The client will no longer be able to sign it.')) return
    try {
      await esignCancelDocument(id)
      fetchDocs()
      showToast('Document cancelled', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleResend(id, e) {
    e.stopPropagation()
    if (!confirm('Resend the signing invitation email to the client?')) return
    setResending(id)
    try {
      await esignResendDocument(id)
      showToast('Signing invitation resent successfully', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResending(null)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by title, client name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => applyStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                     focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="PARTIALLY_SIGNED">Partially Signed</option>
          <option value="SIGNED">Signed</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); applyStatusFilter('') }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5
                       px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Clear
          </button>
        )}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No documents yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Create your first e-sign document to get started
          </p>
          <button
            onClick={() => navigate('/esign/new')}
            className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}
          >
            Create Document
          </button>
        </div>
      ) : view === 'grid' ? (
        /* ── Card / Grid view ──────────────────────────────────────────── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-5">
            {filtered.map(doc => {
              const isTerminal = ['COMPLETED','CANCELLED','EXPIRED'].includes(doc.status)
              const href = isTerminal ? `/esign/${doc.id}/view` : `/esign/${doc.id}`
              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(href)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700
                             shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden"
                >
                  <div className={`h-1.5 w-full ${
                    doc.status === 'COMPLETED' ? 'bg-green-400' :
                    doc.status === 'PENDING'   ? 'bg-yellow-400' :
                    doc.status === 'IN_REVIEW' ? 'bg-blue-400' :
                    doc.status === 'PARTIALLY_SIGNED' ? 'bg-purple-400' :
                    doc.status === 'SIGNED'    ? 'bg-indigo-400' :
                    doc.status === 'CANCELLED' ? 'bg-red-400' :
                    doc.status === 'EXPIRED'   ? 'bg-orange-400' : 'bg-gray-300'
                  }`} />
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug truncate">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doc.sourceType}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0
                                      ${STATUS_COLORS[doc.status] || STATUS_COLORS.DRAFT}`}>
                        {doc.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent-600 dark:text-accent-400">
                          {doc.clientName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.clientName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{doc.clientEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                        …{doc.id.slice(-6)}
                      </span>
                      <CopyIdButton id={doc.id} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>Sent: {fmtDate(doc.sentAt)}</span>
                      {doc.completedAt && <span>Done: {fmtDate(doc.completedAt)}</span>}
                    </div>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(href)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold
                                   rounded-lg border border-gray-200 dark:border-gray-600
                                   text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        {isTerminal ? 'View' : 'Edit'}
                      </button>
                      {doc.status === 'PENDING' && (
                        <button
                          onClick={e => handleResend(doc.id, e)}
                          disabled={resending === doc.id}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                          title="Resend invitation"
                        >
                          {resending === doc.id
                            ? <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                              </svg>}
                        </button>
                      )}
                      {!isTerminal && (
                        <button
                          onClick={e => handleCancel(doc.id, e)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                          title="Cancel"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <PaginationBar
            page={page} totalPages={data?.totalPages ?? 0} totalElements={data?.totalElements ?? 0}
            size={size} onPage={setPage} onSize={applySize} label="documents"
          />
        </div>
      ) : (
        /* ── Table view ────────────────────────────────────────────────── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(doc => {
                const isTerminal = ['COMPLETED','CANCELLED','EXPIRED'].includes(doc.status)
                const href = isTerminal ? `/esign/${doc.id}/view` : `/esign/${doc.id}`
                return (
                  <tr key={doc.id} onClick={() => navigate(href)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                          …{doc.id.slice(-6)}
                        </span>
                        <CopyIdButton id={doc.id}/>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">{doc.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doc.sourceType}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{doc.clientName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{doc.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                      ${STATUS_COLORS[doc.status] || STATUS_COLORS.DRAFT}`}>
                        {doc.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{fmtDate(doc.sentAt)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{fmtDate(doc.completedAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(href)}
                          className="p-1.5 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/30 text-gray-400 hover:text-accent-600 transition-colors"
                          title={isTerminal ? 'View' : 'Edit'}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        {doc.status === 'PENDING' && (
                          <button onClick={e => handleResend(doc.id, e)} disabled={resending === doc.id}
                            className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                            title="Resend signing invitation">
                            {resending === doc.id
                              ? <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
                              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                </svg>}
                          </button>
                        )}
                        {!isTerminal && (
                          <button onClick={e => handleCancel(doc.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                            title="Cancel">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
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
          <PaginationBar
            page={page} totalPages={data?.totalPages ?? 0} totalElements={data?.totalElements ?? 0}
            size={size} onPage={setPage} onSize={applySize} label="documents"
          />
        </div>
      )}
    </>
  )
}

// ── Bulk Batches tab ───────────────────────────────────────────────────────────

/**
 * Displays the list of documents for a given batch.
 * `onBack` returns to the batch list.
 */
function BatchDocumentsView({ batch, onBack }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [size, setSize]       = useState(20)
  const [search, setSearch]   = useState('')
  const [resending, setResending] = useState(null)   // docId currently being resent
  const navigate              = useNavigate()
  const { showToast }         = useToast()

  const fetchDocs = useCallback(() => {
    setLoading(true)
    esignGetBatchDocuments(batch.id, { page, size })
      .then(setData)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [batch.id, page, size])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  function applySize(v) { setSize(v); setPage(0) }

  async function handleResend(id, e) {
    e.stopPropagation()
    if (!confirm('Resend the signing invitation email to this client?')) return
    setResending(id)
    try {
      await esignResendDocument(id)
      showToast('Signing invitation resent successfully', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResending(null)
    }
  }

  async function handleCancel(id, e) {
    e.stopPropagation()
    if (!confirm('Cancel this document? The client will no longer be able to sign it.')) return
    try {
      await esignCancelDocument(id)
      fetchDocs()
      showToast('Document cancelled', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const docs = data?.content ?? []
  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    return !q ||
      d.title?.toLowerCase().includes(q) ||
      d.clientEmail?.toLowerCase().includes(q) ||
      d.clientName?.toLowerCase().includes(q)
  })

  return (
    <div>
      {/* Back + batch info header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          All Batches
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{batch.label}</h3>
          <p className="text-xs text-gray-400">
            {batch.totalCreated} created · {batch.totalSent} sent · {batch.totalFailed} failed
          </p>
        </div>
        <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${BATCH_STATUS_COLORS[batch.status] || 'bg-gray-100 text-gray-600'}`}>
          {batch.status}
        </span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input type="text" placeholder="Search within this batch…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent"/>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No documents found in this batch.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent</th>
                  <th className="px-4 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(doc => {
                  const isTerminal = ['COMPLETED','CANCELLED','EXPIRED'].includes(doc.status)
                  const canResend  = ['PENDING','IN_REVIEW'].includes(doc.status)
                  const href = isTerminal ? `/esign/${doc.id}/view` : `/esign/${doc.id}`
                  return (
                    <tr key={doc.id} onClick={() => navigate(href)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                            …{doc.id.slice(-6)}
                          </span>
                          <CopyIdButton id={doc.id}/>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">{doc.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.sourceType}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{doc.clientName}</p>
                        <p className="text-xs text-gray-400">{doc.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                        ${STATUS_COLORS[doc.status] || STATUS_COLORS.DRAFT}`}>
                          {doc.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{fmtDate(doc.sentAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {/* View / Edit */}
                          <button onClick={() => navigate(href)}
                            className="p-1.5 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/30 text-gray-400 hover:text-accent-600 transition-colors"
                            title={isTerminal ? 'View' : 'Edit'}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>

                          {/* Resend — available while PENDING or IN_REVIEW */}
                          {canResend && (
                            <button
                              onClick={e => handleResend(doc.id, e)}
                              disabled={resending === doc.id}
                              className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                              title="Resend signing invitation">
                              {resending === doc.id
                                ? <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
                                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                  </svg>}
                            </button>
                          )}

                          {/* Cancel — available for any non-terminal document */}
                          {!isTerminal && (
                            <button
                              onClick={e => handleCancel(doc.id, e)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                              title="Cancel document">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
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
          )}
          <PaginationBar
            page={page} totalPages={data?.totalPages ?? 0} totalElements={data?.totalElements ?? 0}
            size={size} onPage={setPage} onSize={applySize} label="documents"
          />
        </div>
      )}
    </div>
  )
}

function BulkBatchesTab() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [size, setSize]         = useState(20)
  const [search, setSearch]     = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)  // drill-down
  const { showToast }           = useToast()

  const fetchBatches = useCallback(() => {
    setLoading(true)
    esignListBatches({ page, size })
      .then(setData)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [page, size])

  useEffect(() => { fetchBatches() }, [fetchBatches])
  function applySize(v) { setSize(v); setPage(0) }

  // If a batch is selected, show its documents
  if (selectedBatch) {
    return <BatchDocumentsView batch={selectedBatch} onBack={() => setSelectedBatch(null)} />
  }

  const batches = data?.content ?? []
  const filtered = batches.filter(b => {
    const q = search.toLowerCase()
    return !q || b.label?.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input type="text" placeholder="Search batches…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent"/>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No bulk batches yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Use Bulk Send to send documents to multiple recipients at once</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Batch Label</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Failed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created At</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(batch => (
                <tr key={batch.id}
                  onClick={() => setSelectedBatch(batch)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{batch.label}</p>
                        <p className="font-mono text-xs text-gray-400 mt-0.5">…{batch.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                    ${BATCH_STATUS_COLORS[batch.status] || 'bg-gray-100 text-gray-600'}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{batch.totalRequested}</td>
                  <td className="px-4 py-4 text-sm text-green-600 dark:text-green-400 font-medium">{batch.totalCreated}</td>
                  <td className="px-4 py-4 text-sm text-blue-600 dark:text-blue-400 font-medium">{batch.totalSent}</td>
                  <td className="px-4 py-4 text-sm text-red-500 dark:text-red-400 font-medium">{batch.totalFailed}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{fmtDate(batch.createdAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedBatch(batch) }}
                      className="flex items-center gap-1 text-xs font-semibold text-accent-600 dark:text-accent-400
                                 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
                    >
                      View docs
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationBar
            page={page} totalPages={data?.totalPages ?? 0} totalElements={data?.totalElements ?? 0}
            size={size} onPage={setPage} onSize={applySize} label="batches"
          />
        </div>
      )}
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'docs',    label: 'Documents' },
  { key: 'batches', label: 'Bulk Batches' },
]

export default function ESignDocumentsPage() {
  const [activeTab, setActiveTab] = useState('docs')
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      {/* Page header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-Sign Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage documents sent for electronic signature
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/esign/bulk')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                       border border-accent-200 dark:border-accent-700 text-accent-700 dark:text-accent-300
                       bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/40
                       transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
            </svg>
            Bulk Send
          </button>
          <button
            onClick={() => navigate('/esign/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
                       shadow-sm hover:shadow-md transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            New Document
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-accent-700 dark:text-accent-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'docs'    && <DocumentsTab />}
      {activeTab === 'batches' && <BulkBatchesTab />}
    </div>
  )
}
