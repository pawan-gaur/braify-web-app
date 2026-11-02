import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import FileDropZone from '../components/ui/FileDropZone'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { fmtDateTime } from '../utils/date'
import {
  getTemplates, createPdfBulkJob, listPdfBulkJobs, getPdfBulkDownload, fetchPdfBulkZip,
} from '../services/api'

const CRUMBS = [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Bulk PDF' }]
const MAX_ROWS = 1000
const ACTIVE = ['QUEUED', 'RUNNING']
const STATUS_BADGE = {
  QUEUED: 'badge-gray', RUNNING: 'badge-brand', COMPLETED: 'badge-success', PARTIAL: 'badge-warning', FAILED: 'badge-danger',
}

/** SheetJS numbers carry float noise (652455.6500000001) — normalise like the bulk e-sign page. */
function cellStr(v) {
  if (v == null) return ''
  if (typeof v === 'number') return String(parseFloat(v.toPrecision(15)))
  return String(v)
}

function parseSheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
        if (raw.length < 2) throw new Error('The sheet needs a header row and at least one data row.')
        const headers = raw[0].map(h => String(h).trim())
        const rows = raw.slice(1)
          .filter(r => r.some(c => c !== '' && c != null))
          .map(r => Object.fromEntries(headers.map((h, i) => [h, cellStr(r[i])]).filter(([h]) => h)))
        if (!rows.length) throw new Error('No data rows found.')
        resolve({ headers: headers.filter(Boolean), rows })
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Bulk PDF: render one PDF template for every spreadsheet row and download the result as a ZIP
 * (also saved to Files → bulk-pdf). Runs in the background; each PDF counts toward the monthly quota.
 */
export default function BulkPdfPage() {
  useDocumentTitle('Bulk PDF')
  const toast = useToast()
  const [params] = useSearchParams()
  const highlight = params.get('job')

  const [templates, setTemplates] = useState(null)
  const [templateId, setTemplateId] = useState('')
  const [sheet, setSheet] = useState(null)        // { name, headers, rows }
  const [pattern, setPattern] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [jobs, setJobs] = useState(null)

  useEffect(() => { getTemplates().then(setTemplates).catch(e => { toast.error(e.message); setTemplates([]) }) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobs = useCallback(() => listPdfBulkJobs().then(p => setJobs(p.content || [])).catch(() => setJobs([])), [])
  useEffect(() => { loadJobs() }, [loadJobs])

  // Poll while something is running.
  const anyActive = jobs?.some(j => ACTIVE.includes(j.status))
  useEffect(() => {
    if (!anyActive) return
    const t = window.setInterval(loadJobs, 3000)
    return () => window.clearInterval(t)
  }, [anyActive, loadJobs])

  const template = templates?.find(t => t.id === templateId)
  const missing = useMemo(() => {
    if (!template || !sheet) return []
    const cols = new Set(sheet.headers.map(h => h.toLowerCase()))
    return (template.placeholders || []).filter(p => !cols.has(String(p).toLowerCase()))
  }, [template, sheet])

  const onFile = async files => {
    const f = files?.[0]
    if (!f) return
    try {
      const parsed = await parseSheet(f)
      if (parsed.rows.length > MAX_ROWS) { toast.error(`Up to ${MAX_ROWS} rows per job — split the sheet.`); return }
      setSheet({ name: f.name, ...parsed })
    } catch (err) { toast.error(err.message) }
  }

  const start = async () => {
    if (!templateId) { toast.error('Choose a PDF template.'); return }
    if (!sheet) { toast.error('Upload a spreadsheet.'); return }
    setBusy(true)
    try {
      await createPdfBulkJob({ templateId, rows: sheet.rows, filenamePattern: pattern.trim() || undefined, label: label.trim() || undefined })
      toast.success(`Generating ${sheet.rows.length} PDF${sheet.rows.length === 1 ? '' : 's'} — you can leave this page.`)
      setSheet(null); setLabel('')
      loadJobs()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  const download = async job => {
    try {
      const d = await getPdfBulkDownload(job.id)
      if (d.url) { window.location.assign(d.url); return }
      const blob = await fetchPdfBulkZip(job.id)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = d.filename || 'bulk-pdf.zip'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10000)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />
      <div className="mt-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Bulk PDF</h1>
        <p className="text-sm text-ink-3 mt-1">
          Generate one PDF per spreadsheet row — certificates, invoices, offer letters. Columns fill the
          template’s <code>{'{{placeholders}}'}</code>; you get a ZIP, also saved to Files → bulk-pdf.
        </p>
      </div>

      <div className="card p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="bp-tpl">PDF template</label>
            <select id="bp-tpl" className="form-input" value={templateId} onChange={e => setTemplateId(e.target.value)}>
              <option value="">{templates === null ? 'Loading…' : templates.length ? 'Choose a template' : 'No PDF templates yet'}</option>
              {(templates || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {templates?.length === 0 && <Link to="/templates" className="text-xs text-brand font-semibold mt-1 inline-block">Create a PDF template →</Link>}
            {template?.placeholders?.length > 0 && (
              <p className="text-xs text-ink-4 mt-1.5">Columns used: {template.placeholders.join(', ')}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="bp-label">Job name (optional)</label>
            <input id="bp-label" className="form-input" placeholder="e.g. June certificates" value={label} onChange={e => setLabel(e.target.value)} />
          </div>
        </div>

        <FileDropZone onFiles={onFile} accept=".xlsx,.xls,.csv" hint="Excel or CSV — first row = column headers"
          selected={sheet ? { title: sheet.name, subtitle: `${sheet.rows.length} row${sheet.rows.length === 1 ? '' : 's'} · ${sheet.headers.length} columns` } : undefined} />

        {sheet && missing.length > 0 && (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-3 text-sm">
            The sheet has no column for: <strong>{missing.join(', ')}</strong>. Those placeholders will use your
            global placeholder values, or stay empty.
          </div>
        )}

        <div>
          <label className="form-label" htmlFor="bp-pattern">File name (optional)</label>
          <input id="bp-pattern" className="form-input font-mono text-sm" value={pattern} onChange={e => setPattern(e.target.value)}
            placeholder={sheet?.headers?.[0] ? `{{${sheet.headers[0]}}}-{{row}}` : '{{name}}-{{row}}'} />
          <p className="text-xs text-ink-4 mt-1">Use <code>{'{{column}}'}</code> and <code>{'{{row}}'}</code>. Default: template name + row number.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn btn-primary disabled:opacity-60" disabled={busy || !sheet || !templateId} onClick={start}>
            {busy ? 'Starting…' : sheet ? `Generate ${sheet.rows.length} PDF${sheet.rows.length === 1 ? '' : 's'}` : 'Generate PDFs'}
          </button>
          <span className="text-xs text-ink-4">Each PDF counts toward your monthly document limit. Up to {MAX_ROWS} rows per job.</span>
        </div>
      </div>

      <h2 className="text-[15px] font-bold text-ink dark:text-white mt-8 mb-3">Recent jobs</h2>
      {jobs === null ? <div className="skeleton h-20 rounded-card" />
        : jobs.length === 0 ? <p className="text-sm text-ink-3">No bulk PDF jobs yet.</p>
        : (
          <div className="space-y-3">
            {jobs.map(j => {
              const done = j.succeeded + j.failed
              const pct = j.total ? Math.round(done * 100 / j.total) : 0
              return (
                <div key={j.id} className={`card p-4 sm:p-5 ${highlight === j.id ? 'ring-2 ring-brand' : ''}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink dark:text-white truncate">{j.label || j.templateName}</p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {j.templateName} · {j.total} row{j.total === 1 ? '' : 's'} · {fmtDateTime(j.createdAt)}
                        {j.createdByEmail ? ` · ${j.createdByEmail}` : ''}
                      </p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[j.status] || 'badge-gray'}`}>{j.status === 'PARTIAL' ? 'Completed with errors' : j.status.charAt(0) + j.status.slice(1).toLowerCase()}</span>
                  </div>

                  {ACTIVE.includes(j.status) && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-ink-8 dark:bg-gray-700 overflow-hidden">
                        <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-ink-4 mt-1">{done} of {j.total}</p>
                    </div>
                  )}

                  {!ACTIVE.includes(j.status) && (
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-sm text-ink-2 dark:text-gray-300">{j.succeeded} generated{j.failed ? `, ${j.failed} failed` : ''}</span>
                      {j.downloadable && (
                        <button className="btn btn-secondary btn-sm" onClick={() => download(j)}>Download ZIP</button>
                      )}
                      {j.fileId && <Link to="/files" className="text-xs font-semibold text-brand">In Files → bulk-pdf</Link>}
                      {j.expired && <span className="text-xs text-ink-4">Download expired</span>}
                    </div>
                  )}
                  {j.error && <p className="text-sm text-danger mt-2">{j.error}</p>}
                  {j.errors?.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs font-semibold text-ink-3 cursor-pointer">Row errors ({j.errors.length}{j.errors.length >= 100 ? '+' : ''})</summary>
                      <ul className="text-xs text-ink-3 mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {j.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
