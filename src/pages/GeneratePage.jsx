import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTemplates, getTemplate, generatePdf, previewPdfBlob } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'

export default function GeneratePage() {
  useDocumentTitle('Generate PDF')
  const toast              = useToast()
  const [searchParams]     = useSearchParams()
  const preselectedId      = searchParams.get('templateId')
  const [tmplView, setTmplView] = useView('braify-view-generate')

  const [templates,  setTemplates]  = useState([])
  const [selectedId, setSelectedId] = useState(preselectedId || '')
  const [template,   setTemplate]   = useState(null)
  const [jsonInput,  setJsonInput]  = useState('{}')
  const [jsonError,  setJsonError]  = useState(null)
  const [generating, setGenerating] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [filename,   setFilename]   = useState('document.pdf')

  useEffect(() => { getTemplates().then(setTemplates).catch(() => {}) }, [])

  useEffect(() => {
    if (!selectedId) { setTemplate(null); return }
    getTemplate(selectedId).then(t => {
      setTemplate(t)
      setFilename(t.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf')
      setJsonInput(t.placeholders?.length ? JSON.stringify(buildHint(t.placeholders), null, 2) : '{}')
    }).catch(err => toast.error(err.message || 'Could not load template.'))
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const parseJson = () => {
    try { setJsonError(null); return JSON.parse(jsonInput) }
    catch (e) { setJsonError('Invalid JSON: ' + e.message); return null }
  }

  const handleGenerate = async () => {
    const data = parseJson(); if (!data) return
    setGenerating(true)
    try {
      await generatePdf(selectedId, data, filename)
      toast.success('PDF downloaded successfully.')
    }
    catch (err) { toast.error(err.message || 'PDF generation failed.') }
    finally { setGenerating(false) }
  }

  const handlePreview = async () => {
    const data = parseJson(); if (!data) return
    setPreviewing(true)
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(await previewPdfBlob(selectedId, data))
    }
    catch (err) { toast.error(err.message || 'Preview failed.') }
    finally { setPreviewing(false) }
  }

  /* Build crumbs — extends with template name once selected */
  const crumbs = [
    { label: 'Dashboard',   to: '/' },
    { label: 'Generate PDF', to: '/generate' },
    ...(template ? [{ label: template.name }] : []),
  ]
  // If no template selected the last crumb is Generate PDF (no `to` needed since it IS current)
  if (!template) crumbs[crumbs.length - 1] = { label: 'Generate PDF' }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Breadcrumbs */}
      <Breadcrumbs items={crumbs} />

      {/* Page header */}
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Generate PDF</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a template, fill in the data, then download or preview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-4">

          {/* Template selector */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Template</label>
              <ViewToggle view={tmplView} onChange={setTmplView} />
            </div>

            {tmplView === 'table' ? (
              /* Compact dropdown */
              <select
                className="form-select"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">— Select a template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : (
              /* Card grid picker */
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-0.5">
                {templates.length === 0 && (
                  <p className="text-xs text-gray-400 py-2 text-center">No templates found</p>
                )}
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all
                      ${selectedId === t.id
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    {/* Mini icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedId === t.id ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <svg className={`w-4 h-4 ${selectedId === t.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}
                        fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        selectedId === t.id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-800 dark:text-gray-200'
                      }`}>{t.name}</p>
                      <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-medium text-gray-400">{t.pageSize || 'A4'}</span>
                        {t.placeholders?.length > 0 && (
                          <span className="text-[10px] font-medium text-gray-400">· {t.placeholders.length} fields</span>
                        )}
                      </div>
                    </div>
                    {selectedId === t.id && (
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {template && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
                <p className="font-semibold text-navy dark:text-white">{template.name}</p>
                {template.description && <p className="text-gray-400 text-xs mt-0.5">{template.description}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="badge badge-indigo">{template.pageSize}</span>
                  <span className="badge badge-violet">{template.orientation}</span>
                  <span className="badge badge-emerald">{template.placeholders?.length || 0} fields</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="form-label">Output filename</label>
              <input
                className="form-input"
                value={filename}
                onChange={e => setFilename(e.target.value)}
              />
            </div>
          </div>

          {/* Placeholder reference */}
          {template?.placeholders?.length > 0 && (
            <div className="card">
              <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
                Template Fields
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.placeholders.map(p => (
                  <span key={p} className="ph-chip font-mono">{`{{${p}}}`}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary w-full justify-center py-2.5"
              onClick={handleGenerate}
              disabled={!selectedId || generating}
            >
              {generating
                ? <><Spinner /> Generating…</>
                : <><DownloadIcon /> Download PDF</>}
            </button>
            <button
              className="btn btn-outline w-full justify-center py-2.5"
              onClick={handlePreview}
              disabled={!selectedId || previewing}
            >
              {previewing
                ? <><Spinner /> Loading preview…</>
                : <><EyeIcon /> Preview in browser</>}
            </button>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4">

          {/* JSON editor */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-700">Data Payload</p>
              <span className="text-xs text-gray-400">JSON</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Fill in values to replace{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{'{{placeholders}}'}</code>{' '}
              in the template.
            </p>

            {jsonError && <div className="alert alert-error py-2 text-xs">{jsonError}</div>}

            <textarea
              value={jsonInput}
              onChange={e => { setJsonInput(e.target.value); setJsonError(null) }}
              className={`w-full min-h-72 font-mono text-sm px-4 py-3 rounded-lg border resize-y outline-none transition-colors duration-150 bg-gray-50 text-gray-800 leading-relaxed ${
                jsonError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'
              }`}
              spellCheck={false}
            />
          </div>

          {/* PDF preview */}
          {previewUrl && (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-700">PDF Preview</span>
                <button
                  className="btn btn-ghost btn-sm text-gray-400"
                  onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}
                >
                  ✕ Close
                </button>
              </div>
              <iframe
                src={previewUrl}
                className="w-full border-none"
                style={{ height: 640 }}
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Tiny icon helpers ── */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  )
}

/* ── Hint builder ── */
function buildHint(placeholders) {
  const obj = {}
  for (const path of placeholders) setNestedHint(obj, path.split('.'))
  return obj
}

function setNestedHint(obj, parts) {
  const [head, ...rest] = parts
  const key = head.replace(/\[.*\]/, '')
  if (rest.length === 0) { if (!(key in obj)) obj[key] = key }
  else {
    if (!obj[key] || typeof obj[key] !== 'object') obj[key] = {}
    setNestedHint(obj[key], rest)
  }
}
