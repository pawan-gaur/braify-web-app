import { useState } from 'react'

/** Editable list of email addresses (chips + input). Controlled: `value` / `onChange(next)`. */
export default function EmailListInput({ value = [], onChange, disabled = false, max = 10, id = 'billing-emails' }) {
  const [text, setText] = useState('')
  const add = () => {
    const parts = text.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
    if (!parts.length) return
    const next = [...value]
    for (const p of parts) if (!next.includes(p) && next.length < max) next.push(p)
    onChange(next)
    setText('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(e => (
          <span key={e} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            {e}
            {!disabled && (
              <button type="button" aria-label={`Remove ${e}`} className="text-gray-400 hover:text-rose-600"
                onClick={() => onChange(value.filter(x => x !== e))}>×</button>
            )}
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-gray-400">No billing emails yet.</span>}
      </div>
      <div className="flex gap-2">
        <input id={id} type="text" className="form-input" placeholder="accounts@company.com" disabled={disabled || value.length >= max}
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }} onBlur={add} />
        <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || !text.trim()} onClick={add}>Add</button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Invoices and reminders go to these addresses (up to {max}).</p>
    </div>
  )
}
