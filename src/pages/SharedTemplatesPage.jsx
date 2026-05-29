import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { getReceivedShares, getSentShares, revokeShare } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { fmtDate } from '../utils/date'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Shared Templates' },
]

const PERM_META = {
  VIEW: { label: 'View',       cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  USE:  { label: 'Use',        cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  EDIT: { label: 'Edit (fork)', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
}

const TYPE_META = {
  TEMPLATE:       { label: 'PDF Template',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  EMAIL_TEMPLATE: { label: 'Email Template', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
}

function PermBadge({ permission }) {
  const meta = PERM_META[permission] || PERM_META.VIEW
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

function TypeIcon({ type }) {
  const meta = TYPE_META[type] || TYPE_META.TEMPLATE
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={meta.icon} />
    </svg>
  )
}

/* ── Received share card ── */
function ReceivedCard({ share, onUse }) {
  const navigate = useNavigate()

  const handleAction = () => {
    if (share.permission === 'VIEW') {
      // VIEW — do nothing actionable without a preview modal; just show info
      return
    }
    if (share.permission === 'USE') {
      // Navigate to generate page with template pre-selected
      navigate(`/generate?templateId=${share.templateId}`)
    }
    if (share.permission === 'EDIT') {
      // Navigate to the forked template in the builder
      if (share.templateType === 'TEMPLATE') {
        navigate(`/builder/${share.forkedTemplateId || share.templateId}`)
      } else {
        navigate(`/email-builder/${share.forkedTemplateId || share.templateId}`)
      }
    }
  }

  const actionLabel = share.permission === 'VIEW' ? 'Preview'
    : share.permission === 'USE' ? 'Generate PDF'
    : 'Open in Builder'

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <TypeIcon type={share.templateType} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{share.templateName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Shared by <span className="font-semibold text-gray-600 dark:text-gray-300">{share.sourceOrgName}</span>
          </p>
        </div>
        <PermBadge permission={share.permission} />
      </div>

      {share.note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
          "{share.note}"
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-gray-400">{fmtDate(share.sharedAt)}</p>
        {share.permission !== 'VIEW' && (
          <button
            onClick={handleAction}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                       text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600
                       dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Sent share row ── */
function SentRow({ share, onRevoked }) {
  const toast = useToast()
  const [revoking, setRevoking] = useState(false)

  const handleRevoke = async () => {
    const msg = share.permission === 'EDIT'
      ? `Revoke share with "${share.targetOrgName}"? The forked copy will be soft-deleted.`
      : `Revoke share with "${share.targetOrgName}"?`
    if (!confirm(msg)) return
    setRevoking(true)
    try {
      await revokeShare(share.id)
      toast.success('Share revoked.')
      onRevoked(share.id)
    } catch (err) {
      toast.error(err.message || 'Failed to revoke share.')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <TypeIcon type={share.templateType} />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{share.templateName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {TYPE_META[share.templateType]?.label}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
        {share.targetOrgName}
      </td>
      <td className="px-5 py-3.5">
        <PermBadge permission={share.permission} />
      </td>
      <td className="px-5 py-3.5 text-xs text-gray-400">
        {share.sharedBy}<br />
        <span className="text-[10px]">{fmtDate(share.sharedAt)}</span>
      </td>
      <td className="px-5 py-3.5">
        {share.note ? (
          <span className="text-xs text-gray-500 italic truncate max-w-[140px] block" title={share.note}>
            "{share.note}"
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right">
        <button
          onClick={handleRevoke}
          disabled={revoking}
          className="text-xs text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          {revoking ? 'Revoking…' : 'Revoke'}
        </button>
      </td>
    </tr>
  )
}

/* ── Main page ── */
export default function SharedTemplatesPage() {
  useDocumentTitle('Shared Templates')
  const toast = useToast()

  const [tab,      setTab]      = useState('received')  // 'received' | 'sent'
  const [received, setReceived] = useState([])
  const [sent,     setSent]     = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getReceivedShares(), getSentShares()])
      .then(([r, s]) => { setReceived(r); setSent(s) })
      .catch(err => toast.error(err.message || 'Could not load shared templates.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRevoked = (id) => setSent(prev => prev.filter(s => s.id !== id))

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Templates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Templates shared between organisations for cross-team collaboration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mb-6">
        {[
          { id: 'received', label: 'Shared with me', count: received.length },
          { id: 'sent',     label: 'Shared by me',   count: sent.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.id
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${tab === t.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      ) : tab === 'received' ? (
        /* ── Received tab ── */
        received.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            <p className="text-sm">No templates have been shared with your organisation yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {received.map(share => (
              <ReceivedCard key={share.id} share={share} />
            ))}
          </div>
        )
      ) : (
        /* ── Sent tab ── */
        sent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            <p className="text-sm">You haven't shared any templates yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Open a template and click "Share" to get started.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Template</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Shared with</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Permission</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Shared by</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Note</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {sent.map(share => (
                  <SentRow key={share.id} share={share} onRevoked={handleRevoked} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

