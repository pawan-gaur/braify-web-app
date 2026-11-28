/**
 * One invoice (Platform Admin): review a draft, add extra lines (fees, discounts, credits),
 * recalculate, issue (number + email), download the PDF and the daily usage spreadsheet.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  invoiceGet, invoiceRecalculate, invoiceUpdate, invoiceDelete, invoiceIssue, invoiceSend, invoicePdf, invoiceUsageXlsx,
} from '../services/api'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { listUrl } from '../hooks/useUrlState'
import { useToast } from '../context/ToastContext'
import { fmtDateTime } from '../utils/date'
import { formatMoney, fmtPeriod, saveBlob, invoiceFileName, isOpen } from '../utils/invoicing'
import InvoiceStatusBadge from '../components/invoicing/InvoiceStatusBadge'
import InvoiceAccountPanel from '../components/invoicing/InvoiceAccountPanel'

const num = v => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [inv, setInv] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState('')
  const [edit, setEdit] = useState(null)        // { note, internalNote, manualLines: [...] }
  const [confirmIssue, setConfirmIssue] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)

  const load = useCallback(() => {
    invoiceGet(id).then(i => { setInv(i); setError(null) }).catch(setError)
  }, [id])
  useEffect(() => { load() }, [load])

  const draft = inv?.status === 'DRAFT'
  const act = async (key, fn, ok) => {
    setBusy(key)
    try {
      const r = await fn()
      if (r && r.id) setInv(r)
      if (ok) toast.success(typeof ok === 'function' ? ok(r) : ok)
      return r
    } catch (err) {
      toast.error(err.message)
      if (err.status === 409) load()
      return null
    } finally {
      setBusy('')
    }
  }

  const startEdit = () => setEdit({
    note: inv.note || '', internalNote: inv.internalNote || '',
    manualLines: inv.lines.filter(l => l.type === 'MANUAL').map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
  })
  const saveEdit = async () => {
    const body = {
      note: edit.note, internalNote: edit.internalNote,
      manualLines: edit.manualLines.map(l => ({ description: l.description, quantity: String(l.quantity ?? 1), unitPrice: String(l.unitPrice ?? 0) })),
    }
    if (await act('save', () => invoiceUpdate(id, body), 'Draft updated.')) setEdit(null)
  }
  const download = async (kind) => {
    setBusy(kind)
    try {
      const blob = kind === 'pdf' ? await invoicePdf(id) : await invoiceUsageXlsx(id)
      saveBlob(blob, invoiceFileName(inv, kind === 'pdf' ? '.pdf' : '-usage.xlsx'))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy('')
    }
  }
  const remove = async () => {
    if (!window.confirm('Delete this draft invoice?')) return
    if (await act('delete', () => invoiceDelete(id).then(() => ({})), 'Draft deleted.')) navigate(listUrl('/invoicing'))
  }
  const issue = async () => {
    const r = await act('issue', () => invoiceIssue(id, sendEmail),
      r => r.emailError ? `Issued as ${r.number}, but the email failed.` : sendEmail ? `Issued as ${r.number} and emailed.` : `Issued as ${r.number}.`)
    if (r) setConfirmIssue(false)
  }

  const crumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Invoicing', to: '/invoicing' }, { label: inv?.number || 'Draft invoice' }]
  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto"><Breadcrumbs items={crumbs} />
        <div className="card p-10 mt-4 text-center text-sm text-gray-500">{error.status === 404 ? 'This invoice no longer exists.' : error.message}</div>
      </div>
    )
  }
  if (!inv) return <div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>

  const cur = inv.currency
  const anyEstimated = inv.lines.some(l => l.estimated)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 mb-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{inv.number || 'Draft invoice'}</h1>
            <InvoiceStatusBadge status={inv.status} />
            {inv.origin === 'AUTOMATIC' && <span className="text-xs text-gray-400">created by the monthly run</span>}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{inv.orgName} · {fmtPeriod(inv.periodFrom, inv.periodTo)}</p>
          {inv.issueDate && <p className="text-xs text-gray-500 mt-0.5">Issued {inv.issueDate} by {inv.issuedBy} · due {inv.dueDate}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" disabled={!!busy} onClick={() => download('pdf')}>{busy === 'pdf' ? 'Preparing…' : draft ? 'Preview PDF' : 'Download PDF'}</button>
          <button className="btn btn-secondary btn-sm" disabled={!!busy} onClick={() => download('xlsx')}>{busy === 'xlsx' ? 'Preparing…' : 'Usage (Excel)'}</button>
          {draft && <>
            <button className="btn btn-secondary btn-sm" disabled={!!busy} onClick={() => act('recalc', () => invoiceRecalculate(id), 'Recalculated with current usage and prices.')}>
              {busy === 'recalc' ? 'Recalculating…' : 'Recalculate'}</button>
            <button className="btn btn-secondary btn-sm text-rose-600" disabled={!!busy} onClick={remove}>Delete draft</button>
            <button className="btn btn-primary btn-sm" disabled={!!busy || !!edit} onClick={() => setConfirmIssue(true)}>Issue invoice</button>
          </>}
          {(isOpen(inv.status) || inv.status === 'PAID') && (
            <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => act('send', () => invoiceSend(id),
              r => r.emailError ? 'Email failed — see below.' : `Emailed to ${r.billingEmails.length} address(es).`)}>
              {busy === 'send' ? 'Sending…' : inv.emailedAt ? 'Email again' : 'Email invoice'}</button>
          )}
        </div>
      </div>

      {inv.emailError && (
        <div className="alert-error border rounded-xl px-4 py-3 text-sm mb-4">Email failed: {inv.emailError}</div>
      )}
      {inv.emailedAt && !inv.emailError && (
        <p className="text-xs text-green-700 dark:text-green-400 mb-4">Emailed {fmtDateTime(inv.emailedAt)} to {inv.billingEmails.join(', ')}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <section className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Unit price</th><th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lines.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 dark:border-gray-700/60 align-top">
                      <td className="px-4 py-2.5">
                        <span className="text-gray-800 dark:text-gray-100">{l.description}</span>
                        {l.type === 'MANUAL' && <span className="ml-1.5 text-[10px] font-semibold text-violet-600">extra</span>}
                        {l.estimated && <span className="ml-1.5 text-[10px] font-semibold text-amber-600" title={l.note || ''}>estimated</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {l.type === 'USAGE' ? <>
                          {num(l.quantity)} {l.unit}
                          {Number(l.included) > 0 && <div className="text-[11px] text-gray-400">{num(l.included)} included · {num(l.billable)} charged</div>}
                        </> : num(l.billable)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatMoney(l.unitPrice, cur)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap font-medium">{formatMoney(l.amount, cur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 flex justify-end">
              <table className="text-sm">
                <tbody>
                  <tr><td className="pr-8 py-1 text-gray-500">Subtotal</td><td className="text-right tabular-nums">{formatMoney(inv.subtotal, cur)}</td></tr>
                  {inv.taxes.map(t => <tr key={t.name}><td className="pr-8 py-1 text-gray-500">{t.name} ({Number(t.ratePercent)}%)</td><td className="text-right tabular-nums">{formatMoney(t.amount, cur)}</td></tr>)}
                  <tr className="border-t border-gray-300 dark:border-gray-600"><td className="pr-8 py-1.5 font-bold">Total</td><td className="text-right tabular-nums font-bold text-base">{formatMoney(inv.total, cur)}</td></tr>
                  {Number(inv.amountPaid) > 0 && <>
                    <tr><td className="pr-8 py-1 text-gray-500">Paid</td><td className="text-right tabular-nums text-green-700 dark:text-green-400">-{formatMoney(inv.amountPaid, cur)}</td></tr>
                    <tr><td className="pr-8 py-1 font-bold">Balance due</td><td className="text-right tabular-nums font-bold">{formatMoney(inv.balance, cur)}</td></tr>
                  </>}
                </tbody>
              </table>
            </div>
            {anyEstimated && <p className="px-4 pb-3 text-[11px] text-amber-700 dark:text-amber-300">Some lines are estimated: daily figures weren't recorded for part of this period, so monthly totals were prorated.</p>}
          </section>

          {!draft && inv.status !== 'ISSUING' && <InvoiceAccountPanel inv={inv} onChange={setInv} onVoided={load} />}

          {draft && (
            <section className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Extra lines & notes</h2>
                {!edit && <button className="btn btn-secondary btn-sm" onClick={startEdit}>Edit</button>}
              </div>
              {!edit ? (
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p>{inv.lines.filter(l => l.type === 'MANUAL').length} extra line(s). Note on invoice: {inv.note || '—'}</p>
                  {inv.internalNote && <p className="text-xs text-gray-500">Internal: {inv.internalNote}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {edit.manualLines.map((l, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className="form-input col-span-6" placeholder="Setup fee, discount, credit…" aria-label={`Line ${i + 1} description`} maxLength={200}
                        value={l.description} onChange={e => setEdit(s => ({ ...s, manualLines: s.manualLines.map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))} />
                      <input className="form-input col-span-2" type="number" step="0.0001" aria-label={`Line ${i + 1} quantity`}
                        value={l.quantity ?? 1} onChange={e => setEdit(s => ({ ...s, manualLines: s.manualLines.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x) }))} />
                      <input className="form-input col-span-3" type="number" step="0.000001" aria-label={`Line ${i + 1} unit price (negative for a discount)`}
                        value={l.unitPrice ?? 0} onChange={e => setEdit(s => ({ ...s, manualLines: s.manualLines.map((x, j) => j === i ? { ...x, unitPrice: e.target.value } : x) }))} />
                      <button type="button" className="col-span-1 text-xs text-rose-600 hover:underline" aria-label={`Remove line ${i + 1}`}
                        onClick={() => setEdit(s => ({ ...s, manualLines: s.manualLines.filter((_, j) => j !== i) }))}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="text-xs font-semibold text-brand hover:underline"
                    onClick={() => setEdit(s => ({ ...s, manualLines: [...s.manualLines, { description: '', quantity: 1, unitPrice: 0 }] }))}>+ Add line</button>
                  <p className="text-[11px] text-gray-400">Quantity × unit price. Use a negative unit price for a discount or credit. Taxes apply to the new subtotal.</p>
                  <div><label className="form-label" htmlFor="inv-note">Note printed on the invoice</label>
                    <input id="inv-note" className="form-input" maxLength={500} value={edit.note} onChange={e => setEdit(s => ({ ...s, note: e.target.value }))} /></div>
                  <div><label className="form-label" htmlFor="inv-inote">Internal note (not printed)</label>
                    <textarea id="inv-inote" className="form-input min-h-[70px]" maxLength={2000} value={edit.internalNote} onChange={e => setEdit(s => ({ ...s, internalNote: e.target.value }))} /></div>
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary btn-sm" disabled={busy === 'save'} onClick={() => setEdit(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" disabled={busy === 'save'} onClick={saveEdit}>{busy === 'save' ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card p-5 text-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Bill to</h2>
            <Party p={inv.billTo} />
            <p className="text-xs text-gray-500 mt-2">{(inv.billingEmails || []).join(', ') || 'No billing email'}</p>
            <p className="text-xs text-gray-500 mt-1">{inv.paymentTermsDays ? `Net ${inv.paymentTermsDays} days` : 'Due on receipt'}</p>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">From</h2>
            <Party p={inv.seller} />
          </section>
          <section className="card p-5 text-xs text-gray-500 space-y-1">
            <p>Prices: {inv.rateCardSource === 'ORG' ? "organisation's own" : 'plan default'} ({cur})</p>
            {inv.calculatedAt && <p>Calculated {fmtDateTime(inv.calculatedAt)}</p>}
            <p>Created {fmtDateTime(inv.createdAt)} by {inv.createdBy}</p>
            {draft && <p className="pt-1">Drafts show the current billing details; issuing freezes them.</p>}
          </section>
        </aside>
      </div>

      {confirmIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !busy && setConfirmIssue(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="iss-title" className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 id="iss-title" className="text-base font-bold text-gray-800 dark:text-gray-100">Issue this invoice?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {inv.orgName} · {fmtPeriod(inv.periodFrom, inv.periodTo)} · <b>{formatMoney(inv.total, cur)}</b>.
              It gets the next invoice number and can't be edited afterwards (only voided with a credit note).
            </p>
            {anyEstimated && <p className="text-xs text-amber-700 dark:text-amber-300">Some lines are estimated.</p>}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
              Email it now to {(inv.billingEmails || []).join(', ') || 'the billing contacts'}
            </label>
            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary" disabled={busy === 'issue'} onClick={() => setConfirmIssue(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy === 'issue'} onClick={issue}>{busy === 'issue' ? 'Issuing…' : 'Issue invoice'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Party({ p }) {
  if (!p || !p.legalName) return <p className="text-gray-400">Not set</p>
  return (
    <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
      <p className="font-semibold">{p.legalName}</p>
      {p.addressLine1 && <p>{p.addressLine1}</p>}
      {p.addressLine2 && <p>{p.addressLine2}</p>}
      {(p.city || p.state || p.postalCode) && <p>{[p.city, p.state, p.postalCode].filter(Boolean).join(', ')}</p>}
      {p.country && <p>{p.country}</p>}
      {p.taxId && <p className="text-xs text-gray-500">Tax ID: {p.taxId}</p>}
    </div>
  )
}
