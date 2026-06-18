import { useState, useMemo, useEffect, useRef } from 'react'

/* ── helpers ────────────────────────────────────────────────────────────── */

/** Replace every {{placeholder}} in the HTML with the placeholder name itself. */
function fillSampleData(html = '', placeholders = []) {
  let result = html
  for (const p of placeholders) {
    result = result.replaceAll(`{{${p}}}`, `<span style="background:#fef3c7;color:#92400e;
      border-radius:3px;padding:0 3px;font-style:italic;">${p}</span>`)
  }
  // catch any remaining {{…}} not in the list
  result = result.replace(/\{\{([^}]+)\}\}/g, (_, name) =>
    `<span style="background:#fef3c7;color:#92400e;border-radius:3px;
      padding:0 3px;font-style:italic;">${name}</span>`)
  return result
}

/** Build the full HTML document to load into the iframe. */
function buildDocument(html, css) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, sans-serif; }
  ${css || ''}
</style>
</head>
<body>${html || '<p style="padding:32px;color:#9ca3af;text-align:center;">No content yet.</p>'}</body>
</html>`
}

const DEVICES = [
  { key: 'desktop', label: 'Desktop', width: 640,  icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'mobile',  label: 'Mobile',  width: 375,  icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
]

/* ── modal ──────────────────────────────────────────────────────────────── */
/**
 * Props:
 *   template  – full EmailTemplate object ({ name, subject, fromName, previewText,
 *                htmlContent, cssContent, placeholders })
 *   onClose   – callback to close the modal
 */
export default function EmailPreviewModal({ template, onClose }) {
  const [device, setDevice] = useState('desktop')
  const iframeRef           = useRef(null)

  const currentDevice = DEVICES.find(d => d.key === device)

  /* Build the document once (or when template changes) */
  const srcDoc = useMemo(() => {
    const filled = fillSampleData(template.htmlContent, template.placeholders)
    return buildDocument(filled, template.cssContent)
  }, [template])

  /* Open in new tab */
  const handleOpenTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // revoke after a short delay — the new tab needs time to load it
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  /* Close on Escape */
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center
                 justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col
                   w-full max-w-4xl overflow-hidden"
        style={{ height: 'min(92vh, 900px)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3
                        border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30
                            flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                Email preview
                {template.placeholders?.length > 0 &&
                  ` · ${template.placeholders.length} placeholder${template.placeholders.length !== 1 ? 's' : ''} shown with sample values`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Device switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {DEVICES.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDevice(d.key)}
                  title={`${d.label} (${d.width}px)`}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium
                              transition-all ${device === d.key
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d.icon}/>
                  </svg>
                  {d.label}
                </button>
              ))}
            </div>

            {/* Open in tab */}
            <button
              onClick={handleOpenTab}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                         border border-gray-200 dark:border-gray-600
                         text-gray-500 dark:text-gray-400
                         hover:border-sky-400 hover:text-sky-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                     M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Open in tab
            </button>

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

        {/* ── Email client header (From / Subject / Preview) ── */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/60
                        border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-1">
          {template.fromName && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-14 text-gray-400 font-medium shrink-0">From</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{template.fromName}</span>
            </div>
          )}
          {template.subject && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-14 text-gray-400 font-medium shrink-0">Subject</span>
              <span className="text-gray-800 dark:text-gray-200 font-semibold">{template.subject}</span>
            </div>
          )}
          {template.previewText && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-14 text-gray-400 font-medium shrink-0">Preview</span>
              <span className="text-gray-400 dark:text-gray-500 italic truncate">{template.previewText}</span>
            </div>
          )}
          {!template.fromName && !template.subject && !template.previewText && (
            <p className="text-xs text-gray-400 italic">No subject or sender set on this template.</p>
          )}
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-950 flex justify-center py-6 px-4">
          <div
            className="transition-all duration-300 ease-in-out"
            style={{ width: currentDevice.width, minWidth: 0 }}
          >
            {/* Device chrome — thin top bar to sell the "phone/monitor" feel */}
            <div className={`mb-2 flex items-center justify-between px-3 py-1.5
                             rounded-t-xl bg-white dark:bg-gray-800 shadow-sm
                             border border-gray-200 dark:border-gray-700`}>
              <span className="text-[10px] text-gray-400 font-mono">
                {currentDevice.label} · {currentDevice.width}px
              </span>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"/>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400"/>
              </div>
            </div>

            {/* Iframe */}
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              sandbox="allow-same-origin allow-scripts"
              className="w-full border-none rounded-b-xl shadow-md bg-white"
              style={{ height: 600, display: 'block' }}
              title={`Email preview – ${template.name}`}
              onLoad={e => {
                // auto-expand height to fit content (up to 800px)
                try {
                  const doc = e.target.contentDocument
                  if (doc) {
                    const h = doc.documentElement.scrollHeight
                    e.target.style.height = Math.min(Math.max(h, 200), 800) + 'px'
                  }
                } catch { /* cross-origin guard */ }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
