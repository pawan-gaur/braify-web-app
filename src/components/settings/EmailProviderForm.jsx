import { useEffect, useState } from 'react'

/**
 * Reusable email-provider configuration form, shared by the org-settings
 * "Email" tab and the platform-admin default-provider page.
 *
 * Props:
 *   initial      – config response object (or null) used to seed the form once
 *   saving       – bool, disables the Save button
 *   testing      – bool, disables the Test button
 *   onSave(payload)  – async; payload is the provider request body
 *   onTest(payload)  – async; payload includes testRecipient
 *   fallbackNote – optional string rendered in the info banner
 *   showEnvFallback – platform scope only: render the built-in-Resend fallback toggle
 */

const PROVIDERS = [
  { key: 'RESEND',   label: 'Resend',   short: 'RS', color: '#000000' },
  { key: 'SENDGRID', label: 'SendGrid', short: 'SG', color: '#1a82e2' },
  { key: 'MAILGUN',  label: 'Mailgun',  short: 'MG', color: '#c02826' },
  { key: 'SMTP',     label: 'SMTP',     short: 'TP', color: '#475569' },
]

const EMPTY = {
  provider: '', fromEmail: '', fromName: '', replyTo: '',
  apiKey: '', mailgunDomain: '', mailgunRegion: 'US',
  smtpHost: '', smtpPort: '', smtpUsername: '', smtpPassword: '', smtpStartTls: true,
  testRecipient: '', envFallbackEnabled: true,
}

export default function EmailProviderForm({ initial, saving, testing, onSave, onTest, fallbackNote, showEnvFallback }) {
  const [form, setForm] = useState(EMPTY)

  // Seed from the loaded config (secrets always come back blank — masked).
  useEffect(() => {
    if (initial && (initial.configured || initial.envFallbackEnabled != null)) {
      setForm({
        provider:      initial.provider      || '',
        fromEmail:     initial.fromEmail     || '',
        fromName:      initial.fromName      || '',
        replyTo:       initial.replyTo       || '',
        apiKey:        '',
        mailgunDomain: initial.mailgunDomain || '',
        mailgunRegion: initial.mailgunRegion || 'US',
        smtpHost:      initial.smtpHost      || '',
        smtpPort:      initial.smtpPort != null ? String(initial.smtpPort) : '',
        smtpUsername:  initial.smtpUsername  || '',
        smtpPassword:  '',
        smtpStartTls:  initial.smtpStartTls != null ? initial.smtpStartTls : true,
        testRecipient: '',
        envFallbackEnabled: initial.envFallbackEnabled != null ? initial.envFallbackEnabled : true,
      })
    }
  }, [initial])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const buildPayload = () => ({
    provider:      form.provider || null,
    fromEmail:     form.fromEmail || null,
    fromName:      form.fromName || null,
    replyTo:       form.replyTo || null,
    // Secrets: only send when the user typed a new value (blank = keep existing)
    apiKey:        form.apiKey || null,
    mailgunDomain: form.mailgunDomain || null,
    mailgunRegion: form.mailgunRegion || null,
    smtpHost:      form.smtpHost || null,
    smtpPort:      form.smtpPort ? Number(form.smtpPort) : null,
    smtpUsername:  form.smtpUsername || null,
    smtpPassword:  form.smtpPassword || null,
    smtpStartTls:  form.smtpStartTls,
    ...(showEnvFallback ? { envFallbackEnabled: form.envFallbackEnabled } : {}),
  })

  const p = form.provider
  const masked = initial?.configured

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Credentials are stored securely</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              API keys and SMTP passwords are encrypted at rest and only displayed in masked form.
              Leave the secret fields blank to keep existing stored values unchanged.
              {fallbackNote ? ' ' + fallbackNote : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Provider + From identity ── */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Email Provider</h2>
            <p className="text-xs text-gray-400 mb-4">Choose which service delivers outbound email.</p>
            <div className="grid grid-cols-4 gap-3">
              {PROVIDERS.map(prov => (
                <button
                  key={prov.key}
                  type="button"
                  onClick={() => set('provider', prov.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                    ${p === prov.key
                      ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md'
                      : 'border-ink-7 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black"
                    style={{ background: prov.color }}>
                    {prov.short}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">
                    {prov.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Sender Identity</h2>
            <div>
              <label className="form-label">From Email <span className="text-red-400">*</span></label>
              <input type="email" className="form-input" placeholder="no-reply@yourdomain.com"
                value={form.fromEmail} onChange={e => set('fromEmail', e.target.value)} />
            </div>
            <div>
              <label className="form-label">From Name</label>
              <input type="text" className="form-input" placeholder="Acme Corp"
                value={form.fromName} onChange={e => set('fromName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Reply-To</label>
              <input type="email" className="form-input" placeholder="support@yourdomain.com"
                value={form.replyTo} onChange={e => set('replyTo', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Right: Provider-specific credentials ── */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {p === 'SMTP' ? 'SMTP Server' : 'Credentials'}
            </h2>

            {(p === 'RESEND' || p === 'SENDGRID' || p === 'MAILGUN') && (
              <div>
                <label className="form-label">API Key <span className="text-red-400">*</span></label>
                <input type="password" className="form-input font-mono" autoComplete="new-password"
                  placeholder={masked && initial?.apiKey ? initial.apiKey + ' — paste to replace' : 'Paste API key'}
                  value={form.apiKey} onChange={e => set('apiKey', e.target.value)} />
              </div>
            )}

            {p === 'MAILGUN' && (
              <>
                <div>
                  <label className="form-label">Sending Domain <span className="text-red-400">*</span></label>
                  <input type="text" className="form-input" placeholder="mg.yourdomain.com"
                    value={form.mailgunDomain} onChange={e => set('mailgunDomain', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">API Region</label>
                  <select className="form-input" value={form.mailgunRegion}
                    onChange={e => set('mailgunRegion', e.target.value)}>
                    <option value="US">US (api.mailgun.net)</option>
                    <option value="EU">EU (api.eu.mailgun.net)</option>
                  </select>
                </div>
              </>
            )}

            {p === 'SMTP' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="form-label">Host <span className="text-red-400">*</span></label>
                    <input type="text" className="form-input" placeholder="smtp.yourhost.com"
                      value={form.smtpHost} onChange={e => set('smtpHost', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Port <span className="text-red-400">*</span></label>
                    <input type="number" className="form-input" placeholder="587"
                      value={form.smtpPort} onChange={e => set('smtpPort', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Username</label>
                  <input type="text" className="form-input" autoComplete="off" placeholder="smtp username"
                    value={form.smtpUsername} onChange={e => set('smtpUsername', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input font-mono" autoComplete="new-password"
                    placeholder={masked && initial?.smtpPassword ? initial.smtpPassword + ' — paste to replace' : 'smtp password'}
                    value={form.smtpPassword} onChange={e => set('smtpPassword', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.smtpStartTls}
                    onChange={e => set('smtpStartTls', e.target.checked)} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Enable STARTTLS</span>
                </label>
              </>
            )}

            {!p && (
              <p className="text-xs text-gray-400">Select a provider above to configure its credentials.</p>
            )}
          </div>

          {/* Test email */}
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Send a Test Email</h2>
            <p className="text-xs text-gray-400">Save first, then send a test using the saved configuration.</p>
            <div className="flex gap-2">
              <input type="email" className="form-input flex-1" placeholder="you@example.com"
                value={form.testRecipient} onChange={e => set('testRecipient', e.target.value)} />
              <button type="button" disabled={testing || !form.testRecipient}
                onClick={() => onTest({ testRecipient: form.testRecipient })}
                className="btn btn-outline whitespace-nowrap">
                {testing ? 'Sending…' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Built-in fallback (platform scope only) */}
      {showEnvFallback && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Built-in Resend fallback</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                When an organisation has no provider and this platform default isn't usable, fall back to the
                built-in Resend credentials from the server configuration.
                {' '}
                {initial?.envFallbackAvailable
                  ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">Built-in credentials are present.</span>
                  : <span className="text-amber-600 dark:text-amber-400 font-medium">No built-in credentials are set on the server.</span>}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <input type="checkbox" checked={form.envFallbackEnabled}
                onChange={e => set('envFallbackEnabled', e.target.checked)} />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {form.envFallbackEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button type="button" onClick={() => onSave(buildPayload())} disabled={saving}
          className="btn btn-primary px-8">
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
    </div>
  )
}
