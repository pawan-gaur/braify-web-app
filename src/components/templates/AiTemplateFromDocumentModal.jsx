/**
 * Create a PDF or Email template from an existing document with AI.
 * Step 1: upload a .docx / .pdf / .html / .txt (+ optional notes). Step 2: the server drafts a
 * template with {{placeholders}}; the user reviews the preview, name and detected fields.
 * Step 3: "Create template" saves it through the normal create API (onCreate).
 *
 * Props:
 *   open, kind ('PDF' | 'Email'), onClose,
 *   onCreate(payload) => Promise<created>,   // createTemplate / createEmailTemplate
 *   onCreated(created)                        // e.g. navigate to the builder
 */
import { useEffect, useMemo, useState } from 'react'
import FileDropZone from '../ui/FileDropZone'
import { aiTemplateFromDocument } from '../../services/api'

const ACCEPT = '.docx,.pdf,.html,.htm,.txt'
const MAX_MB = 10

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Sandboxed preview document: placeholders highlighted, optionally filled with the sample values. */
function previewDoc(html, css, placeholders, showSamples) {
  const samples = Object.fromEntries((placeholders || []).map(p => [p.key, p.example]))
  const body = (html || '').replace(/\{\{([A-Za-z0-9_.-]+)\}\}/g, (token, key) =>
    `<mark class="ph">${esc(showSamples && samples[key] ? samples[key] : token)}</mark>`)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#1d1d1f;font-size:14px}
    mark.ph{background:#E6F0FF;color:#0047B3;border-radius:3px;padding:0 2px}
    ${css || ''}</style></head><body>${body}</body></html>`
}

export default function AiTemplateFromDocumentModal({ open, kind = 'PDF', onClose, onCreate, onCreated }) {
  const isEmail = kind === 'Email'
  const [step, setStep]         = useState('upload')   // upload | working | review
  const [file, setFile]         = useState(null)
  const [notes, setNotes]       = useState('')
  const [draft, setDraft]       = useState(null)
  const [name, setName]         = useState('')
  const [code, setCode]         = useState('')
  const [subject, setSubject]   = useState('')
  const [samples, setSamples]   = useState(true)
  const [elapsed, setElapsed]   = useState(0)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!open) {
      setStep('upload'); setFile(null); setNotes(''); setDraft(null); setName(''); setCode('')
      setSubject(''); setSamples(true); setElapsed(0); setSaving(false); setError('')
    }
  }, [open])

  // Drafting can take a while on long documents — show a running timer.
  useEffect(() => {
    if (step !== 'working') return
    setElapsed(0)
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [step])

  const srcDoc = useMemo(
    () => draft ? previewDoc(draft.htmlContent, draft.cssContent, draft.placeholders, samples) : '',
    [draft, samples])

  if (!open) return null
  const busy = step === 'working' || saving

  function pickFile(f) {
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) { setError(`The file is larger than ${MAX_MB} MB.`); return }
    setFile(f); setError('')
  }

  async function generate() {
    if (!file) { setError('Choose a document to convert.'); return }
    setStep('working'); setError('')
    try {
      const d = await aiTemplateFromDocument(file, isEmail ? 'EMAIL' : 'PDF', notes.trim())
      if (d.status !== 'OK') { setError(d.message || 'The template could not be generated.'); setStep('upload'); return }
      setDraft(d)
      setName(d.name || '')
      setSubject(d.subject || '')
      setStep('review')
    } catch (e) {
      setError(e.message || 'The template could not be generated.')
      setStep('upload')
    }
  }

  async function create() {
    if (!name.trim()) { setError('Enter a template name.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        description: draft.description || undefined,
        htmlContent: draft.htmlContent,
        cssContent: draft.cssContent || '',
      }
      if (isEmail) payload.subject = subject.trim() || name.trim()
      const created = await onCreate(payload)
      onCreated?.(created)
    } catch (e) {
      setError(e.message || 'Failed to create the template')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500'
  const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !busy && onClose()}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full overflow-hidden flex flex-col max-h-[90vh] ${step === 'review' ? 'max-w-5xl' : 'max-w-lg'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Create {isEmail ? 'email' : 'PDF'} template with AI
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {step === 'review'
              ? 'Check the draft, then create it. You can refine everything in the builder.'
              : <>Upload an existing document. AI turns the values that change each time into fields like <code className="font-mono">{'{{client_name}}'}</code>.</>}
          </p>
        </div>

        {step !== 'review' && (
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className={labelCls}>Document</label>
              <FileDropZone
                size="sm"
                accept={ACCEPT}
                hint={`Word (.docx), PDF, HTML or text · max ${MAX_MB} MB`}
                selected={file ? { title: file.name } : null}
                onFiles={([f]) => pickFile(f)}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelCls}>Notes for the AI <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={2000} disabled={busy}
                placeholder="e.g. Keep the company details fixed; make the client, dates and amounts fields."
                className={inputCls}
              />
            </div>
            {step === 'working' && (
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-gray-900 px-3 py-2.5">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {elapsed < 4 ? 'Reading your document…' : 'Building your template — longer documents can take up to a minute…'}
                  <span className="text-gray-400 ml-1">{elapsed}s</span>
                </p>
              </div>
            )}
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        )}

        {step === 'review' && draft && (
          <div className="flex-1 overflow-hidden grid md:grid-cols-[1fr_300px] min-h-0">
            <div className="flex flex-col min-h-0 border-r border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Preview</span>
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={samples} onChange={e => setSamples(e.target.checked)} />
                  Show sample values
                </label>
              </div>
              {/* No allow-scripts: the draft is static markup (scripts are also stripped server-side). */}
              <iframe title="Template preview" sandbox="allow-same-origin" srcDoc={srcDoc} className="flex-1 w-full min-h-[360px] bg-white" />
            </div>

            <div className="overflow-y-auto px-4 py-4 space-y-3">
              <div>
                <label className={labelCls}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </div>
              {isEmail && (
                <div>
                  <label className={labelCls}>Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Code <span className="font-normal text-gray-400">(optional, unique)</span></label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. SERVICE_AGREEMENT"
                  className={`${inputCls} font-mono`} />
              </div>
              <div>
                <p className={labelCls}>Fields detected ({draft.placeholders?.length || 0})</p>
                {draft.placeholders?.length ? (
                  <ul className="space-y-1.5">
                    {draft.placeholders.map(p => (
                      <li key={p.key} className="rounded-lg border border-gray-100 dark:border-gray-700 px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{p.label}</span>
                          <code className="text-[10px] font-mono text-brand-600 shrink-0">{`{{${p.key}}}`}</code>
                        </div>
                        {p.example && <p className="text-[11px] text-gray-400 truncate">e.g. {p.example}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No fields were detected. You can add them in the builder.</p>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Drafted from {draft.sourceFileName} by {draft.provider}{draft.model ? ` · ${draft.model}` : ''}. Review it before use.
              </p>
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
          {step === 'review' ? (
            <>
              <button onClick={() => { setStep('upload'); setError('') }} disabled={saving} className="btn btn-secondary btn-sm">Back</button>
              <button onClick={create} disabled={saving} className="btn btn-accent btn-sm disabled:opacity-50">
                {saving ? 'Creating…' : 'Create template'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} disabled={busy} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={generate} disabled={busy || !file} className="btn btn-accent btn-sm disabled:opacity-50">
                {step === 'working' ? 'Generating…' : 'Generate template'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
