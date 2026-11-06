import { useCallback, useEffect, useState } from 'react'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import LockedFeature from '../components/billing/LockedFeature'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { fmtDateTime } from '../utils/date'
import {
  getWebhookEventTypes, listWebhooks, createWebhook, updateWebhook, deleteWebhook,
  rotateWebhookSecret, testWebhook, listWebhookDeliveries, retryWebhookDelivery,
} from '../services/api'

const CRUMBS = [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Webhooks' }]

const EVENT_LABELS = {
  'esign.document.sent': 'E-sign document sent',
  'esign.document.viewed': 'E-sign document viewed',
  'esign.signer.signed': 'A signer signed',
  'esign.document.completed': 'E-sign document completed',
  'esign.document.cancelled': 'E-sign document cancelled',
  'esign.document.expired': 'E-sign document expired',
  'bulk_email.job.finished': 'Bulk email campaign finished',
  'pdf.bulk.finished': 'Bulk PDF generation finished',
  'file.uploaded': 'File uploaded',
}

const VERIFY_SNIPPET = `// Node.js — verify the Braify-Signature header (use the raw request body)
const crypto = require('crypto')
function verify(rawBody, header, secret) {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')))
  const expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + rawBody).digest('hex')
  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  return ok && Math.abs(Date.now() / 1000 - Number(parts.t)) < 300   // reject replays older than 5 min
}`

/**
 * Outgoing webhooks: connect Zapier / Make (via their "catch hook" URL) or your own systems to
 * Braify events. Org admins only; a paid feature (the API also enforces it).
 */
export default function WebhooksPage() {
  useDocumentTitle('Webhooks')
  const { user, bulkEnabled } = useAuth()
  const toast = useToast()
  const orgId = user?.organizationId

  const [types, setTypes]         = useState([])
  const [endpoints, setEndpoints] = useState(null)
  const [error, setError]         = useState(null)
  const [form, setForm]           = useState({ url: '', description: '', events: [] })
  const [saving, setSaving]       = useState(false)
  const [secret, setSecret]       = useState(null)     // shown once
  const [deliveries, setDeliveries] = useState(null)   // { endpoint, page }

  const load = useCallback(() => {
    if (!orgId) return
    listWebhooks(orgId).then(setEndpoints).catch(e => setError(e.message))
  }, [orgId])

  useEffect(() => {
    if (!orgId || !bulkEnabled) return
    getWebhookEventTypes(orgId).then(setTypes).catch(() => {})
    load()
  }, [orgId, bulkEnabled, load])

  if (!orgId) {
    return <div className="max-w-3xl mx-auto px-6 py-8"><Breadcrumbs items={CRUMBS} />
      <p className="text-sm text-ink-3 mt-6">Webhooks are configured per organisation by its org admin.</p></div>
  }
  if (!bulkEnabled) {
    return <LockedFeature title="Webhooks & integrations"
      description="Send Braify events (document signed, campaign finished, file uploaded…) to Zapier, Make or your own systems in real time." />
  }

  const toggleEvent = (t) => setForm(f => ({ ...f, events: f.events.includes(t) ? f.events.filter(x => x !== t) : [...f.events, t] }))

  const add = async (e) => {
    e.preventDefault()
    if (!form.url.trim()) { toast.error('Enter the endpoint URL.'); return }
    setSaving(true)
    try {
      const created = await createWebhook(orgId, { url: form.url.trim(), description: form.description.trim(), events: form.events })
      setSecret({ url: created.url, value: created.secret })
      setForm({ url: '', description: '', events: [] })
      load()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const act = async (fn, ok) => {
    try { const r = await fn(); if (ok) toast.success(ok); load(); return r } catch (err) { toast.error(err.message) }
  }

  const openDeliveries = async (ep, page = 0) => {
    try { setDeliveries({ endpoint: ep, page, data: await listWebhookDeliveries(orgId, ep.id, page) }) }
    catch (err) { toast.error(err.message) }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />
      <div className="mt-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Webhooks</h1>
        <p className="text-sm text-ink-3 mt-1">
          Send Braify events to Zapier, Make or your own systems. For Zapier, use a “Catch Hook” URL from
          “Webhooks by Zapier”; for Make, a “Custom webhook” URL.
        </p>
      </div>

      {error && <div className="alert-error border rounded-xl px-4 py-3 text-sm mb-6">{error}</div>}

      {/* Secret shown once */}
      {secret && (
        <div className="alert-success border rounded-xl px-4 py-4 mb-6 text-sm">
          <p className="font-semibold">Signing secret for {secret.url}</p>
          <p className="mt-1">Copy it now — it won’t be shown again. Use it to verify the <code>Braify-Signature</code> header.</p>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 truncate bg-white/70 dark:bg-black/20 rounded-lg px-3 py-2 font-mono text-xs">{secret.value}</code>
            <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText(secret.value); toast.success('Copied') }}>Copy</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSecret(null)}>Done</button>
          </div>
        </div>
      )}

      {/* Add endpoint */}
      <form onSubmit={add} className="card p-5 sm:p-6 mb-6 space-y-4">
        <h2 className="text-[15px] font-bold text-ink dark:text-white">Add endpoint</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label" htmlFor="wh-url">Endpoint URL</label>
            <input id="wh-url" className="form-input" placeholder="https://hooks.zapier.com/hooks/catch/…"
              value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="wh-desc">Description (optional)</label>
            <input id="wh-desc" className="form-input" placeholder="e.g. Zapier → Google Sheets"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <fieldset>
          <legend className="form-label">Events <span className="font-normal text-ink-4">(none selected = all)</span></legend>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            {types.map(t => (
              <label key={t} className="flex items-center gap-2 text-sm text-ink-2 dark:text-gray-300">
                <input type="checkbox" checked={form.events.includes(t)} onChange={() => toggleEvent(t)} />
                {EVENT_LABELS[t] || t} <code className="text-[11px] text-ink-4">{t}</code>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">{saving ? 'Adding…' : 'Add endpoint'}</button>
      </form>

      {/* Endpoints */}
      <div className="space-y-3">
        {endpoints === null ? <div className="skeleton h-20 rounded-card" />
          : endpoints.length === 0 ? <p className="text-sm text-ink-3">No endpoints yet.</p>
          : endpoints.map(ep => (
            <div key={ep.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-ink dark:text-white truncate">{ep.url}</p>
                  <p className="text-xs text-ink-3 mt-1">
                    {ep.description ? `${ep.description} · ` : ''}
                    {ep.events?.length ? `${ep.events.length} event${ep.events.length === 1 ? '' : 's'}` : 'All events'}
                    {ep.lastDeliveryAt ? ` · last delivery ${fmtDateTime(ep.lastDeliveryAt)} (${ep.lastStatusCode ?? 'no response'})` : ''}
                  </p>
                  {ep.consecutiveFailures > 0 && (
                    <p className="text-xs text-danger mt-1">{ep.consecutiveFailures} failed deliveries in a row — check the endpoint.</p>
                  )}
                </div>
                <span className={`badge ${ep.active ? 'badge-success' : 'badge-gray'}`}>{ep.active ? 'Active' : 'Disabled'}</span>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => act(() => testWebhook(orgId, ep.id), 'Test event queued — it arrives within a few seconds.')}>Send test</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openDeliveries(ep)}>Deliveries</button>
                <button className="btn btn-ghost btn-sm" onClick={() => act(() => updateWebhook(orgId, ep.id, { active: !ep.active }), ep.active ? 'Disabled' : 'Enabled')}>
                  {ep.active ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={async () => {
                  if (!window.confirm('Rotate the signing secret? Your receiver must switch to the new secret.')) return
                  const s = await act(() => rotateWebhookSecret(orgId, ep.id))
                  if (s) setSecret({ url: ep.url, value: s })
                }}>Rotate secret</button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => {
                  if (window.confirm('Delete this endpoint? Pending deliveries will stop.')) act(() => deleteWebhook(orgId, ep.id), 'Endpoint deleted')
                }}>Delete</button>
              </div>

              {deliveries?.endpoint?.id === ep.id && (
                <div className="mt-4 border-t border-ink-8 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-4">Recent deliveries</p>
                    <button className="text-xs text-ink-4 hover:text-ink-2" onClick={() => setDeliveries(null)}>Close</button>
                  </div>
                  {(deliveries.data?.content || []).length === 0 ? <p className="text-sm text-ink-3">No deliveries yet.</p> : (
                    <ul className="divide-y divide-ink-8 dark:divide-gray-700 text-sm">
                      {deliveries.data.content.map(d => (
                        <li key={d.id} className="py-2 flex items-center justify-between gap-3 flex-wrap">
                          <span className="min-w-0">
                            <code className="text-xs">{d.eventType}</code>
                            <span className="text-xs text-ink-4 ml-2">{fmtDateTime(d.createdAt)} · attempt {d.attempts}{d.lastError ? ` · ${d.lastError}` : ''}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className={`badge ${d.status === 'SUCCEEDED' ? 'badge-success' : d.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>{d.status}</span>
                            {d.status === 'FAILED' && (
                              <button className="text-xs font-semibold text-brand" onClick={async () => {
                                await act(() => retryWebhookDelivery(orgId, d.id), 'Queued for retry'); openDeliveries(ep, deliveries.page)
                              }}>Retry</button>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Docs */}
      <div className="card p-5 sm:p-6 mt-6">
        <h2 className="text-[15px] font-bold text-ink dark:text-white">Payload & signature</h2>
        <p className="text-sm text-ink-3 mt-1">
          Each event is POSTed as JSON <code>{'{ id, type, createdAt, orgId, data }'}</code> with headers
          <code> Braify-Event</code>, <code>Braify-Delivery</code> and <code>Braify-Signature: t=…,v1=…</code>.
          Failed deliveries are retried for about a day (1m → 12h). Return any 2xx status to acknowledge.
        </p>
        <pre className="mt-3 text-xs bg-ink-8 dark:bg-gray-900 rounded-xl p-4 overflow-x-auto"><code>{VERIFY_SNIPPET}</code></pre>
      </div>
    </div>
  )
}
