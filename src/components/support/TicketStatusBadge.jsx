import { STATUS_META } from '../../utils/supportTickets'

/** Coloured pill for a support ticket status. */
export default function TicketStatusBadge({ status }) {
  const m = STATUS_META[status]
  if (!m) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}
