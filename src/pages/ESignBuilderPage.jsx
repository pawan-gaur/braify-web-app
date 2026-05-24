import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  esignCreateDocument,
  esignGetDocument,
  esignSaveFields,
  esignSendDocument,
  getTemplates,
  generatePdfAsBase64,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const FIELD_TYPES = [
  { type: 'SIGNATURE', label: 'Signature',  color: '#7c3aed', bg: '#ede9fe' },
  { type: 'INITIALS',  label: 'Initials',   color: '#2563eb', bg: '#dbeafe' },
  { type: 'DATE',      label: 'Date',        color: '#059669', bg: '#d1fae5' },
  { type: 'TEXT',      label: 'Text',        color: '#d97706', bg: '#fef3c7' },
]

const SOURCE_META = {
  single:   { emoji: '📄', title: 'Upload PDF',   desc: 'Upload a PDF file directly' },
  template: { emoji: '🎨', title: 'PDF Template', desc: 'Generate PDF from a designed template' },
  api:      { emoji: '🌐', title: 'External API', desc: 'Fetch the PDF from an external URL' },
}

const DEFAULT_FIELD_SIZE = { width: 18, height: 5 }
const STEPS    = ['Setup', 'Place Fields', 'Send']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function base64ToBlobUrl(base64) {
  const b64   = base64.includes(',') ? base64.split(',')[1] : base64
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
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
  const [pdfUrl,       setPdfUrl]       = useState(null)
  const [fields,       setFields]       = useState([])
  const [selectedType, setSelectedType] = useState('SIGNATURE')
  const [dragging,     setDragging]     = useState(null)
  const [resizing,     setResizing]     = useState(null)
  const overlayRef = useRef(null)

  /* ── step 2 — send ────────────────────────────────────────────────────── */
  const [doc,     setDoc]     = useState(null)
  const [sending, setSending] = useState(false)
  const [saving,  setSaving]  = useState(false)

  /* ── derived ──────────────────────────────────────────────────────────── */
  const activeSources = sourcePriority.filter(s => enabledSources[s])

  /* ════════════════════════════════════════════════════════════════════════
     Effects
  ════════════════════════════════════════════════════════════════════════ */

  // Load existing document (edit mode)
  useEffect(() => {
    if (!isEdit) return
    esignGetDocument(id).then(d => {
      setDoc(d)
      setFields(d.fields || [])
      setForm(f => ({ ...f, title: d.title, clientEmail: d.clientEmail, clientName: d.clientName }))
      if (d.sourcePdfBase64) {
        setPdfUrl(base64ToBlobUrl(d.sourcePdfBase64))
      }
    }).catch(e => showToast(e.message, 'error'))
  }, [id])

  // Lazy-load templates when template source is enabled
  useEffect(() => {
    if (!enabledSources.template || templates.length > 0) return
    setTemplatesLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch(() => showToast('Failed to load PDF templates', 'error'))
      .finally(() => setTemplatesLoading(false))
  }, [enabledSources.template])

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
          return { sourceType: 'UPLOAD', pdfBase64, blobUrl: base64ToBlobUrl(pdfBase64) }
        } else if (src === 'template') {
          if (!selectedTemplateId) throw new Error('No template selected')
          const previewB64 = await generatePdfAsBase64(selectedTemplateId, {})
          return { sourceType: 'TEMPLATE', templateId: selectedTemplateId, blobUrl: base64ToBlobUrl(previewB64) }
        } else {
          if (!fileApi.url) throw new Error('No API URL configured')
          const b64 = await fetchFileAsBase64(fileApi.url, buildAuthHeaders(fileApi))
          return { sourceType: 'UPLOAD', pdfBase64: b64, blobUrl: base64ToBlobUrl(b64) }
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

  function validateForm() {
    const errors = {}
    if (!form.title?.trim())    errors.title       = 'Document title is required'
    if (!form.clientName?.trim()) errors.clientName = 'Client name is required'
    if (!form.clientEmail?.trim()) errors.clientEmail = 'Client email is required'
    else if (!EMAIL_RE.test(form.clientEmail.trim()))
      errors.clientEmail = 'Enter a valid email address'

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
    if (!validateForm()) return
    setCreating(true)
    try {
      const resolved = await resolvePdfSource()
      const created  = await esignCreateDocument({
        title:         form.title,
        sourceType:    resolved.sourceType,
        pdfBase64:     resolved.pdfBase64,
        templateId:    resolved.templateId,
        clientEmail:   form.clientEmail,
        clientName:    form.clientName,
        tokenValidDays: form.tokenValidDays,
      })
      setDocId(created.id)
      setDoc(created)
      setPdfUrl(resolved.blobUrl)
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
      id: crypto.randomUUID(), page: 1,
      x:  Math.min(Math.max(x - DEFAULT_FIELD_SIZE.width  / 2, 0), 100 - DEFAULT_FIELD_SIZE.width),
      y:  Math.min(Math.max(y - DEFAULT_FIELD_SIZE.height / 2, 0), 100 - DEFAULT_FIELD_SIZE.height),
      width:  DEFAULT_FIELD_SIZE.width,
      height: DEFAULT_FIELD_SIZE.height,
      fieldType: selectedType,
      label: typeDef?.label || selectedType,
      required: true,
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
      showToast('Document sent to ' + (form.clientEmail || doc?.clientEmail) + '!', 'success')
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
                     ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-900/10'
                     : 'border-gray-200 dark:border-gray-700'}`}>

              {/* Header / toggle */}
              <button type="button" onClick={() => toggleSource(src)}
                className="w-full flex items-center gap-3 p-3 text-left">
                <span className="text-xl">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{meta.desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full shrink-0 relative transition-colors
                                 ${enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
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
                                         cursor-pointer hover:border-purple-400 transition-colors
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
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"/>
                          <span className="text-sm text-gray-500">Loading templates…</span>
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
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
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2
                                         focus:ring-purple-500 text-gray-900 dark:text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                            {templates
                              .filter(t => !templateSearch || t.name?.toLowerCase().includes(templateSearch.toLowerCase()))
                              .map(tpl => (
                                <button key={tpl.id} type="button" onClick={() => onTemplateSelect(tpl)}
                                  className={`p-2.5 rounded-lg border-2 text-left transition-colors
                                    ${selectedTemplateId === tpl.id
                                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
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
                                      <svg className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg
                                     hover:bg-purple-700 disabled:opacity-50 text-xs font-medium transition-colors">
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
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
              Fallback Priority
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
              Source #1 is tried first. If it fails the next is tried automatically.
            </p>
            <div className="space-y-1.5">
              {activeSources.map((src, idx) => (
                <div key={src}
                     className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2
                                border border-indigo-100 dark:border-indigo-800/40">
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold
                                   flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1">
                    {SOURCE_META[src].emoji} {SOURCE_META[src].title}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => movePriorityInActive(src, -1)}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    <button type="button" onClick={() => movePriorityInActive(src, 1)}
                      disabled={idx === activeSources.length - 1}
                      className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40
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
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
                              transition-colors duration-200
                              ${i === step
                                ? 'bg-purple-600 text-white'
                                : i < step
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                <span>{i < step ? '✓' : i + 1}</span>
                <span>{s}</span>
              </div>
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

            {/* Multi-source PDF picker */}
            {renderPdfSourceSection()}

            {/* Client details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Client Name" error={formErrors.clientName}>
                <input
                  className={inputCls + (formErrors.clientName ? ' border-red-400 focus:ring-red-400' : '')}
                  placeholder="Jane Smith"
                  value={form.clientName}
                  onChange={e => { setForm(f => ({ ...f, clientName: e.target.value })); setFormErrors(fe => ({ ...fe, clientName: undefined })) }}
                />
              </FormField>
              <FormField label="Client Email" error={formErrors.clientEmail}>
                <input
                  className={inputCls + (formErrors.clientEmail ? ' border-red-400 focus:ring-red-400' : '')}
                  type="email"
                  placeholder="jane@company.com"
                  value={form.clientEmail}
                  onChange={e => { setForm(f => ({ ...f, clientEmail: e.target.value })); setFormErrors(fe => ({ ...fe, clientEmail: undefined })) }}
                  onBlur={() => {
                    if (form.clientEmail && !EMAIL_RE.test(form.clientEmail.trim()))
                      setFormErrors(fe => ({ ...fe, clientEmail: 'Enter a valid email address' }))
                  }}
                />
              </FormField>
            </div>

            <FormField label={`Link valid for (days): ${form.tokenValidDays}`}>
              <input type="range" min={1} max={30} value={form.tokenValidDays}
                onChange={e => setForm(f => ({ ...f, tokenValidDays: +e.target.value }))}
                className="w-full accent-purple-600"/>
            </FormField>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-6 w-full py-3 rounded-xl text-white font-semibold transition-all
                       disabled:opacity-60 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
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
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Field Types</h3>
                <p className="text-xs text-gray-400 mb-3">Select a type, then click on the PDF to place</p>
                <div className="space-y-2">
                  {FIELD_TYPES.map(t => (
                    <button key={t.type} onClick={() => setSelectedType(t.type)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                                  border-2 transition-all
                                  ${selectedType === t.type
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: t.color }}/>
                      {t.label}
                      {selectedType === t.type && (
                        <span className="ml-auto text-purple-500">
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
                    const typeDef = FIELD_TYPES.find(t => t.type === f.fieldType)
                    return (
                      <div key={f.id} className="flex items-center justify-between py-1">
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <span className="w-2 h-2 rounded-sm" style={{ background: typeDef?.color }}/>
                          {f.label}
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
                  className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold
                             transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
                  title={!docId ? 'Complete Step 1 first' : fields.length === 0 ? 'Place at least one field' : ''}
                >
                  {saving ? 'Saving…' : `Save & Continue → (${fields.length} field${fields.length !== 1 ? 's' : ''})`}
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

              {pdfUrl ? (
                <div ref={overlayRef}
                     className="relative w-full"
                     style={{ paddingTop: '141.4%', cursor: 'crosshair' }}
                     onClick={addField}
                     onMouseMove={onMouseMove}
                     onMouseUp={onMouseUp}
                     onMouseLeave={onMouseUp}>
                  <div className="absolute inset-0">
                    <iframe src={pdfUrl + '#toolbar=0&view=FitH'}
                      className="absolute inset-0 w-full h-full border-none pointer-events-none"
                      title="PDF Preview" />
                    {fields.map(f => {
                      const typeDef = FIELD_TYPES.find(t => t.type === f.fieldType)
                      return (
                        <div key={f.id}
                          style={{
                            position: 'absolute',
                            left: `${f.x}%`, top: `${f.y}%`,
                            width: `${f.width}%`, height: `${f.height}%`,
                            background: typeDef?.bg + 'cc',
                            border: `2px dashed ${typeDef?.color}`,
                            borderRadius: 4, cursor: 'grab', boxSizing: 'border-box',
                          }}
                          onMouseDown={e => onDragStart(e, f.id)}
                          onClick={e => e.stopPropagation()}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: typeDef?.color,
                                         padding: '1px 4px', userSelect: 'none', display: 'block',
                                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {f.label}
                          </span>
                          <button
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); removeField(f.id) }}
                            style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18,
                                     borderRadius: '50%', background: typeDef?.color, color: '#fff',
                                     border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: '18px',
                                     textAlign: 'center', display: 'flex', alignItems: 'center',
                                     justifyContent: 'center' }}>×</button>
                          <div
                            style={{ position: 'absolute', bottom: -4, right: -4, width: 12, height: 12,
                                     background: typeDef?.color, borderRadius: 2, cursor: 'se-resize' }}
                            onMouseDown={e => { e.stopPropagation(); onResizeStart(e, f.id) }} />
                        </div>
                      )
                    })}
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
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
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
            <InfoRow label="Client"   value={`${form.clientName} <${form.clientEmail}>`}/>
            <InfoRow label="Fields placed" value={`${fields.length} field${fields.length !== 1 ? 's' : ''}`}/>
            <InfoRow label="Link expires"  value={`${form.tokenValidDays} day${form.tokenValidDays !== 1 ? 's' : ''} after sending`}/>
            <InfoRow label="PDF source"
              value={activeSources.map(s => SOURCE_META[s].title).join(' → ') || '—'}/>
          </div>

          <button onClick={handleSend} disabled={sending}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all
                       disabled:opacity-60 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
            {sending ? 'Sending…' : '📧 Send Signing Invitation'}
          </button>
          <button onClick={() => setStep(1)}
            className="mt-3 w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700
                       dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            ← Back to Field Placement
          </button>
        </div>
      )}
    </div>
  )
}

/* ── helpers ── */
const inputCls = `w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
  bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
  focus:outline-none focus:ring-2 focus:ring-purple-500`

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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
