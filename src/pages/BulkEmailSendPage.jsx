/**
 * Bulk Email Send — 4-step wizard
 *
 * Steps: Upload XLSX → Select Email Template → Configure Attachment → Review & Send
 * After submitting, navigates directly to the detail/status page (/bulk-email/:id).
 *
 * Route: /bulk-email/send
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  getEmailTemplates, getTemplates,
  bulkEmailCreateJob,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_ROWS = 500

const STEPS = [
  { n: 1, label: 'Upload XLSX'    },
  { n: 2, label: 'Email Template' },
  { n: 3, label: 'Attachment'     },
  { n: 4, label: 'Review & Send'  },
]

// SVG paths for attachment option icons (used in the step-3 selector cards)
const ATT_OPTIONS = [
  {
    value: 'NONE',
    label: 'No Attachment',
    desc: 'Send email only',
    iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    value: 'UPLOAD',
    label: 'Upload PDF',
    desc: 'Same PDF for all recipients',
    iconPath: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  },
  {
    value: 'PDF_TEMPLATE',
    label: 'PDF Template',
    desc: 'Generate per-recipient from template',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    value: 'EXTERNAL_API',
    label: 'External API',
    desc: 'Fetch PDF from an HTTP endpoint',
    iconPath: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BulkEmailSendPage() {
  const toast    = useToast()
  const navigate = useNavigate()

  /* ── Wizard state ── */
  const [step, setStep] = useState(1)

  /* Step 1 — XLSX */
  const [xlsxRows,      setXlsxRows]      = useState([])    // [{col1: val, col2: val, ...}]
  const [xlsxColumns,   setXlsxColumns]   = useState([])    // column header names
  const [emailColumn,   setEmailColumn]   = useState('')
  const [nameColumn,    setNameColumn]    = useState('')
  const [xlsxFileName,  setXlsxFileName]  = useState('')
  const [xlsxDragOver,  setXlsxDragOver]  = useState(false)

  /* Step 2 — Email template */
  const [emailTemplates,      setEmailTemplates]      = useState([])
  const [selectedTemplateId,  setSelectedTemplateId]  = useState('')
  const [selectedTemplate,    setSelectedTemplate]    = useState(null)
  const [columnMapping,       setColumnMapping]       = useState({})  // placeholder → xlsxCol

  /* Step 3 — Attachment */
  const [attachmentType,      setAttachmentType]      = useState('NONE')
  const [uploadedPdfFile,     setUploadedPdfFile]     = useState(null)
  const [uploadedPdfB64,      setUploadedPdfB64]      = useState('')
  const [pdfTemplates,        setPdfTemplates]        = useState([])
  const [selectedPdfTemplateId, setSelectedPdfTemplateId] = useState('')
  const [selectedPdfTemplate, setSelectedPdfTemplate] = useState(null)
  const [pdfColumnMapping,    setPdfColumnMapping]    = useState({})
  const [extApiUrl,           setExtApiUrl]           = useState('')
  const [extApiMethod,        setExtApiMethod]        = useState('GET')
  const [extApiHeaders,       setExtApiHeaders]       = useState('')
  const [extApiBody,          setExtApiBody]          = useState('')

  /* Step 4 — Review */
  const [jobLabel,    setJobLabel]    = useState('')
  const [sending,     setSending]     = useState(false)

  // ── Load email templates & PDF templates ─────────────────────────────────
  useEffect(() => {
    getEmailTemplates().then(setEmailTemplates).catch(() => {})
    getTemplates().then(setPdfTemplates).catch(() => {})
  }, [])

  // ── Update selectedTemplate object when id changes ───────────────────────
  useEffect(() => {
    const t = emailTemplates.find(t => t.id === selectedTemplateId) || null
    setSelectedTemplate(t)
    setColumnMapping({})
  }, [selectedTemplateId, emailTemplates])

  useEffect(() => {
    const t = pdfTemplates.find(t => t.id === selectedPdfTemplateId) || null
    setSelectedPdfTemplate(t)
    setPdfColumnMapping({})
  }, [selectedPdfTemplateId, pdfTemplates])

  // ── XLSX upload ───────────────────────────────────────────────────────────
  function handleXlsxFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb     = XLSX.read(e.target.result, { type: 'binary' })
        const ws     = wb.Sheets[wb.SheetNames[0]]
        const parsed = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!parsed.length) { toast.error('XLSX file appears to be empty'); return }
        if (parsed.length > MAX_ROWS) {
          toast.error(`File has ${parsed.length} rows — maximum is ${MAX_ROWS}`)
          return
        }
        const cols = Object.keys(parsed[0])
        setXlsxRows(parsed.map(r => {
          const out = {}
          cols.forEach(c => { out[c] = String(r[c] ?? '') })
          return out
        }))
        setXlsxColumns(cols)
        setXlsxFileName(file.name)
        // Auto-generate campaign name from filename if not already set
        setJobLabel(prev =>
          prev.trim() ? prev : file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        )
        // Auto-detect email / name columns
        const guess = cols.find(c => /email/i.test(c))
        if (guess) setEmailColumn(guess)
        const nameGuess = cols.find(c => /name/i.test(c))
        if (nameGuess) setNameColumn(nameGuess)
      } catch (err) { toast.error('Could not parse XLSX file: ' + err.message) }
    }
    reader.readAsBinaryString(file)
  }

  // ── PDF attachment file ───────────────────────────────────────────────────
  function handlePdfFile(file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('PDF file exceeds 10 MB'); return }
    setUploadedPdfFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setUploadedPdfB64(e.target.result)
    reader.readAsDataURL(file)
  }

  // ── Step validation ───────────────────────────────────────────────────────
  const step1Valid = xlsxRows.length > 0 && emailColumn.length > 0
  const step2Valid = !!selectedTemplateId
  const step3Valid = (() => {
    if (attachmentType === 'UPLOAD')       return !!uploadedPdfB64
    if (attachmentType === 'PDF_TEMPLATE') return !!selectedPdfTemplateId
    if (attachmentType === 'EXTERNAL_API') return extApiUrl.trim().length > 0
    return true // NONE
  })()

  // ── Submit job ────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!step1Valid || !step2Valid || !step3Valid) return
    setSending(true)
    try {
      const payload = {
        label:           jobLabel.trim() || undefined,
        emailTemplateId: selectedTemplateId,
        emailColumn,
        nameColumn:      nameColumn || undefined,
        columnMapping,
        rows:            xlsxRows,
        attachmentType,
        ...(attachmentType === 'UPLOAD' && {
          uploadedPdfBase64: uploadedPdfB64,
          uploadedPdfName:   uploadedPdfFile?.name,
        }),
        ...(attachmentType === 'PDF_TEMPLATE' && {
          pdfTemplateId:    selectedPdfTemplateId,
          pdfColumnMapping: pdfColumnMapping,
        }),
        ...(attachmentType === 'EXTERNAL_API' && {
          externalApiUrl:     extApiUrl.trim(),
          externalApiMethod:  extApiMethod,
          externalApiHeaders: extApiHeaders.trim() || undefined,
          externalApiBody:    extApiBody.trim() || undefined,
        }),
      }
      const job = await bulkEmailCreateJob(payload)
      toast.success('Campaign started — redirecting to status…')
      navigate(`/bulk-email/${job.id}`)
    } catch (e) {
      toast.error(e.message || 'Failed to start job')
    } finally {
      setSending(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Dashboard', to: '/' },
        { label: 'Bulk Email', to: '/bulk-email' },
        { label: 'Send Campaign' },
      ]} />

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2 mb-6">
        Send Bulk Email Campaign
      </h1>

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">

          {/* Step indicator */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {STEPS.map((s, i) => (
              <button
                key={s.n}
                onClick={() => { if (s.n < step || (s.n === 2 && step1Valid) || (s.n === 3 && step2Valid) || (s.n === 4 && step3Valid)) setStep(s.n) }}
                className={`flex-1 py-3 px-2 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition-colors
                  ${step === s.n
                    ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                    : s.n < step
                      ? 'border-transparent text-green-600 cursor-pointer'
                      : 'border-transparent text-gray-400 cursor-default'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${step === s.n ? 'bg-purple-600 text-white' : s.n < step ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {s.n < step ? '✓' : s.n}
                </span>
                <span className="hidden sm:block leading-tight text-center">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── Step 1: Upload XLSX ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Upload Recipient List</h2>
                <p className="text-sm text-gray-500">Upload an Excel (.xlsx) file. The first row must be column headers.</p>

                {/* Drop zone */}
                <label
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-colors
                    ${xlsxDragOver ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : xlsxRows.length ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                      : 'border-gray-300 bg-gray-50 dark:bg-gray-700/40 hover:border-purple-300'}`}
                  onDragOver={e  => { e.preventDefault(); setXlsxDragOver(true) }}
                  onDragLeave={() => setXlsxDragOver(false)}
                  onDrop={e      => { e.preventDefault(); setXlsxDragOver(false); handleXlsxFile(e.dataTransfer.files[0]) }}
                >
                  {xlsxRows.length > 0 ? (
                    <>
                      <span className="text-4xl">✅</span>
                      <p className="font-semibold text-green-700 dark:text-green-400">{xlsxFileName}</p>
                      <p className="text-sm text-gray-500">{xlsxRows.length} rows · {xlsxColumns.length} columns</p>
                      <span className="text-xs text-purple-600 underline">Click to replace</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p className="text-sm text-gray-500">Drag &amp; drop an <strong>.xlsx</strong> file, or <span className="text-purple-600 font-semibold">browse</span></p>
                      <p className="text-xs text-gray-400">Max {MAX_ROWS} rows</p>
                    </>
                  )}
                  <input type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => handleXlsxFile(e.target.files[0])}/>
                </label>

                {xlsxColumns.length > 0 && (
                  <div className="space-y-4">
                    {/* Campaign name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Campaign Name <span className="font-normal text-gray-400">(optional — auto-filled from file name)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. October Newsletter — Customers"
                        value={jobLabel}
                        onChange={e => setJobLabel(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                                   bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    {/* Column mapping */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Email Column <span className="text-red-400">*</span>
                        </label>
                        <select value={emailColumn} onChange={e => setEmailColumn(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
                          <option value="">Select column…</option>
                          {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Name Column <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <select value={nameColumn} onChange={e => setNameColumn(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
                          <option value="">None</option>
                          {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview table */}
                {xlsxRows.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="text-xs w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          {xlsxColumns.map(c => (
                            <th key={c} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {c}
                              {c === emailColumn && <span className="ml-1 text-purple-500 font-normal">(email)</span>}
                              {c === nameColumn  && <span className="ml-1 text-blue-500 font-normal">(name)</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {xlsxRows.slice(0, 5).map((r, i) => (
                          <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                            {xlsxColumns.map(c => (
                              <td key={c} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{r[c]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {xlsxRows.length > 5 && (
                      <p className="text-center text-xs text-gray-400 py-2">+{xlsxRows.length - 5} more rows</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button onClick={() => setStep(2)} disabled={!step1Valid}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                    Next: Email Template →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Email Template ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Select Email Template</h2>

                {emailTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500">No email templates found. Create one in Email Templates first.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emailTemplates.map(t => (
                      <button key={t.id} onClick={() => setSelectedTemplateId(t.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all
                          ${selectedTemplateId === t.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 bg-white dark:bg-gray-700/40'}`}>
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{t.name}</p>
                        {t.subject && <p className="text-xs text-gray-500 mt-0.5 truncate">Subject: {t.subject}</p>}
                        {t.placeholders?.length > 0 && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {t.placeholders.length} variable{t.placeholders.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Placeholder → Column mapping */}
                {selectedTemplate?.placeholders?.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Map Template Variables to XLSX Columns
                    </p>
                    {selectedTemplate.placeholders.map(ph => (
                      <div key={ph} className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded w-40 shrink-0 truncate">
                          {'{{'}{ph}{'}}'}
                        </span>
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                        <select
                          value={columnMapping[ph] || ''}
                          onChange={e => setColumnMapping(m => ({ ...m, [ph]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
                          <option value="">— not mapped —</option>
                          {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    ← Back
                  </button>
                  <button onClick={() => setStep(3)} disabled={!step2Valid}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                    Next: Attachment →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Attachment ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Attachment</h2>
                <p className="text-sm text-gray-500">Optionally attach a PDF to every email. Choose how to source it.</p>

                {/* Attachment type selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ATT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setAttachmentType(opt.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all
                        ${attachmentType === opt.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 bg-white dark:bg-gray-700/40'}`}>
                      <svg className={`w-5 h-5 mb-2 ${attachmentType === opt.value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={opt.iconPath}/>
                      </svg>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {/* UPLOAD */}
                {attachmentType === 'UPLOAD' && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload PDF (max 10 MB)</p>
                    <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors
                      ${uploadedPdfFile ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 hover:border-purple-300'}`}>
                      <svg className="w-8 h-8 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <div>
                        {uploadedPdfFile
                          ? <><p className="text-sm font-medium text-green-700">{uploadedPdfFile.name}</p><p className="text-xs text-gray-500">{fmtBytes(uploadedPdfFile.size)}</p></>
                          : <p className="text-sm text-gray-500">Click to choose a PDF file</p>
                        }
                      </div>
                      <input type="file" accept=".pdf,application/pdf" className="hidden"
                        onChange={e => handlePdfFile(e.target.files[0])} />
                    </label>
                  </div>
                )}

                {/* PDF_TEMPLATE */}
                {attachmentType === 'PDF_TEMPLATE' && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Select PDF Template</p>
                    {pdfTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500">No PDF templates found. Create one in PDF Templates.</p>
                    ) : (
                      <select value={selectedPdfTemplateId} onChange={e => setSelectedPdfTemplateId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        <option value="">Select template…</option>
                        {pdfTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    )}

                    {/* PDF placeholder → column mapping */}
                    {selectedPdfTemplate?.placeholders?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                          Map PDF Variables to XLSX Columns
                        </p>
                        {selectedPdfTemplate.placeholders.map(ph => (
                          <div key={ph} className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded w-36 shrink-0 truncate">
                              {'{{'}{ph}{'}}'}
                            </span>
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                            <select
                              value={pdfColumnMapping[ph] || ''}
                              onChange={e => setPdfColumnMapping(m => ({ ...m, [ph]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                              <option value="">— not mapped —</option>
                              {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* EXTERNAL_API */}
                {attachmentType === 'EXTERNAL_API' && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">External API Configuration</p>
                    <p className="text-xs text-gray-500">
                      Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{{'+'column'+'}}'}</code> in URL/body to inject row values. The API must return PDF bytes.
                    </p>

                    <div className="flex gap-2">
                      <select value={extApiMethod} onChange={e => setExtApiMethod(e.target.value)}
                        className="w-24 shrink-0 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        <option>GET</option>
                        <option>POST</option>
                      </select>
                      <input type="url" placeholder="https://api.example.com/invoice?id={{invoice_id}}"
                        value={extApiUrl} onChange={e => setExtApiUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Headers <span className="font-normal text-gray-400">(JSON, optional)</span>
                      </label>
                      <textarea rows={2} placeholder={'{"Authorization": "Bearer token123"}'}
                        value={extApiHeaders} onChange={e => setExtApiHeaders(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
                    </div>

                    {extApiMethod === 'POST' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Request Body Template <span className="font-normal text-gray-400">(JSON with {'{{'+'var'+'}}'} placeholders)</span>
                        </label>
                        <textarea rows={3} placeholder={'{"customerId": "{{id}}", "name": "{{name}}"}'}
                          value={extApiBody} onChange={e => setExtApiBody(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    ← Back
                  </button>
                  <button onClick={() => setStep(4)} disabled={!step3Valid}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                    Next: Review & Send →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Review & Send ── */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Review &amp; Send</h2>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SummaryCard icon="📧" label="Recipients" value={`${xlsxRows.length} emails`} />
                  <SummaryCard icon="💌" label="Email Template" value={selectedTemplate?.name || '—'} />
                  <SummaryCard icon="📎" label="Attachment"
                    value={ATT_OPTIONS.find(a => a.value === attachmentType)?.label || 'None'} />
                </div>

                {/* Preview first row */}
                {xlsxRows.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
                      First Recipient Preview
                    </p>
                    <div className="space-y-1">
                      {emailColumn && <PreviewRow k="To" v={xlsxRows[0][emailColumn]} />}
                      {nameColumn  && <PreviewRow k="Name" v={xlsxRows[0][nameColumn]} />}
                      {selectedTemplate?.subject && (
                        <PreviewRow k="Subject" v={selectedTemplate.subject} />
                      )}
                      {selectedTemplate?.placeholders?.map(ph => (
                        <PreviewRow key={ph} k={`{{${ph}}}`}
                          v={columnMapping[ph] ? xlsxRows[0][columnMapping[ph]] : '(not mapped)'} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Job label */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Job Label <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input type="text" placeholder="e.g. October Newsletter — Customers"
                    value={jobLabel} onChange={e => setJobLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                </div>

                <div className="flex justify-between items-center">
                  <button onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    ← Back
                  </button>
                  <button onClick={handleSend} disabled={sending}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                    {sending
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>Starting…</span></>
                      : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg><span>Send {xlsxRows.length} Emails</span></>
                    }
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{value}</p>
    </div>
  )
}

function PreviewRow({ k, v }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 w-28 shrink-0">{k}</span>
      <span className="text-gray-700 dark:text-gray-200 font-medium truncate">{v || '—'}</span>
    </div>
  )
}
