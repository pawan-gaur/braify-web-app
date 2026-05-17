import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getBranding, updateBranding } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import LogoUpload from '../components/ui/LogoUpload'
import ColorPicker from '../components/ui/ColorPicker'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Settings' },
  { label: 'Branding' },
]

const DEFAULT_PRIMARY = '#6366f1'
const DEFAULT_ACCENT  = '#818cf8'

/* ── Feature / role meta ─────────────────────────────────────── */
const FEATURES = [
  { key: 'PDF_TEMPLATES',   label: 'PDF Templates',   icon: '📄', description: 'Create and generate PDF documents' },
  { key: 'EMAIL_TEMPLATES', label: 'Email Templates', icon: '✉️',  description: 'Send branded email campaigns' },
  { key: 'E_SIGN',          label: 'E-Sign',          icon: '✍️',  description: 'Electronic signature workflow' },
]

const ROLES = [
  { key: 'ORG_ADMIN', label: 'Org Admin', locked: true,  desc: 'Always has full access' },
  { key: 'ADMIN',     label: 'Admin',     locked: false, desc: 'Can be restricted' },
  { key: 'USER',      label: 'User',      locked: false, desc: 'Can be restricted' },
]

/* ── Theme presets ───────────────────────────────────────────── */
const PRESETS = [
  { name: 'Indigo',  primary: '#6366f1', accent: '#818cf8' },
  { name: 'Blue',    primary: '#3b82f6', accent: '#60a5fa' },
  { name: 'Violet',  primary: '#7c3aed', accent: '#a78bfa' },
  { name: 'Rose',    primary: '#e11d48', accent: '#fb7185' },
  { name: 'Emerald', primary: '#059669', accent: '#34d399' },
  { name: 'Amber',   primary: '#d97706', accent: '#fbbf24' },
  { name: 'Cyan',    primary: '#0891b2', accent: '#22d3ee' },
  { name: 'Slate',   primary: '#475569', accent: '#94a3b8' },
]

/* ─────────────────────────────────────────────────────────────── */
export default function BrandingPage() {
  useDocumentTitle('Organisation Branding')
  const { user, setFeatureRoleAccess } = useAuth()
  const toast = useToast()
  const orgId = user?.organizationId

  const [activeTab, setActiveTab] = useState('identity')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [orgFeatures, setOrgFeatures] = useState([])   // which features org has enabled

  /* Shared form state */
  const [form, setForm] = useState({
    logoBase64:      null,
    primaryColor:    DEFAULT_PRIMARY,
    accentColor:     DEFAULT_ACCENT,
    emailSenderName: '',
    emailReplyTo:    '',
    footerText:      '',
    featureRoleAccess: null,  // null = no restrictions
  })

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    getBranding(orgId)
      .then(data => {
        setOrgFeatures(user?.features ?? [])
        setForm({
          logoBase64:        data.logoBase64        || null,
          primaryColor:      data.primaryColor      || DEFAULT_PRIMARY,
          accentColor:       data.accentColor       || DEFAULT_ACCENT,
          emailSenderName:   data.emailSenderName   || '',
          emailReplyTo:      data.emailReplyTo      || '',
          footerText:        data.footerText        || '',
          featureRoleAccess: data.featureRoleAccess || buildDefaultAccess(user?.features ?? []),
        })
      })
      .catch(() => {
        setOrgFeatures(user?.features ?? [])
        setForm(f => ({ ...f, featureRoleAccess: buildDefaultAccess(user?.features ?? []) }))
      })
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateBranding(orgId, form)
      // Refresh role access in AuthContext so hasFeature reflects new rules immediately
      setFeatureRoleAccess(res.featureRoleAccess ?? null)
      // Apply new theme colors to the app immediately
      if (form.primaryColor) document.documentElement.style.setProperty('--brand-primary', form.primaryColor)
      if (form.accentColor)  document.documentElement.style.setProperty('--brand-accent',  form.accentColor)
      toast.success('Branding saved successfully.')
    } catch (err) {
      toast.error(err.message || 'Failed to save branding.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading branding…
      </div>
    )
  }

  const TABS = [
    { id: 'identity',  label: 'Identity',       icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'theme',     label: 'Theme & Colors',  icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'access',    label: 'Access Control',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organisation Branding</h1>
          <p className="text-sm text-gray-500 mt-1">
            Customise your logo, theme, and control who can access each feature.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon}/>
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Identity ── */}
      {activeTab === 'identity' && (
        <IdentityTab form={form} set={set} saving={saving} onSave={handleSave} />
      )}

      {/* ── Tab: Theme & Colors ── */}
      {activeTab === 'theme' && (
        <ThemeTab form={form} set={set} saving={saving} onSave={handleSave} />
      )}

      {/* ── Tab: Access Control ── */}
      {activeTab === 'access' && (
        <AccessControlTab
          form={form}
          set={set}
          saving={saving}
          onSave={handleSave}
          orgFeatures={orgFeatures}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Tab: Identity — Logo + Email Sender + Footer
══════════════════════════════════════════════════════════════════ */
function IdentityTab({ form, set, saving, onSave }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column */}
      <div className="space-y-6">
        {/* Logo */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Organisation Logo</h2>
          <p className="text-xs text-gray-400 mb-4">
            Appears in PDF document headers, outgoing emails, and the web app navigation.
          </p>
          <LogoUpload
            currentLogo={form.logoBase64}
            onLogoChange={v => set('logoBase64', v)}
            label=""
          />
        </div>

        {/* Email sender */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Email Sender</h2>
            <p className="text-xs text-gray-400 mt-0.5">Shown in the From field of outgoing emails.</p>
          </div>
          <div>
            <label className="form-label">Sender Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Acme Corp"
              value={form.emailSenderName}
              onChange={e => set('emailSenderName', e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <label className="form-label">Reply-To Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="hello@acme.com"
              value={form.emailReplyTo}
              onChange={e => set('emailReplyTo', e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Recipients will reply to this address. Leave blank to use the system default.
            </p>
          </div>
        </div>

        {/* Footer text */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Custom Footer</h2>
          <p className="text-xs text-gray-400 mb-3">Appended to every generated PDF footer. HTML is not supported.</p>
          <textarea
            className="form-input resize-none"
            rows={3}
            maxLength={500}
            placeholder="© 2026 Acme Corp · All rights reserved · acme.com"
            value={form.footerText}
            onChange={e => set('footerText', e.target.value)}
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">{form.footerText.length}/500</p>
        </div>

        <SaveBar saving={saving} onSave={onSave} />
      </div>

      {/* Right column: Live preview */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Live Preview</h2>
        <PdfPreview form={form} />
        <EmailPreview form={form} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Tab: Theme & Colors
══════════════════════════════════════════════════════════════════ */
function ThemeTab({ form, set, saving, onSave }) {
  const isActive = (preset) =>
    preset.primary === form.primaryColor && preset.accent === form.accentColor

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column */}
      <div className="space-y-6">
        {/* Preset themes */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Theme Presets</h2>
          <p className="text-xs text-gray-400 mb-4">
            Pick a preset or customise the colors below. Affects PDF headers, email accents, and the application UI.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {PRESETS.map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => { set('primaryColor', preset.primary); set('accentColor', preset.accent) }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all
                  ${isActive(preset)
                    ? 'border-indigo-400 dark:border-indigo-500 shadow-md'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                title={preset.name}
              >
                {/* Color swatch */}
                <div className="w-10 h-10 rounded-lg shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: preset.primary }} />
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-tl-lg" style={{ background: preset.accent }} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom colors */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Custom Colors</h2>
          <div>
            <ColorPicker
              value={form.primaryColor}
              onChange={v => set('primaryColor', v)}
              label="Primary Color"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Used for headings, buttons, PDF borders, and email accents.
            </p>
          </div>
          <div>
            <ColorPicker
              value={form.accentColor}
              onChange={v => set('accentColor', v)}
              label="Accent / Secondary Color"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Used for highlights, badges, and secondary UI elements.
            </p>
          </div>
        </div>

        <SaveBar saving={saving} onSave={onSave} />
      </div>

      {/* Right column: App theme preview */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Theme Preview</h2>
        <AppThemePreview form={form} />
        <PdfPreview form={form} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Tab: Access Control
══════════════════════════════════════════════════════════════════ */
function AccessControlTab({ form, set, saving, onSave, orgFeatures }) {
  // Build access state from form (null = all roles allowed → convert to default)
  const access = form.featureRoleAccess || buildDefaultAccess(orgFeatures)

  const isAllowed = (featureKey, roleKey) => {
    const roles = access[featureKey]
    if (!roles) return true   // no entry = all allowed
    return roles.includes(roleKey)
  }

  const toggle = (featureKey, roleKey) => {
    if (roleKey === 'ORG_ADMIN') return   // ORG_ADMIN is always locked
    const current = access[featureKey] || ROLES.map(r => r.key)
    const next = current.includes(roleKey)
      ? current.filter(r => r !== roleKey)
      : [...current, roleKey]
    // Always keep ORG_ADMIN
    const safe = next.includes('ORG_ADMIN') ? next : ['ORG_ADMIN', ...next]
    set('featureRoleAccess', { ...access, [featureKey]: safe })
  }

  // Only show features the org has enabled
  const enabledFeatures = FEATURES.filter(f => orgFeatures.includes(f.key))

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How access control works</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Configure which user roles can access each platform feature. <strong>Org Admin</strong> always has full
              access and cannot be restricted. Changes take effect immediately — users will lose access to
              unchecked features on their next page load.
            </p>
          </div>
        </div>
      </div>

      {enabledFeatures.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-sm">No features enabled for this organisation.</p>
          <p className="text-xs mt-1">Ask a Platform Admin to enable features first.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                  Feature
                </th>
                {ROLES.map(role => (
                  <th key={role.key} className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                        ${role.key === 'ORG_ADMIN' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                          : role.key === 'ADMIN'   ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {role.label}
                      </span>
                      {role.locked && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          </svg>
                          Always
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {enabledFeatures.map(feature => (
                <tr key={feature.key} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{feature.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{feature.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{feature.description}</p>
                      </div>
                    </div>
                  </td>
                  {ROLES.map(role => (
                    <td key={role.key} className="px-4 py-4 text-center">
                      {role.locked ? (
                        /* ORG_ADMIN always allowed — locked checkbox */
                        <div className="flex justify-center">
                          <div className="w-5 h-5 rounded bg-violet-500 flex items-center justify-center cursor-not-allowed opacity-80">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        /* Toggleable checkbox */
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggle(feature.key, role.key)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                              ${isAllowed(feature.key, role.key)
                                ? 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                              }`}
                          >
                            {isAllowed(feature.key, role.key) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {enabledFeatures.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Configuration</p>
          <div className="flex flex-wrap gap-2">
            {enabledFeatures.map(feature => {
              const roles = (access[feature.key] || ROLES.map(r => r.key))
                .filter(r => r !== 'ORG_ADMIN')
              const allOthers = roles.length === 2
              return (
                <div key={feature.key}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                  <span className="text-sm">{feature.icon}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{feature.label}</span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${allOthers
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                    {allOthers ? 'All roles' : roles.join(', ') || 'Org Admin only'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <SaveBar saving={saving} onSave={onSave} />
    </div>
  )
}

/* ── Save bar ─────────────────────────────────────────────────── */
function SaveBar({ saving, onSave }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="btn btn-primary px-8"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Saving…
          </span>
        ) : 'Save Changes'}
      </button>
    </div>
  )
}

/* ── PDF document preview ─────────────────────────────────────── */
function PdfPreview({ form }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-4 bg-white dark:bg-gray-800"
        style={{ borderBottom: `3px solid ${form.primaryColor}` }}>
        {form.logoBase64 ? (
          <img src={form.logoBase64} alt="Logo" className="h-10 max-w-[100px] object-contain shrink-0" />
        ) : (
          <div className="w-14 h-10 rounded border-2 border-dashed border-gray-200 dark:border-gray-600
                          flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Document Title</p>
          <p className="text-xs text-gray-400">Generated {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-2 bg-white dark:bg-gray-800">
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-full" />
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
      </div>
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <p className="text-[10px] text-gray-400 text-center">
          {form.footerText || '© Your Organisation · All rights reserved'}
        </p>
      </div>
    </div>
  )
}

/* ── Email preview ───────────────────────────────────────────── */
function EmailPreview({ form }) {
  return (
    <div className="card overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: form.primaryColor }} />
      <div className="p-5 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3 mb-4">
          {form.logoBase64 ? (
            <img src={form.logoBase64} alt="Logo" className="h-8 max-w-[80px] object-contain" />
          ) : (
            <div className="w-10 h-8 rounded border-2 border-dashed border-gray-200 dark:border-gray-600
                            flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
              From: {form.emailSenderName || 'Your Organisation'}
            </p>
            {form.emailReplyTo && (
              <p className="text-[10px] text-gray-400">Reply-to: {form.emailReplyTo}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5 mb-4">
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-full" />
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-4/5" />
        </div>
        <div className="inline-block text-xs font-bold text-white px-4 py-2 rounded-lg"
          style={{ background: form.primaryColor }}>
          View Document
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">
          {form.footerText || '© Your Organisation · All rights reserved'}
        </p>
      </div>
    </div>
  )
}

/* ── App theme preview ───────────────────────────────────────── */
function AppThemePreview({ form }) {
  const p = form.primaryColor || DEFAULT_PRIMARY
  const a = form.accentColor  || DEFAULT_ACCENT

  return (
    <div className="card overflow-hidden">
      {/* Mock top nav */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: p }}>
        {form.logoBase64 ? (
          <img src={form.logoBase64} alt="Logo" className="h-7 max-w-[80px] object-contain" />
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded bg-white/20" />
            <span className="text-white text-sm font-bold">Your App</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-16 h-5 rounded bg-white/20" />
          <div className="w-7 h-7 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Mock sidebar + content */}
      <div className="flex min-h-[120px]">
        <div className="w-28 border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 space-y-1.5">
          {[true, false, false, false].map((active, i) => (
            <div key={i}
              className={`h-5 rounded-lg flex items-center px-2 text-[9px] font-bold
                ${active ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
              style={active ? { background: p } : {}}>
              {active ? 'Dashboard' : ''}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-7 px-4 rounded-lg text-[10px] font-bold text-white flex items-center"
              style={{ background: p }}>
              Primary Button
            </div>
            <div className="h-7 px-4 rounded-lg text-[10px] font-bold text-white flex items-center"
              style={{ background: a }}>
              Accent
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p }} />
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded flex-1" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a }} />
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      </div>

      {/* Color chips */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md shadow-sm" style={{ background: p }} />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Primary</p>
            <p className="text-xs font-mono text-gray-500 uppercase">{p}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md shadow-sm" style={{ background: a }} />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Accent</p>
            <p className="text-xs font-mono text-gray-500 uppercase">{a}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Helper: build default access map (all roles allowed) ─────── */
function buildDefaultAccess(orgFeatures) {
  if (!orgFeatures?.length) return {}
  const allRoles = ROLES.map(r => r.key)
  return Object.fromEntries(orgFeatures.map(f => [f, allRoles]))
}
