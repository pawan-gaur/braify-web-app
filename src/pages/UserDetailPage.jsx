import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getUser, getUserSummary, getOrganizations, enableUser, disableUser, resendInvite } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { listUrl } from '../hooks/useUrlState'
import UserFormModal from '../components/users/UserFormModal'
import {
  ProfileSidebar, ProfileOverview, ActivityTimeline, UnderlineTabs, StatusPill,
  ROLE_LABEL, PROFILE_ICONS as I, Ico,
} from '../components/profile/ProfileParts'
import { FEATURES } from '../config/features'
import { fmtDate } from '../utils/date'

const RANK = { PLATFORM_ADMIN: 4, ORG_ADMIN: 3, ADMIN: 2, USER: 1 }

/**
 * /users/:id — profile of another user (Admin+). Same layout as /profile, read-only, with the
 * management actions the Users list offers (edit, resend invite, enable / disable).
 */
export default function UserDetailPage() {
  const { id } = useParams()
  const { user: me, hasFeature } = useAuth()
  const toast = useToast()
  const isPlatformAdmin = me?.role === ROLES.PLATFORM_ADMIN

  const [user, setUser]       = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError]     = useState(null)
  const [tab, setTab]         = useState('overview')
  const [editing, setEditing] = useState(false)
  const [orgs, setOrgs]       = useState([])
  const [busy, setBusy]       = useState(false)

  useDocumentTitle(user ? `${user.firstName} ${user.lastName}` : 'User')

  const load = useCallback(() => {
    setError(null)
    getUser(id).then(setUser).catch(e => setError(e))
    getUserSummary(id).then(setSummary).catch(() => setSummary({ unavailable: true }))
  }, [id])

  useEffect(() => { setUser(null); setSummary(null); load() }, [load])
  useEffect(() => { if (isPlatformAdmin) getOrganizations().then(setOrgs).catch(() => {}) }, [isPlatformAdmin])

  if (me && id === me.id) return <Navigate to="/profile" replace />

  const crumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'Users', to: listUrl('/users') },
    { label: user ? `${user.firstName} ${user.lastName}` : '…' },
  ]

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={crumbs} />
        <div className="card mt-6 text-center py-16">
          <p className="text-sm text-ink-3">
            {error.status === 403 ? "You don't have access to this user." : error.status === 404 ? 'This user no longer exists.' : error.message}
          </p>
          <Link to={listUrl('/users')} className="btn btn-outline btn-sm mt-4">Back to users</Link>
        </div>
      </div>
    )
  }

  // Same rule as the backend: Platform Admin manages anyone, others only lower roles.
  const canManage = !!user && (isPlatformAdmin || (RANK[me?.role] ?? 0) > (RANK[user.role] ?? 0))

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast.success(ok); load() }
    catch (e) { toast.error(e.message || 'Something went wrong.') }
    finally { setBusy(false) }
  }
  const doResend  = () => run(() => resendInvite(user.id), `Invitation re-sent to ${user.email}.`)
  const doDisable = () => {
    if (!confirm(`Disable "${user.firstName} ${user.lastName}"? Their active sessions will be revoked immediately.`)) return
    run(() => disableUser(user.id), 'User disabled and sessions revoked.')
  }
  const doEnable  = () => {
    if (!confirm(`Re-enable "${user.firstName} ${user.lastName}"?`)) return
    run(() => enableUser(user.id), 'User enabled.')
  }

  const moreItems = canManage ? [
    { label: 'Edit user', icon: I.pen, onClick: () => setEditing(true) },
    ...(user?.mustChangePassword ? [{ label: 'Resend invite', icon: I.mail, onClick: doResend, disabled: busy }] : []),
    user?.active
      ? { label: 'Disable user', icon: I.shield, onClick: doDisable, danger: true, disabled: busy }
      : { label: 'Enable user',  icon: I.check,  onClick: doEnable, disabled: busy },
  ] : []

  const activityHref = summary?.recentActivity && user?.email
    ? `/audit-log?by=${encodeURIComponent(user.email)}` : undefined

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {!user ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] items-start">
          <ProfileSidebar user={user} summary={summary} moreItems={moreItems} activityHref={activityHref} />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link to={listUrl('/users')} aria-label="Back to users"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-ink-8 dark:hover:bg-gray-700">
                <Ico d="M19 12H5M12 19l-7-7 7-7" className="w-4 h-4" />
              </Link>
              <Breadcrumbs items={crumbs} />
            </div>

            {/* Header */}
            <div className="mt-3 mb-5 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white break-words">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-ink-4">
                  <span>Joined on: <span className="font-semibold text-ink-2 dark:text-gray-300">{fmtDate(user.createdAt) || '—'}</span></span>
                  <span className="badge badge-brand text-[11px]">{ROLE_LABEL[user.role] || user.role}</span>
                  {user.organizationName && <span className="badge badge-violet text-[11px]">{user.organizationName}</span>}
                  <StatusPill active={user.active} />
                  {user.mustChangePassword && <span className="badge badge-warning text-[11px]">Invite pending</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 flex-wrap">
                  {user.mustChangePassword && (
                    <button onClick={doResend} disabled={busy} className="btn btn-outline btn-sm">Resend invite</button>
                  )}
                  <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm gap-1.5">
                    <Ico d={I.pen} className="w-3.5 h-3.5" /> Edit
                  </button>
                  {user.active
                    ? <button onClick={doDisable} disabled={busy} className="btn btn-sm border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20">Disable</button>
                    : <button onClick={doEnable} disabled={busy} className="btn btn-sm border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20">Enable</button>}
                </div>
              )}
            </div>

            <UnderlineTabs value={tab} onChange={setTab} tabs={[
              { id: 'overview', label: 'Overview' },
              ...(summary?.recentActivity ? [{ id: 'activity', label: 'Activity', count: summary.recentActivity.length || null }] : []),
            ]} />

            <div className="mt-5">
              {tab === 'overview' && (
                <ProfileOverview summary={summary}
                  canOpenESign={hasFeature?.(FEATURES.E_SIGN)} esignListHref="/esign" />
              )}
              {tab === 'activity' && (
                <div className="card max-w-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-ink dark:text-gray-100">Recent activity</h3>
                    {activityHref && (
                      <Link to={activityHref} className="text-xs font-semibold text-brand-600 hover:underline">Open in audit log</Link>
                    )}
                  </div>
                  <ActivityTimeline items={summary?.recentActivity} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && user && (
        <UserFormModal
          editUser={user}
          isPlatformAdmin={isPlatformAdmin}
          orgs={orgs}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
