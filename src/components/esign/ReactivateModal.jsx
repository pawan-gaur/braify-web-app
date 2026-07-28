import { useEffect, useState } from 'react'

/**
 * Modal to reactivate an expired e-sign document, asking the creator how long the
 * new signing link should stay valid (1–365 days).
 *
 * Props:
 *  - open:     boolean
 *  - title:    optional document title (shown in the sub-text)
 *  - busy:     boolean — request in flight
 *  - onClose:  () => void
 *  - onConfirm:(days:number) => void
 */
export default function ReactivateModal({ open, title, busy = false, onClose, onConfirm }) {
  const [value, setValue] = useState('7')

  useEffect(() => { if (open) setValue('7') }, [open])

  if (!open) return null

  const days  = parseInt(value, 10)
  const valid = Number.isInteger(days) && days >= 1 && days <= 365

  const submit = e => {
    e?.preventDefault()
    if (valid && !busy) onConfirm(days)
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={busy ? undefined : onClose}
    >
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent
                          flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Reactivate document</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              A fresh signing link will be emailed to everyone who still needs to sign
              {title ? <> — <span className="font-medium text-gray-700 dark:text-gray-300">{title}</span></> : null}.
            </p>
          </div>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
          Signing link valid for
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number" min={1} max={365} value={value} autoFocus
            onChange={e => setValue(e.target.value)}
            className="w-28 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600
                       dark:bg-gray-700 dark:text-white focus:border-accent outline-none text-lg font-semibold"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
        </div>
        {!valid && value !== '' && (
          <p className="text-xs text-red-500 mt-1.5">Enter a whole number between 1 and 365.</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          The link (and the document) will expire again if it isn’t signed within this window.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            type="button" onClick={onClose} disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm
                       font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={busy || !valid}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-accent hover:bg-accent-600
                       transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
            {busy ? 'Reactivating…' : 'Reactivate'}
          </button>
        </div>
      </form>
    </div>
  )
}
