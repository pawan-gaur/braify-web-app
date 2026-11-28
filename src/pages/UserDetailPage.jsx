import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getUser, getUserSummary, getOrganizations, enableUser, disableUser, resendInvite, resetUserMfa, unlockUser, signOutUserEverywhere, transferUserEsign, getUsers } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { listUrl } from '../hooks/useUrlState'
import UserFormModal from '../components/users/UserFormModal'
import { canManageUser } from '../utils/userPermissions'
import {
  ProfileSidebar, ProfileOverview, ActivityTimeline, UnderlineTabs, StatusPill,
  ROLE_LABEL, PROFILE_ICONS as I, Ico,
} from '../components/profile/ProfileParts'
import { FEATURES } from '../config/features'
import { fmtDate } from '../utils/date'

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
  const [transferring, setTransferring] = useState(false)

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

  // Same rule as the backend (utils/userPermissions).
  const canManage = canManageUser(me, user)

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast.success(ok); load() }
    catch (e) { toast.error(e.message || 'Something went wrong.') }
    finally { setBusy(false) }
  }
  const doResend  = () => run(() => resendInvite(user.id), `Invitation re-sent to ${user.email}.`)
  const doDisable = () => {
    const owned = summary?.esign?.total ?? 0
    const hint = owned > 0 && canTransfer
      ? `\n\nThey created ${owned} e-sign document${owned === 1 ? '' : 's'} — only the creator and signers can open those PDFs. Use "Transfer e-sign documents" first so a colleague keeps access.`
      : ''
    if (!confirm(`Disable "${user.firstName} ${user.lastName}"? Their active sessions will be revoked immediately.${hint}`)) return
    run(() => disableUser(user.id), 'User disabled and sessions revoked.')
  }
  const doEnable  = () => {
    if (!confirm(`Re-enable "${user.firstName} ${user.lastName}"?`)) return
    run(() => enableUser(user.id), 'User enabled.')
  }

  const doResetMfa = () => {
    if (!confirm(`Reset two-factor authentication for ${user.firstName}?\n\nUse this when they've lost their authenticator and recovery codes. They're signed out and, if 2FA is required, set it up again at next sign-in.`)) return
    run(() => resetUserMfa(user.id), 'Two-factor authentication reset.')
  }
  const doUnlock  = () => run(() => unlockUser(user.id), 'Account unlocked.')
  const doSignOut = () => {
    if (!confirm(`Sign ${user.firstName} out of every device?`)) return
    run(() => signOutUserEverywhere(user.id), 'Signed out everywhere.')
  }
  const locked = !!summary?.lockedUntil
  const canTransfer = canManage && (me?.role === 'ORG_ADMIN' || me?.role === 'PLATFORM_ADMIN') && !!user?.organizationId

  const moreItems = canManage ? [
    { label: 'Edit user', icon: I.pen, onClick: () => setEditing(true) },
    ...(user?.invitePending ? [{ label: 'Resend invite', icon: I.mail, onClick: doResend, disabled: busy }] : []),
    ...(locked ? [{ label: 'Unlock account', icon: I.key, onClick: doUnlock, disabled: busy }] : []),
    ...(summary?.mfaEnabled ? [{ label: 'Reset two-factor', icon: I.shield, onClick: doResetMfa, disabled: busy }] : []),
    ...(summary?.activeSessions > 0 ? [{ label: 'Sign out everywhere', icon: I.device, onClick: doSignOut, disabled: busy }] : []),
    ...(canTransfer ? [{ label: 'Transfer e-sign documents…', icon: I.doc, onClick: () => setTransferring(true) }] : []),
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
                  {user.invitePending && <span className="badge badge-warning text-[11px]">Invite pending</span>}
                  {locked && <span className="badge badge-danger text-[11px]">Locked</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 flex-wrap">
                  {user.invitePending && (
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

      {transferring && user && (
        <TransferEsignModal user={user} onClose={() => setTransferring(false)}
          onDone={(r) => { setTransferring(false); toast.success(`Moved ${r.documents} document(s) and ${r.batches} bulk batch(es).`); load() }} />
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

/** Picks a colleague in the same org to receive a user's e-sign documents (offboarding). */
function TransferEsignModal({ user, onClose, onDone }) {
  const toast = useToast()
  const [people, setPeople] = useState(null)
  const [to, setTo]         = useState('')
  const [busy, setBusy]     = useState(false)

  useEffect(() => {
    getUsers()
      .then(list => setPeople(list.filter(u => u.organizationId === user.organizationId && u.active && u.id !== user.id)))
      .catch(e => { toast.error(e.message); setPeople([]) })
  }, [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!to) return
    setBusy(true)
    try { onDone(await transferUserEsign(user.id, to)) }
    catch (e) { toast.error(e.message || 'Transfer failed.') }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" role="dialog" aria-modal="true"
        onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Transfer e-sign documents</h2>
        <p className="text-sm text-ink-3">
          Moves every e-sign document and bulk batch {user.firstName} created to a colleague, who becomes
          the sender and can open the signed PDFs.
        </p>
        {people === null ? <p className="text-sm text-ink-4">Loading…</p> : people.length === 0 ? (
          <p className="text-sm text-ink-4">There's no other active member in this organisation.</p>
        ) : (
          <select className="form-select" value={to} onChange={e => setTo(e.target.value)}>
            <option value="">— Choose a colleague —</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.email})</option>)}
          </select>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={submit} disabled={!to || busy} className="btn btn-primary flex-1">
            {busy ? 'Moving…' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  )
}
