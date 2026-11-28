import { INVOICE_STATUS } from '../../utils/invoicing'

export default function InvoiceStatusBadge({ status }) {
  const m = INVOICE_STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${m.cls}`}>{m.label}</span>
}
