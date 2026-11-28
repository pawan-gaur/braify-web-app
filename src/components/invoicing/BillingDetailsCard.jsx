import { useEffect, useState } from 'react'
import { myBillingProfile, mySaveBillingProfile } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import BillToFields from './BillToFields'
import EmailListInput from './EmailListInput'

/**
 * Org Admin → Plan & billing: the organisation's invoice details (bill-to, billing emails).
 * Shown only for organisations Braify invoices directly.
 */
export default function BillingDetailsCard() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    myBillingProfile()
      .then(d => { setData(d); setForm({ billTo: d.billTo || {}, billingEmails: d.billingEmails || [] }) })
      .catch(() => setData(null))
  }, [])

  if (!data?.invoiceBilling || !form) return null

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const d = await mySaveBillingProfile(form)
      setData(d)
      setForm({ billTo: d.billTo || {}, billingEmails: d.billingEmails || [] })
      toast.success('Billing details saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="card p-5 sm:p-6 mb-6 space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-ink dark:text-white">Invoice details</h2>
        <p className="text-sm text-ink-3 mt-1">
          Braify invoices your organisation monthly in {data.currency}
          {data.paymentTermsDays ? `, payable within ${data.paymentTermsDays} days` : ', due on receipt'}.
          These details are printed on new invoices; invoices already issued keep their details.
        </p>
      </div>
      <BillToFields value={form.billTo} onChange={billTo => setForm(f => ({ ...f, billTo }))} disabled={saving} required idPrefix="my-bt" />
      <div>
        <label className="form-label" htmlFor="my-billing-emails">Billing emails *</label>
        <EmailListInput id="my-billing-emails" value={form.billingEmails} disabled={saving}
          onChange={billingEmails => setForm(f => ({ ...f, billingEmails }))} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save invoice details'}</button>
      </div>
    </form>
  )
}
