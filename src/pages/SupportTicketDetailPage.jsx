/**
 * One support ticket: what failed, where, for whom; every occurrence (90 days); status,
 * assignee and internal notes. Platform Admin only.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  supportTicketGet, supportTicketOccurrences, supportTicketSetStatus, supportTicketAssign,
  supportTicketAddNote, supportTicketAssignees,
} from '../services/api'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { useToast } from '../context/ToastContext'
import { fmtDateTime, fmtRelative } from '../utils/date'
import { TICKET_STATUSES, STATUS_META, ACTOR_LABEL, ROLE_LABEL, shortType } from '../utils/supportTickets'
import StatusBadge from '../components/support/TicketStatusBadge'

const MAX_NOTE = 5000

export default function SupportTicketDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState(null)
  const [occ, setOcc] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [occPage, setOccPage] = useState(0)
  const [occLoading, setOccLoading] = useState(true)
  const [assignees, setAssignees] = useState([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [showStack, setShowStack] = useState(true)

  const load = useCallback(() => {
    setError(null)
    supportTicketGet(id).then(setTicket).catch(err => setError(err))
  }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => { supportTicketAssignees().then(setAssignees).catch(() => {}) }, [])

  useEffect(() => {
    setOccLoading(true)
    supportTicketOccurrences(id, { page: occPage, size: 20 })
      .then(setOcc)
      .catch(() => setOcc({ content: [], totalElements: 0, totalPages: 0 }))
      .finally(() => setOccLoading(false))
  }, [id, occPage])

  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      const updated = await fn()
      setTicket(updated)
      if (okMsg) toast.success(okMsg)
      return true
    } catch (err) {
      toast.error(err.message)
      if (err.status === 409) load()   // changed meanwhile (e.g. reopened) — show the current state
      return false
    } finally {
      setBusy(false)
    }
  }

  const setStatus = (status) => {
    if (status === ticket.status) return
    run(() => supportTicketSetStatus(id, status), `Marked as ${STATUS_META[status].label.toLowerCase()}.`)
  }
  const assign = (assigneeId) => run(() => supportTicketAssign(id, assigneeId), assigneeId ? 'Assigned.' : 'Unassigned.')
  const addNote = async (e) => {
    e.preventDefault()
    const text = note.trim()
    if (!text) return
    if (await run(() => supportTicketAddNote(id, text), 'Note added.')) setNote('')
  }

  const copy = (text, what) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${what} copied.`)).catch(() => toast.error('Could not copy.'))
  }

  const crumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Support tickets', to: '/support-tickets' },
    { label: ticket ? `#${ticket.number}` : 'Ticket' }]

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Breadcrumbs items={crumbs} />
        <div className="card p-10 mt-4 text-center">
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {error.status === 404 ? 'This ticket no longer exists.' : 'Could not load the ticket.'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {error.status === 404 ? 'Resolved and ignored tickets are deleted 180 days after closing.' : error.message}
          </p>
        </div>
      </div>
    )
  }
  if (!ticket) {
    return <div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
  }

  const isJob = ticket.kind === 'JOB'
  const activity = [...(ticket.activity || [])].reverse()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumbs items={crumbs} />

      {/* Header */}
      <div className="mt-4 mb-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-gray-500">#{ticket.number}</span>
            <StatusBadge status={ticket.status} />
            {ticket.reopenCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                Reopened ×{ticket.reopenCount}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1 break-words">{ticket.feature}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono break-all">
            {isJob ? `Background job: ${ticket.jobName}` : `${ticket.httpMethod || ''} ${ticket.endpoint || ''}`}
            {ticket.httpStatus ? ` → ${ticket.httpStatus}` : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div>
            <label className="form-label" htmlFor="ticket-status">Status</label>
            <div id="ticket-status" className="flex gap-1 bg-ink-8 dark:bg-gray-800 rounded-xl p-1" role="radiogroup" aria-label="Status">
              {TICKET_STATUSES.map(s => (
                <button key={s.value} role="radio" aria-checked={ticket.status === s.value} disabled={busy}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all disabled:opacity-60
                    ${ticket.status === s.value ? 'bg-white dark:bg-gray-700 text-ink dark:text-white shadow-sm' : 'text-ink-3 dark:text-gray-400 hover:text-ink'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="form-label" htmlFor="ticket-assignee">Assignee</label>
            <select id="ticket-assignee" className="form-select" value={ticket.assigneeId || ''} disabled={busy}
              onChange={e => assign(e.target.value)}>
              <option value="">Unassigned</option>
              {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              {ticket.assigneeId && !assignees.some(a => a.id === ticket.assigneeId) && (
                <option value={ticket.assigneeId}>{ticket.assigneeName} (no longer a Platform Admin)</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Facts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Stat label="Occurrences" value={(ticket.occurrenceCount ?? 0).toLocaleString()} />
        <Stat label="Affected" value={`${(ticket.affectedCount ?? 0).toLocaleString()}${ticket.affectedCount >= 500 ? '+' : ''}`}
          hint="Distinct users, signers or API keys" />
        <Stat label="First seen" value={fmtRelative(ticket.firstSeenAt)} title={fmtDateTime(ticket.firstSeenAt)} />
        <Stat label="Last seen" value={fmtRelative(ticket.lastSeenAt)} title={fmtDateTime(ticket.lastSeenAt)} />
        <Stat label="Latest reference" value={ticket.lastReference} mono onCopy={() => copy(ticket.lastReference, 'Reference')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {/* Error */}
          <section className="card p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Error</h2>
            <p className="font-mono text-sm text-rose-600 dark:text-rose-400 break-all" title={ticket.errorType}>{shortType(ticket.errorType)}
              <span className="text-gray-400 text-xs ml-2">{ticket.errorType}</span></p>
            <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{ticket.message || '—'}</p>
            {ticket.topFrame && (
              <p className="mt-3 text-xs text-gray-500">Failed in <span className="font-mono text-gray-700 dark:text-gray-300 break-all">{ticket.topFrame}</span></p>
            )}
            <p className="mt-1 text-xs text-gray-500">Most recently: {ticket.lastActorLabel || '—'}</p>

            {ticket.stackTrace && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setShowStack(s => !s)} className="text-xs font-semibold text-brand hover:underline" aria-expanded={showStack}>
                    {showStack ? 'Hide' : 'Show'} stack trace (latest occurrence)
                  </button>
                  <button onClick={() => copy(ticket.stackTrace, 'Stack trace')} className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Copy</button>
                </div>
                {showStack && (
                  <pre className="text-[11px] leading-relaxed font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 overflow-auto max-h-[420px] whitespace-pre text-gray-700 dark:text-gray-300">
                    {ticket.stackTrace}
                  </pre>
                )}
              </div>
            )}
          </section>

          {/* Occurrences */}
          <section className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Occurrences</h2>
              <span className="text-xs text-gray-500" title="The ticket's count includes every occurrence; individual rows are kept 90 days, and during error bursts only a sample (60 an hour) is stored.">
                Kept for 90 days · {(occ.totalElements ?? 0).toLocaleString()} of {(ticket.occurrenceCount ?? 0).toLocaleString()} stored
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-y border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-2.5">When</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Who</th>
                    <th className="px-4 py-2.5">Organization</th>
                    <th className="px-4 py-2.5">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {occLoading ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center">
                      <div className="inline-block w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    </td></tr>
                  ) : occ.content.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No occurrences in the last 90 days.</td></tr>
                  ) : occ.content.map(o => (
                    <tr key={o.id} className="border-b border-gray-50 dark:border-gray-700/60 align-top">
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-300" title={fmtDateTime(o.occurredAt)}>{fmtDateTime(o.occurredAt)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{o.reference}</td>
                      <td className="px-4 py-2.5 max-w-[240px]">
                        <div className="text-gray-800 dark:text-gray-200 truncate" title={o.userEmail || ''}>
                          {o.userName || o.userEmail || (o.actorType === 'API_KEY' ? `API key "${o.apiKeyName || '?'}"` : ACTOR_LABEL[o.actorType] || '—')}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {[ACTOR_LABEL[o.actorType], o.role && ROLE_LABEL[o.role], o.userName && o.userEmail].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{o.orgName || o.orgId || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[220px]">
                        {o.documentTitle && <div className="truncate" title={o.documentTitle}>Document: {o.documentTitle}</div>}
                        {o.jobName && <div className="truncate">Job: {o.jobName}</div>}
                        {o.message && o.message !== ticket.message && <div className="truncate text-gray-400" title={o.message}>{o.message}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {occ.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-500">
                <span>Page {occPage + 1} of {occ.totalPages} · {occ.totalElements.toLocaleString()} stored</span>
                <div className="flex gap-1">
                  <button disabled={occPage <= 0} onClick={() => setOccPage(p => p - 1)}
                    className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40">Prev</button>
                  <button disabled={occPage >= occ.totalPages - 1} onClick={() => setOccPage(p => p + 1)}
                    className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Notes & history */}
        <aside className="card p-5 h-fit">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Notes &amp; history</h2>
          <form onSubmit={addNote} className="mb-4">
            <label htmlFor="ticket-note" className="sr-only">Internal note</label>
            <textarea id="ticket-note" className="form-input min-h-[88px]" maxLength={MAX_NOTE} value={note}
              onChange={e => setNote(e.target.value)} placeholder="Internal note — cause, fix, release…" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-gray-400">Visible to Platform Admins only</span>
              <button type="submit" disabled={busy || !note.trim()} className="btn btn-primary btn-sm">Add note</button>
            </div>
          </form>
          <ol className="space-y-3">
            {activity.map(a => <ActivityItem key={a.id || a.at} a={a} />)}
          </ol>
        </aside>
      </div>
    </div>
  )
}

function Stat({ label, value, hint, title, mono, onCopy }) {
  return (
    <div className="card p-4 min-w-0" title={title || hint}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-base font-bold text-gray-900 dark:text-white truncate ${mono ? 'font-mono text-sm' : ''}`}>
        {value || '—'}
        {onCopy && value && (
          <button onClick={onCopy} className="ml-2 text-[11px] font-semibold text-brand hover:underline align-middle" aria-label={`Copy ${label}`}>Copy</button>
        )}
      </div>
    </div>
  )
}

function ActivityItem({ a }) {
  const who = a.byName || 'System'
  const st = s => STATUS_META[s]?.label || s
  let text
  switch (a.type) {
    case 'CREATED':  text = <>Ticket raised automatically</>; break
    case 'REOPENED': text = <>Reopened — the error happened again</>; break
    case 'STATUS':   text = <><b>{who}</b> changed status {st(a.from)} → {st(a.to)}</>; break
    case 'ASSIGNED': text = a.to ? <><b>{who}</b> assigned to {a.to}</> : <><b>{who}</b> removed the assignee</>; break
    case 'NOTE':     text = <><b>{who}</b> added a note</>; break
    default:         text = a.type
  }
  return (
    <li className="text-xs">
      <div className="text-gray-700 dark:text-gray-300">{text}</div>
      {a.type === 'NOTE' && (
        <p className="mt-1 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{a.text}</p>
      )}
      {a.type !== 'NOTE' && a.text && a.type !== 'CREATED' && a.type !== 'REOPENED' && <p className="text-gray-500">{a.text}</p>}
      {(a.type === 'CREATED' || a.type === 'REOPENED') && a.text && <p className="text-gray-400">{a.text.replace(/^.*\(reference (ERR-\w+)\)$/, 'Reference $1')}</p>}
      <div className="text-[11px] text-gray-400 mt-0.5" title={fmtDateTime(a.at)}>{fmtRelative(a.at)}</div>
    </li>
  )
}
