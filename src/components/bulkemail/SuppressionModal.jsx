/**
 * Suppression (unsubscribe) list manager.
 *
 * Lists the org's do-not-email addresses, lets an admin add one manually, and remove
 * (re-allow) any entry. Addresses land here automatically when a recipient clicks the
 * unsubscribe link; every future campaign skips them.
 */
import { useEffect, useState } from 'react'
import {
  bulkEmailListSuppressions,
  bulkEmailAddSuppression,
  bulkEmailRemoveSuppression,
} from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { fmtDateTimeGB as fmtDate } from '../../utils/date'

const REASON_LABEL = {
  UNSUBSCRIBE: 'Unsubscribed',
  BOUNCE:      'Bounced',
  COMPLAINT:   'Complaint',
  MANUAL:      'Added manually',
}

export default function SuppressionModal({ open, onClose }) {
  const toast = useToast()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail]     = useState('')
  const [adding, setAdding]   = useState(false)
  const [q, setQ]             = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    bulkEmailListSuppressions()
      .then(d => setRows(d || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  async function handleAdd(e) {
    e.preventDefault()
    const v = email.trim()
    if (!v) return
    setAdding(true)
    try {
      const created = await bulkEmailAddSuppression(v)
      setRows(prev => prev.some(r => r.id === created.id) ? prev : [created, ...prev])
      setEmail('')
      toast.success(`${created.email} will be skipped in future campaigns`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id, addr) {
    try {
      await bulkEmailRemoveSuppression(id)
      setRows(prev => prev.filter(r => r.id !== id))
      toast.success(`${addr} can be emailed again`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filtered = rows.filter(r => !q || r.email?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Unsubscribe list</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Addresses here are skipped in every campaign
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="add-address@example.com"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <button type="submit" disabled={adding || !email.trim()} className="btn btn-accent btn-sm shrink-0">
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>

        {/* Search */}
        {rows.length > 8 && (
          <div className="px-5 pt-3">
            <input
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Filter…"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {rows.length === 0 ? 'No suppressed addresses yet.' : 'No matches.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.email}</p>
                    <p className="text-xs text-gray-400">
                      {REASON_LABEL[r.reason] || r.reason}{r.createdAt ? ` · ${fmtDate(r.createdAt)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(r.id, r.email)}
                    title="Remove (allow emailing again)"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-right">
          <span className="text-xs text-gray-400 mr-auto float-left mt-1.5">{rows.length} address{rows.length !== 1 ? 'es' : ''}</span>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  )
}
