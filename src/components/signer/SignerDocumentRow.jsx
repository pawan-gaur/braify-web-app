import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { fmtDate, fmtRelative, parseUtc } from '../../utils/date'
import { signerStartSigning, signerStartViewing, signerDownloadSignedPdf } from '../../services/api'

const STATUS_CHIP = {
  PENDING:          { label: 'Awaiting signature', cls: 'badge-warning' },
  IN_REVIEW:        { label: 'In progress',        cls: 'badge-brand' },
  PARTIALLY_SIGNED: { label: 'Partially signed',   cls: 'badge-brand' },
  SIGNED:           { label: 'Signed · finalizing', cls: 'badge-success' },
  COMPLETED:        { label: 'Completed',          cls: 'badge-success' },
  EXPIRED:          { label: 'Expired',            cls: 'badge-danger' },
  CANCELLED:        { label: 'Cancelled',          cls: 'badge-danger' },
}

/**
 * Sign / view / download actions for signer-inbox documents. Signing and viewing open the
 * existing public pages with a token issued for this one document.
 *
 * @param onStale called when an action fails because the document moved on (refresh the list)
 */
export function useSignerDocActions(onStale) {
  const navigate = useNavigate()
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)

  const run = async (doc, fn, refresh = false) => {
    setBusyId(doc.id)
    try {
      await fn()
    } catch (e) {
      toast.error(e.message)
      if (refresh) onStale?.()
    } finally {
      setBusyId(null)
    }
  }

  const sign = (doc) => run(doc, async () => {
    navigate(`/sign/${await signerStartSigning(doc.id)}`)
  }, true)   // state may have moved on (someone signed, expired…) — refresh the list

  const view = (doc) => run(doc, async () => {
    navigate(`/esign/view/${await signerStartViewing(doc.id)}`)
  })

  const download = (doc) => run(doc, async () => {
    const blob = await signerDownloadSignedPdf(doc.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(doc.title || 'document').replace(/[^\w.\- ]/g, '_')}-signed.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })

  return { busyId, sign, view, download }
}

/* ── One inbox document ─────────────────────────────────────────────────── */
export default function SignerDocumentRow({ doc, busy, onSign, onView, onDownload }) {
  const chip = STATUS_CHIP[doc.status] || { label: doc.status, cls: 'badge-brand' }
  const due  = dueInfo(doc)

  return (
    <li className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-ink dark:text-white truncate max-w-full">{doc.title || 'Untitled document'}</p>
            <span className={`badge ${chip.cls}`}>{chip.label}</span>
            {doc.myRole === 'CC' && <span className="badge badge-brand">CC</span>}
          </div>
          <p className="text-xs text-ink-3 mt-1">
            From <span className="font-medium text-ink-2 dark:text-gray-300">{doc.orgName || 'Unknown organization'}</span>
            {doc.sentAt && <> · Sent {fmtRelative(doc.sentAt)}</>}
          </p>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-xs text-ink-3">
            {doc.signatoriesTotal > 1 && (
              <span>{doc.signatoriesSigned} of {doc.signatoriesTotal} signed
                {doc.signingMode === 'SEQUENTIAL' && doc.mySigningOrder ? ` · you sign #${doc.mySigningOrder}` : ''}
              </span>
            )}
            {doc.waitingOnName && <span>Waiting on <span className="font-medium text-ink-2 dark:text-gray-300">{doc.waitingOnName}</span></span>}
            {doc.mySignedAt && <span>You signed {fmtDate(doc.mySignedAt)}</span>}
            {due && <span className={due.urgent ? 'font-semibold text-danger' : ''}>{due.label}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 sm:justify-end">
        {doc.canSign && (
          <button onClick={onSign} disabled={busy} className="btn btn-primary btn-sm min-w-[7rem] justify-center">
            {busy ? 'Opening…' : 'Sign now'}
          </button>
        )}
        {doc.canDownload && (
          <button onClick={onDownload} disabled={busy} className="btn btn-secondary btn-sm">Download signed</button>
        )}
        {doc.canView && (
          <button onClick={onView} disabled={busy} className="btn btn-ghost btn-sm">View</button>
        )}
      </div>
    </li>
  )
}

/** "Due in 3 days" / "Due today" for documents still open for signing. */
function dueInfo(doc) {
  if (!['ACTION', 'UPCOMING'].includes(doc.bucket) || !doc.expiresAt) return null
  const d = parseUtc(doc.expiresAt)
  if (!d || isNaN(d)) return null
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return { label: 'Due today', urgent: true }
  if (days === 1) return { label: 'Due tomorrow', urgent: true }
  return { label: `Due ${fmtDate(doc.expiresAt)} · ${days} days left`, urgent: days <= 3 }
}
