import { useState, useEffect } from 'react'
import { previewPdfBlob } from '../../services/api'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Build a flat sample-data object so every placeholder renders as a readable value. */
function buildSampleData(placeholders = []) {
  const obj = {}
  for (const path of placeholders) {
    setNested(obj, path.split('.'), path) // use the placeholder name itself as sample text
  }
  return obj
}

function setNested(obj, [head, ...rest], leafValue) {
  const key = head.replace(/\[.*\]/, '')
  if (rest.length === 0) {
    if (!(key in obj)) obj[key] = leafValue   // e.g. "firstName" → "firstName"
  } else {
    if (!obj[key] || typeof obj[key] !== 'object') obj[key] = {}
    setNested(obj[key], rest, leafValue)
  }
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
/**
 * Props:
 *  template  – { id, name, pageSize, orientation, placeholders[] }
 *  onClose   – called when the modal should close
 */
export default function TemplatePreviewModal({ template, onClose }) {
  const [pdfUrl,   setPdfUrl]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let objectUrl = null
    setLoading(true)
    setError(null)

    const sampleData = buildSampleData(template.placeholders)

    previewPdfBlob(template.id, sampleData)
      .then(url => { objectUrl = url; setPdfUrl(url) })
      .catch(err => setError(err.message || 'Preview failed.'))
      .finally(() => setLoading(false))

    return () => {
      // revoke blob URL on unmount to free memory
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [template.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Open the PDF in a new tab */
  const handleOpenTab = () => { if (pdfUrl) window.open(pdfUrl, '_blank') }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col
                   w-full max-w-4xl"
        style={{ height: 'min(90vh, 860px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5
                        border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Eye icon */}
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30
                            flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                     -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                {template.name}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {template.pageSize} · {template.orientation}
                {template.placeholders?.length > 0 && (
                  <span className="ml-1">
                    · {template.placeholders.length} placeholder{template.placeholders.length !== 1 ? 's' : ''} filled with sample data
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in new tab */}
            {pdfUrl && (
              <button
                onClick={handleOpenTab}
                title="Open in new tab"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                           border border-gray-200 dark:border-gray-600
                           text-gray-500 dark:text-gray-400
                           hover:border-primary hover:text-primary transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                       M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Open in tab
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl
                         text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-800 rounded-b-2xl">

          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-sm">Rendering PDF preview…</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                       c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Preview failed
              </p>
              <p className="text-xs text-gray-400 max-w-xs">{error}</p>
            </div>
          )}

          {/* PDF iframe */}
          {!loading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none rounded-b-2xl"
              title={`Preview – ${template.name}`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
