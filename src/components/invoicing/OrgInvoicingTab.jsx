import { useState, useEffect, useCallback } from 'react'
import {
  invoicingOrgProfile, invoicingSaveOrgProfile, invoicingOrgRateCard, invoicingSaveOrgRateCard,
  invoicingDeleteOrgRateCard, invoicingOrgUsage,
} from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { fmtDateTime } from '../../utils/date'
import { COMMON_CURRENCIES, PAYMENT_TERMS, METRICS, PLANS, formatMoney, quickPeriods, toEditable, toRequest, emptyRateCard } from '../../utils/invoicing'
import RateCardEditor from './RateCardEditor'
import BillToFields from './BillToFields'
import EmailListInput from './EmailListInput'

/** Organisation page → Invoicing tab (Platform Admin): billing settings, prices and usage. */
export default function OrgInvoicingTab({ org, orgId }) {
  const [profile, setProfile] = useState(null)
  const toast = useToast()
  const reload = useCallback(() => {
    invoicingOrgProfile(orgId).then(setProfile).catch(err => toast.error(err.message))
  }, [orgId, toast])
  useEffect(() => { reload() }, [reload])

  if (!profile) return <Spinner />
  return (
    <div className="space-y-5">
      <ProfileCard org={org} orgId={orgId} profile={profile} onSaved={setProfile} />
      <PricesCard org={org} orgId={orgId} profile={profile} />
      <UsageCard orgId={orgId} profile={profile} />
    </div>
  )
}

function Spinner() {
  return <div className="py-10 text-center"><div className="inline-block w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
}

function ProfileCard({ org, orgId, profile, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() => ({ ...profile, taxes: profile.taxes?.length ? profile.taxes : [] }))
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm({ ...profile, taxes: profile.taxes?.length ? profile.taxes : [] }) }, [profile])
  const set = patch => setForm(f => ({ ...f, ...patch }))
  const stripe = org?.billing?.managedBy === 'STRIPE'

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        currency: (form.currency || '').trim().toUpperCase() || null,
        paymentTermsDays: Number(form.paymentTermsDays) || 0,
        taxes: (form.taxes || []).filter(t => (t.name || '').trim() || t.ratePercent !== '' && t.ratePercent != null)
          .map(t => ({ name: t.name, ratePercent: t.ratePercent === '' ? null : String(t.ratePercent) })),
      }
      const saved = await invoicingSaveOrgProfile(orgId, body)
      onSaved(saved)
      toast.success(saved.invoiceBilling ? 'Billing settings saved. Invoice billing is on.' : 'Billing settings saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setTax = (i, patch) => set({ taxes: form.taxes.map((t, j) => j === i ? { ...t, ...patch } : t) })

  return (
    <form onSubmit={save} className="card p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Invoice billing</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            When on, Braify issues this organisation a monthly invoice (plan fee + usage). Stripe-billed organisations get Stripe's invoices instead.
          </p>
        </div>
        <label className={`flex items-center gap-2 text-sm font-semibold shrink-0 ${stripe ? 'opacity-50' : 'cursor-pointer'}`}>
          <input type="checkbox" aria-label="Invoice billing" checked={!!form.invoiceBilling} disabled={saving || stripe}
            onChange={e => set({ invoiceBilling: e.target.checked })} />
          {form.invoiceBilling ? 'On' : 'Off'}
        </label>
      </div>
      {stripe && <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300 rounded-lg p-2.5">This organisation pays through Stripe.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="form-label" htmlFor="bp-currency">Billing currency</label>
          <input id="bp-currency" className="form-input uppercase" list="bp-currencies" maxLength={3} disabled={saving}
            value={form.currency || ''} onChange={e => set({ currency: e.target.value.toUpperCase() })} placeholder="USD" />
          <datalist id="bp-currencies">{COMMON_CURRENCIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="form-label" htmlFor="bp-terms">Payment terms</label>
          <select id="bp-terms" className="form-select" disabled={saving} value={form.paymentTermsDays ?? 30}
            onChange={e => set({ paymentTermsDays: Number(e.target.value) })}>
            {PAYMENT_TERMS.map(d => <option key={d} value={d}>{d === 0 ? 'Due on receipt' : `Net ${d} days`}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="bp-start">Billing start date</label>
          <input id="bp-start" type="date" className="form-input" disabled={saving}
            max={new Date().toISOString().slice(0, 10)}
            value={form.billingStartDate || ''} onChange={e => set({ billingStartDate: e.target.value })} />
          <p className="text-[11px] text-gray-400 mt-1">First day billed. Defaults to the day invoice billing is turned on.</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="form-label mb-0">Taxes (added on top)</span>
          {form.taxes.length < 2 && (
            <button type="button" className="text-xs font-semibold text-brand hover:underline" disabled={saving}
              onClick={() => set({ taxes: [...form.taxes, { name: '', ratePercent: '' }] })}>+ Add tax</button>
          )}
        </div>
        {form.taxes.length === 0 && <p className="text-xs text-gray-400">No tax.</p>}
        <div className="space-y-2">
          {form.taxes.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="form-input" placeholder="VAT" maxLength={30} aria-label={`Tax ${i + 1} name`} disabled={saving}
                value={t.name || ''} onChange={e => setTax(i, { name: e.target.value })} />
              <input className="form-input w-32" type="number" min="0" max="100" step="0.001" placeholder="16" aria-label={`Tax ${i + 1} rate`}
                disabled={saving} value={t.ratePercent ?? ''} onChange={e => setTax(i, { ratePercent: e.target.value })} />
              <span className="text-sm text-gray-500">%</span>
              <button type="button" className="text-xs text-rose-600 hover:underline" disabled={saving}
                onClick={() => set({ taxes: form.taxes.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="form-label">Bill to</span>
        <BillToFields value={form.billTo || {}} onChange={billTo => set({ billTo })} disabled={saving} required={!!form.invoiceBilling} />
      </div>
      <div>
        <label className="form-label" htmlFor="bp-emails">Billing emails{form.invoiceBilling ? ' *' : ''}</label>
        <EmailListInput id="bp-emails" value={form.billingEmails || []} onChange={billingEmails => set({ billingEmails })} disabled={saving} />
      </div>
      <div>
        <label className="form-label" htmlFor="bp-note">Note on every invoice</label>
        <input id="bp-note" className="form-input" maxLength={500} placeholder="PO number, contract reference…" disabled={saving}
          value={form.invoiceNote || ''} onChange={e => set({ invoiceNote: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{profile.updatedAt ? `Last saved ${fmtDateTime(profile.updatedAt)} by ${profile.updatedBy || '—'}` : 'Not set up yet'}</span>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save billing settings'}</button>
      </div>
    </form>
  )
}

function PricesCard({ org, orgId, profile }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => {
    invoicingOrgRateCard(orgId).then(setData).catch(err => toast.error(err.message))
  }, [orgId, toast])
  useEffect(() => { load() }, [load, profile.currency])

  const customise = () => {
    const base = data?.effective ? toEditable(data.effective) : emptyRateCard(profile.currency)
    setEditing({ ...base, id: undefined, plan: undefined, currency: profile.currency })
  }
  const save = async () => {
    setBusy(true)
    try {
      await invoicingSaveOrgRateCard(orgId, toRequest(editing))
      toast.success('Organisation prices saved.')
      setEditing(null)
      load()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  const useDefault = async () => {
    if (!window.confirm('Remove this organisation\'s own prices and use the plan default?')) return
    setBusy(true)
    try {
      await invoicingDeleteOrgRateCard(orgId)
      toast.success('Now using the plan default.')
      load()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  const planLabel = PLANS.find(p => p.value === org?.subscriptionPlan)?.label || org?.subscriptionPlan
  const card = data?.effective
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Prices</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {!data ? 'Loading…'
              : data.source === 'ORG' ? 'This organisation has its own prices.'
              : data.source === 'PLAN_DEFAULT' ? `Using the default price list for ${planLabel} in ${card.currency}.`
              : profile.currency ? `No default price list for ${planLabel} in ${profile.currency}. Give this organisation its own prices or add a default on the Invoicing page.`
              : 'Set a billing currency first.'}
          </p>
        </div>
        {!editing && profile.currency && (
          <div className="flex gap-2 shrink-0">
            {data?.source === 'ORG' && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={useDefault}>Use plan default</button>}
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={customise}>
              {data?.source === 'ORG' ? 'Edit prices' : 'Set own prices'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          <RateCardEditor value={editing} onChange={setEditing} currencyLocked disabled={busy} />
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-secondary" disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save prices'}</button>
          </div>
        </>
      ) : card ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2 pr-3 font-medium">Monthly fee</td>
                <td className="py-2 text-right tabular-nums" colSpan={2}>{formatMoney(card.monthlyFee, card.currency)}</td>
              </tr>
              {METRICS.filter(m => card.metrics?.[m.key]?.enabled).map(m => (
                <tr key={m.key} className="border-b border-gray-50 dark:border-gray-700/60">
                  <td className="py-2 pr-3">{m.label}</td>
                  <td className="py-2 text-right text-xs text-gray-500">
                    {Number(card.metrics[m.key].included) > 0 ? `${Number(card.metrics[m.key].included).toLocaleString()} included` : ''}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(card.metrics[m.key].unitPrice, card.currency)} / {m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function UsageCard({ orgId, profile }) {
  const toast = useToast()
  const periods = quickPeriods()
  const [range, setRange] = useState(periods.thisMonth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((r) => {
    setLoading(true)
    invoicingOrgUsage(orgId, r.from, r.to)
      .then(setData)
      .catch(err => { toast.error(err.message); setData(null) })
      .finally(() => setLoading(false))
  }, [orgId, toast])
  useEffect(() => { load(periods.thisMonth) }, [load]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = r => { setRange(r); load(r) }
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="card p-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Billable usage</h2>
          <p className="text-xs text-gray-500 mt-0.5">What an invoice for this period would charge for (UTC days, inclusive).</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => pick(periods.thisMonth)}>This month to date</button>
          <button className="btn btn-secondary btn-sm" onClick={() => pick(periods.lastMonth)}>Last month</button>
          <input type="date" aria-label="From" className="form-input w-40" value={range.from} max={range.to}
            onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
          <input type="date" aria-label="To" className="form-input w-40" value={range.to} min={range.from} max={today}
            onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
          <button className="btn btn-primary btn-sm" disabled={!range.from || !range.to || loading} onClick={() => load(range)}>Show</button>
        </div>
      </div>
      {loading ? <Spinner /> : !data ? null : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-700">
              <th className="py-2">Usage {data.from} → {data.to}</th><th className="py-2 text-right">Quantity</th><th className="py-2 pl-4">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map(m => (
              <tr key={m.metric} className="border-b border-gray-50 dark:border-gray-700/60 align-top">
                <td className="py-2">{m.label}</td>
                <td className="py-2 text-right tabular-nums font-semibold">{Number(m.quantity).toLocaleString()} <span className="text-xs font-normal text-gray-400">{m.unit}</span></td>
                <td className="py-2 pl-4 text-xs">
                  {m.estimated
                    ? <span className="text-amber-700 dark:text-amber-300" title={m.note || ''}>Estimated{m.note ? ` — ${m.note}` : ''}</span>
                    : <span className="text-green-700 dark:text-green-400">Exact</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!profile.invoiceBilling && <p className="text-[11px] text-gray-400 mt-3">Invoice billing is off for this organisation; this is a preview only.</p>}
    </div>
  )
}
