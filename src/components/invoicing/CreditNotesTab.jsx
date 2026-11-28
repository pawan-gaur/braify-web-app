import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { creditNotesList, creditNotePdf } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatMoney, fmtPeriod, saveBlob } from '../../utils/invoicing'

/** Invoicing page → Credit notes tab. */
export default function CreditNotesTab() {
  const toast = useToast()
  const navigate = useNavigate()
  const [list, setList] = useState(null)
  useEffect(() => { creditNotesList().then(setList).catch(err => { toast.error(err.message); setList([]) }) }, [toast])
  const download = async (cn) => {
    try { saveBlob(await creditNotePdf(cn.id), `${cn.number}.pdf`) } catch (err) { toast.error(err.message) }
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-3">Credit note</th><th className="px-4 py-3">Organisation</th><th className="px-4 py-3">Voids invoice</th>
              <th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list === null ? (
              <tr><td colSpan={7} className="px-4 py-14 text-center"><div className="inline-block w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" /></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-gray-400">No credit notes. Void an issued invoice to create one.</td></tr>
            ) : list.map(cn => (
              <tr key={cn.id} className="border-b border-gray-50 dark:border-gray-700/60">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{cn.number}</td>
                <td className="px-4 py-3">{cn.orgName}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  <a href={`/invoicing/invoices/${cn.invoiceId}`} onClick={e => { e.preventDefault(); navigate(`/invoicing/invoices/${cn.invoiceId}`) }}
                    className="text-brand hover:underline">{cn.invoiceNumber}</a>
                  <div className="font-sans text-[11px] text-gray-400">{fmtPeriod(cn.periodFrom, cn.periodTo)}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{cn.issueDate}</td>
                <td className="px-4 py-3 text-right tabular-nums">-{formatMoney(cn.total, cn.currency)}</td>
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-[240px] truncate" title={cn.reason}>{cn.reason}</td>
                <td className="px-4 py-3 text-right"><button className="text-xs font-semibold text-brand hover:underline" onClick={() => download(cn)}>PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
