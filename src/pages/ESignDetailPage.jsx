/**
 * Document detail / view page for COMPLETED (and other terminal) documents.
 * Shows: metadata, signed-PDF viewer, field summary, full audit trail.
 * Opened when a user clicks on a document row in ESignDocumentsPage.
 *
 * For DRAFT documents the builder is opened instead (see App.jsx routing logic).
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { esignGetDocument, esignGetAudit, esignDownloadSigned } from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const STATUS_COLORS = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PENDING:   'bg-yellow-100 text-yellow-700',
  IN_REVIEW: 'bg-blue-100 text-blue-700',
  SIGNED:    'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  EXPIRED:   'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

const EVENT_ICONS = {
  DOCUMENT_CREATED:       { icon: '📄', color: 'text-gray-500' },
  FIELDS_SAVED:           { icon: '📐', color: 'text-blue-500' },
  DOCUMENT_SENT:          { icon: '📧', color: 'text-purple-500' },
  LINK_OPENED:            { icon: '🔗', color: 'text-blue-400' },
  DOCUMENT_VIEWED:        { icon: '👁️', color: 'text-blue-600' },
  SIGNING_STARTED:        { icon: '✍️', color: 'text-indigo-500' },
  FIELD_SIGNED:           { icon: '✅', color: 'text-green-500' },
  DOCUMENT_SUBMITTED:     { icon: '📬', color: 'text-green-600' },
  PDF_GENERATED:          { icon: '🖨️', color: 'text-teal-500' },
  COMPLETION_EMAIL_SENT:  { icon: '💌', color: 'text-green-500' },
  DOCUMENT_DOWNLOADED:    { icon: '⬇️', color: 'text-gray-500' },
  LINK_EXPIRED:           { icon: '⏰', color: 'text-orange-500' },
  DOCUMENT_CANCELLED:     { icon: '🚫', color: 'text-red-500' },
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ESignDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { showToast } = useToast()

  const [doc,     setDoc]     = useState(null)
  const [audit,   setAudit]   = useState([])
  const [pdfUrl,  setPdfUrl]  = useState(null)  // signed PDF blob URL
  const [srcUrl,  setSrcUrl]  = useState(null)  // source PDF blob URL
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('overview') // overview | pdf | audit

  useEffect(() => {
    Promise.all([
      esignGetDocument(id),
      esignGetAudit(id).catch(() => []),
    ]).then(([d, a]) => {
      setDoc(d)
      setAudit(a)

      if (d.signedPdfBase64) {
        const bytes = Uint8Array.from(atob(d.signedPdfBase64), c => c.charCodeAt(0))
        setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
      }
      if (d.sourcePdfBase64) {
        const bytes = Uint8Array.from(atob(d.sourcePdfBase64), c => c.charCodeAt(0))
        setSrcUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
      }
    })
    .catch(e => showToast(e.message, 'error'))
    .finally(() => setLoading(false))
  }, [id])

  async function handleDownload() {
    try {
      const blob = await esignDownloadSigned(id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = (doc?.title || 'document').replace(/[^a-zA-Z0-9\- ]/g, '') + '-signed.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!doc) return null

  const isCompleted = doc.status === 'COMPLETED'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Dashboard', to: '/' },
        { label: 'E-Sign Documents', to: '/esign' },
        { label: doc?.title || 'Document' },
      ]} />

      {/* Back */}
      <button onClick={() => navigate('/esign')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mt-4 mb-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Documents
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{doc.title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                {doc.status?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                {doc.clientName}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {doc.clientEmail}
              </span>
              {doc.completedAt && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Completed {fmtDateTime(doc.completedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isCompleted && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                           border border-green-300 text-green-700 bg-green-50
                           hover:bg-green-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download Signed PDF
              </button>
            )}
            <button
              onClick={() => navigate(`/verify/${id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Verify
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'pdf',      label: isCompleted ? 'Signed PDF' : 'Source PDF' },
          { key: 'audit',    label: `Audit Trail (${audit.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Timeline</h3>
            <div className="space-y-3">
              {[
                { label: 'Created',    value: doc.createdAt },
                { label: 'Sent',       value: doc.sentAt },
                { label: 'Viewed',     value: doc.viewedAt },
                { label: 'Submitted',  value: doc.submittedAt },
                { label: 'Completed',  value: doc.completedAt },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`text-sm font-medium ${value ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                    {fmtDateTime(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">
              Signature Fields ({doc.fields?.length || 0})
            </h3>
            {doc.fields?.length > 0 ? (
              <div className="space-y-2">
                {doc.fields.map(f => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.label || f.fieldType}</p>
                      <p className="text-xs text-gray-400">Page {f.page} · {f.fieldType}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                      ${f.signed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>
                      {f.signed ? '✓ Signed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No fields defined</p>
            )}
          </div>

          {/* Integrity */}
          {isCompleted && doc.signedPdfHash && (
            <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-5">
              <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Document Integrity Hash (SHA-256)
              </h3>
              <p className="font-mono text-xs text-green-700 dark:text-green-400 break-all bg-green-100 dark:bg-green-900/40 rounded-lg px-3 py-2">
                {doc.signedPdfHash}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Compare this hash with the downloaded PDF to verify it has not been tampered with.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: PDF Viewer ── */}
      {tab === 'pdf' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {(pdfUrl || srcUrl) ? (
            <iframe
              src={(pdfUrl || srcUrl) + '#toolbar=1&view=FitH'}
              className="w-full border-none"
              style={{ height: '80vh' }}
              title="PDF Viewer"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p className="text-sm">PDF not available yet</p>
                {doc.status === 'SIGNED' && (
                  <p className="text-xs mt-1 text-gray-400">Being processed — refresh in a moment</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Audit Trail ── */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {audit.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <p className="text-sm">No audit events yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {audit.map((ev, i) => {
                const { icon, color } = EVENT_ICONS[ev.event] || { icon: '•', color: 'text-gray-400' }
                return (
                  <div key={ev.id || i} className="flex gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className={`text-xl shrink-0 w-8 text-center mt-0.5 ${color}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {ev.event?.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${ev.actorType === 'CREATOR' ? 'bg-purple-100 text-purple-700'
                            : ev.actorType === 'CLIENT' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'}`}>
                          {ev.actorType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {ev.actor}
                        {ev.ipAddress ? ` · ${ev.ipAddress}` : ''}
                      </p>
                      {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                          {Object.entries(ev.metadata).map(([k, v]) => `${k}: ${v}`).join('  ·  ')}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 text-right whitespace-nowrap">
                      {fmtDateTime(ev.timestamp)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
