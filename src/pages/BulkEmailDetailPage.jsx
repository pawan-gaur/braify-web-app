/**
 * Bulk Email Job Detail Page
 *
 * Shows full job information: header card, tab bar with four sections:
 *   Overview    — timeline, config summary, counters
 *   Recipients  — per-row status table
 *   Attachment  — attachment configuration details
 *   Audit Log   — chronological event trail
 *
 * Route: /bulk-email/:id
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  bulkEmailGetJob,
  bulkEmailGetStatus,
  bulkEmailGetAudit,
  bulkEmailResend,
  bulkEmailRetryPending,
  bulkEmailCancelJob,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { fmtDateTimeGB as fmtDate } from '../utils/date'

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  PENDING:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  PARTIAL:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  FAILED:     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED:  'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const ATT_LABELS = {
  NONE:         { path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',  text: 'Email only'   },
  UPLOAD:       { path: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',                     text: 'Uploaded PDF'  },
  PDF_TEMPLATE: { path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', text: 'PDF Template'  },
  EXTERNAL_API: { path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'External API'  },
}

const AUDIT_ICONS = {
  JOB_CREATED:          { path: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',                                         color: 'text-purple-500' },
  PROCESSING_STARTED:   { path: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-500'   },
  JOB_COMPLETED:        { path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                        color: 'text-green-500'  },
  JOB_PARTIAL:          { path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-orange-500' },
  JOB_FAILED:           { path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',                                color: 'text-red-500'    },
  JOB_CANCELLED:        { path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',        color: 'text-gray-400'   },
  RESEND_CREATED:       { path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'text-indigo-500' },
}

const POLL_MS = 3000
const RECIP_PAGE_SIZE = 100   // recipients rendered per page (jobs can have thousands)

// ── Helpers ────────────────────────────────────────────────────────────────────
function Spinner() {
  return <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BulkEmailDetailPage() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const toast         = useToast()

  const [job,          setJob]          = useState(null)
  const [audit,        setAudit]        = useState([])
  const [auditLoaded,  setAuditLoaded]  = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState('overview')
  const [recipPage,    setRecipPage]    = useState(0)   // recipients tab pagination
  const pollRef = useRef(null)

  const TERMINAL = ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED']

  // Merge lightweight status counters into job state without overwriting
  // fields that were only loaded by the full getJob call (e.g. rows[]).
  const applyStatus = (prev, status) => prev
    ? { ...prev,
        status:       status.status,
        sentCount:    status.sentCount,
        failedCount:  status.failedCount,
        pendingCount: status.pendingCount,
        totalCount:   status.totalCount }
    : prev

  // ── Initial load — full job + audit in parallel ────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [j, a] = await Promise.all([
          bulkEmailGetJob(id),
          bulkEmailGetAudit(id).catch(() => []),
        ])
        setJob(j)
        setAudit(a || [])
        setAuditLoaded(true)
      } catch (e) {
        toast.error(e.message)
        navigate('/bulk-email')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Polling — lightweight status only (counters + status field) ────────
  // Replaces the old full-job poll that was loading ~5 MB of rows every 3 s.
  // When the job reaches a terminal state the poll fires one final full reload
  // so the Recipients tab and audit trail reflect the completed picture.
  useEffect(() => {
    clearInterval(pollRef.current)
    if (!job || TERMINAL.includes(job.status)) return

    pollRef.current = setInterval(async () => {
      try {
        const status = await bulkEmailGetStatus(id)
        setJob(prev => applyStatus(prev, status))

        if (TERMINAL.includes(status.status)) {
          clearInterval(pollRef.current)
          // One final full reload so rows + audit are up to date
          const [j, a] = await Promise.all([
            bulkEmailGetJob(id),
            bulkEmailGetAudit(id).catch(() => []),
          ])
          setJob(j)
          setAudit(a || [])
          setAuditLoaded(true)
        }
      } catch { /* ignore transient network errors */ }
    }, POLL_MS)

    return () => clearInterval(pollRef.current)
  }, [job?.status, id])

  // ── Lazy audit load — only fetch when Audit tab is first opened ────────
  useEffect(() => {
    if (tab !== 'audit' || auditLoaded) return
    bulkEmailGetAudit(id)
      .then(a => { setAudit(a || []); setAuditLoaded(true) })
      .catch(() => {})
  }, [tab, auditLoaded, id])

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleResend() {
    try {
      await bulkEmailResend(id)
      const [j, a] = await Promise.all([
        bulkEmailGetJob(id),
        bulkEmailGetAudit(id).catch(() => []),
      ])
      setJob(j)
      setAudit(a || [])
      setAuditLoaded(true)
      toast.success(`Resend started — ${j.pendingCount} failed email(s) are being retried`)
    } catch (e) { toast.error(e.message) }
  }

  async function handleRetryPending() {
    const n = job.pendingCount ?? 0
    if (!confirm(`Retry ${n.toLocaleString()} pending email(s)? Already-sent emails will NOT be duplicated.`)) return
    try {
      await bulkEmailRetryPending(id)
      const [j, a] = await Promise.all([
        bulkEmailGetJob(id),
        bulkEmailGetAudit(id).catch(() => []),
      ])
      setJob(j)
      setAudit(a || [])
      setAuditLoaded(true)
      toast.success(`Retry started — ${n.toLocaleString()} pending email(s) are being sent`)
    } catch (e) { toast.error(e.message) }
  }

  async function handleCancel() {
    if (!confirm('Cancel this job? Emails already sent will NOT be recalled.')) return
    try {
      const updated = await bulkEmailCancelJob(id)
      setJob(updated)
      toast.success('Job cancelled')
    } catch (e) { toast.error(e.message) }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }
  if (!job) return null

  const isActive   = job.status === 'PENDING' || job.status === 'PROCESSING'
  const isTerminal = ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'].includes(job.status)
  const pct        = job.totalCount > 0 ? Math.round((job.sentCount / job.totalCount) * 100) : 0
  const att        = ATT_LABELS[job.attachmentType] || ATT_LABELS.NONE

  const TABS = [
    { key: 'overview',    label: 'Overview'                        },
    { key: 'recipients',  label: `Recipients (${job.totalCount})`   },
    { key: 'attachment',  label: 'Attachment'                       },
    { key: 'audit',       label: `Audit Log (${audit.length})`       },
  ]

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Dashboard',     to: '/' },
        { label: 'Bulk Email',    to: '/bulk-email' },
        { label: job.label || 'Job Detail' },
      ]} />

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="mt-3 mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Left: title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {job.label}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-500'}`}>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>}
                {job.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {job.emailTemplateName}
              {job.emailTemplateSubject && (
                <span className="ml-2 text-gray-400">· {job.emailTemplateSubject}</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">Created {fmtDate(job.createdAt)}</p>
          </div>

          {/* Right: counters + actions */}
          <div className="flex flex-col items-end gap-3">
            {/* Counter chips */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{job.sentCount}</p>
                <p className="text-[11px] text-gray-500">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">{job.failedCount}</p>
                <p className="text-[11px] text-gray-500">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{job.pendingCount}</p>
                <p className="text-[11px] text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{job.totalCount}</p>
                <p className="text-[11px] text-gray-500">Total</p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {(job.status === 'PARTIAL' || job.status === 'FAILED') && (
                <button
                  onClick={handleResend}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Resend {job.failedCount} Failed
                </button>
              )}
              {job.status === 'CANCELLED' && job.pendingCount > 0 && (
                <button
                  onClick={handleRetryPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Retry {(job.pendingCount ?? 0).toLocaleString()} Pending
                </button>
              )}
              {isActive && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Cancel Job
                </button>
              )}
              <button
                onClick={() => navigate('/bulk-email/send')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                New Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{isActive ? 'Sending…' : `${pct}% complete`}</span>
            <span>{job.sentCount} / {job.totalCount}</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                job.failedCount > 0 && job.sentCount === 0 ? 'bg-red-400'
                : job.failedCount > 0 ? 'bg-orange-400'
                : 'bg-green-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${tab === t.key
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ───────────────────────────────────────────────────── */}

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-4">Campaign Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Email Template"  value={job.emailTemplateName} />
              <InfoItem label="Subject"         value={job.emailTemplateSubject || '—'} />
              <InfoItem label="Attachment"      value={att.text} />
              <InfoItem label="Total Recipients" value={String(job.totalCount)} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <StatCard value={job.sentCount}   label="Sent"    color="green" />
              <StatCard value={job.failedCount} label="Failed"  color="red"   />
              <StatCard value={job.pendingCount} label="Pending" color="gray"  />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-4">Timeline</h2>
            <div className="space-y-4">
              <TimelineItem
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                label="Job Created"
                time={job.createdAt}
                active
              />
              <TimelineItem
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                label="Processing Started"
                time={job.startedAt}
                active={!!job.startedAt}
              />
              <TimelineItem
                icon={isTerminal
                  ? job.status === 'COMPLETED'
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    : job.status === 'CANCELLED'
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                }
                label={isTerminal ? `Completed (${job.status})` : 'Awaiting completion…'}
                time={job.completedAt}
                active={!!job.completedAt}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── RECIPIENTS ── */}
      {tab === 'recipients' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {!job.rows || job.rows.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
              </div>
              <p className="text-sm">No recipient data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">#</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Email</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Name</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Info</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {job.rows.slice(recipPage * RECIP_PAGE_SIZE, (recipPage + 1) * RECIP_PAGE_SIZE).map(r => (
                    <tr key={r.rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{r.rowIndex + 1}</td>
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200 font-medium max-w-[200px] truncate">
                        {r.recipientEmail}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell max-w-[160px] truncate">
                        {r.recipientName || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'SENT'    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : r.status === 'FAILED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {r.status === 'SENT'
                            ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                            : r.status === 'FAILED'
                            ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                            : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          }
                          {' '}{r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell max-w-[200px] truncate text-xs">
                        {r.error || (r.messageId ? `ID: ${r.messageId}` : '—')}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                        {r.sentAt ? fmtDate(r.sentAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {job.rows.length > RECIP_PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
                  <span>
                    {(recipPage * RECIP_PAGE_SIZE + 1).toLocaleString()}–
                    {Math.min((recipPage + 1) * RECIP_PAGE_SIZE, job.rows.length).toLocaleString()} of {job.rows.length.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:border-primary"
                      disabled={recipPage === 0}
                      onClick={() => setRecipPage(p => Math.max(0, p - 1))}
                    >Prev</button>
                    <button
                      className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:border-primary"
                      disabled={(recipPage + 1) * RECIP_PAGE_SIZE >= job.rows.length}
                      onClick={() => setRecipPage(p => p + 1)}
                    >Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ATTACHMENT ── */}
      {tab === 'attachment' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-5">Attachment Configuration</h2>

          {job.attachmentType === 'NONE' || !job.attachmentType ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600 dark:text-gray-300">No attachment</p>
              <p className="text-sm mt-1">Emails were sent without a PDF attachment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={att.path}/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{att.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {job.attachmentType === 'UPLOAD'       && 'Same PDF file sent to all recipients'}
                    {job.attachmentType === 'PDF_TEMPLATE' && 'PDF generated per-recipient from a template'}
                    {job.attachmentType === 'EXTERNAL_API' && 'PDF fetched per-recipient from an external API'}
                  </p>
                </div>
              </div>

              {job.attachmentType === 'UPLOAD' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="File Name" value={job.uploadedPdfName || 'attachment.pdf'} />
                  <InfoItem label="Type"      value="Static PDF (same for all recipients)" />
                </div>
              )}

              {job.attachmentType === 'PDF_TEMPLATE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="PDF Template" value={job.pdfTemplateName || '—'} />
                  <InfoItem label="Type"         value="Per-recipient generated PDF" />
                </div>
              )}

              {job.attachmentType === 'EXTERNAL_API' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem label="HTTP Method" value={job.externalApiMethod || 'GET'} />
                    <InfoItem label="Type"        value="Per-recipient API fetch" />
                  </div>
                  {job.externalApiUrl && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">API URL</p>
                      <code className="block w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
                        {job.externalApiUrl}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT LOG ── */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-5">Audit Log</h2>

          {audit.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-sm">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-5 pl-12">
                {audit.map((ev, i) => {
                  const ei = AUDIT_ICONS[ev.type] || { path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-gray-400' }
                  return (
                    <div key={i} className="relative">
                      {/* Dot on the timeline */}
                      <div className={`absolute -left-[2.6rem] w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center ${ei.color}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ei.path}/>
                        </svg>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <p className={`text-sm font-semibold ${ei.color}`}>
                            {ev.type?.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(ev.timestamp)}</p>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small helper components ────────────────────────────────────────────────────
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-words">{value || '—'}</p>
    </div>
  )
}

function StatCard({ value, label, color }) {
  const colorClass = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red:   'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
    gray:  'bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300',
  }[color] || 'bg-gray-50 text-gray-600'
  return (
    <div className={`rounded-xl p-3 text-center ${colorClass}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  )
}

function TimelineItem({ icon, label, time, active }) {
  return (
    <div className={`flex items-start gap-3 ${active ? '' : 'opacity-40'}`}>
      <div className="w-5 h-5 shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
        {time ? (
          <p className="text-xs text-gray-500 mt-0.5">{fmtDate(time)}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5 italic">Not yet</p>
        )}
      </div>
    </div>
  )
}
