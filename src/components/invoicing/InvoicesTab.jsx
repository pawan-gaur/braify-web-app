import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoicesList, invoicingInvoicedOrgs, invoiceGenerate, invoicesSummary } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import useUrlState from '../../hooks/useUrlState'
import { INVOICE_STATUS, formatMoney, fmtPeriod, quickPeriods } from '../../utils/invoicing'
import InvoiceStatusBadge from './InvoiceStatusBadge'

const FIELD = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100'

/** Invoicing page → Invoices tab: list, filters and "New invoice". */
export default function InvoicesTab() {
  const navigate = useNavigate()
  const toast = useToast()
  const [q, setQ] = useUrlState({ tab: 'invoices', page: 0, status: '', org: '', search: '' })
  const [search, setSearch] = useState(q.search)
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState([])
  const [creating, setCreating] = useState(false)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    invoicingInvoicedOrgs().then(setOrgs).catch(() => {})
    invoicesSummary().then(setSummary).catch(() => {})
  }, [])
  useEffect(() => {
    if (search.trim() === q.search) return
    const t = setTimeout(() => setQ({ search: search.trim(), page: 0 }), 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoading(true)
    invoicesList({ status: q.status, orgId: q.org, q: q.search, page: q.page, size: 20 })
      .then(setData)
      .catch(err => { toast.error(err.message); setData({ content: [], totalElements: 0, totalPages: 0 }) })
      .finally(() => setLoading(false))
  }, [q.status, q.org, q.search, q.page, toast])
  useEffect(() => { load() }, [load])

  const currencies = Object.entries(summary?.byCurrency || {})
  return (
    <div className="space-y-4">
      {summary && (currencies.length > 0 || summary.drafts > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="card p-4 text-left hover:shadow-md transition-shadow" onClick={() => setQ({ status: 'DRAFT', page: 0 })}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Drafts to review</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{summary.drafts}</div>
          </button>
          <div className="card p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Outstanding</div>
            {currencies.length === 0 ? <div className="text-xl font-bold mt-1">—</div>
              : currencies.map(([c, v]) => <div key={c} className="text-lg font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{formatMoney(v.outstanding, c)}</div>)}
          </div>
          <button className="card p-4 text-left hover:shadow-md transition-shadow" onClick={() => setQ({ status: 'OVERDUE', page: 0 })}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Overdue · {summary.overdueCount} invoice{summary.overdueCount === 1 ? '' : 's'}</div>
            {currencies.length === 0 ? <div className="text-xl font-bold mt-1">—</div>
              : currencies.map(([c, v]) => <div key={c} className={`text-lg font-bold mt-1 tabular-nums ${Number(v.overdue) > 0 ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>{formatMoney(v.overdue, c)}</div>)}
          </button>
        </div>
      )}
      <div className="card p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <input className={`${FIELD} flex-1`} placeholder="Invoice number or organisation…" aria-label="Search invoices"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className={FIELD} value={q.status} onChange={e => setQ({ status: e.target.value, page: 0 })} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={FIELD} value={q.org} onChange={e => setQ({ org: e.target.value, page: 0 })} aria-label="Organisation">
          <option value="">All organisations</option>
          {orgs.map(o => <option key={o.orgId} value={o.orgId}>{o.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={orgs.length === 0}
          title={orgs.length === 0 ? 'Turn on invoice billing for an organisation first' : undefined}>New invoice</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Organisation</th><th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-14 text-center"><div className="inline-block w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" /></td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-14 text-center text-gray-400">
                  {orgs.length === 0 ? 'No organisation has invoice billing on yet (Organizations → organisation → Invoicing).' : 'No invoices match.'}
                </td></tr>
              ) : data.content.map(inv => (
                <tr key={inv.id} onClick={() => navigate(`/invoicing/invoices/${inv.id}`)}
                  className="border-b border-gray-50 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs">
                    <a href={`/invoicing/invoices/${inv.id}`} onClick={e => { e.preventDefault(); navigate(`/invoicing/invoices/${inv.id}`) }}
                      className="font-semibold text-brand hover:underline">{inv.number || 'Draft'}</a>
                    {inv.origin === 'AUTOMATIC' && !inv.number && <span className="ml-1 text-[10px] font-sans text-gray-400">auto</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{inv.orgName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{fmtPeriod(inv.periodFrom, inv.periodTo)}</td>
                  <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatMoney(inv.total, inv.currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{inv.balance != null && inv.status !== 'VOID' ? formatMoney(inv.balance, inv.currency) : '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{inv.dueDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Page {q.page + 1} of {data.totalPages} · {data.totalElements} invoices</span>
          <div className="flex gap-1">
            <button disabled={q.page <= 0} onClick={() => setQ(p => ({ page: p.page - 1 }))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40">Prev</button>
            <button disabled={q.page >= data.totalPages - 1} onClick={() => setQ(p => ({ page: p.page + 1 }))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {creating && <NewInvoiceModal orgs={orgs} defaultOrg={q.org} onClose={() => setCreating(false)}
        onCreated={inv => { setCreating(false); toast.success('Draft invoice created.'); navigate(`/invoicing/invoices/${inv.id}`) }} />}
    </div>
  )
}

function NewInvoiceModal({ orgs, defaultOrg, onClose, onCreated }) {
  const toast = useToast()
  const periods = quickPeriods()
  const [orgId, setOrgId] = useState(defaultOrg || orgs[0]?.orgId || '')
  const [range, setRange] = useState(periods.lastMonth)
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const org = orgs.find(o => o.orgId === orgId)

  const create = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      onCreated(await invoiceGenerate(orgId, range.from, range.to))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !busy && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="ni-title" onSubmit={create}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 id="ni-title" className="text-base font-bold text-gray-800 dark:text-gray-100">New invoice</h2>
        <div>
          <label className="form-label" htmlFor="ni-org">Organisation</label>
          <select id="ni-org" className="form-select" value={orgId} onChange={e => setOrgId(e.target.value)} disabled={busy}>
            {orgs.map(o => <option key={o.orgId} value={o.orgId}>{o.name} ({o.currency})</option>)}
          </select>
          {org && <p className="text-[11px] text-gray-400 mt-1">Billed from {org.billingStartDate}. Earlier days are left out.</p>}
        </div>
        <div>
          <span className="form-label">Period</span>
          <div className="flex flex-wrap gap-2 mb-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRange(periods.lastMonth)}>Last month</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRange(periods.thisMonth)}>This month to date</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="form-input" aria-label="From" value={range.from} max={range.to} required disabled={busy}
              onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
            <input type="date" className="form-input" aria-label="To" value={range.to} min={range.from} max={today} required disabled={busy}
              onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">UTC days, inclusive. A period can't overlap another invoice of this organisation.</p>
        </div>
        <p className="text-xs text-gray-500">A draft is created. Review it, then issue it to assign a number and email it.</p>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !orgId}>{busy ? 'Creating…' : 'Create draft'}</button>
        </div>
      </form>
    </div>
  )
}
