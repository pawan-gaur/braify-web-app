import { useEffect, useState } from 'react'
import { myInvoices, myCreditNotes, myInvoicePdf, myInvoiceUsageXlsx, myCreditNotePdf } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatMoney, fmtPeriod, saveBlob, invoiceFileName } from '../../utils/invoicing'
import InvoiceStatusBadge from './InvoiceStatusBadge'

/** Org Admin → Plan & billing: invoices and credit notes from Braify (issued only). */
export default function MyInvoicesCard() {
  const toast = useToast()
  const [invoices, setInvoices] = useState(null)
  const [notes, setNotes] = useState([])
  useEffect(() => {
    myInvoices().then(setInvoices).catch(() => setInvoices([]))
    myCreditNotes().then(setNotes).catch(() => setNotes([]))
  }, [])
  if (!invoices || (invoices.length === 0 && notes.length === 0)) return null

  const get = async (fn, name) => {
    try { saveBlob(await fn(), name) } catch (err) { toast.error(err.message) }
  }
  const outstanding = invoices.filter(i => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))

  return (
    <div className="card overflow-hidden mb-6">
      <div className="p-5 sm:p-6 border-b border-ink-8 dark:border-gray-700">
        <h2 className="text-[15px] font-bold text-ink dark:text-white">Invoices</h2>
        <p className="text-sm text-ink-3 mt-1">
          {outstanding.length === 0 ? 'Nothing outstanding.'
            : `${outstanding.length} unpaid invoice${outstanding.length === 1 ? '' : 's'}: ` + outstanding.map(i => formatMoney(i.balance, i.currency)).join(', ')}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-4 border-b border-ink-8 dark:border-gray-700">
              <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Balance</th><th className="px-5 py-3">Due</th><th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-b border-ink-8/60 dark:border-gray-700/60">
                <td className="px-5 py-3 font-mono text-xs font-semibold">{i.number}</td>
                <td className="px-5 py-3 whitespace-nowrap">{fmtPeriod(i.periodFrom, i.periodTo)}</td>
                <td className="px-5 py-3"><InvoiceStatusBadge status={i.status} />
                  {i.creditNoteNumber && <div className="text-[11px] text-ink-4 mt-0.5">credit note {i.creditNoteNumber}</div>}</td>
                <td className="px-5 py-3 text-right tabular-nums">{formatMoney(i.total, i.currency)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{i.status === 'VOID' ? '—' : formatMoney(i.balance, i.currency)}</td>
                <td className="px-5 py-3 whitespace-nowrap">{i.dueDate}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button className="text-xs font-semibold text-brand hover:underline mr-3" onClick={() => get(() => myInvoicePdf(i.id), invoiceFileName(i))}>PDF</button>
                  <button className="text-xs font-semibold text-brand hover:underline" onClick={() => get(() => myInvoiceUsageXlsx(i.id), invoiceFileName(i, '-usage.xlsx'))}>Usage</button>
                </td>
              </tr>
            ))}
            {notes.map(cn => (
              <tr key={cn.id} className="border-b border-ink-8/60 dark:border-gray-700/60 text-ink-3">
                <td className="px-5 py-3 font-mono text-xs">{cn.number}</td>
                <td className="px-5 py-3" colSpan={2}>Credit note for {cn.invoiceNumber}</td>
                <td className="px-5 py-3 text-right tabular-nums">-{formatMoney(cn.total, cn.currency)}</td>
                <td className="px-5 py-3" /><td className="px-5 py-3 whitespace-nowrap">{cn.issueDate}</td>
                <td className="px-5 py-3 text-right"><button className="text-xs font-semibold text-brand hover:underline" onClick={() => get(() => myCreditNotePdf(cn.id), `${cn.number}.pdf`)}>PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
