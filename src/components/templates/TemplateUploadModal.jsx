/**
 * Create a PDF or Email template by uploading an HTML file.
 * Placeholders ({{...}}) are auto-detected server-side. A unique per-org "code" is optional;
 * a duplicate code returns 400 and the error is shown inline so the user can rename.
 *
 * Props:
 *   open, kind ('PDF' | 'Email'), onClose,
 *   onCreate(payload) => Promise<created>,   // createTemplate / createEmailTemplate
 *   onCreated(created)                        // e.g. navigate to the builder
 */
import { useEffect, useState } from 'react'

export default function TemplateUploadModal({ open, kind = 'PDF', onClose, onCreate, onCreated }) {
  const [file, setFile]       = useState(null)
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [subject, setSubject] = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!open) { setFile(null); setName(''); setCode(''); setSubject(''); setError(''); setBusy(false) }
  }, [open])

  if (!open) return null
  const isEmail = kind === 'Email'

  function pickFile(f) {
    if (!f) return
    setFile(f)
    if (!name) setName(f.name.replace(/\.html?$/i, ''))   // suggest a name from the filename
    setError('')
  }

  async function submit() {
    if (!file)        { setError('Choose an HTML file to upload.'); return }
    if (!name.trim()) { setError('Enter a template name.'); return }
    setBusy(true); setError('')
    try {
      const htmlContent = await file.text()
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        htmlContent,
        cssContent: '',
      }
      if (isEmail) payload.subject = subject.trim() || name.trim()
      const created = await onCreate(payload)
      onCreated?.(created)
    } catch (e) {
      setError(e.message || 'Failed to create the template')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !busy && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Upload {isEmail ? 'email' : 'PDF'} template from HTML</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Placeholders like <code className="font-mono">{'{{name}}'}</code> are detected automatically.
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">HTML file</label>
            <input type="file" accept=".html,.htm,text/html" onChange={e => pickFile(e.target.files?.[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Invoice A"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500" />
          </div>
          {isEmail && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Subject <span className="font-normal text-gray-400">(optional)</span></label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Code <span className="font-normal text-gray-400">(optional, unique)</span></label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. INVOICE_A"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500" />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn btn-accent btn-sm disabled:opacity-50">
            {busy ? 'Creating…' : 'Create template'}
          </button>
        </div>
      </div>
    </div>
  )
}
