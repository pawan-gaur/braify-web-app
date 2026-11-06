import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'

const PROVIDERS = [
  { key: '',       label: 'None',        hint: null },
  { key: 'TWILIO', label: 'Twilio',      hint: 'Account SID + auth token from the Twilio console.' },
  { key: 'VONAGE', label: 'Vonage',      hint: 'API key + secret from the Vonage dashboard.' },
  { key: 'HTTP',   label: 'Custom HTTP', hint: 'Any SMS gateway with an HTTP API. Use {{to}}, {{from}} and {{text}} in the body.' },
]
const EMPTY = {
  provider: '', fromNumber: '', accountSid: '', authToken: '', apiKey: '', apiSecret: '',
  apiUrl: '', httpMethod: 'POST', contentType: 'JSON', bodyTemplate: '', authHeaderName: '', authHeaderValue: '',
}

/**
 * SMS provider settings (Twilio / Vonage / custom HTTP) — shared by Organization Settings (the org's
 * own provider) and Platform Settings (the default every org falls back to). Secrets are write-only:
 * the API returns them masked, and leaving a secret blank keeps the stored value.
 *
 * Props: load() → config, save(payload) → config, test(phone) → {success, message}, noneLabel
 */
export default function SmsProviderForm({ load, save, test, noneLabel = 'None' }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [masked, setMasked] = useState({})   // current masked secrets, shown as placeholders
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)

  const apply = cfg => {
    setForm({
      ...EMPTY,
      provider: cfg?.provider || '',
      fromNumber: cfg?.fromNumber || '', accountSid: cfg?.accountSid || '', apiKey: cfg?.apiKey || '',
      apiUrl: cfg?.apiUrl || '', httpMethod: cfg?.httpMethod || 'POST', contentType: cfg?.contentType || 'JSON',
      bodyTemplate: cfg?.bodyTemplate || '', authHeaderName: cfg?.authHeaderName || '',
    })
    setMasked({ authToken: cfg?.authToken, apiSecret: cfg?.apiSecret, authHeaderValue: cfg?.authHeaderValue })
  }

  useEffect(() => {
    load().then(apply).catch(e => toast.error(e.message)).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onSave = async () => {
    setSaving(true)
    try {
      apply(await save({ ...form, provider: form.provider || null }))
      toast.success(form.provider ? 'SMS provider saved.' : 'SMS provider removed.')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const onTest = async () => {
    if (!testTo.trim()) { toast.error('Enter a phone number to send the test to.'); return }
    setTesting(true)
    try {
      const r = await test(testTo.trim())
      r.success ? toast.success(r.message) : toast.error(r.message)
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
  const text = (key, label, placeholder = '') => (
    <Field label={label}>
      <input className="form-input" value={form[key]} placeholder={placeholder} onChange={e => set(key, e.target.value)} />
    </Field>
  )

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="SMS provider">
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
          {text('fromNumber', p === 'HTTP' ? 'Sender ID / number' : 'From number', '+15551234567')}
          {p === 'TWILIO' && <>{text('accountSid', 'Account SID', 'AC…')}{secret('authToken', 'Auth token')}</>}
          {p === 'VONAGE' && <>{text('apiKey', 'API key')}{secret('apiSecret', 'API secret')}</>}
          {p === 'HTTP' && <>
            {text('apiUrl', 'API URL', 'https://api.example.com/sms/send')}
            <Field label="Method / body">
              <div className="flex gap-2">
                <select className="form-input" value={form.httpMethod} onChange={e => set('httpMethod', e.target.value)}>
                  <option>POST</option><option>GET</option>
                </select>
                <select className="form-input" value={form.contentType} onChange={e => set('contentType', e.target.value)}>
                  <option value="JSON">JSON</option><option value="FORM">Form</option>
                </select>
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Body template">
                <textarea rows={3} className="form-input font-mono text-xs" value={form.bodyTemplate}
                  placeholder='{"to":"{{to}}","from":"{{from}}","message":"{{text}}"}' onChange={e => set('bodyTemplate', e.target.value)} />
              </Field>
            </div>
            {text('authHeaderName', 'Auth header (optional)', 'Authorization')}
            {secret('authHeaderValue', 'Auth header value')}
          </>}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap pt-2">
        <button type="button" className="btn btn-primary disabled:opacity-60" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
        <span className="text-ink-8 dark:text-gray-700">|</span>
        <input className="form-input w-48" placeholder="+250788123456" aria-label="Test phone number" value={testTo} onChange={e => setTestTo(e.target.value)} />
        <button type="button" className="btn btn-secondary disabled:opacity-60" disabled={testing} onClick={onTest}>{testing ? 'Sending…' : 'Send test SMS'}</button>
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
