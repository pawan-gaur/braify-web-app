/**
 * Clone a PDF or Email template. Pre-fills the new code + name with the source's values
 * suffixed "_clone" (the user can rename before creating). A duplicate/reserved code returns
 * 400 and the message is shown inline so the user can pick a different code.
 *
 * Props:
 *   open, source ({ id, name, code }),
 *   cloneFn(id, { code, name }) => Promise<created>,   // cloneTemplate / cloneEmailTemplate
 *   onClose, onCloned(created)
 */
import { useEffect, useState } from 'react'

export default function TemplateCloneModal({ open, source, cloneFn, onClose, onCloned }) {
  const [code, setCode]   = useState('')
  const [name, setName]   = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && source) {
      setCode(source.code ? `${source.code}_clone` : '')
      setName(source.name ? `${source.name}_clone` : '')
      setError('')
      setBusy(false)
    }
  }, [open, source])

  if (!open || !source) return null

  async function submit() {
    setBusy(true); setError('')
    try {
      const created = await cloneFn(source.id, { code: code.trim() || undefined, name: name.trim() || undefined })
      onCloned?.(created)
    } catch (e) {
      setError(e.message || 'Failed to clone the template')
      setBusy(false)   // keep open so the user can rename
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !busy && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Clone template</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Copy of “{source.name}”</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">New name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              New code <span className="font-normal text-gray-400">(unique{source.code ? '' : ', optional'})</span>
            </label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. INVOICE_A_clone"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500" />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={submit} disabled={busy || !name.trim()} className="btn btn-accent btn-sm disabled:opacity-50">
            {busy ? 'Cloning…' : 'Create clone'}
          </button>
        </div>
      </div>
    </div>
  )
}
