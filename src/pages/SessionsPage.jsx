import { useState, useEffect, useCallback } from 'react'
import { getSessions, revokeSession, revokeOtherSessions } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import { useAuth, ROLES } from '../context/AuthContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Active Sessions' },
]

const ROLE_BADGE = {
  PLATFORM_ADMIN: 'bg-violet-100 text-violet-700',
  ORG_ADMIN:      'bg-indigo-100 text-indigo-700',
  ADMIN:          'bg-blue-100   text-blue-700',
  USER:           'bg-gray-100   text-gray-600',
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeSince(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/** Parse user-agent into a short human-readable label */
function parseDevice(ua) {
  if (!ua) return 'Unknown device'
  let browser = 'Browser'
  let os      = ''
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox'))  browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg'))      browser = 'Edge'
  else if (ua.includes('OPR'))      browser = 'Opera'

  if (ua.includes('Windows'))       os = 'Windows'
  else if (ua.includes('Mac'))      os = 'macOS'
  else if (ua.includes('Linux'))    os = 'Linux'
  else if (ua.includes('Android'))  os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return os ? `${browser} on ${os}` : browser
}

/* ── Device icon ── */
function DeviceIcon({ ua }) {
  const isMobile = ua && (ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad'))
  const d = isMobile
    ? 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
    : 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/>
    </svg>
  )
}

/* ── User avatar ── */
function Avatar({ name, email, size = 'sm' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500']
  const bg = colors[(email?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`${s} ${bg} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  )
}

export default function SessionsPage() {
  useDocumentTitle('Active Sessions')
  const toast = useToast()
  const { user: me } = useAuth()
  const isPlatformAdmin = me?.role === ROLES.PLATFORM_ADMIN
  const isUser          = me?.role === ROLES.USER

  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [revoking,  setRevoking]  = useState(null)   // id being revoked
  const [revokeAll, setRevokeAll] = useState(false)

  /* Group filter (for Platform Admin / Org Admin) */
  const [filter, setFilter] = useState('all')  // 'all' | 'mine'

  const load = useCallback(() => {
    setLoading(true)
    getSessions()
      .then(setSessions)
      .catch(err => toast.error(err.message || 'Could not load sessions.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this session? The user will be signed out immediately.')) return
    setRevoking(id)
    try {
      await revokeSession(id)
      toast.success('Session revoked.')
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to revoke session.')
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Sign out all your other active sessions?')) return
    setRevokeAll(true)
    try {
      const res = await revokeOtherSessions()
      toast.success(`${res.revoked} session${res.revoked === 1 ? '' : 's'} revoked.`)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to revoke sessions.')
    } finally {
      setRevokeAll(false)
    }
  }

  const displayed = filter === 'mine'
    ? sessions.filter(s => s.userId === me?.id)
    : sessions

  const mySessions    = sessions.filter(s => s.userId === me?.id)
  const otherSessions = sessions.filter(s => s.userId !== me?.id)
  const hasOthers     = mySessions.filter(s => !s.current).length > 0

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Active Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isUser
              ? 'Manage your active login sessions.'
              : 'Monitor and manage active login sessions based on your role.'}
          </p>
        </div>

        {/* "Sign out everywhere else" button — shown for all roles */}
        {hasOthers && (
          <button
            onClick={handleRevokeAll}
            disabled={revokeAll}
            className="btn btn-outline gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            {revokeAll ? (
              <Spinner />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            )}
            Sign out everywhere else
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Active" value={sessions.length} color="indigo" />
        <StatCard label="My Sessions"  value={mySessions.length} color="violet" />
        {!isUser && <StatCard label="Others' Sessions" value={otherSessions.length} color="sky" />}
        <StatCard label="Current"      value={sessions.filter(s => s.current).length} color="emerald" />
      </div>

      {/* Filter tabs — only shown when there are multiple users' sessions */}
      {!isUser && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5 gap-1">
          {[
            { id: 'all',  label: 'All Sessions' },
            { id: 'mine', label: 'My Sessions'  },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${filter === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {t.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold
                ${filter === t.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                {t.id === 'all' ? sessions.length : mySessions.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Session list */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <Spinner className="h-5 w-5 text-primary" />
            Loading sessions…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm">No active sessions found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Device</th>
                {!isUser && <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">User</th>}
                {isPlatformAdmin && <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Organization</th>}
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">IP Address</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Last Active</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Signed In</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Expires</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {displayed.map(s => (
                <tr key={s.id}
                  className={`transition-colors group
                    ${s.current
                      ? 'bg-indigo-50/40 dark:bg-indigo-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>

                  {/* Device */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                        ${s.current
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        <DeviceIcon ua={s.deviceInfo} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                          {parseDevice(s.deviceInfo)}
                          {s.current && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[180px] mt-0.5" title={s.deviceInfo}>
                          {s.deviceInfo || 'Unknown agent'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  {!isUser && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.userName} email={s.userEmail} />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{s.userName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ROLE_BADGE[s.userRole] || 'bg-gray-100 text-gray-600'}`}>
                              {s.userRole?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Organization */}
                  {isPlatformAdmin && (
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {s.organizationName || s.organizationId || <span className="text-gray-300">—</span>}
                    </td>
                  )}

                  {/* IP */}
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                      {s.ipAddress || '—'}
                    </code>
                  </td>

                  {/* Last active */}
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    <span title={fmtDateTime(s.lastUsedAt)}>{timeSince(s.lastUsedAt)}</span>
                  </td>

                  {/* Signed in */}
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {fmtDateTime(s.createdAt)}
                  </td>

                  {/* Expires */}
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {fmtDateTime(s.expiresAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    {!s.current && (
                      <button
                        onClick={() => handleRevoke(s.id)}
                        disabled={revoking === s.id}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200
                                   text-red-400 hover:bg-red-50 hover:border-red-400
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                   opacity-0 group-hover:opacity-100"
                      >
                        {revoking === s.id ? <Spinner /> : 'Revoke'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Sessions automatically expire after 24 hours of inactivity.
        Revoking a session signs the user out immediately.
      </p>
    </div>
  )
}

/* ── Mini components ── */
function StatCard({ label, value, color }) {
  const colors = {
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    violet:  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800',
    sky:     'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 ${colors[color] || colors.indigo}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
    </div>
  )
}

function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}
