import { useState } from 'react'
import { createPortal } from 'react-dom'
import EmailPreviewModal from './EmailPreviewModal'
import TemplatePreviewModal from './TemplatePreviewModal'
import { getEmailTemplate } from '../../services/api'

/**
 * Small "Preview" trigger for template pickers — lets the user look at an existing
 * email or PDF template before (or after) selecting it, without leaving the flow.
 *
 * Props:
 *   kind      – 'email' | 'pdf'
 *   template  – the template object from the list endpoint (null/undefined → disabled)
 *   compact   – icon-only (for small cards); default shows "Preview" text
 *   className – extra classes (e.g. absolute positioning inside a card)
 *
 * The modal is portalled to <body> and click events are stopped at the trigger and
 * the portal root, so it can sit next to (or over) a clickable card without
 * selecting it.
 */
export default function TemplatePreviewButton({ kind, template, compact = false, className = '' }) {
  const [open,    setOpen]    = useState(false)
  const [full,    setFull]    = useState(null)
  const [loading, setLoading] = useState(false)

  const disabled = !template?.id

  const handleOpen = async e => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    // Email list items normally carry htmlContent; fetch the full template if not.
    if (kind === 'email' && template.htmlContent == null) {
      setLoading(true)
      try { setFull(await getEmailTemplate(template.id)) }
      catch { setFull(template) }
      finally { setLoading(false) }
    } else {
      setFull(template)
    }
    setOpen(true)
  }

  const close = () => { setOpen(false); setFull(null) }
  const label = `Preview ${template?.name || 'template'}`

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || loading}
        title={disabled ? 'Select a template to preview' : label}
        aria-label={label}
        className={`inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg border
                    border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90
                    text-gray-500 dark:text-gray-400 hover:border-accent-400 hover:text-accent-600
                    dark:hover:text-accent-400 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors ${compact ? 'w-7 h-7' : 'px-3 py-2 text-xs font-medium'} ${className}`}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        )}
        {!compact && 'Preview'}
      </button>

      {open && full && createPortal(
        <div onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          {kind === 'email'
            ? <EmailPreviewModal template={full} onClose={close} />
            : <TemplatePreviewModal template={full} onClose={close} />}
        </div>,
        document.body,
      )}
    </>
  )
}
