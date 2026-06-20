/**
 * Bulk Email Campaigns — list / dashboard page
 *
 * Matches the design language of ESignDocumentsPage:
 *   • Grid (card) and Table view toggle, persisted to localStorage
 *   • PaginationBar with page-size selector
 *   • CopyIdButton on every row / card
 *   • SVG icons — no unrelated emoji
 *   • Live polling while any job is PROCESSING / PENDING
 *
 * Route: /bulk-email
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bulkEmailListJobs, bulkEmailResend, bulkEmailRetryPending, bulkEmailCancelJob } from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import { fmtDateTimeGB as fmtDate } from '../utils/date'

// ── Constants ──────────────────────────────────────────────────────────────────
const POLL_MS          = 5000
const PAGE_SIZE_OPTIONS = [10, 20, 50]

const STATUS_COLORS = {
  PENDING:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  PARTIAL:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  FAILED:     'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  CANCELLED:  'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const STATUS_BAR = {
  PENDING:    'bg-yellow-400',
  PROCESSING: 'bg-blue-400',
  COMPLETED:  'bg-green-400',
  PARTIAL:    'bg-orange-400',
  FAILED:     'bg-red-400',
  CANCELLED:  'bg-gray-300 dark:bg-gray-600',
}

// ── SVG icons for attachment types ─────────────────────────────────────────────
function AttachmentIcon({ type, className = 'w-4 h-4' }) {
  if (type === 'UPLOAD') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
    </svg>
  )
  if (type === 'PDF_TEMPLATE') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  )
  if (type === 'EXTERNAL_API') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
    </svg>
  )
  // NONE — envelope
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  )
}

const ATT_LABEL = {
  NONE:         'Email only',
  UPLOAD:       'Uploaded PDF',
  PDF_TEMPLATE: 'PDF Template',
  EXTERNAL_API: 'External API',
}

// ── Shared small components ────────────────────────────────────────────────────
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
      className="p-0.5 rounded text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 transition-colors shrink-0"
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
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
}

function PaginationBar({ page, totalPages, totalElements, size, onPage, onSize }) {
  if (totalPages <= 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3
                    border-t border-gray-100 dark:border-gray-700
                    text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-2">
        <span>{totalElements} campaign{totalElements !== 1 ? 's' : ''}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <label className="flex items-center gap-1.5 text-xs">
          Show
          <select
            value={size}
            onChange={e => onSize(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          per page
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page === 0} onClick={() => onPage(0)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="First">«</button>
        <button disabled={page === 0} onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Previous">‹</button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p
          if (totalPages <= 7)           p = i
          else if (page < 4)             p = i < 5 ? i : i === 5 ? -1 : totalPages - 1
          else if (page >= totalPages-4) p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i
          else                           p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2)
          if (p === -1) return <span key={`e${i}`} className="px-1 text-gray-400">…</span>
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors
                ${page === p
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >{p + 1}</button>
          )
        })}
        <button disabled={page >= totalPages-1} onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Next">›</button>
        <button disabled={page >= totalPages-1} onClick={() => onPage(totalPages - 1)}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Last">»</button>
      </div>
    </div>
  )
}

// ── Progress bar helper ────────────────────────────────────────────────────────
function ProgressBar({ job, height = 'h-1.5' }) {
  const pct = job.totalCount > 0 ? Math.round((job.sentCount / job.totalCount) * 100) : 0
  const color = job.failedCount > 0 && job.sentCount === 0 ? 'bg-red-400'
    : job.failedCount > 0 ? 'bg-orange-400' : 'bg-green-500'
  return (
    <div className={`w-full ${height} bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }}/>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BulkEmailJobsPage() {
  const navigate      = useNavigate()
  const toast         = useToast()

  const [view, setView]         = useView('braify-view-bulk-email', 'grid')
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]         = useState(0)
  const [size, setSize]         = useState(20)
  const [totalPages, setTotalPages]   = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pollRef = useRef(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await bulkEmailListJobs({ page, size })
      setJobs(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (e) {
      if (!silent) toast.error(e.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [page, size])

  useEffect(() => { loadJobs() }, [loadJobs])

  // Live poll while any job is active.
  // Depend on the derived boolean (not the whole `jobs` array) so the interval
  // is created once when a job becomes active — not torn down and recreated on
  // every poll tick (which happened when `jobs` was a dependency).
  const hasActiveJob = jobs.some(j => j.status === 'PROCESSING' || j.status === 'PENDING')
  useEffect(() => {
    clearInterval(pollRef.current)
    if (hasActiveJob) pollRef.current = setInterval(() => loadJobs(true), POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [hasActiveJob, loadJobs])

  function applyStatusFilter(v) { setStatusFilter(v); setPage(0) }
  function applySize(v)         { setSize(v);          setPage(0) }

  // Client-side text + status filter within current page
  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchText   = !q || j.label?.toLowerCase().includes(q) || j.emailTemplateName?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || j.status === statusFilter
    return matchText && matchStatus
  })

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleResend(jobId, e) {
    e.stopPropagation()
    try {
      await bulkEmailResend(jobId)
      toast.success('Resend started — failed emails are being retried')
      loadJobs(true)
    } catch (err) { toast.error(err.message) }
  }

  async function handleRetryPending(job, e) {
    e.stopPropagation()
    const n = job.pendingCount ?? 0
    if (!confirm(`Retry ${n.toLocaleString()} pending email(s)? Already-sent emails will NOT be duplicated.`)) return
    try {
      await bulkEmailRetryPending(job.id)
      toast.success(`Retry started — ${n.toLocaleString()} pending email(s) are being sent`)
      loadJobs(true)
    } catch (err) { toast.error(err.message) }
  }

  async function handleCancel(jobId, e) {
    e.stopPropagation()
    if (!confirm('Cancel this job? Emails already sent will not be recalled.')) return
    try {
      await bulkEmailCancelJob(jobId)
      toast.success('Job cancelled')
      loadJobs(true)
    } catch (err) { toast.error(err.message) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Bulk Email' }]} />

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Email Campaigns</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Send templated emails to a list of recipients
          </p>
        </div>
        <button
          onClick={() => navigate('/bulk-email/send')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                     shadow-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Send Bulk Email
        </button>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by campaign or template name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => applyStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                     focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="PARTIAL">Partial</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Clear filters */}
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); applyStatusFilter('') }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors
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

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          {search || statusFilter ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No campaigns match your filters</p>
              <button onClick={() => { setSearch(''); applyStatusFilter('') }}
                className="mt-3 text-sm text-purple-600 hover:underline">
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No bulk email campaigns yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Create your first campaign to get started
              </p>
              <button
                onClick={() => navigate('/bulk-email/send')}
                className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
              >
                Send Bulk Email
              </button>
            </>
          )}
        </div>

      ) : view === 'grid' ? (
        /* ── Grid / Card view ─────────────────────────────────────────────── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-5">
            {filtered.map(job => {
              const isActive   = job.status === 'PROCESSING' || job.status === 'PENDING'
              const isTerminal = ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'].includes(job.status)
              const pct = job.totalCount > 0 ? Math.round((job.sentCount / job.totalCount) * 100) : 0
              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/bulk-email/${job.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700
                             shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden"
                >
                  {/* Status colour bar at top */}
                  <div className={`h-1.5 w-full ${STATUS_BAR[job.status] || 'bg-gray-300'}`} />

                  <div className="p-5 flex flex-col flex-1 gap-3">
                    {/* Title + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug truncate">
                          {job.label}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {job.emailTemplateName}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0
                                      ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-500'}`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>}
                        {job.status}
                      </span>
                    </div>

                    {/* Attachment type */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <AttachmentIcon type={job.attachmentType} className="w-3.5 h-3.5 shrink-0" />
                      {ATT_LABEL[job.attachmentType] || 'Email only'}
                    </div>

                    {/* Progress bar */}
                    <ProgressBar job={job} />

                    {/* Counters */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600 dark:text-green-400 font-medium">{job.sentCount} sent</span>
                      {job.failedCount > 0
                        ? <span className="text-red-500 dark:text-red-400 font-medium">{job.failedCount} failed</span>
                        : <span className="text-gray-400">{pct}%</span>}
                      <span className="text-gray-400">of {job.totalCount}</span>
                    </div>

                    {/* ID + date */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2
                                    border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400
                                         bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                          …{job.id?.slice(-6)}
                        </span>
                        <CopyIdButton id={job.id} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{fmtDate(job.createdAt)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/bulk-email/${job.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold
                                   rounded-lg border border-gray-200 dark:border-gray-600
                                   text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        View
                      </button>

                      {(job.status === 'PARTIAL' || job.status === 'FAILED') && (
                        <button
                          onClick={e => handleResend(job.id, e)}
                          title="Resend failed rows"
                          className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30
                                     text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                        </button>
                      )}
                      {job.status === 'CANCELLED' && job.pendingCount > 0 && (
                        <button
                          onClick={e => handleRetryPending(job, e)}
                          title={`Retry ${job.pendingCount} pending`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30
                                     text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={e => handleCancel(job.id, e)}
                          title="Cancel job"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30
                                     text-gray-400 hover:text-red-500 transition-colors"
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
            page={page} totalPages={totalPages} totalElements={totalElements}
            size={size} onPage={setPage} onSize={applySize}
          />
        </div>

      ) : (
        /* ── Table view ───────────────────────────────────────────────────── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700
                        overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Attachment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(job => {
                const isActive = job.status === 'PROCESSING' || job.status === 'PENDING'
                const pct = job.totalCount > 0 ? Math.round((job.sentCount / job.totalCount) * 100) : 0
                return (
                  <tr key={job.id}
                    onClick={() => navigate(`/bulk-email/${job.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">

                    {/* ID */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300
                                         bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                          …{job.id?.slice(-6)}
                        </span>
                        <CopyIdButton id={job.id} />
                      </div>
                    </td>

                    {/* Campaign */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                        {job.label}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">
                        {job.emailTemplateName}
                      </p>
                    </td>

                    {/* Attachment */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <AttachmentIcon type={job.attachmentType} className="w-3.5 h-3.5 shrink-0" />
                        {ATT_LABEL[job.attachmentType] || 'Email only'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                      text-xs font-semibold ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-500'}`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>}
                        {job.status}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar job={job} />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {job.sentCount}/{job.totalCount}
                          {job.failedCount > 0 && (
                            <span className="text-red-500 ml-1">· {job.failedCount}✗</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {fmtDate(job.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => navigate(`/bulk-email/${job.id}`)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30
                                     text-gray-400 hover:text-purple-600 transition-colors"
                          title="View details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        {(job.status === 'PARTIAL' || job.status === 'FAILED') && (
                          <button onClick={e => handleResend(job.id, e)}
                            className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30
                                       text-gray-400 hover:text-orange-600 transition-colors"
                            title={`Resend ${job.failedCount} failed`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                          </button>
                        )}
                        {job.status === 'CANCELLED' && job.pendingCount > 0 && (
                          <button onClick={e => handleRetryPending(job, e)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30
                                       text-gray-400 hover:text-blue-600 transition-colors"
                            title={`Retry ${job.pendingCount} pending`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </button>
                        )}
                        {isActive && (
                          <button onClick={e => handleCancel(job.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30
                                       text-gray-400 hover:text-red-500 transition-colors"
                            title="Cancel job">
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
            page={page} totalPages={totalPages} totalElements={totalElements}
            size={size} onPage={setPage} onSize={applySize}
          />
        </div>
      )}
    </div>
  )
}
