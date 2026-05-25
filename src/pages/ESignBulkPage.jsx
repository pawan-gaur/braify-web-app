import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { esignCreateDocument, esignSaveFields, esignSendDocument, esignInitBatch, esignFinalizeBatch, getTemplates, generatePdfAsBase64, getEmailTemplates } from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'E-Sign Documents', to: '/esign' },
  { label: 'Bulk Send' },
]

const STEPS = ['Upload Excel', 'PDF Source', 'Map Columns', 'Preview', 'Process']

const BULK_FIELD_TYPES = [
  { type: 'SIGNATURE', label: 'Signature', color: '#7c3aed', bg: '#ede9fe' },
  { type: 'INITIALS',  label: 'Initials',  color: '#2563eb', bg: '#dbeafe' },
  { type: 'DATE',      label: 'Date',      color: '#059669', bg: '#d1fae5' },
  { type: 'TEXT',      label: 'Text',      color: '#d97706', bg: '#fef3c7' },
]

// E-sign fields to map from Excel columns (fileIdentifier removed — API mode uses URL substitution)
const ESIGN_MAP_FIELDS = [
  { key: 'title',          label: 'Document Title',    required: true  },
  { key: 'clientEmail',    label: 'Client Email',      required: true  },
  { key: 'clientName',     label: 'Client Name',       required: true  },
  { key: 'tokenValidDays', label: 'Token Valid Days',  required: false, note: 'Default: 7' },
]

/* ─────────────────────────────────────────────────────────────────── */
/* Utilities                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data    = new Uint8Array(e.target.result)
        const wb      = XLSX.read(data, { type: 'array' })
        const ws      = wb.Sheets[wb.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (!rawRows.length || rawRows[0].every(c => c === ''))
          throw new Error('Sheet appears to be empty')
        if (rawRows.length < 2)
          throw new Error('File must have a header row and at least one data row')
        const headers = rawRows[0].map(h => String(h).trim()).filter(Boolean)
        const rows = rawRows
          .slice(1)
          .filter(r => headers.some((_, i) => r[i] !== '' && r[i] !== undefined))
          .map(r =>
            Object.fromEntries(
              headers.map((h, i) => [h, r[i] !== undefined && r[i] !== '' ? String(r[i]) : ''])
            )
          )
        if (!rows.length) throw new Error('No data rows found in the file')
        resolve({ headers, rows })
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/** Substitute {ColumnName} placeholders in a URL template with row values. */
function buildApiUrl(urlTemplate, row) {
  return Object.entries(row).reduce((url, [col, val]) => {
    const escaped = col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return url.replace(new RegExp(`\\{${escaped}\\}`, 'g'), encodeURIComponent(String(val || '')))
  }, urlTemplate)
}

/** Build auth headers from the external-API config object. */
function buildAuthHeaders(config) {
  const h = {}
  if (config.authType === 'bearer')
    h['Authorization'] = `Bearer ${config.authValue}`
  else if (config.authType === 'apikey')
    h[config.authKey || 'X-API-Key'] = config.authValue
  else if (config.authType === 'basic')
    h['Authorization'] = 'Basic ' + btoa(`${config.basicUser}:${config.basicPass}`)
  return h
}

/** Fetch a URL and return its content as a base64 data-URL. */
async function fetchFileAsBase64(url, extraHeaders = {}) {
  const res = await fetch(url, { headers: extraHeaders })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/* ─────────────────────────────────────────────────────────────────── */
/* Step indicator                                                        */
/* ─────────────────────────────────────────────────────────────────── */

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
              ${i === current ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-400'}`}>
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

/* ─────────────────────────────────────────────────────────────────── */
/* Status maps (Step 4)                                                 */
/* ─────────────────────────────────────────────────────────────────── */

const STATUS_DOT = {
  pending:      'bg-gray-300',
  fetching_pdf: 'bg-blue-400 animate-pulse',
  creating:     'bg-yellow-400 animate-pulse',
  created:      'bg-blue-500',
  sending:      'bg-purple-400 animate-pulse',
  sent:         'bg-green-500',
  failed:       'bg-red-500',
  skipped:      'bg-gray-400',
}
const STATUS_LABEL = {
  pending:      '–',
  fetching_pdf: 'Generating PDF…',
  creating:     'Creating…',
  created:      'Created',
  sending:      'Sending…',
  sent:         'Sent ✓',
  failed:       'Failed',
  skipped:      'Skipped',
}

/* ─────────────────────────────────────────────────────────────────── */
/* Shared Tailwind snippets                                              */
/* ─────────────────────────────────────────────────────────────────── */

const INPUT = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white'
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

/* ═══════════════════════════════════════════════════════════════════ */
export default function ESignBulkPage() {
  const navigate      = useNavigate()
  const { showToast } = useToast()
  const [step, setStep] = useState(0)

  /* ── Step 0 — Excel ──────────────────────────────────────────────── */
  const [excelHeaders, setExcelHeaders] = useState([])
  const [excelRows,    setExcelRows]    = useState([])
  const [excelFileName, setExcelFileName] = useState('')
  const [excelLoading, setExcelLoading]   = useState(false)
  const [excelError,   setExcelError]     = useState('')
  const excelRef = useRef()

  /* ── Step 1 — PDF Source ─────────────────────────────────────────── */
  // Any combination of the 3 sources can be enabled simultaneously
  const [enabledSources, setEnabledSources] = useState({ single: true, template: false, api: false })
  // Fallback priority order — first entry tried first per row (all 3 present; only enabled ones used)
  const [sourcePriority, setSourcePriority] = useState(['single', 'template', 'api'])

  // Single PDF upload
  const [singlePdfBase64,   setSinglePdfBase64]   = useState(null)
  const [singlePdfFileName, setSinglePdfFileName] = useState('')
  const pdfRef = useRef()

  // PDF Template mode
  const [templates,         setTemplates]         = useState([])
  const [templatesLoading,  setTemplatesLoading]  = useState(false)
  const [templateSearch,    setTemplateSearch]    = useState('')
  const [selectedTemplateId,setSelectedTemplateId]= useState('')
  const [selectedTemplate,  setSelectedTemplate]  = useState(null)
  const [placeholderMapping,setPlaceholderMapping]= useState({}) // { placeholder: excelColumn }

  // External API mode
  const [fileApi, setFileApi] = useState({
    url: '', authType: 'none', authValue: '',
    authKey: 'X-API-Key', basicUser: '', basicPass: '',
  })
  const [fileApiLoading, setFileApiLoading] = useState(false)
  const [fileApiTested,  setFileApiTested]  = useState(false)
  const [fileApiError,   setFileApiError]   = useState('')
  const [fileApiTestInfo,setFileApiTestInfo]= useState(null) // { size, contentType }

  // Blob URL for PDF preview in field placement canvas
  const [singlePdfBlobUrl, setSinglePdfBlobUrl] = useState(null)

  /* ── Step 1 — Field placement (shared across Upload / Template modes) */
  const [bulkFields,        setBulkFields]        = useState([])
  const [selectedFieldType, setSelectedFieldType] = useState('SIGNATURE')
  const [bulkDragging,      setBulkDragging]      = useState(null)
  const fieldCanvasRef = useRef(null)
  const bulkDragRef    = useRef(null)   // sync ref so mousemove closure is stable
  const didDragRef     = useRef(false)  // prevents canvas click from placing after a drag

  /* ── Email Template (optional — Step 1) ─────────────────────────── */
  const [emailTemplates,          setEmailTemplates]          = useState([])
  const [emailTemplatesLoading,   setEmailTemplatesLoading]   = useState(false)
  const [emailTemplateSearch,     setEmailTemplateSearch]     = useState('')
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('')
  const [selectedEmailTemplate,   setSelectedEmailTemplate]   = useState(null)
  const [emailPickerOpen,         setEmailPickerOpen]         = useState(false)

  /* ── Step 2 — Column mapping ─────────────────────────────────────── */
  const [mapping, setMapping] = useState({ title: '', clientEmail: '', clientName: '', tokenValidDays: '' })

  /* ── Step 4 — Processing ─────────────────────────────────────────── */
  const [rowStatuses, setRowStatuses] = useState([])
  const [processing,  setProcessing]  = useState(false)
  const [processDone, setProcessDone] = useState(false)
  const cancelRef = useRef(false)

  /* ── Load PDF templates when mode switches to 'template' ────────── */
  useEffect(() => {
    if (!enabledSources.template || templates.length > 0) return
    setTemplatesLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch(() => showToast('Failed to load PDF templates', 'error'))
      .finally(() => setTemplatesLoading(false))
  }, [enabledSources.template])

  /* ── Load email templates when the picker is first opened ───────── */
  useEffect(() => {
    if (!emailPickerOpen || emailTemplates.length > 0) return
    setEmailTemplatesLoading(true)
    getEmailTemplates()
      .then(setEmailTemplates)
      .catch(() => showToast('Failed to load email templates', 'error'))
      .finally(() => setEmailTemplatesLoading(false))
  }, [emailPickerOpen])

  /* ── Computed preview rows (memoised) ────────────────────────────── */
  const previewRows = useMemo(() =>
    excelRows.map((row, idx) => {
      const title          = row[mapping.title]          || ''
      const clientEmail    = row[mapping.clientEmail]    || ''
      const clientName     = row[mapping.clientName]     || ''
      const tokenValidDays = mapping.tokenValidDays
        ? (row[mapping.tokenValidDays] || '7') : '7'

      const resolvedApiUrl = enabledSources.api && fileApi.url
        ? buildApiUrl(fileApi.url, row) : null

      const errs = []
      if (!title)       errs.push('Title missing')
      if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail))
        errs.push('Invalid email')
      if (!clientName)  errs.push('Client name missing')

      return {
        idx: idx + 1, title, clientEmail, clientName,
        tokenValidDays, resolvedApiUrl, errs, valid: !errs.length,
        rawRow: row,
      }
    }),
    [excelRows, mapping, enabledSources.api, fileApi.url]
  )

  /* ── Derived: enabled sources in priority order ─────────────────── */
  const activeSources = sourcePriority.filter(s => enabledSources[s])

  function toggleSource(src) {
    setEnabledSources(s => ({ ...s, [src]: !s[src] }))
  }

  function movePriorityInActive(src, dir) {
    const active = sourcePriority.filter(s => enabledSources[s])
    const activeIdx = active.indexOf(src)
    const newActiveIdx = activeIdx + dir
    if (newActiveIdx < 0 || newActiveIdx >= active.length) return
    const swapWith = active[newActiveIdx]
    setSourcePriority(prev => {
      const arr = [...prev]
      const iA = arr.indexOf(src)
      const iB = arr.indexOf(swapWith)
      ;[arr[iA], arr[iB]] = [arr[iB], arr[iA]]
      return arr
    })
  }

  /* ── Global mouse handlers for field drag ───────────────────────── */
  useEffect(() => {
    function onMove(e) {
      const drag = bulkDragRef.current
      if (!drag) return
      const rect = fieldCanvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const newX = ((e.clientX - rect.left - drag.offsetX) / rect.width)  * 100
      const newY = ((e.clientY - rect.top  - drag.offsetY) / rect.height) * 100
      setBulkFields(prev => prev.map(f => f.id === drag.id
        ? { ...f,
            x: Math.min(Math.max(newX, 0), 100 - f.width),
            y: Math.min(Math.max(newY, 0), 100 - f.height) }
        : f
      ))
    }
    function onUp() {
      if (bulkDragRef.current) didDragRef.current = true
      bulkDragRef.current = null
      setBulkDragging(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  function placeField(e) {
    if (didDragRef.current) { didDragRef.current = false; return }
    const rect = fieldCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width)  * 100 - 9,   0), 82)
    const y = Math.min(Math.max(((e.clientY - rect.top)  / rect.height) * 100 - 2.5, 0), 95)
    const typeDef = BULK_FIELD_TYPES.find(t => t.type === selectedFieldType)
    setBulkFields(prev => [...prev, {
      id: crypto.randomUUID(), page: 1,
      x, y, width: 18, height: 5,
      fieldType: selectedFieldType,
      label: typeDef?.label || selectedFieldType,
      required: true,
    }])
  }

  function startFieldDrag(e, fieldId) {
    e.stopPropagation()
    const rect  = fieldCanvasRef.current?.getBoundingClientRect()
    const field = bulkFields.find(f => f.id === fieldId)
    if (!rect || !field) return
    const drag = {
      id:      fieldId,
      offsetX: e.clientX - rect.left - (field.x / 100) * rect.width,
      offsetY: e.clientY - rect.top  - (field.y / 100) * rect.height,
    }
    bulkDragRef.current = drag
    setBulkDragging(drag)
  }

  function removeBulkField(id) {
    setBulkFields(f => f.filter(field => field.id !== id))
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Step 0 handlers                                                     */
  /* ────────────────────────────────────────────────────────────────── */
  async function onExcelFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelError('')
    setExcelLoading(true)
    try {
      const { headers, rows } = await parseExcelFile(file)
      setExcelHeaders(headers)
      setExcelRows(rows)
      setExcelFileName(file.name)
      // Auto-map common header names
      const AUTO = {
        title:          ['title', 'document title', 'doc title', 'document name', 'subject'],
        clientEmail:    ['email', 'client email', 'recipient email', 'to', 'email address'],
        clientName:     ['name', 'client name', 'recipient name', 'full name', 'client'],
        tokenValidDays: ['days', 'valid days', 'expiry days', 'token days', 'validity'],
      }
      const autoMap = {}
      headers.forEach(h => {
        const hl = h.toLowerCase()
        for (const [f, matchers] of Object.entries(AUTO)) {
          if (!autoMap[f] && matchers.some(m => hl.includes(m))) autoMap[f] = h
        }
      })
      setMapping(m => ({ ...m, ...autoMap }))
    } catch (err) {
      setExcelError(err.message)
    } finally {
      setExcelLoading(false)
    }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Step 1 handlers                                                     */
  /* ────────────────────────────────────────────────────────────────── */
  function onSinglePdfFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSinglePdfFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      setSinglePdfBase64(ev.target.result)
      const b64   = ev.target.result.split(',')[1]
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
      setSinglePdfBlobUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    }
    reader.readAsDataURL(file)
  }

  function onTemplateSelect(tpl) {
    setSelectedTemplateId(tpl.id)
    setSelectedTemplate(tpl)
    // Auto-map placeholders to matching Excel columns
    const autoMap = {}
    ;(tpl.placeholders || []).forEach(p => {
      const pl = p.toLowerCase()
      const match = excelHeaders.find(h => {
        const hl = h.toLowerCase()
        return hl.includes(pl) || pl.includes(hl)
      })
      if (match) autoMap[p] = match
    })
    setPlaceholderMapping(autoMap)
  }

  async function onTestApi() {
    if (!fileApi.url || !excelRows.length) return
    setFileApiLoading(true)
    setFileApiError('')
    setFileApiTested(false)
    setFileApiTestInfo(null)
    try {
      const testUrl = buildApiUrl(fileApi.url, excelRows[0])
      const res     = await fetch(testUrl, { headers: buildAuthHeaders(fileApi) })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const ct = res.headers.get('content-type') || ''
      const cl = res.headers.get('content-length')
      if (!ct.includes('pdf') && !ct.includes('octet-stream') && !ct.includes('binary')) {
        throw new Error(`Expected a PDF but received content-type: "${ct || 'unknown'}"`)
      }
      setFileApiTestInfo({
        contentType: ct,
        size: cl ? `${Math.round(parseInt(cl) / 1024)} KB` : null,
      })
      setFileApiTested(true)
    } catch (err) {
      setFileApiError(err.message)
    } finally {
      setFileApiLoading(false)
    }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Navigation validation                                               */
  /* ────────────────────────────────────────────────────────────────── */
  function canGoNext() {
    if (step === 0) return excelRows.length > 0
    if (step === 1) {
      if (!activeSources.length) return false
      const ready = {
        single:   !!singlePdfBase64,
        template: !!selectedTemplateId,
        api:      fileApiTested && !!fileApi.url,
      }
      return activeSources.every(s => ready[s])
    }
    if (step === 2) return !!(mapping.title && mapping.clientEmail && mapping.clientName)
    return true
  }

  function goNext() { setStep(s => s + 1) }
  function goBack() { if (step > 0 && !processing) setStep(s => s - 1) }

  /* ────────────────────────────────────────────────────────────────── */
  /* Processing                                                          */
  /* ────────────────────────────────────────────────────────────────── */
  function updateStatus(idx, patch) {
    setRowStatuses(prev => prev.map((s, j) => j === idx ? { ...s, ...patch } : s))
  }

  async function startProcessing() {
    const initial = previewRows.map(r => ({
      ...r, docStatus: 'pending', sendStatus: 'pending', docId: null, error: null,
    }))
    setRowStatuses(initial)
    setProcessing(true)
    setProcessDone(false)
    cancelRef.current = false

    const validCount = previewRows.filter(r => r.valid).length

    // ── 0. Create a batch record so documents appear in Bulk Batches tab ──
    let batchId = null
    try {
      const batch = await esignInitBatch(null, validCount)
      batchId = batch.id
    } catch (err) {
      console.warn('Could not create batch record — documents will still be created:', err.message)
    }

    let totalCreated = 0, totalSent = 0, totalFailed = 0

    for (let i = 0; i < previewRows.length; i++) {
      if (cancelRef.current) break
      const row = previewRows[i]

      if (!row.valid) {
        updateStatus(i, { docStatus: 'skipped', sendStatus: 'skipped', error: row.errs.join('; ') })
        continue
      }

      // ── 1. Resolve PDF base64 (try sources in priority order) ───────
      let pdfBase64
      try {
        updateStatus(i, { docStatus: 'fetching_pdf' })
        let lastErr = null
        for (const src of activeSources) {
          try {
            if (src === 'single') {
              pdfBase64 = singlePdfBase64
            } else if (src === 'template') {
              const data = {}
              ;(selectedTemplate?.placeholders || []).forEach(p => {
                const col = placeholderMapping[p]
                data[p] = col ? (row.rawRow[col] || '') : ''
              })
              pdfBase64 = await generatePdfAsBase64(selectedTemplateId, data)
            } else {
              const url = buildApiUrl(fileApi.url, row.rawRow)
              pdfBase64 = await fetchFileAsBase64(url, buildAuthHeaders(fileApi))
            }
            if (pdfBase64) break   // source succeeded — stop trying fallbacks
          } catch (e) {
            lastErr = e             // source failed — try next in chain
          }
        }
        if (!pdfBase64) throw lastErr || new Error('No PDF source returned a result')
      } catch (err) {
        updateStatus(i, { docStatus: 'failed', sendStatus: 'skipped', error: `PDF: ${err.message}` })
        totalFailed++
        continue
      }

      // ── 2. Create document ─────────────────────────────────────────
      let docId
      try {
        updateStatus(i, { docStatus: 'creating' })
        const doc = await esignCreateDocument({
          title:           row.title,
          sourceType:      'UPLOAD',
          pdfBase64,
          clientEmail:     row.clientEmail,
          clientName:      row.clientName,
          tokenValidDays:  parseInt(row.tokenValidDays) || 7,
          bulkBatchId:     batchId,
          emailTemplateId: selectedEmailTemplateId || undefined,
        })
        docId = doc.id
        totalCreated++
        updateStatus(i, { docStatus: 'created', docId })
      } catch (err) {
        updateStatus(i, { docStatus: 'failed', sendStatus: 'skipped', error: `Create: ${err.message}` })
        totalFailed++
        continue
      }

      // ── 2b. Save field placements ──────────────────────────────────
      if (bulkFields.length > 0) {
        try {
          const fieldPayload = bulkFields.map(({ id: _id, ...rest }) => rest)
          await esignSaveFields(docId, fieldPayload)
        } catch (err) {
          // Non-fatal — document still exists and can be sent
          console.warn(`Field save failed for doc ${docId}:`, err.message)
        }
      }

      // ── 3. Send document ───────────────────────────────────────────
      try {
        updateStatus(i, { sendStatus: 'sending' })
        await esignSendDocument(docId, parseInt(row.tokenValidDays) || 7)
        updateStatus(i, { sendStatus: 'sent' })
        totalSent++
      } catch (err) {
        updateStatus(i, { sendStatus: 'failed', error: `Send: ${err.message}` })
        totalFailed++
      }
    }

    // ── 4. Finalize the batch record ──────────────────────────────────
    if (batchId) {
      try {
        await esignFinalizeBatch(batchId, totalCreated, totalSent, totalFailed)
      } catch (err) {
        console.warn('Could not finalize batch record:', err.message)
      }
    }

    setProcessing(false)
    setProcessDone(true)
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Render: Step 0 — Upload Excel                                       */
  /* ────────────────────────────────────────────────────────────────── */
  function renderStep0() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Upload your spreadsheet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supported formats: .xlsx, .xls, .csv — first row must contain column headers
          </p>
        </div>

        <button type="button" onClick={() => excelRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10
                     text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors group">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 group-hover:text-purple-400 transition-colors"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414
                 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {excelFileName
            ? <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{excelFileName} — click to replace</p>
            : <><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload Excel or CSV</p>
                <p className="text-xs text-gray-400 mt-1">.xlsx · .xls · .csv</p></>
          }
        </button>
        <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onExcelFile} />

        {excelLoading && <p className="text-sm text-purple-600 text-center animate-pulse">Parsing file…</p>}
        {excelError   && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">{excelError}</p>}

        {excelRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {excelRows.length} rows · {excelHeaders.length} columns
              </p>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400
                               px-2 py-0.5 rounded-full font-medium">Ready</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>{excelHeaders.map(h =>
                    <th key={h} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  )}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {excelRows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="bg-white dark:bg-gray-900">
                      {excelHeaders.map(h =>
                        <td key={h} className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{row[h]}</td>
                      )}
                    </tr>
                  ))}
                  {excelRows.length > 3 && (
                    <tr className="bg-gray-50 dark:bg-gray-800/60">
                      <td colSpan={excelHeaders.length}
                          className="px-3 py-2 text-center text-gray-400 text-xs">+{excelRows.length - 3} more rows…</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Render: Step 1 — PDF Source                                         */
  /* ────────────────────────────────────────────────────────────────── */
  function renderStep1() {
    const SOURCE_META = {
      single:   { emoji: '📄', title: 'Upload PDF',   desc: 'One static PDF file used for all rows' },
      template: { emoji: '🎨', title: 'PDF Template', desc: 'Generate a unique PDF per row using a designed template with placeholder data' },
      api:      { emoji: '🌐', title: 'External API', desc: 'Fetch each row\'s PDF from an API URL — use {ColumnName} to substitute row values' },
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">PDF Source</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enable one or more sources. When multiple are active, the system tries them in priority
            order per row and uses the first successful result.
          </p>
        </div>

        {/* ── Source toggle cards ─────────────────────────────────── */}
        {(['single', 'template', 'api']).map(src => {
          const meta    = SOURCE_META[src]
          const enabled = enabledSources[src]
          return (
            <div key={src}
                 className={`rounded-xl border-2 transition-colors
                   ${enabled
                     ? 'border-purple-500 bg-purple-50/30 dark:bg-purple-900/10'
                     : 'border-gray-200 dark:border-gray-700'}`}>

              {/* Card header — clicking toggles the source */}
              <button type="button" onClick={() => toggleSource(src)}
                className="w-full flex items-center gap-4 p-4 text-left">
                <span className="text-2xl">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{meta.desc}</p>
                </div>
                {/* Toggle pill */}
                <div className={`w-11 h-6 rounded-full shrink-0 relative transition-colors
                                 ${enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform
                                   ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>

              {/* Config section — only when enabled */}
              {enabled && (
                <div className="px-4 pb-5 border-t border-gray-200/70 dark:border-gray-700/60 pt-4 space-y-4">

                  {/* ── Single PDF ── */}
                  {src === 'single' && (
                    <>
                      <button type="button" onClick={() => pdfRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600
                                   rounded-xl p-8 text-center hover:border-purple-400 transition-colors group">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 group-hover:text-purple-400 transition-colors"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414
                               5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        {singlePdfFileName
                          ? <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{singlePdfFileName} — click to replace</p>
                          : <><p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload PDF</p>
                              <p className="text-xs text-gray-400 mt-1">.pdf only</p></>
                        }
                      </button>
                      <input ref={pdfRef} type="file" accept=".pdf,application/pdf"
                             className="hidden" onChange={onSinglePdfFile} />
                    </>
                  )}

                  {/* ── PDF Template ── */}
                  {src === 'template' && (
                    <div className="space-y-4">
                      {templatesLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"/>
                          <span className="text-sm text-gray-500">Loading templates…</span>
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No PDF templates found.</p>
                          <a href="/templates" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                            Create a template first →
                          </a>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                            </svg>
                            <input type="text" value={templateSearch}
                              onChange={e => setTemplateSearch(e.target.value)}
                              placeholder="Search templates…"
                              className={`${INPUT} pl-9`} />
                          </div>

                          <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                            {templates
                              .filter(t => !templateSearch || t.name?.toLowerCase().includes(templateSearch.toLowerCase()))
                              .map(tpl => (
                                <button key={tpl.id} type="button" onClick={() => onTemplateSelect(tpl)}
                                  className={`p-3 rounded-lg border-2 text-left transition-colors
                                    ${selectedTemplateId === tpl.id
                                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tpl.name}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {tpl.pageSize || 'A4'}
                                        {tpl.placeholders?.length
                                          ? ` · ${tpl.placeholders.length} placeholder${tpl.placeholders.length !== 1 ? 's' : ''}`
                                          : ' · No placeholders'}
                                      </p>
                                    </div>
                                    {selectedTemplateId === tpl.id && (
                                      <svg className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              ))}
                          </div>

                          {selectedTemplate && (
                            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Map Template Placeholders</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  Each placeholder is filled with values from the spreadsheet row by row
                                </p>
                              </div>
                              {(!selectedTemplate.placeholders || selectedTemplate.placeholders.length === 0) ? (
                                <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-4 py-3">
                                  This template has no placeholders — the same PDF content will be used for all rows.
                                </p>
                              ) : (
                                <>
                                  <div className="space-y-2">
                                    {selectedTemplate.placeholders.map(p => (
                                      <div key={p} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
                                        <code className="text-xs font-mono text-purple-700 dark:text-purple-400
                                                         bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                          {`{{${p}}}`}
                                        </code>
                                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                        </svg>
                                        <select value={placeholderMapping[p] || ''}
                                          onChange={e => setPlaceholderMapping(m => ({ ...m, [p]: e.target.value }))}
                                          className="flex-1 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg
                                                     bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2
                                                     focus:ring-purple-500 text-gray-900 dark:text-white">
                                          <option value="">— Not mapped (blank) —</option>
                                          {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        {placeholderMapping[p] && excelRows[0] && (
                                          <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700
                                                           dark:text-indigo-300 px-2 py-0.5 rounded-full shrink-0 max-w-[100px] truncate"
                                                title={excelRows[0][placeholderMapping[p]] || '(empty)'}>
                                            {excelRows[0][placeholderMapping[p]] || '(empty)'}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border
                                                  border-purple-200 dark:border-purple-800 text-xs">
                                    <p className="font-medium text-purple-700 dark:text-purple-400 mb-2">
                                      First row preview
                                    </p>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                      {selectedTemplate.placeholders.map(p => (
                                        <>
                                          <span key={p + 'k'} className="font-mono text-gray-500">{`{{${p}}}`}</span>
                                          <span key={p + 'v'} className="text-gray-900 dark:text-white font-medium truncate">
                                            {placeholderMapping[p]
                                              ? (excelRows[0]?.[placeholderMapping[p]] || '(empty)')
                                              : <span className="text-gray-400 italic">not mapped</span>}
                                          </span>
                                        </>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── External API ── */}
                  {src === 'api' && (
                    <div className="space-y-4">
                      <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20
                                      px-3 py-2.5 rounded-lg space-y-1">
                        <p className="font-medium">Dynamic URL substitution</p>
                        <p>Use <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">{'{ColumnName}'}</code> anywhere
                          in the URL to insert row values. Example:</p>
                        <code className="block text-xs mt-1 text-blue-800 dark:text-blue-200 break-all">
                          https://api.example.com/documents/{'{Document_ID}'}/pdf
                        </code>
                      </div>

                      <div>
                        <label className={LABEL}>API URL</label>
                        <input type="url" value={fileApi.url}
                          placeholder={`https://api.example.com/docs/{${excelHeaders[0] || 'ID'}}/pdf`}
                          onChange={e => { setFileApi(a => ({ ...a, url: e.target.value })); setFileApiTested(false) }}
                          className={INPUT} />
                      </div>

                      {fileApi.url && excelRows.length > 0 && (() => {
                        const resolved = buildApiUrl(fileApi.url, excelRows[0])
                        return resolved !== fileApi.url && (
                          <div className="text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700
                                          rounded-lg px-3 py-2">
                            <span className="text-gray-400 mr-1.5">First row resolves to:</span>
                            <code className="text-gray-700 dark:text-gray-300 break-all">{resolved}</code>
                          </div>
                        )
                      })()}

                      <div>
                        <label className={LABEL}>Authentication</label>
                        <select value={fileApi.authType}
                          onChange={e => { setFileApi(a => ({ ...a, authType: e.target.value })); setFileApiTested(false) }}
                          className={INPUT}>
                          <option value="none">No Authentication</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="apikey">API Key Header</option>
                          <option value="basic">Basic Auth</option>
                        </select>
                      </div>

                      {fileApi.authType === 'bearer' && (
                        <div>
                          <label className={LABEL}>Bearer Token</label>
                          <input type="password" value={fileApi.authValue} placeholder="your-token-here"
                            onChange={e => { setFileApi(a => ({ ...a, authValue: e.target.value })); setFileApiTested(false) }}
                            className={INPUT} />
                        </div>
                      )}
                      {fileApi.authType === 'apikey' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL}>Header Name</label>
                            <input type="text" value={fileApi.authKey} placeholder="X-API-Key"
                              onChange={e => { setFileApi(a => ({ ...a, authKey: e.target.value })); setFileApiTested(false) }}
                              className={INPUT} />
                          </div>
                          <div>
                            <label className={LABEL}>API Key</label>
                            <input type="password" value={fileApi.authValue} placeholder="your-api-key"
                              onChange={e => { setFileApi(a => ({ ...a, authValue: e.target.value })); setFileApiTested(false) }}
                              className={INPUT} />
                          </div>
                        </div>
                      )}
                      {fileApi.authType === 'basic' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL}>Username</label>
                            <input type="text" value={fileApi.basicUser}
                              onChange={e => { setFileApi(a => ({ ...a, basicUser: e.target.value })); setFileApiTested(false) }}
                              className={INPUT} />
                          </div>
                          <div>
                            <label className={LABEL}>Password</label>
                            <input type="password" value={fileApi.basicPass}
                              onChange={e => { setFileApi(a => ({ ...a, basicPass: e.target.value })); setFileApiTested(false) }}
                              className={INPUT} />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <button type="button" onClick={onTestApi}
                          disabled={!fileApi.url || !excelRows.length || fileApiLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
                                     hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                                     text-sm font-medium transition-colors">
                          {fileApiLoading
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                <span>Testing…</span></>
                            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg><span>Test with First Row</span></>
                          }
                        </button>
                        {!excelRows.length && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">Upload Excel first to enable test</p>
                        )}
                      </div>

                      {fileApiError && (
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
                          {fileApiError}
                        </p>
                      )}
                      {fileApiTested && fileApiTestInfo && (
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400
                                        bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                          <span>
                            PDF received
                            {fileApiTestInfo.size && ` (${fileApiTestInfo.size})`}
                            {' — '}<span className="opacity-70">{fileApiTestInfo.contentType}</span>
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20
                                    px-3 py-2 rounded-lg">
                        The external server must allow CORS requests from this app's domain.
                        If the test fails with a network error, consider a backend proxy.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* ── Fallback priority order (shown when 2+ sources enabled) ── */}
        {activeSources.length > 1 && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
              Fallback Priority Order
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3">
              For each row, source #1 is tried first. If it fails, source #2 is tried, and so on.
              Use the arrows to reorder.
            </p>
            <div className="space-y-2">
              {activeSources.map((src, idx) => (
                <div key={src}
                     className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5
                                border border-indigo-100 dark:border-indigo-800/40">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold
                                   flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                    {SOURCE_META[src].emoji} {SOURCE_META[src].title}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button type="button"
                      onClick={() => movePriorityInActive(src, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    <button type="button"
                      onClick={() => movePriorityInActive(src, 1)}
                      disabled={idx === activeSources.length - 1}
                      className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Email Template (optional) ────────────────────────────── */}
        <div className={`rounded-xl border-2 transition-colors
          ${emailPickerOpen
            ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-900/10'
            : 'border-gray-200 dark:border-gray-700'}`}>

          {/* Toggle header */}
          <button type="button" onClick={() => setEmailPickerOpen(o => !o)}
            className="w-full flex items-center gap-4 p-4 text-left">
            <span className="text-2xl">✉️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Email Template
                <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedEmailTemplate
                  ? `Using: ${selectedEmailTemplate.name}`
                  : 'Use a custom email template for all signing invitations in this batch'}
              </p>
            </div>
            <div className={`w-11 h-6 rounded-full shrink-0 relative transition-colors
                             ${emailPickerOpen ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform
                               ${emailPickerOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Picker body */}
          {emailPickerOpen && (
            <div className="px-4 pb-5 border-t border-gray-200/70 dark:border-gray-700/60 pt-4 space-y-4">
              {emailTemplatesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"/>
                  <span className="text-sm text-gray-500">Loading email templates…</span>
                </div>
              ) : emailTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No email templates found.</p>
                  <a href="/email-templates" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                    Create an email template first →
                  </a>
                </div>
              ) : (
                <>
                  {/* None (default) option */}
                  <button type="button"
                    onClick={() => { setSelectedEmailTemplateId(''); setSelectedEmailTemplate(null) }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors
                      ${!selectedEmailTemplateId
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Default invitation email</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use the built-in invitation template for all rows</p>
                  </button>

                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                    </svg>
                    <input type="text" value={emailTemplateSearch}
                      onChange={e => setEmailTemplateSearch(e.target.value)}
                      placeholder="Search email templates…"
                      className={`${INPUT} pl-9`} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                    {emailTemplates
                      .filter(t => !emailTemplateSearch || t.name?.toLowerCase().includes(emailTemplateSearch.toLowerCase()))
                      .map(tpl => (
                        <button key={tpl.id} type="button"
                          onClick={() => { setSelectedEmailTemplateId(tpl.id); setSelectedEmailTemplate(tpl) }}
                          className={`p-3 rounded-lg border-2 text-left transition-colors
                            ${selectedEmailTemplateId === tpl.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tpl.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {tpl.subject ? `Subject: ${tpl.subject}` : 'No subject set'}
                              </p>
                            </div>
                            {selectedEmailTemplateId === tpl.id && (
                              <svg className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>

                  {selectedEmailTemplate && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2
                                  bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                      Template "{selectedEmailTemplate.name}" will be used for all {excelRows.length} invitation{excelRows.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  <p className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20
                                px-3 py-2 rounded-lg">
                    Tip: Use <code className="font-mono">{'{{clientName}}'}</code>,{' '}
                    <code className="font-mono">{'{{documentTitle}}'}</code>,{' '}
                    <code className="font-mono">{'{{signingLink}}'}</code>, and{' '}
                    <code className="font-mono">{'{{orgName}}'}</code> in your template.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Signature Field Placement ────────────────────────────── */}
        {(enabledSources.single || enabledSources.template) && (
          <div className="rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800
                          bg-purple-50/30 dark:bg-purple-900/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Signature Fields
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Click the document to place fields — the same layout is applied to every row
                </p>
              </div>
              {bulkFields.length > 0 && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700
                                 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  {bulkFields.length} field{bulkFields.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Field type selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 font-medium">Add:</span>
              {BULK_FIELD_TYPES.map(ft => (
                <button key={ft.type} type="button"
                  onClick={() => setSelectedFieldType(ft.type)}
                  style={selectedFieldType === ft.type
                    ? { borderColor: ft.color, backgroundColor: ft.bg, color: ft.color }
                    : {}}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                    ${selectedFieldType === ft.type
                      ? 'border-2'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                  {ft.label}
                </button>
              ))}
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">
                ← then click the document below
              </span>
            </div>

            {/* PDF canvas */}
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white"
                 style={{ paddingBottom: '141.4%' /* A4 aspect ratio 297/210 */ }}>
              <div className="absolute inset-0">
                {/* PDF iframe or blank A4 placeholder */}
                {singlePdfBlobUrl && enabledSources.single
                  ? <iframe src={singlePdfBlobUrl} title="PDF preview"
                             className="w-full h-full" style={{ pointerEvents: 'none' }} />
                  : <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/40">
                      <p className="text-xs text-gray-300 dark:text-gray-600 select-none text-center px-4">
                        {enabledSources.single
                          ? 'Upload a PDF above to see a preview here'
                          : 'A4 page — click to place fields at approximate positions'}
                      </p>
                    </div>
                }

                {/* Click-to-place + drag overlay */}
                <div ref={fieldCanvasRef}
                     className={`absolute inset-0 z-10 ${bulkDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                     onClick={placeField}>
                  {bulkFields.map(f => {
                    const typeDef = BULK_FIELD_TYPES.find(t => t.type === f.fieldType)
                    return (
                      <div key={f.id}
                           style={{
                             position: 'absolute',
                             left: `${f.x}%`, top: `${f.y}%`,
                             width: `${f.width}%`, height: `${f.height}%`,
                             borderColor: typeDef?.color,
                             backgroundColor: typeDef?.bg + 'cc',
                           }}
                           className="border-2 rounded flex items-center justify-between px-1.5 cursor-move select-none"
                           onMouseDown={e => startFieldDrag(e, f.id)}
                           onClick={e => e.stopPropagation()}>
                        <span style={{ color: typeDef?.color }}
                              className="text-xs font-semibold truncate leading-none">
                          {f.label}
                        </span>
                        <button type="button"
                          style={{ color: typeDef?.color }}
                          className="text-xs font-bold ml-0.5 hover:opacity-60 shrink-0 leading-none"
                          onClick={e => { e.stopPropagation(); removeBulkField(f.id) }}>
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Field list / edit below canvas */}
            {bulkFields.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Configured fields — edit labels or mark required
                </p>
                {bulkFields.map(f => {
                  const typeDef = BULK_FIELD_TYPES.find(t => t.type === f.fieldType)
                  return (
                    <div key={f.id}
                         className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800
                                    rounded-lg border border-gray-100 dark:border-gray-700 text-xs">
                      <span style={{ color: typeDef?.color, backgroundColor: typeDef?.bg }}
                            className="px-2 py-0.5 rounded font-bold shrink-0 text-xs">
                        {f.fieldType}
                      </span>
                      <input value={f.label}
                        onChange={e => setBulkFields(prev =>
                          prev.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))}
                        placeholder="Label"
                        className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-600
                                   focus:outline-none focus:border-purple-400 text-gray-700
                                   dark:text-gray-300 py-0.5" />
                      <span className="text-gray-400 shrink-0">Pg {f.page}</span>
                      <label className="flex items-center gap-1 text-gray-500 dark:text-gray-400 shrink-0 cursor-pointer">
                        <input type="checkbox" checked={f.required}
                          onChange={e => setBulkFields(prev =>
                            prev.map(x => x.id === f.id ? { ...x, required: e.target.checked } : x))}
                          className="rounded border-gray-300" />
                        Req
                      </label>
                      <button type="button" onClick={() => removeBulkField(f.id)}
                        className="text-red-400 hover:text-red-600 shrink-0 p-0.5 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {bulkFields.length === 0 && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 pb-1">
                No fields placed yet — click anywhere on the document above to add one
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Render: Step 2 — Map Columns                                        */
  /* ────────────────────────────────────────────────────────────────── */
  function renderStep2() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Map Columns</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Map your spreadsheet columns to the E-Sign document fields
          </p>
        </div>

        <div className="space-y-2">
          {ESIGN_MAP_FIELDS.map(field => (
            <div key={field.key}
                 className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
              <div className="w-40 shrink-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </p>
                {field.note && <p className="text-xs text-gray-400">{field.note}</p>}
              </div>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              <select value={mapping[field.key]}
                onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2
                           focus:ring-purple-500 text-gray-900 dark:text-white">
                <option value="">— {field.required ? 'Select column' : 'Not mapped'} —</option>
                {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              {mapping[field.key] && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700
                                 dark:text-purple-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {excelRows[0]?.[mapping[field.key]] || '(empty)'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* PDF source reminder */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400
                        bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>
            PDF source{activeSources.length > 1 ? 's (with fallback)' : ''}:{' '}
            {activeSources.map((src, i) => (
              <span key={src}>
                {i > 0 && <span className="text-gray-400 mx-1">→</span>}
                <strong>
                  {src === 'single'   && 'Uploaded PDF'}
                  {src === 'template' && `Template "${selectedTemplate?.name || '…'}"`}
                  {src === 'api'      && 'External API'}
                </strong>
              </span>
            ))}
          </span>
        </div>

        {/* First-row preview */}
        {mapping.clientEmail && mapping.clientName && mapping.title && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl
                          border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-3 uppercase tracking-wider">
              First Row Preview
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {[
                ['Title',        mapping.title,          excelRows[0]?.[mapping.title]],
                ['Client Email', mapping.clientEmail,    excelRows[0]?.[mapping.clientEmail]],
                ['Client Name',  mapping.clientName,     excelRows[0]?.[mapping.clientName]],
                mapping.tokenValidDays
                  ? ['Token Days', mapping.tokenValidDays, excelRows[0]?.[mapping.tokenValidDays] || '7']
                  : null,
              ].filter(Boolean).map(([label, , val]) => (
                <>
                  <span key={label + 'l'} className="text-gray-500 dark:text-gray-400">{label}:</span>
                  <span key={label + 'v'} className="font-medium text-gray-900 dark:text-white truncate">{val || '—'}</span>
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Render: Step 3 — Preview & Validate                                 */
  /* ────────────────────────────────────────────────────────────────── */
  function renderStep3() {
    const validCount   = previewRows.filter(r => r.valid).length
    const invalidCount = previewRows.length - validCount

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Preview &amp; Validate</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review all rows before processing</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400
                             px-2.5 py-1 rounded-full font-medium">{validCount} valid</span>
            {invalidCount > 0 && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                               px-2.5 py-1 rounded-full font-medium">{invalidCount} invalid</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['#', 'Title', 'Client Email', 'Client Name', 'Days',
                  ...(enabledSources.api ? ['Resolved PDF URL'] : []),
                  'Status'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500
                                         uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {previewRows.map((row, i) => (
                <tr key={i} className={row.valid ? 'bg-white dark:bg-gray-900' : 'bg-red-50 dark:bg-red-900/10'}>
                  <td className="px-3 py-2.5 text-xs text-gray-400">{row.idx}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                    {row.title || <span className="text-red-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {row.clientEmail || <span className="text-red-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400">
                    {row.clientName || <span className="text-red-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{row.tokenValidDays}d</td>
                  {enabledSources.api && (
                    <td className="px-3 py-2.5 text-xs max-w-[200px]">
                      <span className="text-gray-500 dark:text-gray-400 truncate block"
                            title={row.resolvedApiUrl || ''}>
                        {row.resolvedApiUrl
                          ? row.resolvedApiUrl.replace(/^https?:\/\//, '').slice(0, 40) + '…'
                          : '—'}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    {row.valid
                      ? <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600
                                         dark:text-green-400 px-2 py-0.5 rounded-full">Ready</span>
                      : <div className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                          {row.errs.map((e, j) => <div key={j}>{e}</div>)}
                        </div>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invalidCount > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
            {invalidCount} invalid row{invalidCount > 1 ? 's' : ''} will be skipped during processing.
          </p>
        )}
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Render: Step 4 — Process & Track                                    */
  /* ────────────────────────────────────────────────────────────────── */
  function renderStep4() {
    const sent    = rowStatuses.filter(r => r.sendStatus === 'sent').length
    const failed  = rowStatuses.filter(r => r.docStatus === 'failed' || r.sendStatus === 'failed').length
    const skipped = rowStatuses.filter(r => r.docStatus === 'skipped').length
    const total   = rowStatuses.length
    const done    = rowStatuses.filter(r =>
      ['sent', 'failed', 'skipped'].includes(r.sendStatus) || r.docStatus === 'skipped'
    ).length
    const pct     = total > 0 ? Math.round((done / total) * 100) : 0
    const validCount = previewRows.filter(r => r.valid).length

    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Process &amp; Track</h3>
            {!processing && !processDone && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {validCount} valid document{validCount !== 1 ? 's' : ''} ready to send
              </p>
            )}
            {processing && (
              <p className="text-sm text-purple-600 dark:text-purple-400 animate-pulse">
                Processing… ({done}/{total})
              </p>
            )}
            {processDone && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete —{' '}
                <span className="text-green-600 dark:text-green-400 font-medium">{sent} sent</span>
                {failed  > 0 && <> · <span className="text-red-500 font-medium">{failed} failed</span></>}
                {skipped > 0 && <> · <span className="text-gray-400">{skipped} skipped</span></>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {processing && (
              <button type="button" onClick={() => { cancelRef.current = true }}
                className="px-3 py-1.5 text-sm text-red-600 border border-red-200 dark:border-red-800
                           rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Stop
              </button>
            )}
            {processDone && (
              <button type="button" onClick={() => navigate('/esign')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                           text-sm font-medium transition-colors">
                Go to E-Sign Documents
              </button>
            )}
          </div>
        </div>

        {(processing || processDone) && (
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                   style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 text-right">{done} / {total}</p>
          </div>
        )}

        {rowStatuses.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['#', 'Title', 'Client Email', 'Doc Status', 'Email Status', 'Notes'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500
                                           uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rowStatuses.map((r, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-900">
                    <td className="px-3 py-2.5 text-xs text-gray-400">{r.idx}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-white truncate max-w-[150px]">{r.title}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{r.clientEmail}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[r.docStatus] || 'bg-gray-300'}`}/>
                        {STATUS_LABEL[r.docStatus] || r.docStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[r.sendStatus] || 'bg-gray-300'}`}/>
                        {STATUS_LABEL[r.sendStatus] || r.sendStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-red-500 max-w-[200px] truncate"
                        title={r.error || undefined}>{r.error || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!processing && !processDone && (
          <button type="button" onClick={startProcessing} disabled={validCount === 0}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold
                       hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors text-sm">
            Start Processing {validCount} Document{validCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Root render                                                         */
  /* ────────────────────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk E-Sign Send</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Send e-sign requests to multiple recipients from a spreadsheet
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
        {step === 4 && renderStep4()}

        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={goBack} disabled={step === 0 || processing}
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
              {step === 3 ? 'Proceed to Processing' : 'Next'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
