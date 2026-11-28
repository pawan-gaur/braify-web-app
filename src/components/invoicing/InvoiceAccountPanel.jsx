import { useState } from 'react'
import {
  invoiceRecordPayment, invoiceDeletePayment, invoiceSetReminders, invoiceVoid, creditNotePdf, creditNoteSend,
} from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { fmtDateTime } from '../../utils/date'
import { PAYMENT_METHODS, REMINDER_LABEL, formatMoney, isOpen, saveBlob } from '../../utils/invoicing'

/**
 * Issued invoice → payments (record / remove), reminders (history, pause) and void with a credit
 * note. `onChange(invoice)` receives the updated invoice; `onVoided()` asks the page to reload.
 */
export default function InvoiceAccountPanel({ inv, onChange, onVoided }) {
  const toast = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const [pay, setPay] = useState(null)       // payment form
  const [voiding, setVoiding] = useState(null)
  const [busy, setBusy] = useState('')
  const cur = inv.currency
  const open = isOpen(inv.status)
  const methodLabel = v => PAYMENT_METHODS.find(m => m.value === v)?.label || v

  const run = async (key, fn, ok) => {
    setBusy(key)
    try {
      const r = await fn()
      if (ok) toast.success(typeof ok === 'function' ? ok(r) : ok)
      return r
    } catch (err) {
      toast.error(err.message)
      return null
    } finally {
      setBusy('')
    }
  }

  const savePayment = async (e) => {
    e.preventDefault()
    const r = await run('pay', () => invoiceRecordPayment(inv.id, { ...pay, amount: String(pay.amount) }),
      r => r.status === 'PAID' ? 'Payment recorded — the invoice is paid.' : 'Payment recorded.')
    if (r) { onChange(r); setPay(null) }
  }
  const removePayment = async (p) => {
    if (!window.confirm(`Remove the payment of ${formatMoney(p.amount, cur)} on ${p.date}?`)) return
    const r = await run('del-' + p.id, () => invoiceDeletePayment(inv.id, p.id), 'Payment removed.')
    if (r) onChange(r)
  }
  const togglePause = async () => {
    const r = await run('pause', () => invoiceSetReminders(inv.id, !inv.remindersPaused),
      inv.remindersPaused ? 'Reminders resumed.' : 'Reminders paused.')
    if (r) onChange(r)
  }
  const doVoid = async (e) => {
    e.preventDefault()
    const cn = await run('void', () => invoiceVoid(inv.id, voiding.reason, voiding.sendEmail),
      cn => cn.emailError ? `Voided with ${cn.number}, but the email failed.` : `Voided with credit note ${cn.number}.`)
    if (cn) { setVoiding(null); onVoided() }
  }
  const downloadCn = () => run('cn', async () => saveBlob(await creditNotePdf(inv.creditNoteId), `${inv.creditNoteNumber}.pdf`))

  return (
    <div className="space-y-4">
      {inv.status === 'VOID' && (
        <section className="card p-5 border-l-4 border-slate-400">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Voided</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Cancelled {fmtDateTime(inv.voidedAt)} by {inv.voidedBy}. Reason: {inv.voidReason}
          </p>
          {inv.creditNoteId && (
            <div className="flex gap-2 mt-3">
              <button className="btn btn-secondary btn-sm" disabled={!!busy} onClick={downloadCn}>Credit note {inv.creditNoteNumber} (PDF)</button>
              <button className="btn btn-secondary btn-sm" disabled={!!busy}
                onClick={() => run('cn-send', () => creditNoteSend(inv.creditNoteId), r => r.emailError ? `Email failed: ${r.emailError}` : 'Credit note emailed.')}>
                Email credit note</button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">The period {inv.periodFrom} → {inv.periodTo} can be invoiced again.</p>
        </section>
      )}

      {inv.status !== 'VOID' && (
        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payments</h2>
            {open && !pay && (
              <button className="btn btn-primary btn-sm" onClick={() => setPay({ date: today, amount: inv.balance, method: 'BANK_TRANSFER', reference: '', note: '' })}>
                Record payment</button>
            )}
          </div>
          {(inv.payments || []).length === 0 ? <p className="text-sm text-gray-400">No payments recorded.</p> : (
            <table className="w-full text-sm mb-2">
              <tbody>
                {inv.payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/60 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{p.date}</td>
                    <td className="py-2 pr-3">{methodLabel(p.method)}{p.reference && <span className="text-gray-500"> · {p.reference}</span>}
                      {p.note && <div className="text-xs text-gray-400">{p.note}</div>}
                      <div className="text-[11px] text-gray-400">recorded by {p.recordedBy}</div></td>
                    <td className="py-2 text-right tabular-nums font-medium whitespace-nowrap">{formatMoney(p.amount, cur)}</td>
                    <td className="py-2 pl-3 text-right">
                      <button className="text-xs text-rose-600 hover:underline" disabled={!!busy} onClick={() => removePayment(p)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-sm">Paid <b>{formatMoney(inv.amountPaid, cur)}</b> · Balance <b className={Number(inv.balance) > 0 ? 'text-rose-600' : 'text-green-600'}>{formatMoney(inv.balance, cur)}</b></p>

          {pay && (
            <form onSubmit={savePayment} className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="form-label" htmlFor="pay-date">Date received</label>
                  <input id="pay-date" type="date" className="form-input" max={today} required value={pay.date} onChange={e => setPay(p => ({ ...p, date: e.target.value }))} /></div>
                <div><label className="form-label" htmlFor="pay-amount">Amount ({cur})</label>
                  <input id="pay-amount" type="number" min="0" step="0.01" max={inv.balance} className="form-input" required value={pay.amount}
                    onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><label className="form-label" htmlFor="pay-method">Method</label>
                  <select id="pay-method" className="form-select" value={pay.method} onChange={e => setPay(p => ({ ...p, method: e.target.value }))}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="form-label" htmlFor="pay-ref">Reference</label>
                  <input id="pay-ref" className="form-input" maxLength={100} placeholder="Bank ref / M-Pesa code" value={pay.reference} onChange={e => setPay(p => ({ ...p, reference: e.target.value }))} /></div>
                <div><label className="form-label" htmlFor="pay-note">Note</label>
                  <input id="pay-note" className="form-input" maxLength={500} value={pay.note} onChange={e => setPay(p => ({ ...p, note: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={busy === 'pay'} onClick={() => setPay(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'pay'}>{busy === 'pay' ? 'Saving…' : 'Save payment'}</button>
              </div>
            </form>
          )}
        </section>
      )}

      {inv.status !== 'VOID' && (
        <section className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payment reminders</h2>
            {open && (
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={!inv.remindersPaused} disabled={busy === 'pause'} onChange={togglePause} />
                Automatic reminders
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2">Emailed 3 days before the due date, on it, then weekly while overdue (up to 12 weeks).</p>
          {(inv.reminders || []).length === 0 ? <p className="text-sm text-gray-400">None sent yet.</p> : (
            <ul className="text-sm space-y-1">
              {inv.reminders.map(r => (
                <li key={r.key}>{REMINDER_LABEL(r.key)} · {fmtDateTime(r.sentAt)}
                  {r.error && <span className="text-rose-600 text-xs"> — failed: {r.error}</span>}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {open && (
        <section className="card p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Cancel this invoice</h2>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Voids it with a credit note (its own number), so the period can be invoiced again. Only possible while no payment is recorded.
          </p>
          {!voiding ? (
            <button className="btn btn-secondary btn-sm text-rose-600" disabled={Number(inv.amountPaid) > 0}
              title={Number(inv.amountPaid) > 0 ? 'Remove the recorded payments first' : undefined}
              onClick={() => setVoiding({ reason: '', sendEmail: true })}>Void with credit note</button>
          ) : (
            <form onSubmit={doVoid} className="space-y-3">
              <div><label className="form-label" htmlFor="void-reason">Reason (printed on the credit note)</label>
                <input id="void-reason" className="form-input" required minLength={3} maxLength={500} value={voiding.reason}
                  onChange={e => setVoiding(v => ({ ...v, reason: e.target.value }))} placeholder="Wrong price list applied" /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={voiding.sendEmail} onChange={e => setVoiding(v => ({ ...v, sendEmail: e.target.checked }))} />
                Email the credit note to {(inv.billingEmails || []).join(', ')}
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={busy === 'void'} onClick={() => setVoiding(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'void'}>{busy === 'void' ? 'Voiding…' : `Void ${inv.number}`}</button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
