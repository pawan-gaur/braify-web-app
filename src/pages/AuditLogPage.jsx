import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuditLogs } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import { useAuth, ROLES } from '../context/AuthContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Audit Log' },
]

/* ── Action badge colours ── */
const ACTION_BADGE = {
  CREATED:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATED:         'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  DELETED:         'bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400',
  RESTORED:        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PASSWORD_CHANGED:'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  AVATAR_UPDATED:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DEACTIVATED:     'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  ACTIVATED:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SESSION_REVOKED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SENT:            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

/* ── Action icon paths ── */
const ACTION_ICON = {
  CREATED:         'M12 4v16m8-8H4',
  UPDATED:         'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  DELETED:         'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  RESTORED:        'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  PASSWORD_CHANGED:'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  AVATAR_UPDATED:  'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  DEACTIVATED:     'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  ACTIVATED:       'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  SESSION_REVOKED: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  SENT:            'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
}

/* ── Resource type labels ── */
const RESOURCE_LABEL = {
  TEMPLATE:       { label: 'PDF Template',   color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
  EMAIL_TEMPLATE: { label: 'Email Template', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' },
  USER:           { label: 'User / Profile', color: 'bg-sky-50    text-sky-600    dark:bg-sky-900/20    dark:text-sky-400' },
}

/* ── All filter actions ── */
const ALL_ACTIONS = [
  'ALL', 'CREATED', 'UPDATED', 'DELETED', 'RESTORED',
  'PASSWORD_CHANGED', 'AVATAR_UPDATED', 'DEACTIVATED', 'ACTIVATED', 'SESSION_REVOKED', 'SENT',
]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

/* ── Scope description shown below the header ── */
function scopeLabel(role) {
  switch (role) {
    case ROLES.PLATFORM_ADMIN: return 'Showing all activity across the entire platform.'
    case ROLES.ORG_ADMIN:      return 'Showing all activity within your organization.'
    case ROLES.ADMIN:          return 'Showing activity by Admin and User roles in your organization.'
    default:                   return 'Showing only your own activity.'
  }
}

export default function AuditLogPage() {
  useDocumentTitle('Audit Log')
  const navigate   = useNavigate()
  const toast      = useToast()
  const { user: me } = useAuth()

  const [data,    setData]    = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')

  const SIZE = 20

  useEffect(() => {
    setLoading(true)
    setPage(0)
  }, [filter])

  useEffect(() => {
    setLoading(true)
    getAuditLogs(page, SIZE)
      .then(setData)
      .catch(err => toast.error(err.message || 'Could not load audit log.'))
      .finally(() => setLoading(false))
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = filter === 'ALL'
    ? data.content
    : data.content.filter(e => e.action === filter)

  /* Determine which actions are relevant to the user's role */
  const visibleActions = me?.role === ROLES.USER
    ? ['ALL', 'CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'PASSWORD_CHANGED', 'AVATAR_UPDATED', 'SENT']
    : ALL_ACTIONS

  /* Can the user navigate to a template builder from this log entry? */
  const canOpenTemplate = (entry) =>
    (entry.resourceType === 'TEMPLATE' || entry.resourceType === 'EMAIL_TEMPLATE') &&
    entry.action !== 'DELETED'

  const openResource = (entry) => {
    if (entry.resourceType === 'EMAIL_TEMPLATE') {
      navigate(`/email-builder/${entry.templateId}`)
    } else if (entry.resourceType === 'TEMPLATE') {
      navigate(`/builder/${entry.templateId}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">{scopeLabel(me?.role)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-indigo text-xs">{data.totalElements} total events</span>
        </div>
      </div>

      {/* Action filter pills */}
      <div className="flex gap-1.5 mb-5 flex-wrap mt-4">
        {visibleActions.map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
              filter === a
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading audit log…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-sm">No events found{filter !== 'ALL' ? ` for "${filter.replace(/_/g, ' ')}"` : ''}.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Resource</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Version</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Performed By</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Timestamp</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {displayed.map(entry => {
                const resInfo = RESOURCE_LABEL[entry.resourceType] || { label: entry.resourceType, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">

                    {/* Action badge with icon */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap
                        ${ACTION_BADGE[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={ACTION_ICON[entry.action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}/>
                        </svg>
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Resource name + ID */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-200 leading-tight max-w-[180px] truncate">
                        {entry.templateName || '—'}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-[180px]">
                        {entry.templateId}
                      </p>
                    </td>

                    {/* Resource type chip */}
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${resInfo.color}`}>
                        {resInfo.label}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="px-5 py-3.5">
                      {entry.versionNumber > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg
                                         text-xs font-bold bg-indigo-50 text-indigo-600
                                         dark:bg-indigo-900/20 dark:text-indigo-400">
                          v{entry.versionNumber}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>

                    {/* Performed by */}
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {entry.performedBy || 'system'}
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(entry.timestamp)}
                    </td>

                    {/* Open resource button */}
                    <td className="px-4 py-3.5 text-right">
                      {canOpenTemplate(entry) && (
                        <button
                          onClick={() => openResource(entry)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity
                                     text-xs px-2.5 py-1 rounded-lg border border-gray-200
                                     dark:border-gray-600 text-gray-500 dark:text-gray-400
                                     hover:border-primary hover:text-primary"
                        >
                          Open
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Page {page + 1} of {data.totalPages} · {data.totalElements} events
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-ghost btn-sm disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-ghost btn-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
