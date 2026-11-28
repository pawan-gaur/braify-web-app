/**
 * Invoicing setup (Platform Admin): default price lists per plan and currency, and Braify's seller
 * details printed on invoices. Per-organisation settings live on the organisation's Invoicing tab.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  invoicingRateCards, invoicingCreateRateCard, invoicingUpdateRateCard, invoicingDeleteRateCard,
  invoicingSettings, invoicingSaveSettings, invoicingSamplePdf, uploadToStorage,
} from '../services/api'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import useUrlState from '../hooks/useUrlState'
import { useToast } from '../context/ToastContext'
import { fmtDateTime } from '../utils/date'
import { PLANS, METRICS, formatMoney, emptyRateCard, toEditable, toRequest } from '../utils/invoicing'
import RateCardEditor from '../components/invoicing/RateCardEditor'
import BillToFields from '../components/invoicing/BillToFields'
import ColorPicker from '../components/ui/ColorPicker'
import InvoicesTab from '../components/invoicing/InvoicesTab'
import CreditNotesTab from '../components/invoicing/CreditNotesTab'

const CRUMBS = [{ label: 'Dashboard', to: '/' }, { label: 'Invoicing' }]
const TABS = [{ value: 'invoices', label: 'Invoices' }, { value: 'credit-notes', label: 'Credit notes' }, { value: 'prices', label: 'Price lists' }, { value: 'seller', label: 'Seller details' }]
const planLabel = v => PLANS.find(p => p.value === v)?.label || v

export default function InvoicingPage() {
  const [q, setQ] = useUrlState({ tab: 'invoices' })
  const tab = TABS.some(t => t.value === q.tab) ? q.tab : 'invoices'
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumbs items={CRUMBS} />
      <div className="mt-4 mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoicing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Invoices Braify issues to organisations, default prices and seller details. Turn on invoice billing for an organisation on its
          <b> Invoicing</b> tab (Organizations → organisation). Drafts for last month are created automatically on the 1st.
        </p>
      </div>
      <div className="flex gap-1 bg-ink-8 dark:bg-gray-800 rounded-xl p-1 mb-5 w-fit" role="tablist">
        {TABS.map(t => (
          <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setQ({ tab: t.value })}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.value
              ? 'bg-gradient-accent text-white shadow-soft' : 'text-ink-3 dark:text-gray-400 hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'invoices' ? <InvoicesTab /> : tab === 'credit-notes' ? <CreditNotesTab /> : tab === 'prices' ? <PriceLists /> : <SellerDetails />}
    </div>
  )
}

function PriceLists() {
  const toast = useToast()
  const [cards, setCards] = useState(null)
  const [editing, setEditing] = useState(null)   // { id?, ...editable }
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    invoicingRateCards().then(setCards).catch(err => { toast.error(err.message); setCards([]) })
  }, [toast])
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!editing.plan) { toast.error('Choose a plan.'); return }
    setSaving(true)
    try {
      const body = toRequest(editing)
      if (editing.id) await invoicingUpdateRateCard(editing.id, body)
      else await invoicingCreateRateCard(body)
      toast.success('Price list saved.')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete the ${planLabel(c.plan)} price list in ${c.currency}?`)) return
    try {
      await invoicingDeleteRateCard(c.id)
      toast.success('Price list deleted.')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Default price lists</h2>
          <p className="text-xs text-gray-500 mt-0.5">Used for an organisation's plan and billing currency unless it has its own prices.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing(emptyRateCard('USD', 'PROFESSIONAL'))}>New price list</button>
      </div>
      {cards === null ? (
        <div className="py-10 text-center"><div className="inline-block w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : cards.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No default price lists yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-700">
                <th className="px-3 py-2">Plan</th><th className="px-3 py-2">Currency</th><th className="px-3 py-2 text-right">Monthly fee</th>
                <th className="px-3 py-2">Usage charged</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700/60">
                  <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-100">{planLabel(c.plan)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.currency}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(c.monthlyFee, c.currency)}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    {Object.keys(c.metrics || {}).filter(k => c.metrics[k]?.enabled)
                      .map(k => METRICS.find(m => m.key === k)?.label || k).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(c.updatedAt)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button className="text-xs font-semibold text-brand hover:underline mr-3" onClick={() => setEditing(toEditable(c))}>Edit</button>
                    <button className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setEditing(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="rc-title"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h2 id="rc-title" className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">
              {editing.id ? 'Edit price list' : 'New price list'}
            </h2>
            <RateCardEditor value={editing} onChange={setEditing} showPlan disabled={saving} />
            <div className="flex justify-end gap-3 mt-5">
              <button className="btn btn-secondary" disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SellerDetails() {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    invoicingSettings().then(s => setForm({ ...s, seller: s.seller || {} })).catch(err => toast.error(err.message))
  }, [toast])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const s = await invoicingSaveSettings(form)
      setForm({ ...s, seller: s.seller || {} })
      toast.success('Seller details saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <div className="py-10 text-center"><div className="inline-block w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
  const set = patch => setForm(f => ({ ...f, ...patch }))

  const uploadLogo = async (file) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) { toast.error('Use a PNG or JPEG logo (SVG and WebP can\'t be printed on the PDF).'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be 2 MB or smaller.'); return }
    setSaving(true)
    try {
      const f = await uploadToStorage(file, 'BRANDING_LOGO')
      set({ logoFileId: f.id })
      toast.success('Logo uploaded — save to use it on invoices.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }
  const preview = async () => {
    setSaving(true)
    try {
      const blob = await invoicingSamplePdf()
      window.open(URL.createObjectURL(blob), '_blank', 'noopener')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="card p-5 space-y-5">
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Seller details</h2>
        <p className="text-xs text-gray-500 mt-0.5">Printed as "From" on every invoice. Issued invoices keep the details they were issued with.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="form-label">Logo on invoices</span>
          <div className="flex items-center gap-3">
            <div className="w-40 h-14 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
              {form.logoFileId
                ? <img src={`/api/public/files/${form.logoFileId}`} alt="Invoice logo" className="max-h-12 max-w-[9.5rem] object-contain" />
                : <span className="text-[11px] text-gray-400">No logo</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="btn btn-secondary btn-sm cursor-pointer">
                {form.logoFileId ? 'Replace' : 'Upload'}
                <input type="file" accept="image/png,image/jpeg,image/gif" className="sr-only" disabled={saving}
                  onChange={e => { uploadLogo(e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {form.logoFileId && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => set({ logoFileId: null })}>Remove</button>}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">PNG or JPEG, up to 2 MB. A wide logo (about 4:1) looks best. Without a logo the company name is shown.</p>
        </div>
        <div>
          <ColorPicker label="Invoice colour" value={form.brandColor || '#4F46E5'} onChange={brandColor => set({ brandColor })} />
          <p className="text-[11px] text-gray-400 mt-1">Used for the title, table header and amount due.</p>
        </div>
      </div>
      <BillToFields value={form.seller} onChange={seller => set({ seller })} nameLabel="Company legal name" disabled={saving} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="form-label" htmlFor="s-email">Email</label>
          <input id="s-email" type="email" className="form-input" value={form.sellerEmail || ''} onChange={e => set({ sellerEmail: e.target.value })} disabled={saving} /></div>
        <div><label className="form-label" htmlFor="s-phone">Phone</label>
          <input id="s-phone" className="form-input" value={form.sellerPhone || ''} onChange={e => set({ sellerPhone: e.target.value })} disabled={saving} /></div>
        <div><label className="form-label" htmlFor="s-web">Website</label>
          <input id="s-web" className="form-input" value={form.sellerWebsite || ''} onChange={e => set({ sellerWebsite: e.target.value })} disabled={saving} /></div>
      </div>
      <div>
        <label className="form-label" htmlFor="s-pay">Payment instructions</label>
        <textarea id="s-pay" className="form-input min-h-[96px]" maxLength={2000} placeholder="Bank name, account number, SWIFT, M-Pesa paybill…"
          value={form.paymentInstructions || ''} onChange={e => set({ paymentInstructions: e.target.value })} disabled={saving} />
      </div>
      <div>
        <label className="form-label" htmlFor="s-notes">Notes on every invoice</label>
        <textarea id="s-notes" className="form-input min-h-[96px]" maxLength={2000} disabled={saving}
          placeholder={'Please make the payment by the due date using the payment details above.\nA late fee of $200 applies to payments received after the due date.'}
          value={form.invoiceNotes || ''} onChange={e => set({ invoiceNotes: e.target.value })} />
        <p className="text-[11px] text-gray-400 mt-1">One note per line (up to 8). Printed as bullets under "Notes:" at the bottom of each invoice, after the organisation's own note.</p>
      </div>
      <div>
        <label className="form-label" htmlFor="s-foot">Footer note</label>
        <input id="s-foot" className="form-input" maxLength={500} placeholder="Thank you for your business."
          value={form.footerNote || ''} onChange={e => set({ footerNote: e.target.value })} disabled={saving} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{form.updatedAt ? `Last saved ${fmtDateTime(form.updatedAt)} by ${form.updatedBy || '—'}` : 'Not saved yet'}</span>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={preview} title="Uses the saved settings">Preview sample PDF</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 -mt-3 text-right">Save first — the preview uses the saved settings. Draft invoices pick up changes automatically; issued invoices keep their design.</p>
    </form>
  )
}
