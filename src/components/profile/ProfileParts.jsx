import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtDate, fmtDateTime } from '../../utils/date'
import { FEATURES } from '../../config/features'

/*
 * Building blocks of the two-column profile layout shared by /profile (own account) and
 * /users/:id (another user): a left identity panel and a right overview with stats,
 * recent e-sign documents and an activity timeline. Data comes from the summary endpoints
 * (getMySummary / getUserSummary); any section the viewer may not see arrives as null and is hidden.
 */

export const ROLE_LABEL = {
  PLATFORM_ADMIN: 'Platform Admin',
  ORG_ADMIN:      'Org Admin',
  ADMIN:          'Admin',
  USER:           'User',
}

/* ── Small icons (stroke paths, 24×24) ─────────────────────────────────── */
const P = {
  mail:     'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  copy:     'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  more:     'M5 12h.01M12 12h.01M19 12h.01',
  org:      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  badge:    'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
  shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  login:    'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
  device:   'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  key:      'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  doc:      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  envelope: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207',
  pen:      'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  cog:      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  folder:   'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  chevron:  'M9 5l7 7-7 7',
}

export function Ico({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
export function ProfileAvatar({ user, className = 'w-20 h-20 text-2xl' }) {
  if (user?.profilePicture) {
    return <img src={user.profilePicture} alt="" className={`${className} rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-soft`} />
  }
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?'
  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-brand-500 to-accent-600 ring-4 ring-white dark:ring-gray-800
                     shadow-soft flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  )
}

/** Short, human-friendly reference for a user id (last 6 chars). */
export const shortId = (id) => (id ? `#${String(id).slice(-6).toUpperCase()}` : '')

/* ── Activity wording ───────────────────────────────────────────────────── */
const VERB = {
  CREATED: 'Created', UPDATED: 'Updated', DELETED: 'Deleted', RESTORED: 'Restored',
  READ: 'Opened', EXPORTED: 'Exported', ACCESS_DENIED: 'Was denied access to',
  PASSWORD_CHANGED: 'Changed the password', AVATAR_UPDATED: 'Updated the profile photo',
  DEACTIVATED: 'Deactivated', ACTIVATED: 'Activated',
  MFA_ENABLED: 'Turned on two-factor authentication', MFA_DISABLED: 'Turned off two-factor authentication',
  MFA_RECOVERY_USED: 'Signed in with a recovery code',
  LOGIN: 'Signed in', LOGOUT: 'Signed out', SESSION_REVOKED: 'Revoked a session',
  SENT: 'Sent for signature', CANCELLED: 'Cancelled',
  API_KEY_CREATED: 'Created API key', API_KEY_REVOKED: 'Revoked API key', API_KEY_TOGGLED: 'Toggled API key',
  FEATURES_UPDATED: 'Changed features of', MFA_POLICY_CHANGED: 'Changed the 2FA policy of',
  PLATFORM_SETTINGS_UPDATED: 'Updated platform settings', SUBSCRIPTION_CHANGED: 'Changed the plan of',
  BRANDING_UPDATED: 'Updated branding of', QUOTA_EXCEEDED: 'Hit a usage limit',
  TEMPLATE_SHARED: 'Shared', TEMPLATE_UNSHARED: 'Stopped sharing',
}
const NOUN = {
  TEMPLATE: 'PDF template', EMAIL_TEMPLATE: 'email template', USER: 'user', ORGANIZATION: 'organisation',
  E_SIGN: 'e-sign document', SHARING: 'template', API_KEY: '', DOCUMENT: 'file', FILE: 'file',
  SESSION: '', BULK_EMAIL: 'bulk email', CLOUD_CONFIG: 'storage settings', PLATFORM: '',
}
/** Actions whose verb already says everything (no "… PDF template X" suffix). */
const SELF_CONTAINED = new Set([
  'PASSWORD_CHANGED', 'AVATAR_UPDATED', 'MFA_ENABLED', 'MFA_DISABLED', 'MFA_RECOVERY_USED',
  'LOGIN', 'LOGOUT', 'SESSION_REVOKED', 'PLATFORM_SETTINGS_UPDATED', 'QUOTA_EXCEEDED',
])
const TILE = {
  TEMPLATE:       { d: P.doc,      c: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300' },
  EMAIL_TEMPLATE: { d: P.envelope, c: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300' },
  E_SIGN:         { d: P.pen,      c: 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-300' },
  SESSION:        { d: P.login,    c: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
  USER:           { d: P.user,     c: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
  FILE:           { d: P.folder,   c: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300' },
  DOCUMENT:       { d: P.folder,   c: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300' },
  API_KEY:        { d: P.key,      c: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' },
}
const TILE_DEFAULT = { d: P.cog, c: 'bg-ink-8 text-ink-3 dark:bg-gray-700 dark:text-gray-300' }

export function describeActivity(a) {
  const verb = VERB[a.action] || (a.action || '').replace(/_/g, ' ').toLowerCase()
  if (SELF_CONTAINED.has(a.action)) return { verb, noun: '', name: '' }
  return { verb, noun: a.action === 'SENT' ? '' : (NOUN[a.resourceType] ?? ''), name: a.resourceName || '' }
}

/* ── Activity timeline ──────────────────────────────────────────────────── */
export function ActivityTimeline({ items, limit, emptyText = 'No activity recorded yet.' }) {
  if (!items) return <p className="text-xs text-ink-4 py-6 text-center">Activity isn't visible to your role.</p>
  const list = limit ? items.slice(0, limit) : items
  if (list.length === 0) return <p className="text-xs text-ink-4 py-6 text-center">{emptyText}</p>
  return (
    <ol className="relative">
      {list.map((a, i) => {
        const t = TILE[a.resourceType] || TILE_DEFAULT
        const { verb, noun, name } = describeActivity(a)
        return (
          <li key={a.id || i} className="relative flex gap-3 pb-5 last:pb-0">
            {i < list.length - 1 && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px bg-ink-7 dark:bg-gray-700" aria-hidden="true" />
            )}
            <span className={`relative z-[1] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.c}`}>
              <Ico d={t.d} className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] leading-snug text-ink-2 dark:text-gray-300">
                {verb}{noun && ` ${noun}`}
                {name && <> <span className="font-semibold text-ink dark:text-white break-words">{name}</span></>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-ink-4">{fmtDateTime(a.timestamp)}</span>
                {a.outcome === 'FAILURE' && <span className="badge badge-danger text-[10px]">Failed</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ── Tabs (underline style) ─────────────────────────────────────────────── */
export function UnderlineTabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-ink-7 dark:border-gray-700" role="tablist">
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`relative px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5
            ${value === t.id ? 'text-ink dark:text-white' : 'text-ink-4 hover:text-ink-2 dark:hover:text-gray-200'}`}>
          {t.label}
          {t.count != null && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-ink dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center">
              {t.count}
            </span>
          )}
          {value === t.id && <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-gradient-accent" />}
        </button>
      ))}
    </div>
  )
}

/* ── Left panel ─────────────────────────────────────────────────────────── */
function QuickAction({ icon, label, tone, onClick, href, children }) {
  const cls = `w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:-translate-y-0.5 ${tone}`
  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      {href
        ? <a href={href} className={cls} aria-label={label}><Ico d={icon} className="w-5 h-5" /></a>
        : <button type="button" onClick={onClick} className={cls} aria-label={label}><Ico d={icon} className="w-5 h-5" /></button>}
      <span className="text-[11px] font-medium text-ink-3 dark:text-gray-400">{label}</span>
      {children}
    </div>
  )
}

function MoreMenu({ items, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const esc  = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [onClose])
  return (
    <div ref={ref} role="menu"
      className="absolute top-12 left-1/2 -translate-x-1/2 z-20 w-60 py-1.5 rounded-xl bg-white dark:bg-gray-800
                 border border-ink-7 dark:border-gray-700 shadow-lift text-left">
      {items.map(it => (
        <button key={it.label} role="menuitem" type="button" disabled={it.disabled}
          onClick={() => { onClose(); it.onClick() }}
          className={`w-full px-3.5 py-2 text-sm text-left whitespace-nowrap flex items-center gap-2.5 hover:bg-ink-8 dark:hover:bg-gray-700 disabled:opacity-50
            ${it.danger ? 'text-rose-600' : 'text-ink-2 dark:text-gray-200'}`}>
          {it.icon && <Ico d={it.icon} className="w-4 h-4 shrink-0" />}
          {it.label}
        </button>
      ))}
    </div>
  )
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-ink-8 dark:bg-gray-700/60 text-ink-3 dark:text-gray-300 flex items-center justify-center shrink-0">
        <Ico d={icon} className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-4">{label}</p>
        <div className="text-[13px] font-semibold text-ink dark:text-gray-100 break-words">{children}</div>
      </div>
    </div>
  )
}

export function StatusPill({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold
      ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-ink-8 text-ink-3 dark:bg-gray-700 dark:text-gray-300'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

/**
 * Left identity panel.
 *   user        – UserResponse
 *   summary     – UserSummaryResponse or null while loading
 *   avatarSlot  – optional element rendered over the avatar (e.g. the change-photo button)
 *   moreItems   – [{ label, icon?, onClick, danger?, disabled? }] for the "More" menu
 *   activityHref – "View all" link under the timeline (optional)
 */
export function ProfileSidebar({ user, summary, avatarSlot, moreItems = [], activityHref }) {
  const [tab, setTab] = useState('info')
  const [menu, setMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  // summary: null = loading, { unavailable: true } = failed to load
  const ready = summary && !summary.unavailable
  const facts = (render) => (ready ? render() : summary ? '—' : '…')
  const lastActivity = summary?.lastActiveAt || summary?.recentActivity?.[0]?.timestamp || summary?.lastLoginAt
  const copyEmail = () => {
    navigator.clipboard?.writeText(user?.email || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <aside className="card p-0 overflow-visible self-start">
      {/* Identity */}
      <div className="px-5 pt-6 pb-5 text-center">
        <div className="relative w-fit mx-auto">
          <ProfileAvatar user={user} />
          {avatarSlot}
        </div>
        <h2 className="mt-3 text-lg font-bold text-ink dark:text-white tracking-tight break-words">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-xs text-ink-4 mt-0.5">
          {ROLE_LABEL[user?.role] || user?.role} <span className="mx-1 text-ink-6">|</span> {shortId(user?.id)}
        </p>

        <div className="flex items-start justify-center gap-4 mt-4">
          <QuickAction icon={P.mail} label="Mail" href={user?.email ? `mailto:${user.email}` : undefined}
            tone="bg-brand-500 text-white shadow-soft" />
          <QuickAction icon={copied ? P.check : P.copy} label={copied ? 'Copied' : 'Copy email'} onClick={copyEmail}
            tone="bg-emerald-500 text-white shadow-soft" />
          {moreItems.length > 0 && (
            <QuickAction icon={P.more} label="More" onClick={() => setMenu(m => !m)}
              tone="bg-ink-8 text-ink-2 dark:bg-gray-700 dark:text-gray-200">
              {menu && <MoreMenu items={moreItems} onClose={() => setMenu(false)} />}
            </QuickAction>
          )}
        </div>

        <p className="mt-4 text-[11px] text-ink-4 flex items-center justify-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${lastActivity ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          Last activity:{' '}
          <span className="font-semibold text-ink-2 dark:text-gray-300">
            {facts(() => (lastActivity ? fmtDateTime(lastActivity) : 'None yet'))}
          </span>
        </p>
      </div>

      {/* Info / Activities */}
      <div className="grid grid-cols-2 border-y border-ink-7 dark:border-gray-700 text-sm font-semibold">
        {[['info', 'User info'], ['activity', 'Activities']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`relative py-2.5 transition-colors ${tab === id ? 'text-ink dark:text-white' : 'text-ink-4 hover:text-ink-2'}`}>
            {label}
            {tab === id && <span className="absolute left-4 right-4 -bottom-px h-0.5 rounded-full bg-gradient-accent" />}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {tab === 'info' ? (
          <div className="space-y-4">
            <InfoRow icon={P.mail} label="Email">{user?.email}</InfoRow>
            {user?.organizationName && <InfoRow icon={P.org} label="Organisation">{user.organizationName}</InfoRow>}
            <InfoRow icon={P.badge} label="Role">{ROLE_LABEL[user?.role] || user?.role}</InfoRow>
            <InfoRow icon={P.check} label="Status">
              <span className="inline-flex items-center gap-2 flex-wrap">
                <StatusPill active={user?.active} />
                {user?.mustChangePassword && <span className="badge badge-warning text-[10px]">Invite pending</span>}
              </span>
            </InfoRow>
            {user?.bio && <InfoRow icon={P.user} label="Bio"><span className="font-normal">{user.bio}</span></InfoRow>}
          </div>
        ) : (
          <>
            <ActivityTimeline items={ready ? summary.recentActivity : []} limit={6}
              emptyText={ready ? 'No activity recorded yet.' : summary ? "Couldn't load activity." : 'Loading…'} />
            {activityHref && summary?.recentActivity?.length > 0 && (
              <Link to={activityHref} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                View all activity <Ico d={P.chevron} className="w-3 h-3" />
              </Link>
            )}
          </>
        )}
      </div>

      {/* Account facts */}
      <div className="px-5 py-5 border-t border-ink-7 dark:border-gray-700">
        <p className="text-eyebrow text-[10px] mb-3">Account</p>
        <div className="space-y-4">
          <InfoRow icon={P.calendar} label="Member since">{fmtDate(user?.createdAt) || '—'}</InfoRow>
          <InfoRow icon={P.login} label="Last sign-in">{facts(() => (summary.lastLoginAt ? fmtDateTime(summary.lastLoginAt) : 'Never'))}</InfoRow>
          <InfoRow icon={P.shield} label="Two-factor authentication">
            {facts(() => (summary.mfaEnabled
              ? <span className="text-emerald-600 dark:text-emerald-400">On{summary.mfaEnrolledAt ? ` · since ${fmtDate(summary.mfaEnrolledAt)}` : ''}</span>
              : <span className="text-ink-3">Off</span>))}
          </InfoRow>
          {summary?.passwordChangedAt && (
            <InfoRow icon={P.key} label="Password changed">{fmtDate(summary.passwordChangedAt)}</InfoRow>
          )}
          <InfoRow icon={P.device} label="Active sessions">{facts(() => summary.activeSessions)}</InfoRow>
        </div>
      </div>
    </aside>
  )
}

/* ── Right-hand overview ────────────────────────────────────────────────── */
const DOC_STATUS = {
  DRAFT:            'bg-ink-8 text-ink-3 dark:bg-gray-700 dark:text-gray-300',
  PENDING:          'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  IN_REVIEW:        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PARTIALLY_SIGNED: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
  SIGNED:           'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  COMPLETED:        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  EXPIRED:          'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CANCELLED:        'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
}
const statusLabel = (s) => (s || '').toLowerCase().replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())

function StatTile({ icon, label, value, suffix, hint }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-ink-7 dark:border-gray-700 px-4 py-3.5 min-w-0">
      <p className="text-xs text-ink-3 dark:text-gray-400 flex items-center gap-1.5">
        <Ico d={icon} className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink dark:text-white">
        {value ?? <span className="inline-block w-8 h-6 rounded bg-ink-8 dark:bg-gray-700 animate-pulse align-middle" />}
        {suffix != null && value != null && <span className="text-sm font-semibold text-ink-4 ml-0.5">/{suffix}</span>}
      </p>
      {hint && <p className="text-[11px] text-ink-4 mt-0.5 truncate">{hint}</p>}
    </div>
  )
}

/**
 * Stats + recent e-sign documents.
 *   summary       – UserSummaryResponse (null while loading)
 *   canOpenESign  – the viewer can open /esign (has the E-Sign feature)
 *   esignListHref – link for "Go to e-sign documents" (omit to hide)
 *   isSelf        – wording ("You haven't…" vs "No … yet")
 */
export function ProfileOverview({ summary, canOpenESign, esignListHref, isSelf }) {
  if (summary?.unavailable) {
    return <div className="card text-sm text-ink-4 text-center py-10">The overview couldn't be loaded. Try again in a moment.</div>
  }
  const f = summary?.features || []
  const esign = summary?.esign
  const tiles = []
  if (!summary || f.includes(FEATURES.PDF_TEMPLATES))
    tiles.push({ key: 'pdf', icon: P.doc, label: 'PDF templates', value: summary?.pdfTemplates, hint: 'Created' })
  if (!summary || f.includes(FEATURES.EMAIL_TEMPLATES))
    tiles.push({ key: 'email', icon: P.envelope, label: 'Email templates', value: summary?.emailTemplates, hint: 'Created' })
  if (summary && f.includes(FEATURES.E_SIGN) && esign) {
    tiles.push({ key: 'await', icon: P.clock, label: 'Awaiting signature', value: esign.awaiting, hint: `${esign.drafts} draft${esign.drafts === 1 ? '' : 's'}` })
    tiles.push({ key: 'done', icon: P.check, label: 'Signed', value: esign.completed, suffix: esign.total - esign.drafts,
                 hint: esign.closed ? `${esign.closed} expired or cancelled` : 'Of documents sent' })
  }

  const docs = summary?.recentDocuments
  const showDocs = summary && f.includes(FEATURES.E_SIGN) && docs

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-ink-8 dark:bg-gray-900/40 border border-ink-7 dark:border-gray-700 p-3">
        <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 ${tiles.length >= 3 ? 'xl:grid-cols-4' : ''}`}>
          {tiles.map(({ key, ...t }) => <StatTile key={key} {...t} />)}
        </div>
        {showDocs && canOpenESign && esignListHref && (
          <Link to={esignListHref}
            className="mt-3 ml-1 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2 dark:text-gray-200 hover:text-brand-600">
            Go to e-sign documents <Ico d={P.chevron} className="w-3.5 h-3.5" />
          </Link>
        )}
      </section>

      {showDocs && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-ink dark:text-gray-100 tracking-tight">Recent e-sign documents</h3>
            {esign && <span className="text-xs text-ink-4">{esign.total} in total</span>}
          </div>
          {docs.length === 0 ? (
            <div className="card text-center py-10 text-sm text-ink-4">
              {isSelf ? "You haven't created any e-sign documents yet." : 'No e-sign documents yet.'}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {docs.map(d => {
                const body = (
                  <>
                    <span className="w-9 h-9 rounded-lg bg-ink-8 dark:bg-gray-700 text-ink-3 dark:text-gray-300 flex items-center justify-center shrink-0">
                      <Ico d={P.doc} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink dark:text-gray-100 truncate">{d.title || 'Untitled document'}</p>
                      <p className="text-[11px] text-ink-4 truncate">
                        {[d.clientName, d.signatories ? `${d.signatories} signator${d.signatories === 1 ? 'y' : 'ies'}` : null, fmtDate(d.createdAt)]
                          .filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${DOC_STATUS[d.status] || DOC_STATUS.DRAFT}`}>
                      {statusLabel(d.status)}
                    </span>
                    {canOpenESign && <Ico d={P.chevron} className="w-4 h-4 text-ink-4 shrink-0" />}
                  </>
                )
                const cls = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-ink-7 dark:border-gray-700'
                return (
                  <li key={d.id}>
                    {canOpenESign
                      ? <Link to={`/esign/${d.id}`} className={`${cls} hover:border-brand-300 hover:shadow-soft transition`}>{body}</Link>
                      : <div className={cls}>{body}</div>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export const PROFILE_ICONS = P
