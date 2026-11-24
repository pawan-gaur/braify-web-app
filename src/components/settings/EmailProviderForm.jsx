import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'

const PROVIDERS = [
  { key: '',         label: 'None',     hint: null },
  { key: 'RESEND',   label: 'Resend',   hint: 'API key from resend.com → API Keys. The from address must be on a verified domain.' },
  { key: 'SENDGRID', label: 'SendGrid', hint: 'API key with “Mail Send” permission. The from address must be a verified sender.' },
  { key: 'MAILGUN',  label: 'Mailgun',  hint: 'Private API key and your sending domain.' },
  { key: 'SMTP',     label: 'SMTP',     hint: 'Any mail server (e.g. Microsoft 365, Google Workspace, Amazon SES SMTP).' },
]
const EMPTY = {
  provider: '', fromEmail: '', fromName: '', replyTo: '', apiKey: '',
  mailgunDomain: '', mailgunRegion: 'US', smtpHost: '', smtpPort: 587, smtpUsername: '', smtpPassword: '', smtpStartTls: true,
}

/**
 * Email provider settings (Resend / SendGrid / Mailgun / SMTP) — shared by Organization Settings
 * (the org's own sender for campaigns and template sends) and Platform Messaging (the default every
 * org falls back to). Secrets are write-only: the API returns them masked; blank keeps the stored value.
 *
 * Props: load() → config, save(payload) → config, test(email) → {success, message},
 *        noneLabel, platform (shows the built-in fallback toggle)
 */
export default function EmailProviderForm({ load, save, test, noneLabel = 'None', platform = false }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [masked, setMasked] = useState({})
  const [fallback, setFallback] = useState({ enabled: null, available: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)

  const apply = cfg => {
    setForm({
      ...EMPTY,
      provider: cfg?.provider || '',
      fromEmail: cfg?.fromEmail || '', fromName: cfg?.fromName || '', replyTo: cfg?.replyTo || '',
      mailgunDomain: cfg?.mailgunDomain || '', mailgunRegion: cfg?.mailgunRegion || 'US',
      smtpHost: cfg?.smtpHost || '', smtpPort: cfg?.smtpPort || 587, smtpUsername: cfg?.smtpUsername || '',
      smtpStartTls: cfg?.smtpStartTls ?? true,
    })
    setMasked({ apiKey: cfg?.apiKey, smtpPassword: cfg?.smtpPassword })
    setFallback({ enabled: cfg?.envFallbackEnabled ?? null, available: !!cfg?.envFallbackAvailable })
  }

  useEffect(() => {
    load().then(apply).catch(e => toast.error(e.message)).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, provider: form.provider || null, smtpPort: form.smtpPort ? Number(form.smtpPort) : null }
      if (platform && fallback.enabled !== null) payload.envFallbackEnabled = fallback.enabled
      apply(await save(payload))
      toast.success(form.provider ? 'Email provider saved.' : 'Email provider removed.')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const onTest = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo.trim())) { toast.error('Enter an email address to send the test to.'); return }
    setTesting(true)
    try {
      const r = await test(testTo.trim())
      r.success ? toast.success(r.message || 'Test email sent.') : toast.error(r.message || 'Test failed.')
    } catch (e) { toast.error(e.message) } finally { setTesting(false) }
  }

  if (loading) return <div className="skeleton h-40 rounded-card" />

  const p = form.provider
  const secret = (key, label) => (
    <Field label={label}>
      <input type="password" autoComplete="new-password" className="form-input" value={form[key]}
        placeholder={masked[key] ? `${masked[key]} (unchanged)` : ''} onChange={e => set(key, e.target.value)} />
    </Field>
  )
  const text = (key, label, placeholder = '', type = 'text') => (
    <Field label={label}>
      <input type={type} className="form-input" value={form[key]} placeholder={placeholder} onChange={e => set(key, e.target.value)} />
    </Field>
  )

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Email provider">
        {PROVIDERS.map(x => (
          <button key={x.key} type="button" role="radio" aria-checked={p === x.key} onClick={() => set('provider', x.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors
              ${p === x.key ? 'border-brand bg-brand-50 text-brand-700 dark:bg-brand/10' : 'border-ink-8 dark:border-gray-700 text-ink-3 hover:text-ink'}`}>
            {x.key === '' ? noneLabel : x.label}
          </button>
        ))}
      </div>
      {PROVIDERS.find(x => x.key === p)?.hint && <p className="text-xs text-ink-3">{PROVIDERS.find(x => x.key === p).hint}</p>}

      {p && (
        <div className="grid sm:grid-cols-2 gap-4">
          {text('fromEmail', 'From email', 'notifications@yourcompany.com', 'email')}
          {text('fromName', 'From name', 'Your Company')}
          {text('replyTo', 'Reply-to (optional)', 'support@yourcompany.com', 'email')}
          {(p === 'RESEND' || p === 'SENDGRID' || p === 'MAILGUN') && secret('apiKey', 'API key')}
          {p === 'MAILGUN' && <>
            {text('mailgunDomain', 'Sending domain', 'mg.yourcompany.com')}
            <Field label="Region">
              <select className="form-input" value={form.mailgunRegion} onChange={e => set('mailgunRegion', e.target.value)}>
                <option value="US">US</option><option value="EU">EU</option>
              </select>
            </Field>
          </>}
          {p === 'SMTP' && <>
            {text('smtpHost', 'SMTP host', 'smtp.office365.com')}
            {text('smtpPort', 'Port', '587', 'number')}
            {text('smtpUsername', 'Username')}
            {secret('smtpPassword', 'Password')}
            <label className="flex items-center gap-2 text-sm text-ink-2 dark:text-gray-300 sm:col-span-2">
              <input type="checkbox" checked={!!form.smtpStartTls} onChange={e => set('smtpStartTls', e.target.checked)} />
              Use STARTTLS (port 587). Untick for implicit TLS on port 465.
            </label>
          </>}
        </div>
      )}

      {platform && fallback.available && (
        <label className="flex items-start gap-2 text-sm text-ink-2 dark:text-gray-300">
          <input type="checkbox" className="mt-0.5" checked={fallback.enabled !== false}
            onChange={e => setFallback(f => ({ ...f, enabled: e.target.checked }))} />
          <span>Fall back to the built-in Resend account (server environment) when no provider here or on the organisation works.</span>
        </label>
      )}

      <div className="flex items-center gap-3 flex-wrap pt-2">
        <button type="button" className="btn btn-primary disabled:opacity-60" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
        <span className="text-ink-8 dark:text-gray-700">|</span>
        <input className="form-input w-56" type="email" placeholder="you@yourcompany.com" aria-label="Test email address" value={testTo} onChange={e => setTestTo(e.target.value)} />
        <button type="button" className="btn btn-secondary disabled:opacity-60" disabled={testing} onClick={onTest}>{testing ? 'Sending…' : 'Send test email'}</button>
      </div>
      <p className="text-xs text-ink-4">The test uses the saved settings — save first.</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      {children}
    </label>
  )
}
