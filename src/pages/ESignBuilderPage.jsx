import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  esignCreateDocument,
  esignGetDocument,
  esignDownloadSource,
  esignSaveFields,
  esignSendDocument,
  getTemplates,
  generatePdfAsBase64,
  getEmailTemplates,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { IconX, IconCheck, IconArrowRight, IconArrowLeft } from '../components/ui/icons'
import PdfPageCanvas from '../components/esign/PdfPageCanvas'

const FIELD_TYPES = [
  { type: 'SIGNATURE', label: 'Signature',  color: '#7c3aed', bg: '#ede9fe' },
  { type: 'INITIALS',  label: 'Initials',   color: '#2563eb', bg: '#dbeafe' },
  { type: 'DATE',      label: 'Date',        color: '#059669', bg: '#d1fae5' },
  { type: 'TEXT',      label: 'Text',        color: '#d97706', bg: '#fef3c7' },
]

const SOURCE_META = {
  single:   { path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Upload PDF',   desc: 'Upload a PDF file directly' },
  template: { path: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', title: 'PDF Template', desc: 'Generate PDF from a designed template' },
  api:      { path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'External API', desc: 'Fetch the PDF from an external URL' },
}

const DEFAULT_FIELD_SIZE = { width: 18, height: 5 }
const STEPS    = ['Setup', 'Place Fields', 'Send']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Distinct colours used to tell signatories apart when placing per-signatory fields.
const SIGNATORY_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#db2777', '#0891b2', '#ca8a04', '#dc2626']
const signatoryColor = idx => SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length]

/* ─────────────────────────────── utilities ─────────────────────────────── */

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

async function fetchFileAsBase64(url, extraHeaders = {}) {
  const res = await fetch(url, { headers: extraHeaders })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}


/* ══════════════════════════════════════════════════════════════════════════ */
export default function ESignBuilderPage({ initialDocStatus }) {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { showToast } = useToast()
  const isEdit        = !!id

  /* ── wizard step ──────────────────────────────────────────────────────── */
  const [step,  setStep]  = useState(isEdit ? 1 : 0)
  const [docId, setDocId] = useState(id || null)

  /* ── form (client info + token days) ─────────────────────────────────── */
  const [form, setForm] = useState({
    title: '', clientEmail: '', clientName: '', tokenValidDays: 7,
  })
  const [formErrors, setFormErrors] = useState({})
  const [creating, setCreating]     = useState(false)

  /* ── recipient chip lists (CC on invitation + final signed-copy) ─────── */
  const [inviteCc,          setInviteCc]          = useState([])   // CC on the signing invitation
  const [inviteCcInput,     setInviteCcInput]     = useState('')
  const [completionCc,      setCompletionCc]      = useState([])   // recipients of the final signed PDF
  const [completionCcInput, setCompletionCcInput] = useState('')

  /* ── signatories ──────────────────────────────────────────────────────── */
  // In Setup these hold {name,email}; after create / in edit mode they also carry the
  // server-assigned {id} used to tag each placed field.
  const [signatories,       setSignatories]       = useState([{ name: '', email: '' }])
  const [signingMode,       setSigningMode]       = useState('PARALLEL')   // PARALLEL | SEQUENTIAL
  const [activeSignatoryIdx, setActiveSignatoryIdx] = useState(0)         // whose field is being placed

  /* ── PDF source selection ─────────────────────────────────────────────── */
  const [enabledSources, setEnabledSources] = useState({ single: true, template: false, api: false })
  const [sourcePriority, setSourcePriority] = useState(['single', 'template', 'api'])

  // Upload PDF
  const [pdfBase64,   setPdfBase64]   = useState(null)
  const [pdfFileName, setPdfFileName] = useState('')
  const fileRef = useRef()

  // PDF Template
  const [templates,          setTemplates]          = useState([])
  const [templatesLoading,   setTemplatesLoading]   = useState(false)
  const [templateSearch,     setTemplateSearch]     = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedTemplate,   setSelectedTemplate]   = useState(null)

  // External API
  const [fileApi, setFileApi] = useState({
    url: '', authType: 'none', authValue: '',
    authKey: 'X-API-Key', basicUser: '', basicPass: '',
  })
  const [fileApiLoading, setFileApiLoading] = useState(false)
  const [fileApiTested,  setFileApiTested]  = useState(false)
  const [fileApiError,   setFileApiError]   = useState('')
  const [fileApiTestInfo,setFileApiTestInfo]= useState(null)

  /* ── step 1 — field placement ─────────────────────────────────────────── */
  const [pdfBase64ForPreview, setPdfBase64ForPreview] = useState(null)  // fed to PdfPageCanvas
  const [pdfLoading,     setPdfLoading]     = useState(false)           // fetching the existing PDF (edit mode)
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1)
  const [pdfPageCount,   setPdfPageCount]   = useState(1)
  const [fields,       setFields]       = useState([])
  const [selectedType, setSelectedType] = useState('SIGNATURE')
  const [dragging,     setDragging]     = useState(null)
  const [resizing,     setResizing]     = useState(null)
  const overlayRef = useRef(null)

  /* ── email template (optional) ───────────────────────────────────────── */
  const [emailTemplates,        setEmailTemplates]        = useState([])
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false)
  const [emailTemplateSearch,   setEmailTemplateSearch]   = useState('')
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('')
  const [selectedEmailTemplate,   setSelectedEmailTemplate]   = useState(null)
  const [emailPickerOpen,       setEmailPickerOpen]       = useState(false)

  /* ── step 2 — send ────────────────────────────────────────────────────── */
  const [doc,     setDoc]     = useState(null)
  const [sending, setSending] = useState(false)
  const [saving,  setSaving]  = useState(false)

  /* ── derived ──────────────────────────────────────────────────────────── */
  const activeSources = sourcePriority.filter(s => enabledSources[s])
  const multiSig      = signatories.length > 1

  /** Index of a field's owning signatory (defaults to the first signatory). */
  function fieldSignatoryIdx(f) {
    if (!f.signatoryId) return 0
    const i = signatories.findIndex(s => s.id === f.signatoryId)
    return i >= 0 ? i : 0
  }
  /** A field's display colour — by signatory when multi-party, else by field type. */
  function fieldColor(f) {
    return multiSig
      ? signatoryColor(fieldSignatoryIdx(f))
      : (FIELD_TYPES.find(t => t.type === f.fieldType)?.color || '#7c3aed')
  }

  /* ── signatory editing ────────────────────────────────────────────────── */
  function updateSignatory(idx, patch) {
    setSignatories(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
    setFormErrors(fe => ({ ...fe, signatories: undefined }))
  }
  function addSignatory() {
    setSignatories(prev => [...prev, { name: '', email: '' }])
  }
  function removeSignatory(idx) {
    setSignatories(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  }
  function moveSignatory(idx, dir) {
    setSignatories(prev => {
      const ni = idx + dir
      if (ni < 0 || ni >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[ni]] = [arr[ni], arr[idx]]
      return arr
    })
  }

  /* ════════════════════════════════════════════════════════════════════════
     Effects
  ════════════════════════════════════════════════════════════════════════ */

  // Load existing document (edit mode)
  useEffect(() => {
    if (!isEdit) return
    setPdfLoading(true)   // show a loading state until the existing PDF is fetched
    esignGetDocument(id).then(d => {
      setDoc(d)
      setFields(d.fields || [])
      setForm(f => ({ ...f, title: d.title, clientEmail: d.clientEmail, clientName: d.clientName }))
      setSignatories(d.signatories?.length
        ? d.signatories.map(s => ({ id: s.id, name: s.name, email: s.email }))
        : [{ name: d.clientName || '', email: d.clientEmail || '' }])
      setSigningMode(d.signingMode || 'PARALLEL')
      setInviteCc(d.ccEmails || [])
      setCompletionCc(d.completionCcEmails || [])
      setPdfCurrentPage(1)
      // Render the existing PDF in the editor. Legacy docs embed base64; cloud docs are
      // fetched via the same-origin source-pdf endpoint (no bucket CORS needed) as a blob.
      if (d.sourcePdfBase64) {
        setPdfBase64ForPreview(d.sourcePdfBase64)
        setPdfLoading(false)
      } else {
        esignDownloadSource(id)
          .then(blob => setPdfBase64ForPreview(URL.createObjectURL(blob)))
          .catch(() => showToast('Could not load the document PDF', 'error'))
          .finally(() => setPdfLoading(false))
      }
    }).catch(e => { showToast(e.message, 'error'); setPdfLoading(false) })
  }, [id])

  // Lazy-load PDF templates when template source is enabled
  useEffect(() => {
    if (!enabledSources.template || templates.length > 0) return
    setTemplatesLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch(() => showToast('Failed to load PDF templates', 'error'))
      .finally(() => setTemplatesLoading(false))
  }, [enabledSources.template])

  // Lazy-load email templates when the email picker is first opened
  useEffect(() => {
    if (!emailPickerOpen || emailTemplates.length > 0) return
    setEmailTemplatesLoading(true)
    getEmailTemplates()
      .then(setEmailTemplates)
      .catch(() => showToast('Failed to load email templates', 'error'))
      .finally(() => setEmailTemplatesLoading(false))
  }, [emailPickerOpen])

  /* ════════════════════════════════════════════════════════════════════════
     PDF source helpers
  ════════════════════════════════════════════════════════════════════════ */

  function toggleSource(src) {
    setEnabledSources(s => ({ ...s, [src]: !s[src] }))
  }

  function movePriorityInActive(src, dir) {
    const active = sourcePriority.filter(s => enabledSources[s])
    const ai     = active.indexOf(src)
    const ni     = ai + dir
    if (ni < 0 || ni >= active.length) return
    const swapWith = active[ni]
    setSourcePriority(prev => {
      const arr = [...prev]
      const iA  = arr.indexOf(src)
      const iB  = arr.indexOf(swapWith)
      ;[arr[iA], arr[iB]] = [arr[iB], arr[iA]]
      return arr
    })
  }

  function onPdfFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFileName(file.name)
    setFormErrors(fe => ({ ...fe, pdf: undefined }))
    const reader = new FileReader()
    reader.onload = ev => setPdfBase64(ev.target.result)
    reader.readAsDataURL(file)
  }

  function onTemplateSelect(tpl) {
    setSelectedTemplateId(tpl.id)
    setSelectedTemplate(tpl)
    setFormErrors(fe => ({ ...fe, pdf: undefined }))
  }

  async function onTestApi() {
    if (!fileApi.url) return
    setFileApiLoading(true)
    setFileApiError('')
    setFileApiTested(false)
    setFileApiTestInfo(null)
    try {
      const res = await fetch(fileApi.url, { headers: buildAuthHeaders(fileApi) })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const ct = res.headers.get('content-type') || ''
      const cl = res.headers.get('content-length')
      if (!ct.includes('pdf') && !ct.includes('octet-stream') && !ct.includes('binary'))
        throw new Error(`Expected a PDF but got content-type: "${ct || 'unknown'}"`)
      setFileApiTestInfo({ contentType: ct, size: cl ? `${Math.round(parseInt(cl) / 1024)} KB` : null })
      setFileApiTested(true)
    } catch (err) {
      setFileApiError(err.message)
    } finally {
      setFileApiLoading(false)
    }
  }

  /** Try each active source in priority order, return first that succeeds. */
  async function resolvePdfSource() {
    let lastErr = null
    for (const src of activeSources) {
      try {
        if (src === 'single') {
          if (!pdfBase64) throw new Error('No PDF uploaded')
          return { sourceType: 'UPLOAD', pdfBase64, previewBase64: pdfBase64 }
        } else if (src === 'template') {
          if (!selectedTemplateId) throw new Error('No template selected')
          const previewB64 = await generatePdfAsBase64(selectedTemplateId, {})
          return { sourceType: 'TEMPLATE', templateId: selectedTemplateId, previewBase64: previewB64 }
        } else {
          if (!fileApi.url) throw new Error('No API URL configured')
          const b64 = await fetchFileAsBase64(fileApi.url, buildAuthHeaders(fileApi))
          return { sourceType: 'UPLOAD', pdfBase64: b64, previewBase64: b64 }
        }
      } catch (e) {
        lastErr = e
      }
    }
    throw lastErr || new Error('No PDF source available')
  }

  /* ════════════════════════════════════════════════════════════════════════
     Step 0 — create document
  ════════════════════════════════════════════════════════════════════════ */

  /** Adds the typed email to a chip list (deduped, case-insensitive). Returns false if invalid. */
  function addEmailChip(raw, setList, errKey) {
    const val = (raw || '').trim().replace(/,+$/, '').trim()
    if (!val) return true
    if (!EMAIL_RE.test(val)) {
      setFormErrors(fe => ({ ...fe, [errKey]: 'Enter a valid email address' }))
      return false
    }
    setList(prev => prev.some(x => x.toLowerCase() === val.toLowerCase()) ? prev : [...prev, val])
    setFormErrors(fe => ({ ...fe, [errKey]: undefined }))
    return true
  }

  /** Returns the final chip list including any unsubmitted text; null if that text is invalid. */
  function flushEmailChips(raw, list, errKey) {
    const val = (raw || '').trim().replace(/,+$/, '').trim()
    if (!val) return list
    if (!EMAIL_RE.test(val)) {
      setFormErrors(fe => ({ ...fe, [errKey]: 'Enter a valid email address' }))
      return null
    }
    return list.some(x => x.toLowerCase() === val.toLowerCase()) ? list : [...list, val]
  }

  const commitInviteCc = e => {
    if (e) e.preventDefault()
    if (addEmailChip(inviteCcInput, setInviteCc, 'inviteCc')) setInviteCcInput('')
  }
  const commitCompletionCc = e => {
    if (e) e.preventDefault()
    if (addEmailChip(completionCcInput, setCompletionCc, 'completionCc')) setCompletionCcInput('')
  }

  function validateForm() {
    const errors = {}
    if (!form.title?.trim())    errors.title       = 'Document title is required'

    // Every signatory needs a name + valid email, and emails must be unique
    if (!signatories.length ||
        signatories.some(s => !s.name?.trim() || !s.email?.trim() || !EMAIL_RE.test(s.email.trim()))) {
      errors.signatories = 'Each signatory needs a name and a valid email'
    } else {
      const emails = signatories.map(s => s.email.trim().toLowerCase())
      if (new Set(emails).size !== emails.length)
        errors.signatories = 'Each signatory must have a unique email'
    }

    // At least one source must be enabled and minimally configured
    if (!activeSources.length) {
      errors.pdf = 'Enable at least one PDF source'
    } else {
      const ready = { single: !!pdfBase64, template: !!selectedTemplateId, api: !!fileApi.url }
      if (!activeSources.some(s => ready[s]))
        errors.pdf = 'Configure at least one enabled PDF source'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreate() {
    // Returning to Setup after the document already exists: just advance — the document's
    // title / PDF / signatories are fixed once created (no update endpoint), so don't re-create.
    if (docId) { setStep(1); return }

    if (!validateForm()) return

    // Flush any address still typed in either cc box into its committed list.
    const finalInviteCc = flushEmailChips(inviteCcInput, inviteCc, 'inviteCc')
    if (finalInviteCc === null) return
    const finalCc = flushEmailChips(completionCcInput, completionCc, 'completionCc')
    if (finalCc === null) return
    setInviteCc(finalInviteCc); setInviteCcInput('')
    setCompletionCc(finalCc);   setCompletionCcInput('')

    setCreating(true)
    try {
      const resolved = await resolvePdfSource()
      const created  = await esignCreateDocument({
        title:           form.title,
        sourceType:      resolved.sourceType,
        pdfBase64:       resolved.pdfBase64,
        templateId:      resolved.templateId,
        signatories:     signatories.map((s, i) => ({
                            name: s.name.trim(), email: s.email.trim(), signingOrder: i + 1,
                         })),
        signingMode,
        tokenValidDays:  form.tokenValidDays,
        emailTemplateId: selectedEmailTemplateId || undefined,
        ccEmails:           finalInviteCc.length ? finalInviteCc : undefined,
        completionCcEmails: finalCc.length ? finalCc : undefined,
      })
      setDocId(created.id)
      setDoc(created)
      // Adopt the server-assigned signatory IDs so placed fields can reference them
      if (created.signatories?.length) setSignatories(created.signatories)
      setActiveSignatoryIdx(0)
      setPdfBase64ForPreview(resolved.previewBase64 || null)
      setPdfCurrentPage(1)
      window.history.replaceState(null, '', `/esign/${created.id}`)
      setStep(1)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     Step 1 — field placement
  ════════════════════════════════════════════════════════════════════════ */

  function getOverlayRect() {
    return overlayRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 1, height: 1 }
  }
  function toPercent(px, total) { return (px / total) * 100 }

  function addField(e) {
    if (dragging || resizing) return
    const rect = getOverlayRect()
    const x    = toPercent(e.clientX - rect.left, rect.width)
    const y    = toPercent(e.clientY - rect.top,  rect.height)
    const typeDef = FIELD_TYPES.find(t => t.type === selectedType)
    setFields(prev => [...prev, {
      id: crypto.randomUUID(), page: pdfCurrentPage,
      x:  Math.min(Math.max(x - DEFAULT_FIELD_SIZE.width  / 2, 0), 100 - DEFAULT_FIELD_SIZE.width),
      y:  Math.min(Math.max(y - DEFAULT_FIELD_SIZE.height / 2, 0), 100 - DEFAULT_FIELD_SIZE.height),
      width:  DEFAULT_FIELD_SIZE.width,
      height: DEFAULT_FIELD_SIZE.height,
      fieldType: selectedType,
      label: typeDef?.label || selectedType,
      required: true,
      signatoryId: signatories[activeSignatoryIdx]?.id,
    }])
  }

  function removeField(id) { setFields(prev => prev.filter(f => f.id !== id)) }

  function onDragStart(e, fid) {
    e.stopPropagation()
    const rect  = getOverlayRect()
    const field = fields.find(f => f.id === fid)
    setDragging({
      id: fid,
      offsetX: e.clientX - rect.left - (field.x / 100) * rect.width,
      offsetY: e.clientY - rect.top  - (field.y / 100) * rect.height,
    })
  }

  const onMouseMove = useCallback(e => {
    const rect = getOverlayRect()
    if (dragging) {
      const newX = toPercent(e.clientX - rect.left - dragging.offsetX, rect.width)
      const newY = toPercent(e.clientY - rect.top  - dragging.offsetY, rect.height)
      setFields(prev => prev.map(f => f.id === dragging.id
        ? { ...f,
            x: Math.min(Math.max(newX, 0), 100 - f.width),
            y: Math.min(Math.max(newY, 0), 100 - f.height) }
        : f))
    }
    if (resizing) {
      const dxPct = toPercent(e.clientX - resizing.startX, rect.width)
      const dyPct = toPercent(e.clientY - resizing.startY, rect.height)
      setFields(prev => prev.map(f => f.id === resizing.id
        ? { ...f, width: Math.max(resizing.startW + dxPct, 5), height: Math.max(resizing.startH + dyPct, 2) }
        : f))
    }
  }, [dragging, resizing])

  const onMouseUp = useCallback(() => { setDragging(null); setResizing(null) }, [])

  function onResizeStart(e, fid) {
    e.stopPropagation()
    const field = fields.find(f => f.id === fid)
    setResizing({ id: fid, startX: e.clientX, startY: e.clientY, startW: field.width, startH: field.height })
  }

  async function handleSaveFields() {
    if (!docId) { showToast('Document not ready — complete Step 1 first', 'error'); return }
    setSaving(true)
    try {
      const payload = fields.map(f => ({
        page: f.page, x: f.x, y: f.y,
        width: f.width, height: f.height,
        fieldType: f.fieldType, label: f.label,
        required: f.required ?? true,
        signatoryId: f.signatoryId,
      }))
      await esignSaveFields(docId, payload)
      const alreadySent = ['PENDING', 'IN_REVIEW'].includes(initialDocStatus)
                       || ['PENDING', 'IN_REVIEW'].includes(doc?.status)
      if (alreadySent) {
        showToast('Fields updated successfully', 'success')
        navigate('/esign')
        return
      }
      setStep(2)
      showToast('Fields saved — ready to send', 'success')
    } catch (e) {
      showToast(e.message || 'Failed to save fields', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     Step 2 — send
  ════════════════════════════════════════════════════════════════════════ */

  async function handleSend() {
    setSending(true)
    try {
      await esignSendDocument(docId, form.tokenValidDays)
      navigate('/esign')
      const recipientNote = signatories.length > 1
        ? `${signatories.length} signatories`
        : (signatories[0]?.email || doc?.clientEmail)
      showToast('Document sent to ' + recipientNote + '!', 'success')
    } catch (e) {
      showToast(e.message || 'Failed to send document', 'error')
    } finally {
      setSending(false)
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     Render — Step 0 PDF source section
  ════════════════════════════════════════════════════════════════════════ */

  function renderPdfSourceSection() {
    return (
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          PDF Source
          {formErrors.pdf && (
            <span className="ml-2 text-red-500 normal-case font-normal tracking-normal">
              — {formErrors.pdf}
            </span>
          )}
        </label>

        {/* Toggle cards */}
        {(['single', 'template', 'api']).map(src => {
          const meta    = SOURCE_META[src]
          const enabled = enabledSources[src]
          return (
            <div key={src}
                 className={`rounded-xl border-2 transition-colors
                   ${enabled
                     ? 'border-accent-500 bg-accent-50/40 dark:bg-accent-700/10'
                     : 'border-gray-200 dark:border-gray-700'}`}>

              {/* Header / toggle */}
              <button type="button" onClick={() => toggleSource(src)}
                className="w-full flex items-center gap-3 p-3 text-left">
                <div className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={meta.path}/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{meta.desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full shrink-0 relative transition-colors
                                 ${enabled ? 'bg-accent-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                                   ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>

              {/* Config — only when enabled */}
              {enabled && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-200/70 dark:border-gray-700/60 space-y-3">

                  {/* ── Upload PDF ── */}
                  {src === 'single' && (
                    <>
                      <label className={`mt-3 flex items-center gap-3 border-2 border-dashed rounded-xl p-3
                                         cursor-pointer hover:border-accent-400 transition-colors
                                         ${formErrors.pdf ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}>
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <span className={`text-sm ${pdfFileName ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {pdfFileName || 'Click to upload PDF…'}
                        </span>
                        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfFile}/>
                      </label>
                      {pdfFileName && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                          {pdfFileName} ready
                        </p>
                      )}
                    </>
                  )}

                  {/* ── PDF Template ── */}
                  {src === 'template' && (
                    <div className="space-y-3 mt-3">
                      {templatesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mr-2"/>
                          <span className="text-sm text-gray-500">Loading templates…</span>
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <p className="text-sm">No PDF templates found.</p>
                          <a href="/templates" className="text-xs text-accent-600 hover:underline mt-1 inline-flex items-center gap-1.5">
                            Create a template first <IconArrowRight className="w-3.5 h-3.5" />
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
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2
                                         focus:ring-accent-500 text-gray-900 dark:text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                            {templates
                              .filter(t => !templateSearch || t.name?.toLowerCase().includes(templateSearch.toLowerCase()))
                              .map(tpl => (
                                <button key={tpl.id} type="button" onClick={() => onTemplateSelect(tpl)}
                                  className={`p-2.5 rounded-lg border-2 text-left transition-colors
                                    ${selectedTemplateId === tpl.id
                                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-700/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tpl.name}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {tpl.pageSize || 'A4'}
                                        {tpl.placeholders?.length ? ` · ${tpl.placeholders.length} placeholders` : ''}
                                      </p>
                                    </div>
                                    {selectedTemplateId === tpl.id && (
                                      <svg className="w-3.5 h-3.5 text-accent-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              ))}
                          </div>
                          {selectedTemplate && (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                              Template "{selectedTemplate.name}" selected
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── External API ── */}
                  {src === 'api' && (
                    <div className="space-y-3 mt-3">
                      <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20
                                      px-3 py-2 rounded-lg">
                        Enter a URL that returns the PDF file. Authentication options are below.
                      </div>
                      <div>
                        <label className={labelCls}>API URL</label>
                        <input type="url" value={fileApi.url}
                          placeholder="https://api.example.com/document.pdf"
                          onChange={e => { setFileApi(a => ({ ...a, url: e.target.value })); setFileApiTested(false) }}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Authentication</label>
                        <select value={fileApi.authType}
                          onChange={e => { setFileApi(a => ({ ...a, authType: e.target.value })); setFileApiTested(false) }}
                          className={inputCls}>
                          <option value="none">No Authentication</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="apikey">API Key Header</option>
                          <option value="basic">Basic Auth</option>
                        </select>
                      </div>
                      {fileApi.authType === 'bearer' && (
                        <div>
                          <label className={labelCls}>Bearer Token</label>
                          <input type="password" value={fileApi.authValue} placeholder="your-token"
                            onChange={e => { setFileApi(a => ({ ...a, authValue: e.target.value })); setFileApiTested(false) }}
                            className={inputCls} />
                        </div>
                      )}
                      {fileApi.authType === 'apikey' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls}>Header Name</label>
                            <input type="text" value={fileApi.authKey} placeholder="X-API-Key"
                              onChange={e => { setFileApi(a => ({ ...a, authKey: e.target.value })); setFileApiTested(false) }}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>API Key</label>
                            <input type="password" value={fileApi.authValue}
                              onChange={e => { setFileApi(a => ({ ...a, authValue: e.target.value })); setFileApiTested(false) }}
                              className={inputCls} />
                          </div>
                        </div>
                      )}
                      {fileApi.authType === 'basic' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls}>Username</label>
                            <input type="text" value={fileApi.basicUser}
                              onChange={e => { setFileApi(a => ({ ...a, basicUser: e.target.value })); setFileApiTested(false) }}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Password</label>
                            <input type="password" value={fileApi.basicPass}
                              onChange={e => { setFileApi(a => ({ ...a, basicPass: e.target.value })); setFileApiTested(false) }}
                              className={inputCls} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={onTestApi}
                          disabled={!fileApi.url || fileApiLoading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 text-white rounded-lg
                                     hover:bg-accent-700 disabled:opacity-50 text-xs font-medium transition-colors">
                          {fileApiLoading
                            ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Testing…</>
                            : <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                Test Connection
                              </>
                          }
                        </button>
                      </div>
                      {fileApiError && (
                        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                          {fileApiError}
                        </p>
                      )}
                      {fileApiTested && fileApiTestInfo && (
                        <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400
                                        bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                          PDF received{fileApiTestInfo.size && ` (${fileApiTestInfo.size})`}
                          {' — '}{fileApiTestInfo.contentType}
                        </div>
                      )}
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20
                                    px-3 py-2 rounded-lg">
                        The external server must allow CORS requests from this app's domain.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Fallback priority (2+ sources enabled) */}
        {activeSources.length > 1 && (
          <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
            <p className="text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
              Fallback Priority
            </p>
            <p className="text-xs text-brand-600 dark:text-brand-400 mb-2">
              Source #1 is tried first. If it fails the next is tried automatically.
            </p>
            <div className="space-y-1.5">
              {activeSources.map((src, idx) => (
                <div key={src}
                     className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2
                                border border-brand-100 dark:border-brand-800/40">
                  <span className="w-5 h-5 bg-brand-600 text-white rounded-full text-xs font-bold
                                   flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 flex-1">
                    <svg className="w-3.5 h-3.5 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={SOURCE_META[src].path}/>
                    </svg>
                    {SOURCE_META[src].title}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => movePriorityInActive(src, -1)}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-brand-100 dark:hover:bg-brand-900/40
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-3 h-3 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    <button type="button" onClick={() => movePriorityInActive(src, 1)}
                      disabled={idx === activeSources.length - 1}
                      className="p-0.5 rounded hover:bg-brand-100 dark:hover:bg-brand-900/40
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-3 h-3 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════════
     Main render
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', to: '/' },
          { label: 'E-Sign Documents', to: '/esign' },
          { label: isEdit ? 'Edit Document' : 'New Document' },
        ]} />
        <button onClick={() => navigate('/esign')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mt-4 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Documents
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <button
                type="button"
                disabled={i >= step}
                onClick={() => { if (i < step) setStep(i) }}
                title={i < step ? `Back to ${s}` : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
                              transition-colors duration-200
                              ${i === step
                                ? 'bg-accent-600 text-white'
                                : i < step
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 cursor-pointer hover:brightness-95'
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-default'}`}>
                <span>{i < step ? <IconCheck className="w-4 h-4" /> : i + 1}</span>
                <span>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── STEP 0: Setup ─── */}
      {step === 0 && (
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8
                        border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Document Setup</h2>

          {docId && (
            <div className="flex items-start gap-2 mb-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200
                            dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>
                This document has already been created — its PDF, title and signatories are now fixed.
                Continue to adjust field placements, or cancel from the documents list to start over.
              </span>
            </div>
          )}

          <div className="space-y-5">
            {/* Document title */}
            <FormField label="Document Title" error={formErrors.title}>
              <input
                className={inputCls + (formErrors.title ? ' border-red-400 focus:ring-red-400' : '')}
                placeholder="e.g. Service Agreement 2025"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(fe => ({ ...fe, title: undefined })) }}
              />
            </FormField>

            {/* Multi-source PDF picker — locked once the document exists (PDF can't be changed) */}
            {docId ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  PDF Source
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700
                                bg-gray-50 dark:bg-gray-700/40 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  PDF already attached — to use a different file, cancel this document and create a new one.
                </div>
              </div>
            ) : renderPdfSourceSection()}

            {/* ── Email Template (optional) ── */}
            <div className={`rounded-xl border-2 transition-colors
              ${emailPickerOpen
                ? 'border-accent-500 bg-accent-50/40 dark:bg-accent-700/10'
                : 'border-gray-200 dark:border-gray-700'}`}>

              {/* Toggle header */}
              <button type="button" onClick={() => setEmailPickerOpen(o => !o)}
                className="w-full flex items-center gap-3 p-3 text-left">
                <div className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Email Template
                    <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedEmailTemplate
                      ? `Using: ${selectedEmailTemplate.name}`
                      : 'Use a custom email template for the signing invitation'}
                  </p>
                </div>
                <div className={`w-10 h-5 rounded-full shrink-0 relative transition-colors
                                 ${emailPickerOpen ? 'bg-accent-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                                   ${emailPickerOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>

              {/* Picker body */}
              {emailPickerOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-200/70 dark:border-gray-700/60 space-y-3">
                  {emailTemplatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mr-2"/>
                      <span className="text-sm text-gray-500">Loading email templates…</span>
                    </div>
                  ) : emailTemplates.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">No email templates found.</p>
                      <a href="/email-templates" className="text-xs text-accent-600 hover:underline mt-1 inline-flex items-center gap-1.5">
                        Create an email template first <IconArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="relative mt-3">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                        </svg>
                        <input type="text" value={emailTemplateSearch}
                          onChange={e => setEmailTemplateSearch(e.target.value)}
                          placeholder="Search email templates…"
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2
                                     focus:ring-accent-500 text-gray-900 dark:text-white" />
                      </div>

                      {/* None option */}
                      <button type="button"
                        onClick={() => { setSelectedEmailTemplateId(''); setSelectedEmailTemplate(null) }}
                        className={`w-full p-2.5 rounded-lg border-2 text-left transition-colors
                          ${!selectedEmailTemplateId
                            ? 'border-accent-500 bg-accent-50 dark:bg-accent-700/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          Default invitation email
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Use the built-in invitation template</p>
                      </button>

                      <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {emailTemplates
                          .filter(t => !emailTemplateSearch || t.name?.toLowerCase().includes(emailTemplateSearch.toLowerCase()))
                          .map(tpl => (
                            <button key={tpl.id} type="button"
                              onClick={() => { setSelectedEmailTemplateId(tpl.id); setSelectedEmailTemplate(tpl) }}
                              className={`p-2.5 rounded-lg border-2 text-left transition-colors
                                ${selectedEmailTemplateId === tpl.id
                                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-700/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tpl.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {tpl.subject ? `Subject: ${tpl.subject}` : 'No subject set'}
                                  </p>
                                </div>
                                {selectedEmailTemplateId === tpl.id && (
                                  <svg className="w-3.5 h-3.5 text-accent-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                      </div>

                      {selectedEmailTemplate && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                          Template "{selectedEmailTemplate.name}" will be used for the invitation
                        </p>
                      )}

                      <p className="text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20
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

            {/* Signatories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Signatories
                  {formErrors.signatories && (
                    <span className="ml-2 text-red-500 normal-case font-normal tracking-normal">
                      — {formErrors.signatories}
                    </span>
                  )}
                </label>
                <button type="button" onClick={addSignatory}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add signatory
                </button>
              </div>

              <div className="space-y-2">
                {signatories.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: signatoryColor(i) }}
                      title={`Signatory ${i + 1}`} />
                    {signingMode === 'SEQUENTIAL' && (
                      <span className="w-5 text-center text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                    )}
                    <input
                      className={inputCls + ' flex-1'}
                      placeholder="Name"
                      value={s.name || ''}
                      onChange={e => updateSignatory(i, { name: e.target.value })}
                    />
                    <input
                      className={inputCls + ' flex-1'}
                      type="email"
                      placeholder="email@company.com"
                      value={s.email || ''}
                      onChange={e => updateSignatory(i, { email: e.target.value })}
                    />
                    {signingMode === 'SEQUENTIAL' && signatories.length > 1 && (
                      <div className="flex flex-col shrink-0">
                        <button type="button" onClick={() => moveSignatory(i, -1)} disabled={i === 0}
                          className="p-0.5 text-gray-400 hover:text-accent-600 disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/></svg>
                        </button>
                        <button type="button" onClick={() => moveSignatory(i, 1)} disabled={i === signatories.length - 1}
                          className="p-0.5 text-gray-400 hover:text-accent-600 disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                        </button>
                      </div>
                    )}
                    <button type="button" onClick={() => removeSignatory(i)}
                      disabled={signatories.length <= 1}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                      title="Remove signatory">
                      <IconX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Signing order (only relevant with 2+ signatories) */}
              {signatories.length > 1 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 shrink-0">Signing order:</span>
                    {[
                      { key: 'PARALLEL',   label: 'Any order' },
                      { key: 'SEQUENTIAL', label: 'In order' },
                    ].map(opt => (
                      <button key={opt.key} type="button" onClick={() => setSigningMode(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0
                          ${signingMode === opt.key
                            ? 'border-accent-500 bg-accent-50 dark:bg-accent-700/30 text-accent-700 dark:text-accent-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {signingMode === 'SEQUENTIAL'
                      ? 'Each person is invited after the previous one signs.'
                      : 'Everyone is invited at once.'}
                  </p>
                </div>
              )}
            </div>

            {/* CC on the signing invitation (optional) */}
            <EmailChipsField
              label="CC on the invitation email"
              helper="These people are copied on the signing invitation (and any resend), so they're kept in the loop. Press Enter or comma to add."
              emails={inviteCc}
              input={inviteCcInput}
              onInput={v => { setInviteCcInput(v); setFormErrors(fe => ({ ...fe, inviteCc: undefined })) }}
              onCommit={commitInviteCc}
              onRemove={email => setInviteCc(prev => prev.filter(x => x !== email))}
              error={formErrors.inviteCc}
            />

            {/* Send a copy of the signed document to (optional) */}
            <EmailChipsField
              label="Send a copy of the signed document to"
              helper="These people receive the final signed PDF by email once signing is complete. Press Enter or comma to add."
              emails={completionCc}
              input={completionCcInput}
              onInput={v => { setCompletionCcInput(v); setFormErrors(fe => ({ ...fe, completionCc: undefined })) }}
              onCommit={commitCompletionCc}
              onRemove={email => setCompletionCc(prev => prev.filter(x => x !== email))}
              error={formErrors.completionCc}
            />

            <FormField label={`Link valid for (days): ${form.tokenValidDays}`}>
              <input type="range" min={1} max={30} value={form.tokenValidDays}
                onChange={e => setForm(f => ({ ...f, tokenValidDays: +e.target.value }))}
                className="w-full accent-accent-600"/>
            </FormField>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn btn-accent w-full mt-6"
          >
            {creating ? 'Creating…' : 'Continue → Place Fields'}
          </button>
        </div>
      )}

      {/* ─── STEP 1: Place Fields ─── */}
      {step === 1 && (
        <div className="max-w-7xl mx-auto flex gap-5 flex-col">
          {isEdit && (initialDocStatus || doc?.status) && (initialDocStatus || doc?.status) !== 'DRAFT' && (
            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200
                            dark:border-yellow-700 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <span>
                This document is <strong>{(initialDocStatus || doc?.status)?.replace('_', ' ')}</strong>.
                You can update field placements — the client's signing link will still work.
                Use <strong>Resend</strong> on the list page to issue a fresh link if needed.
              </span>
            </div>
          )}
          <div className="flex gap-5">
            {/* Toolbox */}
            <div className="w-56 shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200
                              dark:border-gray-700 p-4 shadow-sm sticky top-6">
                {/* Signatory selector — choose whose field you're placing */}
                {multiSig && (
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Placing fields for</h3>
                    <p className="text-xs text-gray-400 mb-2">Fields you place are assigned to this signatory.</p>
                    <div className="space-y-1.5">
                      {signatories.map((s, i) => (
                        <button key={s.id || i} onClick={() => setActiveSignatoryIdx(i)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left border-2 transition-all
                            ${activeSignatoryIdx === i
                              ? 'border-accent-500 bg-accent-50 dark:bg-accent-700/30'
                              : 'border-transparent bg-gray-50 dark:bg-gray-700'}`}>
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: signatoryColor(i) }}/>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {signingMode === 'SEQUENTIAL' ? `${i + 1}. ` : ''}{s.name || `Signatory ${i + 1}`}
                            </span>
                            <span className="block text-[10px] text-gray-400 truncate">{s.email}</span>
                          </span>
                          {activeSignatoryIdx === i && (
                            <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Field Types</h3>
                <p className="text-xs text-gray-400 mb-3">Select a type, then click on the PDF to place</p>
                <div className="space-y-2">
                  {FIELD_TYPES.map(t => (
                    <button key={t.type} onClick={() => setSelectedType(t.type)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                                  border-2 transition-all
                                  ${selectedType === t.type
                                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-700/30 text-accent-700 dark:text-accent-300'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: t.color }}/>
                      {t.label}
                      {selectedType === t.type && (
                        <span className="ml-auto text-accent-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Placed: {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </p>
                  {fields.map(f => {
                    const owner = multiSig ? signatories[fieldSignatoryIdx(f)] : null
                    return (
                      <div key={f.id} className="flex items-center justify-between py-1">
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 min-w-0">
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: fieldColor(f) }}/>
                          <span className="truncate">
                            {f.label}{owner ? ` · ${owner.name || owner.email}` : ''}
                          </span>
                        </span>
                        <button onClick={() => removeField(f.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={handleSaveFields}
                  disabled={saving || !docId || fields.length === 0}
                  className="btn btn-accent btn-sm w-full mt-4"
                  title={!docId ? 'Complete Step 1 first' : fields.length === 0 ? 'Place at least one field' : ''}
                >
                  {saving ? 'Saving…' : (
                    <span className="inline-flex items-center gap-1.5">
                      Save & Continue <IconArrowRight className="w-4 h-4" /> ({fields.length} field{fields.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setStep(0)}
                  className="w-full mt-2 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700
                             dark:text-gray-400 dark:hover:text-gray-200 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <IconArrowLeft className="w-4 h-4" /> Back to Setup
                </button>
              </div>
            </div>

            {/* PDF canvas */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200
                            dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click on the PDF to place a <strong className="text-gray-700 dark:text-gray-200">{selectedType}</strong> field.
                  Drag to move. Resize using the handle.
                </span>
              </div>

              {pdfBase64ForPreview ? (
                <div className="p-4 max-h-[calc(100vh-9rem)] overflow-y-auto">
                  {/* Page navigation — shown only for multi-page PDFs */}
                  {pdfPageCount > 1 && (
                    <div className="flex items-center justify-center gap-3 mb-3 sticky top-0 z-10">
                      <button type="button"
                        onClick={() => setPdfCurrentPage(p => Math.max(1, p - 1))}
                        disabled={pdfCurrentPage <= 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800
                                   hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <IconArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                        Page {pdfCurrentPage} of {pdfPageCount}
                      </span>
                      <button type="button"
                        onClick={() => setPdfCurrentPage(p => Math.min(pdfPageCount, p + 1))}
                        disabled={pdfCurrentPage >= pdfPageCount}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800
                                   hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <IconArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* PDF page (canvas) + click-to-place field overlay */}
                  <div ref={overlayRef}
                       className="relative w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
                    <PdfPageCanvas
                      source={pdfBase64ForPreview}
                      pageNumber={pdfCurrentPage}
                      onPageCountChange={setPdfPageCount}
                    />
                    <div className="absolute inset-0"
                         style={{ cursor: 'crosshair' }}
                         onClick={addField}
                         onMouseMove={onMouseMove}
                         onMouseUp={onMouseUp}
                         onMouseLeave={onMouseUp}>
                      {fields.filter(f => (f.page || 1) === pdfCurrentPage).map(f => {
                        const color = fieldColor(f)
                        return (
                          <div key={f.id}
                            style={{
                              position: 'absolute',
                              left: `${f.x}%`, top: `${f.y}%`,
                              width: `${f.width}%`, height: `${f.height}%`,
                              background: color + '22',
                              border: `2px dashed ${color}`,
                              borderRadius: 4, cursor: 'grab', boxSizing: 'border-box',
                            }}
                            onMouseDown={e => onDragStart(e, f.id)}
                            onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: 10, fontWeight: 700, color,
                                           padding: '1px 4px', userSelect: 'none', display: 'block',
                                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {f.label}
                            </span>
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => { e.stopPropagation(); removeField(f.id) }}
                              style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18,
                                       borderRadius: '50%', background: color, color: '#fff',
                                       border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: '18px',
                                       textAlign: 'center', display: 'flex', alignItems: 'center',
                                       justifyContent: 'center' }}><IconX className="w-3 h-3" /></button>
                            <div
                              style={{ position: 'absolute', bottom: -4, right: -4, width: 12, height: 12,
                                       background: color, borderRadius: 2, cursor: 'se-resize' }}
                              onMouseDown={e => { e.stopPropagation(); onResizeStart(e, f.id) }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {pdfPageCount > 1 && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Fields apply to the page shown. Switch pages to place fields on other pages.
                    </p>
                  )}
                </div>
              ) : pdfLoading ? (
                <div className="flex items-center justify-center h-80 text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                    <p>Loading PDF…</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>No PDF loaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Send ─── */}
      {step === 2 && (
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8
                        border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6D52E8,#2F5BF0)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ready to Send</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Review details and send the signing invitation
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <InfoRow label="Document" value={form.title || doc?.title}/>
            <InfoRow
              label={signatories.length > 1 ? `Signatories (${signatories.length})` : 'Signatory'}
              value={signatories.length > 1
                ? (signingMode === 'SEQUENTIAL' ? 'Sign in order' : 'Sign in any order')
                : `${signatories[0]?.name} <${signatories[0]?.email}>`}/>
            {signatories.length > 1 && (
              <div className="py-2 border-b border-gray-100 dark:border-gray-700 space-y-1">
                {signatories.map((s, i) => (
                  <div key={s.id || i} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: signatoryColor(i) }}/>
                    {signingMode === 'SEQUENTIAL' && <span className="text-xs font-bold text-gray-400">{i + 1}.</span>}
                    <span className="font-medium text-gray-800 dark:text-gray-200">{s.name}</span>
                    <span className="text-gray-400 truncate">{s.email}</span>
                  </div>
                ))}
              </div>
            )}
            <InfoRow label="Fields placed" value={`${fields.length} field${fields.length !== 1 ? 's' : ''}`}/>
            <InfoRow label="Link expires"  value={`${form.tokenValidDays} day${form.tokenValidDays !== 1 ? 's' : ''} after sending`}/>
            <InfoRow label="PDF source"
              value={activeSources.map(s => SOURCE_META[s].title).join(' → ') || '—'}/>
            <InfoRow label="Invitation email"
              value={selectedEmailTemplate ? selectedEmailTemplate.name : 'Default template'}/>
            {inviteCc.length > 0 && (
              <InfoRow label="Invitation CC" value={inviteCc.join(', ')}/>
            )}
            {completionCc.length > 0 && (
              <InfoRow label="Signed copy to" value={completionCc.join(', ')}/>
            )}
          </div>

          <button onClick={handleSend} disabled={sending}
            className="btn btn-accent w-full">
            {sending ? 'Sending…' : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Send Signing Invitation
              </span>
            )}
          </button>
          <button onClick={() => setStep(1)}
            className="mt-3 w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700
                       dark:text-gray-400 dark:hover:text-gray-200 transition-colors inline-flex items-center justify-center gap-1.5">
            <IconArrowLeft className="w-4 h-4" /> Back to Field Placement
          </button>
        </div>
      )}
    </div>
  )
}

/* ── helpers ── */
const inputCls = `w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
  bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
  focus:outline-none focus:ring-2 focus:ring-accent-500`

const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide'

function FormField({ label, children, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

/** Reusable tag-style multi-email input (chips + free-text). Parent owns both the
 *  committed `emails` array and the in-progress `input` text so callers can flush
 *  unsubmitted text on submit. */
function EmailChipsField({ label, helper, emails, input, onInput, onCommit, onRemove, error, placeholder = 'cc@company.com' }) {
  return (
    <FormField label={label} error={error}>
      <div className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-gray-700
                      flex flex-wrap items-center gap-1.5 min-h-[44px]
                      focus-within:ring-2 focus-within:ring-accent-500
                      ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}>
        {emails.map(email => (
          <span key={email}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                       bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
            {email}
            <button type="button" onClick={() => onRemove(email)}
              className="hover:text-red-500 transition-colors" title="Remove">
              <IconX className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') onCommit(e) }}
          onBlur={() => onCommit()}
          placeholder={emails.length ? 'Add another…' : placeholder}
          className="flex-1 min-w-[140px] bg-transparent border-none outline-none p-0
                     text-sm text-gray-900 dark:text-white focus:ring-0"
        />
      </div>
      {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
    </FormField>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
