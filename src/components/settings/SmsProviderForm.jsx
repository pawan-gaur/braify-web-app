import { useEffect, useState } from 'react'

/**
 * Reusable SMS-provider configuration form, shared by the org-settings "SMS" tab
 * and the platform-admin default-provider page.
 *
 * Props: initial, saving, testing, onSave(payload), onTest(payload), fallbackNote
 */

const PROVIDERS = [
  { key: 'TWILIO', label: 'Twilio',      short: 'TW',  color: '#f22f46' },
  { key: 'VONAGE', label: 'Vonage',      short: 'VO',  color: '#871fff' },
  { key: 'HTTP',   label: 'Custom HTTP', short: 'API', color: '#0ea5e9' },
]

const DEFAULT_BODY = '{"to":"{{to}}","from":"{{from}}","text":"{{text}}"}'

const EMPTY = {
  provider: '', fromNumber: '',
  accountSid: '', authToken: '',
  apiKey: '', apiSecret: '',
  apiUrl: '', httpMethod: 'POST', contentType: 'JSON', bodyTemplate: DEFAULT_BODY,
  authHeaderName: '', authHeaderValue: '',
  testRecipient: '',
}

export default function SmsProviderForm({ initial, saving, testing, onSave, onTest, fallbackNote }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (initial && initial.configured) {
      setForm({
        provider:    initial.provider    || '',
        fromNumber:  initial.fromNumber  || '',
        accountSid:  initial.accountSid  || '',   // identifier — returned in clear
        authToken:   '',                          // secret — masked, seed blank
        apiKey:      initial.apiKey      || '',
        apiSecret:   '',
        apiUrl:         initial.apiUrl         || '',
        httpMethod:     initial.httpMethod     || 'POST',
        contentType:    initial.contentType    || 'JSON',
        bodyTemplate:   initial.bodyTemplate   || DEFAULT_BODY,
        authHeaderName: initial.authHeaderName || '',
        authHeaderValue: '',                      // secret — masked, seed blank
        testRecipient: '',
      })
    }
  }, [initial])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const buildPayload = () => ({
    provider:   form.provider || null,
    fromNumber: form.fromNumber || null,
    accountSid: form.accountSid || null,
    authToken:  form.authToken || null,   // only sent when typed (blank = keep existing)
    apiKey:     form.apiKey || null,
    apiSecret:  form.apiSecret || null,
    apiUrl:         form.apiUrl || null,
    httpMethod:     form.httpMethod || null,
    contentType:    form.contentType || null,
    bodyTemplate:   form.bodyTemplate || null,
    authHeaderName: form.authHeaderName || null,
    authHeaderValue: form.authHeaderValue || null,   // only sent when typed
  })

  const p = form.provider
  const masked = initial?.configured

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Credentials are stored securely</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Auth tokens and API secrets are encrypted at rest and only displayed in masked form.
              Leave the secret fields blank to keep existing stored values unchanged.
              {fallbackNote ? ' ' + fallbackNote : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider + sender */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">SMS Provider</h2>
            <p className="text-xs text-gray-400 mb-4">Choose which service delivers outbound text messages.</p>
            <div className="grid grid-cols-3 gap-3">
              {PROVIDERS.map(prov => (
                <button key={prov.key} type="button" onClick={() => set('provider', prov.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${p === prov.key
                      ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md'
                      : 'border-ink-7 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black"
                    style={{ background: prov.color }}>{prov.short}</div>
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{prov.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Sender</h2>
            <div>
              <label className="form-label">From Number / Sender ID <span className="text-red-400">*</span></label>
              <input type="text" className="form-input" placeholder="+15551234567"
                value={form.fromNumber} onChange={e => set('fromNumber', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">E.164 phone number, or an alphanumeric sender id where supported.</p>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Credentials</h2>

            {p === 'TWILIO' && (
              <>
                <div>
                  <label className="form-label">Account SID <span className="text-red-400">*</span></label>
                  <input type="text" className="form-input font-mono" autoComplete="off" placeholder="ACxxxxxxxx"
                    value={form.accountSid} onChange={e => set('accountSid', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Auth Token <span className="text-red-400">*</span></label>
                  <input type="password" className="form-input font-mono" autoComplete="new-password"
                    placeholder={masked && initial?.authToken ? initial.authToken + ' — paste to replace' : 'Paste auth token'}
                    value={form.authToken} onChange={e => set('authToken', e.target.value)} />
                </div>
              </>
            )}

            {p === 'VONAGE' && (
              <>
                <div>
                  <label className="form-label">API Key <span className="text-red-400">*</span></label>
                  <input type="text" className="form-input font-mono" autoComplete="off" placeholder="abcd1234"
                    value={form.apiKey} onChange={e => set('apiKey', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">API Secret <span className="text-red-400">*</span></label>
                  <input type="password" className="form-input font-mono" autoComplete="new-password"
                    placeholder={masked && initial?.apiSecret ? initial.apiSecret + ' — paste to replace' : 'Paste API secret'}
                    value={form.apiSecret} onChange={e => set('apiSecret', e.target.value)} />
                </div>
              </>
            )}

            {p === 'HTTP' && (
              <>
                <div>
                  <label className="form-label">Endpoint URL <span className="text-red-400">*</span></label>
                  <input type="text" className="form-input font-mono" autoComplete="off"
                    placeholder="https://api.smsprovider.com/v1/messages"
                    value={form.apiUrl} onChange={e => set('apiUrl', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Method</label>
                    <select className="form-input" value={form.httpMethod} onChange={e => set('httpMethod', e.target.value)}>
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Body format</label>
                    <select className="form-input" value={form.contentType} onChange={e => set('contentType', e.target.value)}>
                      <option value="JSON">JSON</option>
                      <option value="FORM">Form-encoded</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">
                    {form.httpMethod === 'GET' ? 'Query template' : 'Body template'} <span className="text-red-400">*</span>
                  </label>
                  <textarea rows={3} className="form-input resize-none font-mono text-xs"
                    value={form.bodyTemplate} onChange={e => set('bodyTemplate', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">
                    Placeholders: <code>{'{{to}}'}</code>, <code>{'{{from}}'}</code>, <code>{'{{text}}'}</code>.
                    They are auto-escaped for the chosen format.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Auth header name</label>
                    <input type="text" className="form-input font-mono" autoComplete="off" placeholder="Authorization"
                      value={form.authHeaderName} onChange={e => set('authHeaderName', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Auth header value</label>
                    <input type="password" className="form-input font-mono" autoComplete="new-password"
                      placeholder={masked && initial?.authHeaderValue ? initial.authHeaderValue + ' — paste to replace' : 'Bearer …'}
                      value={form.authHeaderValue} onChange={e => set('authHeaderValue', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {!p && <p className="text-xs text-gray-400">Select a provider above to configure its credentials.</p>}
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Send a Test SMS</h2>
            <p className="text-xs text-gray-400">Save first, then send a test using the saved configuration.</p>
            <div className="flex gap-2">
              <input type="text" className="form-input flex-1" placeholder="+15559876543"
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

      <div className="flex justify-end">
        <button type="button" onClick={() => onSave(buildPayload())} disabled={saving}
          className="btn btn-primary px-8">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
