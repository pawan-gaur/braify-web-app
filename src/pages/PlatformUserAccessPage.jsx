import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { Toggle, SelectField, SettingRow, SettingsGroup, InfoBanner } from '../components/platform/SettingsKit'
import { IconArrowLeft } from '../components/ui/icons'
import {
  loadPlatformSettings, savePlatformSettings, DEFAULT_PLATFORM_SETTINGS,
} from '../config/platformSettings'

const ICON_USER_PLUS = 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6'
const ICON_SLIDERS   = 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'

const roleOpts = [
  { value: 'USER',  label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function PlatformUserAccessPage() {
  useDocumentTitle('User access')
  const { user } = useAuth()
  const { addToast } = useToast()

  const [settings, setSettings] = useState(null)
  const [baseline, setBaseline] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    loadPlatformSettings().then(s => {
      if (!alive) return
      setSettings(s); setBaseline(JSON.stringify(s)); setLoading(false)
    })
    return () => { alive = false }
  }, [])

  if (user && user.role !== ROLES.PLATFORM_ADMIN) return <Navigate to="/dashboard" replace />
  if (loading || !settings) return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex justify-center items-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const acc = settings.access
  const dirty = JSON.stringify(settings) !== baseline

  const set = (key) => (val) =>
    setSettings(s => ({ ...s, access: { ...s.access, [key]: val } }))

  const save = async () => {
    setSaving(true)
    try {
      const saved = await savePlatformSettings(settings)
      setSettings(saved)
      setBaseline(JSON.stringify(saved))
      addToast({ type: 'success', message: 'User access settings saved — applied platform-wide.' })
    } catch {
      addToast({ type: 'error', message: 'Could not save user access settings.' })
    } finally {
      setSaving(false)
    }
  }

  const discard = () => setSettings(JSON.parse(baseline))
  const resetDefaults = () =>
    setSettings(s => ({ ...s, access: JSON.parse(JSON.stringify(DEFAULT_PLATFORM_SETTINGS.access)) }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-28">
      <Link to="/settings/platform"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand dark:text-brand-400 mb-3 hover:underline">
        <IconArrowLeft className="w-4 h-4" /> All settings
      </Link>
      <Breadcrumbs items={[
        { label: 'Platform', to: '/dashboard' },
        { label: 'Settings', to: '/settings/platform' },
        { label: 'User access' },
      ]} />

      <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">
        User access
      </h1>
      <p className="text-sm text-ink-3 dark:text-gray-400 mt-1 mb-6">
        Sign-up, verification and default rules applied to every new user across all organisations.
      </p>

      <InfoBanner>
        <strong className="font-semibold">Admin-only settings.</strong>{' '}
        These rules govern how users are created and what they can do by default platform-wide.
      </InfoBanner>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SettingsGroup iconPath={ICON_USER_PLUS} title="Sign-up &amp; verification"
          footnote="With self-signup off, only admins can create users. Email verification blocks access until the address is confirmed.">
          <SettingRow title="Allow self-signup"
            desc="Let people request an account without an invite.">
            <Toggle checked={acc.allowSelfSignup} onChange={set('allowSelfSignup')} label="Allow self-signup" />
          </SettingRow>
          <SettingRow title="Require email verification"
            desc="New users must confirm their email before first login.">
            <Toggle checked={acc.requireEmailVerification} onChange={set('requireEmailVerification')} label="Require email verification" />
          </SettingRow>
        </SettingsGroup>

        <SettingsGroup iconPath={ICON_SLIDERS} title="User defaults"
          footnote="Defaults applied at user creation. Admins can still change a user's role and details afterwards.">
          <SettingRow title="Default role" desc="Role assigned to a newly created user.">
            <SelectField value={acc.defaultRole} options={roleOpts} onChange={set('defaultRole')} />
          </SettingRow>
          <SettingRow title="Force password change on first login"
            desc="New users must set a new password before continuing.">
            <Toggle checked={acc.forcePasswordChangeOnFirstLogin} onChange={set('forcePasswordChangeOnFirstLogin')} label="Force password change" />
          </SettingRow>
          <SettingRow title="Allow profile self-editing"
            desc="Users can edit their own name, avatar and details.">
            <Toggle checked={acc.allowProfileSelfEdit} onChange={set('allowProfileSelfEdit')} label="Allow profile self-editing" />
          </SettingRow>
        </SettingsGroup>
      </div>

      <button onClick={resetDefaults}
        className="mt-5 text-xs font-semibold text-ink-4 hover:text-ink-2 transition-colors">
        Reset to recommended defaults
      </button>

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
        Changes are saved platform-wide and recorded in the audit log.
      </p>
    </div>
  )
}
