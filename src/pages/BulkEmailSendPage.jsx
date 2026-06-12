/**
 * Bulk Email Send — 4-step wizard
 *
 * Design matches the Bulk E-Sign Send page:
 *  - Circle + connector step indicator above the card
 *  - Unified card container (max-w-4xl, white, rounded-xl)
 *  - Shared Back / Next footer nav
 *
 * Steps: 0=Upload XLSX  1=Email Template  2=Attachment  3=Review & Send
 * After submitting, navigates to the job detail page (/bulk-email/:id).
 *
 * Route: /bulk-email/send
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  getEmailTemplates, getTemplates,
  bulkEmailCreateJob,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_ROWS = 10000

const STEPS = ['Upload XLSX', 'Email Template', 'Attachment', 'Review & Send']

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
  {
    value: 'EXCEL_SHEET',
    label: 'Excel from Sheet 2',
    desc: 'Per-recipient rows from 2nd worksheet',
    iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400'

/**
 * Convert a raw SheetJS cell value to a clean string.
 * SheetJS returns Excel numbers as JS floats which can carry IEEE 754 noise
 * (e.g. 652455.65 → 652455.6500000001).  Routing through toPrecision(15)
 * keeps all meaningful digits while stripping the noise.
 */
function cellStr(v) {
  if (v == null) return ''
  if (typeof v === 'number') return String(parseFloat(v.toPrecision(15)))
  return String(v)
}

function fmtBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

// ── Step indicator (mirrors ESignBulkPage design) ─────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
              ${i < current
                ? 'bg-purple-600 text-white'
                : i === current
                  ? 'bg-purple-600 text-white ring-4 ring-purple-200 dark:ring-purple-900/40'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
              {i < current
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                : i + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap
              ${i === current
                ? 'text-purple-600 dark:text-purple-400 font-medium'
                : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 mx-3 mb-4 ${i < current ? 'bg-purple-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BulkEmailSendPage() {
  const { showToast } = useToast()
  const navigate      = useNavigate()

  /* ── Wizard state (0-based steps) ── */
  const [step, setStep] = useState(0)

  /* Step 0 — XLSX */
  const [xlsxRows,     setXlsxRows]     = useState([])
  const [xlsxColumns,  setXlsxColumns]  = useState([])
  const [emailColumn,  setEmailColumn]  = useState('')
  const [nameColumn,   setNameColumn]   = useState('')
  const [ccColumns,    setCcColumns]    = useState([])   // column names whose values become CC addresses
  const [xlsxFileName, setXlsxFileName] = useState('')
  const [xlsxDragOver, setXlsxDragOver] = useState(false)
  const xlsxRef = useRef()

  /* Step 1 — Email template */
  const [emailTemplates,     setEmailTemplates]     = useState([])
  const [templatesLoading,   setTemplatesLoading]   = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedTemplate,   setSelectedTemplate]   = useState(null)
  const [columnMapping,      setColumnMapping]      = useState({})

  /* Step 2 — Attachment */
  const [attachmentType,        setAttachmentType]        = useState('NONE')
  const [includeExcelSheet,     setIncludeExcelSheet]     = useState(false)  // secondary attachment toggle
  const [uploadedPdfFile,       setUploadedPdfFile]       = useState(null)
  const [uploadedPdfB64,        setUploadedPdfB64]        = useState('')
  const [pdfTemplates,          setPdfTemplates]          = useState([])
  const [pdfTemplatesLoading,   setPdfTemplatesLoading]   = useState(false)
  const [selectedPdfTemplateId, setSelectedPdfTemplateId] = useState('')
  const [selectedPdfTemplate,   setSelectedPdfTemplate]   = useState(null)
  const [pdfColumnMapping,      setPdfColumnMapping]      = useState({})
  const [extApiUrl,             setExtApiUrl]             = useState('')
  const [extApiMethod,          setExtApiMethod]          = useState('GET')
  const [extApiHeaders,         setExtApiHeaders]         = useState('')
  const [extApiBody,            setExtApiBody]            = useState('')
  const pdfRef = useRef()

  /* Step 2 — Sheet 2 (EXCEL_SHEET or secondary attachment) */
  const [sheet2Rows,            setSheet2Rows]            = useState([])
  const [sheet2Columns,         setSheet2Columns]         = useState([])
  const [sheet2SelectedColumns, setSheet2SelectedColumns] = useState([])
  const [sheet2IdColumn,        setSheet2IdColumn]        = useState('')
  const [mainIdColumn,          setMainIdColumn]          = useState('')
  const [detailFileName,        setDetailFileName]        = useState('')

  /* Step 3 — Review & Send */
  const [jobLabel,  setJobLabel]  = useState('')
  const [sending,   setSending]   = useState(false)
  const [sendError, setSendError] = useState('')

  // ── Load email & PDF templates ───────────────────────────────────────────
  useEffect(() => {
    setTemplatesLoading(true)
    getEmailTemplates()
      .then(setEmailTemplates)
      .catch(() => showToast('Failed to load email templates', 'error'))
      .finally(() => setTemplatesLoading(false))

    setPdfTemplatesLoading(true)
    getTemplates()
      .then(setPdfTemplates)
      .catch(() => {})
      .finally(() => setPdfTemplatesLoading(false))
  }, [])

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

  // ── Step validation ───────────────────────────────────────────────────────
  // When the secondary Excel attachment is enabled, its link-columns must be configured
  const excelSheetValid = sheet2Rows.length > 0
    && sheet2IdColumn.length > 0
    && mainIdColumn.length > 0
    && sheet2SelectedColumns.length > 0

  const step2Valid = (() => {
    const primaryOk =
        attachmentType === 'UPLOAD'       ? !!uploadedPdfB64
      : attachmentType === 'PDF_TEMPLATE' ? !!selectedPdfTemplateId
      : attachmentType === 'EXTERNAL_API' ? extApiUrl.trim().length > 0
      : attachmentType === 'EXCEL_SHEET'  ? excelSheetValid
      : true  // NONE
    // If the secondary Excel toggle is on, its config must also be complete
    const secondaryOk = !includeExcelSheet || excelSheetValid
    return primaryOk && secondaryOk
  })()

  const stepValid = [
    xlsxRows.length > 0 && emailColumn.length > 0,   // step 0
    !!selectedTemplateId,                              // step 1
    step2Valid,                                        // step 2
    true,                                              // step 3
  ]

  function canGoNext() { return stepValid[step] }
  function goNext()    { if (canGoNext()) setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function goBack()    { setStep(s => Math.max(s - 1, 0)) }

  // ── XLSX upload ───────────────────────────────────────────────────────────
  function handleXlsxFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb     = XLSX.read(e.target.result, { type: 'binary' })
        const ws     = wb.Sheets[wb.SheetNames[0]]
        const parsed = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!parsed.length) { showToast('XLSX file appears to be empty', 'error'); return }

        // ── Sanitise Sheet 1 rows ──────────────────────────────────────────────
        // 1. Stringify all values; strip "mailto:" prefixes from email-like cells
        // 2. Drop rows that have fewer than 2 populated (non-empty) cells — these
        //    are blank spacer rows or Excel hyperlink artifacts
        const allRows = parsed.map(r => {
          const out = {}
          Object.keys(r).forEach(c => {
            let v = cellStr(r[c])
            if (v.toLowerCase().startsWith('mailto:')) v = v.slice(7)
            out[c] = v
          })
          return out
        })
        const validRows = allRows.filter(r =>
          Object.values(r).filter(v => v !== '' && v !== 'null' && v !== 'undefined').length >= 2
        )
        const skipped = allRows.length - validRows.length

        if (!validRows.length) { showToast('No valid data rows found in the file', 'error'); return }
        if (validRows.length > MAX_ROWS) {
          showToast(`File has ${validRows.length} rows — maximum is ${MAX_ROWS}`, 'error')
          return
        }
        if (skipped > 0)
          showToast(`${skipped} blank / empty row${skipped > 1 ? 's' : ''} were automatically skipped`, 'info')

        const cols = Object.keys(validRows[0])
        setXlsxRows(validRows)
        setXlsxColumns(cols)
        setXlsxFileName(file.name)
        setJobLabel(prev =>
          prev.trim() ? prev : file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        )
        const emailGuess = cols.find(c => /email/i.test(c))
        if (emailGuess) setEmailColumn(emailGuess)
        const nameGuess = cols.find(c => /\bname\b/i.test(c))
        if (nameGuess) setNameColumn(nameGuess)

        // ── Parse Sheet 2 (if present) ──────────────────────────────────────────
        if (wb.SheetNames.length > 1) {
          const ws2     = wb.Sheets[wb.SheetNames[1]]
          const parsed2 = XLSX.utils.sheet_to_json(ws2, { defval: '' })
          if (parsed2.length > 0) {
            const cols2 = Object.keys(parsed2[0])
            const rows2 = parsed2.map(r => {
              const out = {}
              cols2.forEach(c => { out[c] = cellStr(r[c]) })
              return out
            })
            setSheet2Rows(rows2)
            setSheet2Columns(cols2)
            setSheet2SelectedColumns(cols2)   // default: all columns selected
            // Auto-guess link columns — prefer exact "Account" / "Id" / "ID" match
            const idGuess2 = cols2.find(c => /account/i.test(c))
              || cols2.find(c => /^id$/i.test(c))
              || cols2.find(c => /id/i.test(c))
            if (idGuess2) setSheet2IdColumn(idGuess2)
            const idGuess1 = cols.find(c => /account/i.test(c))
              || cols.find(c => /^id$/i.test(c))
              || cols.find(c => /id/i.test(c))
            if (idGuess1) setMainIdColumn(idGuess1)
          } else {
            setSheet2Rows([]); setSheet2Columns([]); setSheet2SelectedColumns([])
            setSheet2IdColumn(''); setMainIdColumn('')
          }
        } else {
          setSheet2Rows([]); setSheet2Columns([]); setSheet2SelectedColumns([])
          setSheet2IdColumn(''); setMainIdColumn('')
        }
      } catch (err) { showToast('Could not parse XLSX file: ' + err.message, 'error') }
    }
    reader.readAsBinaryString(file)
  }

  // ── PDF attachment ────────────────────────────────────────────────────────
  function handlePdfFile(file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { showToast('PDF file exceeds 10 MB', 'error'); return }
    setUploadedPdfFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setUploadedPdfB64(e.target.result)
    reader.readAsDataURL(file)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!stepValid[0] || !stepValid[1] || !stepValid[2]) return
    setSendError('')
    setSending(true)
    try {
      // Sheet 2 fields are sent when primary = EXCEL_SHEET OR when secondary toggle is on
      const needsExcelFields = attachmentType === 'EXCEL_SHEET' || includeExcelSheet

      const payload = {
        label:           jobLabel.trim() || undefined,
        emailTemplateId: selectedTemplateId,
        emailColumn,
        nameColumn:      nameColumn || undefined,
        ccColumns:       ccColumns.length > 0 ? ccColumns : undefined,
        columnMapping,
        rows:            xlsxRows,
        attachmentType,
        includeExcelSheet: includeExcelSheet && attachmentType !== 'EXCEL_SHEET',
        ...(attachmentType === 'UPLOAD' && {
          uploadedPdfBase64: uploadedPdfB64,
          uploadedPdfName:   uploadedPdfFile?.name,
        }),
        ...(attachmentType === 'PDF_TEMPLATE' && {
          pdfTemplateId:    selectedPdfTemplateId,
          pdfColumnMapping,
        }),
        ...(attachmentType === 'EXTERNAL_API' && {
          externalApiUrl:     extApiUrl.trim(),
          externalApiMethod:  extApiMethod,
          externalApiHeaders: extApiHeaders.trim() || undefined,
          externalApiBody:    extApiBody.trim() || undefined,
        }),
        ...(needsExcelFields && {
          detailSheetRows:     sheet2Rows,
          detailSheetColumns:  sheet2SelectedColumns,
          detailSheetIdColumn: sheet2IdColumn,
          mainSheetIdColumn:   mainIdColumn,
          detailSheetFileName: detailFileName.trim() || undefined,
        }),
      }
      const job = await bulkEmailCreateJob(payload)
      showToast('Campaign started — redirecting to status…', 'success')
      navigate(`/bulk-email/${job.id}`)
    } catch (e) {
      setSendError(e.message || 'Failed to start campaign')
    } finally {
      setSending(false)
    }
  }

  // ── Render: Step 0 — Upload XLSX ─────────────────────────────────────────
  function renderStep0() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Upload Recipient List</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supported formats: .xlsx, .xls — first row must contain column headers. Max {MAX_ROWS} rows.
          </p>
        </div>

        {/* Drop zone */}
        <button
          type="button"
          onClick={() => xlsxRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-10 text-center transition-colors group
            ${xlsxDragOver   ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/10'
              : xlsxRows.length ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'}`}
          onDragOver={e  => { e.preventDefault(); setXlsxDragOver(true) }}
          onDragLeave={() => setXlsxDragOver(false)}
          onDrop={e      => { e.preventDefault(); setXlsxDragOver(false); handleXlsxFile(e.dataTransfer.files[0]) }}
        >
          {xlsxRows.length > 0 ? (
            <>
              <svg className="w-10 h-10 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">{xlsxFileName} — click to replace</p>
              <p className="text-xs text-gray-500 mt-1">{xlsxRows.length} rows · {xlsxColumns.length} columns</p>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 group-hover:text-purple-400 transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload Excel or CSV</p>
              <p className="text-xs text-gray-400 mt-1">.xlsx · .xls</p>
            </>
          )}
        </button>
        <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { handleXlsxFile(e.target.files[0]); e.target.value = '' }}/>

        {xlsxColumns.length > 0 && (
          <div className="space-y-4">
            {/* Campaign name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Campaign Name <span className="font-normal text-gray-400">(optional — auto-filled from filename)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. October Newsletter — Customers"
                value={jobLabel}
                onChange={e => setJobLabel(e.target.value)}
                className={INPUT}
              />
            </div>

            {/* Column selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Email Column <span className="text-red-400">*</span>
                </label>
                <select value={emailColumn} onChange={e => setEmailColumn(e.target.value)} className={INPUT}>
                  <option value="">Select column…</option>
                  {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Name Column <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <select value={nameColumn} onChange={e => setNameColumn(e.target.value)} className={INPUT}>
                  <option value="">None</option>
                  {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* CC columns — multi-select chip picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                CC Columns <span className="font-normal text-gray-400">(optional — select one or more columns containing additional email addresses)</span>
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Every email address found in these columns per row will be added as a CC recipient.
              </p>
              <div className="flex flex-wrap gap-2">
                {xlsxColumns
                  .filter(c => c !== emailColumn)
                  .map(col => {
                    const isCC = ccColumns.includes(col)
                    return (
                      <button key={col} type="button"
                        onClick={() => setCcColumns(prev =>
                          prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
                        )}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                          ${isCC
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-sky-400'}`}>
                        {isCC && (
                          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                        {col}
                      </button>
                    )
                  })}
              </div>
              {ccColumns.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">CC columns selected:</span>
                  {ccColumns.map(c => (
                    <span key={c} className="text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                  <button type="button" onClick={() => setCcColumns([])}
                    className="text-xs text-gray-400 hover:text-red-500 ml-1">
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Preview table */}
            {xlsxRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {xlsxRows.length} rows · {xlsxColumns.length} columns
                  </p>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400
                                   px-2 py-0.5 rounded-full font-medium">Ready</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {xlsxColumns.map(c => (
                          <th key={c} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {c}
                            {c === emailColumn      && <span className="ml-1 text-purple-500">(to)</span>}
                            {c === nameColumn       && <span className="ml-1 text-blue-500">(name)</span>}
                            {ccColumns.includes(c)  && <span className="ml-1 text-sky-500">(cc)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {xlsxRows.slice(0, 3).map((r, i) => (
                        <tr key={i} className="bg-white dark:bg-gray-900">
                          {xlsxColumns.map(c => (
                            <td key={c} className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{r[c]}</td>
                          ))}
                        </tr>
                      ))}
                      {xlsxRows.length > 3 && (
                        <tr className="bg-gray-50 dark:bg-gray-800/60">
                          <td colSpan={xlsxColumns.length} className="px-3 py-2 text-center text-gray-400 text-xs">
                            +{xlsxRows.length - 3} more rows…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Render: Step 1 — Email Template ──────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Select Email Template</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose the email template to use for this campaign.
          </p>
        </div>

        {templatesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : emailTemplates.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
            No email templates found.{' '}
            <a href="/email-templates" className="text-purple-600 underline">Create one first.</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emailTemplates.map(t => (
              <button key={t.id} type="button" onClick={() => setSelectedTemplateId(t.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all
                  ${selectedTemplateId === t.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 bg-white dark:bg-gray-700/40'}`}>
                <div className="flex items-start gap-2">
                  {selectedTemplateId === t.id && (
                    <svg className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{t.name}</p>
                    {t.subject && <p className="text-xs text-gray-500 mt-0.5 truncate">Subject: {t.subject}</p>}
                    {t.placeholders?.length > 0 && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {t.placeholders.length} variable{t.placeholders.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Placeholder → Column mapping */}
        {selectedTemplate?.placeholders?.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Map Template Variables to XLSX Columns
              </p>
            </div>
            <div className="p-4 space-y-3">
              {selectedTemplate.placeholders.map(ph => (
                <div key={ph} className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded w-36 shrink-0 truncate">
                    {'{{'}{ph}{'}}'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                  <select
                    value={columnMapping[ph] || ''}
                    onChange={e => setColumnMapping(m => ({ ...m, [ph]: e.target.value }))}
                    className={INPUT + ' flex-1'}>
                    <option value="">— not mapped —</option>
                    {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Shared Excel Sheet config panel (used for primary EXCEL_SHEET and secondary toggle) ──
  function renderExcelSheetConfig(sectionTitle = 'Sheet 2 — Per-Recipient Excel Configuration') {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{sectionTitle}</p>
        </div>
        <div className="p-4 space-y-5">
          {sheet2Rows.length === 0 ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No second worksheet detected. Re-upload an Excel workbook with two worksheets — Sheet 1 for recipients and Sheet 2 for per-recipient detail rows.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Sheet 2 detected — <strong>{sheet2Rows.length} rows</strong> across <strong>{sheet2Columns.length} columns</strong>.
                </p>
              </div>

              {/* Link columns */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Link columns — how Sheet 1 and Sheet 2 are joined</p>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Sheet 1 key column <span className="text-red-400">*</span></label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Unique ID in the recipient sheet</p>
                    <select value={mainIdColumn} onChange={e => setMainIdColumn(e.target.value)} className={INPUT}>
                      <option value="">Select column…</option>
                      {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Sheet 2 key column <span className="text-red-400">*</span></label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">The column in Sheet 2 that matches the Sheet 1 ID</p>
                    <select value={sheet2IdColumn} onChange={e => setSheet2IdColumn(e.target.value)} className={INPUT}>
                      <option value="">Select column…</option>
                      {sheet2Columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {mainIdColumn && sheet2IdColumn && xlsxRows.length > 0 && (() => {
                  const idVal      = xlsxRows[0][mainIdColumn] || ''
                  const matchCount = sheet2Rows.filter(r => String(r[sheet2IdColumn]).toLowerCase() === idVal.toLowerCase()).length
                  return (
                    <div className="mx-4 mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {mainIdColumn} = <code className="font-mono bg-white dark:bg-gray-700 px-1 rounded">{idVal || '—'}</code>{' '}→{' '}
                        <strong className={matchCount === 0 ? 'text-amber-600' : 'text-green-700 dark:text-green-400'}>{matchCount} matching row{matchCount !== 1 ? 's' : ''}</strong>
                        {matchCount === 0 && <span className="ml-2 text-amber-600"> — check key columns match</span>}
                      </p>
                    </div>
                  )
                })()}
              </div>

              {/* Column picker */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Columns to include</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSheet2SelectedColumns([...sheet2Columns])} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">All</button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button type="button" onClick={() => setSheet2SelectedColumns([])} className="text-xs text-gray-500 hover:underline font-medium">None</button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {sheet2Columns.map(col => {
                      const selected = sheet2SelectedColumns.includes(col)
                      return (
                        <button key={col} type="button"
                          onClick={() => setSheet2SelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${selected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                          {selected && <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                          {col}
                        </button>
                      )
                    })}
                  </div>
                  {sheet2SelectedColumns.length === 0 && (
                    <p className="mt-3 text-xs text-red-500">Select at least one column.</p>
                  )}
                </div>
              </div>

              {/* Filename template */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Filename template <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input type="text" placeholder="e.g. Claims_{{Provider Name}}_April2026.xlsx"
                  value={detailFileName} onChange={e => setDetailFileName(e.target.value)} className={INPUT}/>
                <p className="text-xs text-gray-400 mt-1.5">
                  Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-purple-600 dark:text-purple-400">{'{{column}}'}</code> with any Sheet 1 column to personalise per recipient.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Step 2 — Attachment ───────────────────────────────────────────
  function renderStep2() {
    const showSecondaryExcelToggle = sheet2Rows.length > 0 && attachmentType !== 'EXCEL_SHEET'
    const showExcelConfig = attachmentType === 'EXCEL_SHEET' || (includeExcelSheet && attachmentType !== 'EXCEL_SHEET')

    return (
      <div className="space-y-5">
        {/* ── Section header ── */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Attachments</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a primary attachment and optionally also attach an Excel file from Sheet 2.
          </p>
        </div>

        {/* ── Primary attachment label ── */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold">1</span>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Primary attachment</p>
        </div>

        {/* Primary attachment type cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ATT_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { setAttachmentType(opt.value); if (opt.value === 'EXCEL_SHEET') setIncludeExcelSheet(false) }}
              className={`p-4 rounded-xl border-2 text-left transition-all
                ${attachmentType === opt.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 bg-white dark:bg-gray-700/40'}`}>
              <svg className={`w-5 h-5 mb-2.5 ${attachmentType === opt.value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={opt.iconPath}/>
              </svg>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{opt.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Primary attachment config panels ── */}
        {attachmentType === 'UPLOAD' && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Upload PDF (max 10 MB)</p>
            </div>
            <div className="p-4">
              <button type="button" onClick={() => pdfRef.current?.click()}
                className={`w-full flex items-center gap-4 border-2 border-dashed rounded-xl p-4 transition-colors text-left
                  ${uploadedPdfFile
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                <svg className="w-8 h-8 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <div>
                  {uploadedPdfFile
                    ? <><p className="text-sm font-medium text-green-700 dark:text-green-400">{uploadedPdfFile.name}</p>
                       <p className="text-xs text-gray-500">{fmtBytes(uploadedPdfFile.size)}</p></>
                    : <p className="text-sm text-gray-500 dark:text-gray-400">Click to choose a PDF file</p>
                  }
                </div>
              </button>
              <input ref={pdfRef} type="file" accept=".pdf,application/pdf" className="hidden"
                onChange={e => { handlePdfFile(e.target.files[0]); e.target.value = '' }}/>
            </div>
          </div>
        )}

        {/* PDF_TEMPLATE */}
        {attachmentType === 'PDF_TEMPLATE' && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Select PDF Template</p>
            </div>
            <div className="p-4 space-y-4">
              {pdfTemplatesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : pdfTemplates.length === 0 ? (
                <p className="text-sm text-gray-500">No PDF templates found. Create one in PDF Templates.</p>
              ) : (
                <select value={selectedPdfTemplateId} onChange={e => setSelectedPdfTemplateId(e.target.value)} className={INPUT}>
                  <option value="">Select template…</option>
                  {pdfTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}

              {selectedPdfTemplate?.placeholders?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Map PDF Variables to XLSX Columns
                  </p>
                  {selectedPdfTemplate.placeholders.map(ph => (
                    <div key={ph} className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded w-36 shrink-0 truncate">
                        {'{{'}{ph}{'}}'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                      </svg>
                      <select
                        value={pdfColumnMapping[ph] || ''}
                        onChange={e => setPdfColumnMapping(m => ({ ...m, [ph]: e.target.value }))}
                        className={INPUT + ' flex-1'}>
                        <option value="">— not mapped —</option>
                        {xlsxColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXTERNAL_API */}
        {attachmentType === 'EXTERNAL_API' && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">External API Configuration</p>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-purple-600 dark:text-purple-400">
                  {'{{column}}'}
                </code>{' '}
                in URL or body to inject row values. The endpoint must return PDF bytes.
              </p>

              <div className="flex gap-2">
                <select value={extApiMethod} onChange={e => setExtApiMethod(e.target.value)}
                  className="w-24 shrink-0 px-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <input type="url" placeholder="https://api.example.com/invoice?id={{invoice_id}}"
                  value={extApiUrl} onChange={e => setExtApiUrl(e.target.value)}
                  className={INPUT + ' flex-1'}/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Headers <span className="font-normal text-gray-400">(JSON, optional)</span>
                </label>
                <textarea rows={2} placeholder={'{"Authorization": "Bearer token123"}'}
                  value={extApiHeaders} onChange={e => setExtApiHeaders(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
              </div>

              {extApiMethod === 'POST' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Request Body Template <span className="font-normal text-gray-400">(JSON with {'{{'+'var'+'}}'} placeholders)</span>
                  </label>
                  <textarea rows={3} placeholder={'{"customerId": "{{id}}", "name": "{{name}}"}'}
                    value={extApiBody} onChange={e => setExtApiBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary: EXCEL_SHEET config */}
        {attachmentType === 'EXCEL_SHEET' && renderExcelSheetConfig()}

        {/* ── Secondary attachment: Excel from Sheet 2 ── */}
        {showSecondaryExcelToggle && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Also attach</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold">2</span>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional attachment (optional)</p>
            </div>

            {/* Excel Sheet 2 toggle card */}
            <button type="button" onClick={() => setIncludeExcelSheet(v => !v)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                ${includeExcelSheet
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 bg-white dark:bg-gray-700/40'}`}>
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                ${includeExcelSheet ? 'bg-green-600 border-green-600' : 'border-gray-300 dark:border-gray-500'}`}>
                {includeExcelSheet && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <svg className={`w-5 h-5 shrink-0 ${includeExcelSheet ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Excel from Sheet 2</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sheet2Rows.length > 0
                    ? `Attach a per-recipient Excel file alongside the primary attachment — ${sheet2Rows.length} Sheet 2 rows detected`
                    : 'Upload an Excel workbook with Sheet 2 to enable this option'}
                </p>
              </div>
              {includeExcelSheet && (
                <span className="ml-auto shrink-0 text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                  Enabled
                </span>
              )}
            </button>

            {/* Excel Sheet 2 config — shown when toggle is on */}
            {includeExcelSheet && renderExcelSheetConfig('Sheet 2 — Excel Attachment Configuration')}
          </>
        )}

        {/* Summary badge when both are active */}
        {attachmentType !== 'NONE' && attachmentType !== 'EXCEL_SHEET' && includeExcelSheet && sheet2Rows.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Each email will have <strong>2 attachments</strong>: a{' '}
              <strong>{ATT_OPTIONS.find(o => o.value === attachmentType)?.label}</strong> and an Excel file from Sheet 2.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Step 3 — Review & Send ────────────────────────────────────────
  function renderStep3() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Review &amp; Send</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review the campaign details below, then click <strong>Send Campaign</strong>.
          </p>
        </div>

        {/* Summary card — mirrors ESignBulkPage Step 4 summary */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {[
            { label: 'Campaign label',  value: jobLabel.trim() || (xlsxFileName ? xlsxFileName.replace(/\.[^.]+$/, '') : 'Auto-named') },
            { label: 'Recipients',      value: `${xlsxRows.length} email${xlsxRows.length !== 1 ? 's' : ''}` },
            { label: 'Email template',  value: selectedTemplate?.name || '—' },
            { label: 'Attachment',      value: ATT_OPTIONS.find(a => a.value === attachmentType)?.label || 'None' },
            ...(attachmentType === 'UPLOAD' && uploadedPdfFile
              ? [{ label: 'PDF file', value: `${uploadedPdfFile.name} (${fmtBytes(uploadedPdfFile.size)})` }]
              : []),
            ...(attachmentType === 'PDF_TEMPLATE' && selectedPdfTemplate
              ? [{ label: 'PDF template', value: selectedPdfTemplate.name }]
              : []),
            ...(attachmentType === 'EXTERNAL_API' && extApiUrl
              ? [{ label: 'API endpoint', value: extApiUrl.length > 50 ? extApiUrl.slice(0, 50) + '…' : extApiUrl }]
              : []),
            ...(attachmentType === 'EXCEL_SHEET' && sheet2Rows.length > 0
              ? [
                  { label: 'Sheet 2 detail rows', value: `${sheet2Rows.length} row${sheet2Rows.length !== 1 ? 's' : ''}` },
                  { label: 'Linked by', value: `${mainIdColumn} → ${sheet2IdColumn}` },
                  { label: 'Columns in attachment', value: `${sheet2SelectedColumns.length} of ${sheet2Columns.length} columns` },
                  ...(detailFileName.trim() ? [{ label: 'Filename template', value: detailFileName.trim() }] : []),
                ]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* First row preview */}
        {xlsxRows.length > 0 && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-3 uppercase tracking-wider">
              First Recipient Preview
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {[
                emailColumn && ['To', xlsxRows[0][emailColumn]],
                nameColumn  && ['Name', xlsxRows[0][nameColumn]],
                selectedTemplate?.subject && ['Subject', selectedTemplate.subject],
              ].filter(Boolean).map(([k, v]) => (
                <>
                  <span key={k + 'l'} className="text-gray-500 dark:text-gray-400">{k}:</span>
                  <span key={k + 'v'} className="font-medium text-gray-900 dark:text-white truncate">{v || '—'}</span>
                </>
              ))}
              {selectedTemplate?.placeholders?.map(ph => (
                <>
                  <span key={ph + 'l'} className="text-gray-500 dark:text-gray-400 font-mono text-xs">{`{{${ph}}}`}:</span>
                  <span key={ph + 'v'} className="font-medium text-gray-900 dark:text-white truncate text-xs">
                    {columnMapping[ph] ? xlsxRows[0][columnMapping[ph]] || '—' : '(not mapped)'}
                  </span>
                </>
              ))}
            </div>
          </div>
        )}

        {/* Campaign name editable */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
            Campaign Name <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input type="text" placeholder="e.g. October Newsletter — Customers"
            value={jobLabel} onChange={e => setJobLabel(e.target.value)} className={INPUT}/>
        </div>

        {/* Error banner */}
        {sendError && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p className="text-xs text-red-700 dark:text-red-300">{sendError}</p>
          </div>
        )}

        {/* Send button — full width, matches ESignBulkPage "Start Batch" style */}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center justify-center gap-2"
          style={{ background: sending ? '#9ca3af' : 'linear-gradient(135deg,#059669,#047857)' }}
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"/>
              Starting campaign…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              Send Campaign — {xlsxRows.length} Email{xlsxRows.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    )
  }

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Dashboard', to: '/' },
        { label: 'Bulk Email', to: '/bulk-email' },
        { label: 'Send Campaign' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Bulk Email Campaign</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Send personalised emails to multiple recipients from a spreadsheet
          </p>
        </div>
      </div>

      <StepIndicator current={step} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200
                      dark:border-gray-700 p-6 min-h-[400px]">

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Unified footer nav — hidden on step 3 (send button inside step) */}
        {step < 3 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={goBack} disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                         border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50
                         dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <button type="button" onClick={goNext} disabled={!canGoNext()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-purple-600 text-white
                         rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors">
              {step === 2 ? 'Review & Send' : 'Next'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* Back button on Review step (send button is inside the step content) */}
        {step === 3 && (
          <div className="flex mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                         border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50
                         dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
