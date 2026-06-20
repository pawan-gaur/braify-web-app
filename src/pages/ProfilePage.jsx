import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile, changePassword, uploadAvatar, getMyAuditLog } from '../services/api'
import MfaCard from '../components/profile/MfaCard'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'My Profile' },
]

const ACTION_BADGE = {
  CREATED:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATED:          'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  DELETED:          'bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400',
  RESTORED:         'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PASSWORD_CHANGED: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  AVATAR_UPDATED:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DEACTIVATED:      'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  ACTIVATED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SESSION_REVOKED:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

import { fmtDateTime as fmtDate } from '../utils/date'

function Avatar({ user, size = 'lg' }) {
  const s = size === 'lg' ? 'w-24 h-24 text-2xl' : 'w-12 h-12 text-base'
  if (user.profilePicture) {
    return <img src={user.profilePicture} alt="" className={`${s} rounded-full object-cover`} />
  }
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  useDocumentTitle('My Profile')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const fileRef = useRef(null)

  const [tab, setTab] = useState('info')  // 'info' | 'password' | 'activity'

  /* Info form */
  const [info, setInfo]         = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', bio: user?.bio || '' })
  const [savingInfo, setSavingInfo] = useState(false)

  /* Password form */
  const [pw, setPw]       = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  /* Avatar */
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  /* Audit log */
  const [auditLogs,    setAuditLogs]    = useState([])
  const [loadingLogs,  setLoadingLogs]  = useState(false)
  const [logsLoaded,   setLogsLoaded]   = useState(false)

  useEffect(() => {
    // Fetch once when the activity tab is first opened; skip on subsequent visits
    if (tab === 'activity' && !logsLoaded) {
      setLoadingLogs(true)
      getMyAuditLog()
        .then(data => { setAuditLogs(data); setLogsLoaded(true) })
        .catch(err => toast.error(err.message || 'Could not load activity log.'))
        .finally(() => setLoadingLogs(false))
    }
  }, [tab, logsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    if (!info.firstName.trim() || !info.lastName.trim()) { toast.error('First and last name are required.'); return }
    setSavingInfo(true)
    try {
      const updated = await updateProfile(info)
      setUser(u => ({ ...u, ...updated }))
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setSavingInfo(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pw.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return }
    if (pw.newPassword !== pw.confirm) { toast.error('Passwords do not match.'); return }
    setSavingPw(true)
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      toast.success('Password changed successfully.')
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password.')
    } finally {
      setSavingPw(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be smaller than 2 MB.'); return }
    setUploadingAvatar(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target.result
          const updated = await uploadAvatar(base64)
          setUser(u => ({ ...u, profilePicture: updated.profilePicture }))
          toast.success('Profile picture updated.')
        } catch (err) {
          toast.error(err.message || 'Failed to upload avatar.')
        } finally {
          setUploadingAvatar(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setUploadingAvatar(false)
    }
  }

  const ROLE_LABEL = {
    PLATFORM_ADMIN: 'Platform Admin',
    ORG_ADMIN:      'Org Admin',
    ADMIN:          'Admin',
    USER:           'User',
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Profile header card */}
      <div className="mt-4 mb-6 card flex items-center gap-6">
        <div className="relative">
          <Avatar user={user || {}} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-gray-700 border-2
                       border-gray-100 dark:border-gray-600 flex items-center justify-center
                       shadow hover:bg-indigo-50 transition-colors"
            title="Change photo"
          >
            {uploadingAvatar
              ? <svg className="animate-spin w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge badge-indigo text-[11px]">{ROLE_LABEL[user?.role] || user?.role}</span>
            {user?.organizationName && (
              <span className="badge badge-violet text-[11px]">{user?.organizationName}</span>
            )}
            {user?.mustChangePassword && (
              <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                Password setup required
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6 w-fit">
        {[
          { id: 'info',     label: 'Personal Info' },
          { id: 'password', label: 'Change Password' },
          { id: 'security', label: 'Security' },
          { id: 'activity', label: 'Activity Log' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.id
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Personal Info */}
      {tab === 'info' && (
        <form onSubmit={handleSaveInfo} className="card space-y-4">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input className="form-input" value={info.firstName}
                onChange={e => setInfo(i => ({ ...i, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={info.lastName}
                onChange={e => setInfo(i => ({ ...i, lastName: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
              value={user?.email || ''} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact your admin.</p>
          </div>
          <div>
            <label className="form-label">Bio</label>
            <textarea className="form-input resize-none" rows={3}
              placeholder="Tell us a bit about yourself…"
              value={info.bio}
              onChange={e => setInfo(i => ({ ...i, bio: e.target.value }))} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingInfo} className="btn btn-primary">
              {savingInfo ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Change Password */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="card space-y-4">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Change Password</h2>
          <div>
            <label className="form-label">Current Password *</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="form-input pr-10"
                placeholder="Enter current password"
                value={pw.currentPassword}
                onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={showPw ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                     : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'}/>
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">New Password *</label>
            <input type={showPw ? 'text' : 'password'} className="form-input"
              placeholder="Min 6 characters"
              value={pw.newPassword}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Confirm New Password *</label>
            <input type={showPw ? 'text' : 'password'} className="form-input"
              placeholder="Re-enter new password"
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          {pw.newPassword && pw.confirm && pw.newPassword !== pw.confirm && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPw} className="btn btn-primary">
              {savingPw ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Security (2FA) */}
      {tab === 'security' && <MfaCard />}

      {/* Tab: Activity Log */}
      {tab === 'activity' && (
        <div className="card p-0 overflow-hidden">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
              Loading activity…
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p className="text-sm">No activity recorded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {auditLogs.map(log => (
                <li key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 mt-0.5 ${ACTION_BADGE[log.action] || 'bg-gray-100 text-gray-600'}`}>
                    {log.action.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{log.templateName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(log.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
