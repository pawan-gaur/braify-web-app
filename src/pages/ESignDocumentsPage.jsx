import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { esignListDocuments, esignCancelDocument, esignResendDocument } from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'E-Sign Documents' },
]

const STATUS_COLORS = {
  DRAFT:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  PENDING:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  SIGNED:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  EXPIRED:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Copy text to clipboard and briefly toggle a "copied" state */
function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy full ID'}
      className="p-0.5 rounded text-gray-300 hover:text-purple-500 dark:hover:text-purple-400
                 transition-colors shrink-0"
    >
      {copied ? (
        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      )}
    </button>
  )
}

export default function ESignDocumentsPage() {
  const [docs, setDocs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [resending, setResending] = useState(null)  // docId currently being resent
  const navigate               = useNavigate()
  const { showToast }          = useToast()

  useEffect(() => {
    esignListDocuments()
      .then(setDocs)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = docs.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.clientEmail?.toLowerCase().includes(search.toLowerCase()) ||
    d.clientName?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCancel(id, e) {
    e.stopPropagation()
    if (!confirm('Cancel this document? The client will no longer be able to sign it.')) return
    try {
      await esignCancelDocument(id)
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'CANCELLED' } : d))
      showToast('Document cancelled', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleResend(id, e) {
    e.stopPropagation()
    if (!confirm('Resend the signing invitation email to the client?')) return
    setResending(id)
    try {
      await esignResendDocument(id)
      showToast('Signing invitation resent successfully', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResending(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-Sign Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage documents sent for electronic signature
          </p>
        </div>
        <button
          onClick={() => navigate('/esign/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
                     shadow-sm hover:shadow-md transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          New Document
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
        </svg>
        <input
          type="text"
          placeholder="Search by title, client name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No documents yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Create your first e-sign document to get started
          </p>
          <button
            onClick={() => navigate('/esign/new')}
            className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold
                       transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
          >
            Create Document
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Title', 'Client', 'ID', 'Status', 'Sent', 'Completed', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(doc => {
                const isTerminal = ['COMPLETED','CANCELLED','EXPIRED'].includes(doc.status)
                const href = isTerminal ? `/esign/${doc.id}/view` : `/esign/${doc.id}`
                return (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(href)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    {/* Title */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doc.sourceType}</p>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{doc.clientName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{doc.clientEmail}</p>
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                                         px-2 py-0.5 rounded-md tracking-wide">
                          …{doc.id.slice(-6)}
                        </span>
                        <CopyIdButton id={doc.id}/>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                      ${STATUS_COLORS[doc.status] || STATUS_COLORS.DRAFT}`}>
                        {doc.status?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{fmtDate(doc.sentAt)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{fmtDate(doc.completedAt)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>

                        {/* View / Edit */}
                        <button
                          onClick={() => navigate(href)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30
                                     text-gray-400 hover:text-purple-600 transition-colors"
                          title={isTerminal ? 'View' : 'Edit'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>

                        {/* Resend — only when PENDING */}
                        {doc.status === 'PENDING' && (
                          <button
                            onClick={e => handleResend(doc.id, e)}
                            disabled={resending === doc.id}
                            className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30
                                       text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400
                                       transition-colors disabled:opacity-50"
                            title="Resend signing invitation"
                          >
                            {resending === doc.id ? (
                              <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                              </svg>
                            )}
                          </button>
                        )}

                        {/* Cancel */}
                        {!isTerminal && (
                          <button
                            onClick={e => handleCancel(doc.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30
                                       text-gray-400 hover:text-red-500 transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
