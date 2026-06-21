import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { Toggle, SelectField, SettingRow, SettingsGroup, InfoBanner } from '../components/platform/SettingsKit'
import { IconArrowLeft, IconCheck } from '../components/ui/icons'
import {
  loadPlatformSettings, savePlatformSettings, DEFAULT_PLATFORM_SETTINGS,
} from '../config/platformSettings'

const ICON_SHIELD  = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
const ICON_LOCK    = 'M5 13a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zM8 11V7a4 4 0 118 0v4'
const ICON_BAN     = 'M18.364 5.636a9 9 0 11-12.728 0 9 9 0 0112.728 0zM5.636 5.636l12.728 12.728'
const ICON_CLOCK   = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'

/* select option helpers */
const len   = [8, 10, 12, 14, 16, 20].map(v => ({ value: v, label: `${v}` }))
const expiry = [
  { value: 30, label: '30 days' }, { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }, { value: 180, label: '180 days' },
  { value: 0,  label: 'Never' },
]
const reuse   = [3, 5, 10].map(v => ({ value: v, label: `Last ${v}` }))
const attempts = [3, 5, 10].map(v => ({ value: v, label: `${v}` }))
const lockMins = [{ value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 60, label: '60 min' }]
const sessHrs  = [{ value: 4, label: '4 hours' }, { value: 8, label: '8 hours' }, { value: 12, label: '12 hours' }, { value: 24, label: '24 hours' }]
const idleMins = [{ value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 60, label: '60 min' }]
const concurrent = [1, 2, 3, 5].map(v => ({ value: v, label: `${v}` }))

const CLASSES = [
  { key: 'requireUpper',  label: 'A-Z' },
  { key: 'requireLower',  label: 'a-z' },
  { key: 'requireDigit',  label: '0-9' },
  { key: 'requireSymbol', label: '!@#' },
]

function ComplexityChip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-chip border transition-colors
        ${active
          ? 'bg-brand-100 border-brand-300 text-brand-700 dark:bg-brand-900/30 dark:border-brand-900/50 dark:text-brand-300'
          : 'bg-white dark:bg-gray-700 border-ink-7 dark:border-gray-600 text-ink-4 hover:text-ink-3'}`}>
      {active && <IconCheck className="w-3 h-3" />}{children}
    </button>
  )
}

export default function PlatformSecurityPoliciesPage() {
  useDocumentTitle('Security policies')
  const { user } = useAuth()
  const { addToast } = useToast()

  const [settings, setSettings] = useState(loadPlatformSettings)
  const [baseline, setBaseline] = useState(() => JSON.stringify(loadPlatformSettings()))
  const [saving, setSaving] = useState(false)

  if (user && user.role !== ROLES.PLATFORM_ADMIN) return <Navigate to="/dashboard" replace />

  const sec = settings.security
  const dirty = JSON.stringify(settings) !== baseline

  /* curried immutable updater: set('mfa','required')(true) */
  const set = (group, key) => (val) =>
    setSettings(s => ({ ...s, security: { ...s.security, [group]: { ...s.security[group], [key]: val } } }))

  const save = async () => {
    setSaving(true)
    try {
      await savePlatformSettings(settings)
      setBaseline(JSON.stringify(settings))
      addToast({ type: 'success', message: 'Security policies saved — applied platform-wide.' })
    } catch {
      addToast({ type: 'error', message: 'Could not save security policies.' })
    } finally {
      setSaving(false)
    }
  }

  const discard = () => setSettings(JSON.parse(baseline))
  const resetDefaults = () =>
    setSettings(s => ({ ...s, security: JSON.parse(JSON.stringify(DEFAULT_PLATFORM_SETTINGS.security)) }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-28">
      <Link to="/settings/platform"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand dark:text-brand-400 mb-3 hover:underline">
        <IconArrowLeft className="w-4 h-4" /> All settings
      </Link>
      <Breadcrumbs items={[
        { label: 'Platform', to: '/dashboard' },
        { label: 'Settings', to: '/settings/platform' },
        { label: 'Security policies' },
      ]} />

      <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">
        Security policies
      </h1>
      <p className="text-sm text-ink-3 dark:text-gray-400 mt-1 mb-6">
        Authentication, passwords, lockout &amp; sessions enforced across the platform.
      </p>

      <InfoBanner>
        <strong className="font-semibold">Admin-only settings.</strong>{' '}
        MFA, password policy, lockout &amp; sessions can only be configured by a Platform Admin.
        Changes apply platform-wide and are written to the audit log.
      </InfoBanner>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Multi-factor authentication ── */}
        <SettingsGroup iconPath={ICON_SHIELD} title="Multi-factor authentication"
          footnote="When MFA is required, every user must enrol at least one method at next login. At least one method below must stay enabled.">
          <SettingRow title="MFA required"
            desc="Mandatory for all users on first login and every session.">
            <Toggle checked={sec.mfa.required} onChange={set('mfa', 'required')} label="MFA required" />
          </SettingRow>
          <SettingRow title="TOTP authenticator app"
            desc="Google Authenticator, Authy, 1Password.">
            <Toggle checked={sec.mfa.totp}
              onChange={(v) => { if (v || sec.mfa.emailOtp) set('mfa', 'totp')(v) }} label="TOTP" />
          </SettingRow>
          <SettingRow title="Email one-time passcode"
            desc="Fallback for users without an authenticator.">
            <Toggle checked={sec.mfa.emailOtp}
              onChange={(v) => { if (v || sec.mfa.totp) set('mfa', 'emailOtp')(v) }} label="Email OTP" />
          </SettingRow>
        </SettingsGroup>

        {/* ── Password policy ── */}
        <SettingsGroup iconPath={ICON_LOCK} title="Password policy"
          footnote="Applies to every Braify user. Existing users are prompted to update at next login if their password doesn't meet the policy.">
          <SettingRow title="Minimum length" desc="Characters required.">
            <SelectField value={sec.password.minLength} numeric options={len}
              onChange={set('password', 'minLength')} />
          </SettingRow>
          <SettingRow title="Complexity" desc="Required character classes.">
            <div className="flex flex-wrap gap-1.5 justify-end max-w-[12rem]">
              {CLASSES.map(c => (
                <ComplexityChip key={c.key} active={sec.password[c.key]}
                  onClick={() => set('password', c.key)(!sec.password[c.key])}>{c.label}</ComplexityChip>
              ))}
            </div>
          </SettingRow>
          <SettingRow title="Expiry interval" desc="Force rotation periodically.">
            <SelectField value={sec.password.expiryDays} numeric options={expiry}
              onChange={set('password', 'expiryDays')} />
          </SettingRow>
          <SettingRow title="Re-use restriction" desc="Block previously used passwords.">
            <div className="flex items-center gap-3">
              {sec.password.reuseRestriction && (
                <SelectField value={sec.password.reuseCount} numeric options={reuse}
                  onChange={set('password', 'reuseCount')} />
              )}
              <Toggle checked={sec.password.reuseRestriction}
                onChange={set('password', 'reuseRestriction')} label="Re-use restriction" />
            </div>
          </SettingRow>
        </SettingsGroup>

        {/* ── Lockout ── */}
        <SettingsGroup iconPath={ICON_BAN} title="Lockout"
          footnote="After the limit, the account locks and auto-unlocks once the duration passes. An admin can unlock sooner from the user's record.">
          <SettingRow title="Max failed attempts" desc="Before the account is locked.">
            <SelectField value={sec.lockout.maxFailedAttempts} numeric options={attempts}
              onChange={set('lockout', 'maxFailedAttempts')} />
          </SettingRow>
          <SettingRow title="Lockout duration" desc="Auto-unlock window.">
            <SelectField value={sec.lockout.lockoutMinutes} numeric options={lockMins}
              onChange={set('lockout', 'lockoutMinutes')} />
          </SettingRow>
        </SettingsGroup>

        {/* ── Sessions ── */}
        <SettingsGroup iconPath={ICON_CLOCK} title="Sessions"
          footnote="Shorter timeouts improve security; longer ones reduce re-logins. Concurrent limit caps simultaneous active sign-ins per user.">
          <SettingRow title="Session timeout" desc="Absolute maximum session length.">
            <SelectField value={sec.sessions.sessionTimeoutHours} numeric options={sessHrs}
              onChange={set('sessions', 'sessionTimeoutHours')} />
          </SettingRow>
          <SettingRow title="Idle timeout" desc="Inactivity before auto-logout.">
            <SelectField value={sec.sessions.idleTimeoutMinutes} numeric options={idleMins}
              onChange={set('sessions', 'idleTimeoutMinutes')} />
          </SettingRow>
          <SettingRow title="Max concurrent sessions" desc="Active sign-ins allowed per user.">
            <SelectField value={sec.sessions.maxConcurrent} numeric options={concurrent}
              onChange={set('sessions', 'maxConcurrent')} />
          </SettingRow>
        </SettingsGroup>
      </div>

      <button onClick={resetDefaults}
        className="mt-5 text-xs font-semibold text-ink-4 hover:text-ink-2 transition-colors">
        Reset to recommended defaults
      </button>

      {/* ── Sticky save bar (appears when there are unsaved changes) ── */}
      {dirty && (
        <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3
                        glass rounded-input px-4 py-3 shadow-lift">
          <span className="text-sm font-medium text-ink-2 dark:text-gray-200">You have unsaved changes</span>
          <div className="flex gap-2">
            <button onClick={discard} className="btn btn-outline btn-sm" disabled={saving}>Discard</button>
            <button onClick={save} className="btn btn-accent btn-sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] text-ink-4">
        Saved to this browser for now — the platform-settings API will be connected next.
      </p>
    </div>
  )
}
