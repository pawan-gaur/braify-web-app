import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  esignCreateDocument,
  esignGetDocument,
  esignSaveFields,
  esignSendDocument,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const FIELD_TYPES = [
  { type: 'SIGNATURE', label: 'Signature',  color: '#7c3aed', bg: '#ede9fe' },
  { type: 'INITIALS',  label: 'Initials',   color: '#2563eb', bg: '#dbeafe' },
  { type: 'DATE',      label: 'Date',        color: '#059669', bg: '#d1fae5' },
  { type: 'TEXT',      label: 'Text',        color: '#d97706', bg: '#fef3c7' },
]

const DEFAULT_FIELD_SIZE = { width: 18, height: 5 }

/* ── step wizard ── */
const STEPS = ['Setup', 'Place Fields', 'Send']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ESignBuilderPage({ initialDocStatus }) {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { showToast } = useToast()
  const isEdit     = !!id

  /* ── step ── */
  const [step, setStep]   = useState(isEdit ? 1 : 0)
  const [docId, setDocId] = useState(id || null)

  /* ── step 0 setup form ── */
  const [form, setForm] = useState({
    title: '', sourceType: 'UPLOAD', pdfBase64: null,
    clientEmail: '', clientName: '', tokenValidDays: 7,
  })
  const [formErrors, setFormErrors] = useState({})
  const [pdfFileName, setPdfFileName] = useState('')

  /* ── step 1 field placement ── */
  const [pdfUrl, setPdfUrl]           = useState(null)
  const [fields, setFields]           = useState([])
  const [selectedType, setSelectedType] = useState('SIGNATURE')
  const [dragging, setDragging]       = useState(null)   // { id, offsetX, offsetY }
  const [resizing, setResizing]       = useState(null)   // { id, startX, startY, startW, startH }
  const overlayRef                    = useRef(null)

  /* ── step 2 send ── */
  const [doc, setDoc]         = useState(null)
  const [sending, setSending] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [creating, setCreating] = useState(false)

  /* ────────────────────────────────────────────────────── */
  /* Load existing doc                                       */
  /* ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isEdit) return
    esignGetDocument(id).then(d => {
      setDoc(d)
      setFields(d.fields || [])
      setForm(f => ({
        ...f,
        title: d.title,
        clientEmail: d.clientEmail,
        clientName: d.clientName,
      }))
      if (d.sourcePdfBase64) {
        const bytes = Uint8Array.from(atob(d.sourcePdfBase64), c => c.charCodeAt(0))
        const blob  = new Blob([bytes], { type: 'application/pdf' })
        setPdfUrl(URL.createObjectURL(blob))
      }
    }).catch(e => showToast(e.message, 'error'))
  }, [id])

  /* ────────────────────────────────────────────────────── */
  /* Step 0 — PDF file pick                                 */
  /* ────────────────────────────────────────────────────── */
  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPdfFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(f => ({ ...f, pdfBase64: ev.target.result }))
      const bytes = Uint8Array.from(atob(ev.target.result.split(',')[1]), c => c.charCodeAt(0))
      setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    }
    reader.readAsDataURL(file)
  }

  function validateForm() {
    const errors = {}
    if (!form.title?.trim())                  errors.title       = 'Document title is required'
    if (!form.pdfBase64)                      errors.pdf         = 'Please upload a PDF file'
    if (!form.clientName?.trim())             errors.clientName  = 'Client name is required'
    if (!form.clientEmail?.trim())            errors.clientEmail = 'Client email is required'
    else if (!EMAIL_RE.test(form.clientEmail.trim()))
                                              errors.clientEmail = 'Enter a valid email address'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreate() {
    if (!validateForm()) return
    setCreating(true)
    try {
      const created = await esignCreateDocument({
        title: form.title,
        sourceType: form.sourceType,
        pdfBase64: form.pdfBase64,
        clientEmail: form.clientEmail,
        clientName: form.clientName,
        tokenValidDays: form.tokenValidDays,
      })
      setDocId(created.id)
      setDoc(created)
      // Update URL cosmetically WITHOUT unmounting — navigate() would switch route
      // /esign/new → /esign/:id and remount the component, wiping all state.
      window.history.replaceState(null, '', `/esign/${created.id}`)
      setStep(1)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  /* ────────────────────────────────────────────────────── */
  /* Step 1 — field placement helpers                       */
  /* ────────────────────────────────────────────────────── */

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
      id: crypto.randomUUID(),
      page: 1,
      x:  Math.min(Math.max(x - DEFAULT_FIELD_SIZE.width / 2, 0), 100 - DEFAULT_FIELD_SIZE.width),
      y:  Math.min(Math.max(y - DEFAULT_FIELD_SIZE.height / 2, 0), 100 - DEFAULT_FIELD_SIZE.height),
      width:  DEFAULT_FIELD_SIZE.width,
      height: DEFAULT_FIELD_SIZE.height,
      fieldType: selectedType,
      label: typeDef?.label || selectedType,
      required: true,
    }])
  }

  function removeField(id) {
    setFields(prev => prev.filter(f => f.id !== id))
  }

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
        : f
      ))
    }
    if (resizing) {
      const dxPct = toPercent(e.clientX - resizing.startX, rect.width)
      const dyPct = toPercent(e.clientY - resizing.startY, rect.height)
      setFields(prev => prev.map(f => f.id === resizing.id
        ? { ...f,
            width:  Math.max(resizing.startW + dxPct, 5),
            height: Math.max(resizing.startH + dyPct, 2) }
        : f
      ))
    }
  }, [dragging, resizing])

  const onMouseUp = useCallback(() => {
    setDragging(null)
    setResizing(null)
  }, [])

  function onResizeStart(e, fid) {
    e.stopPropagation()
    const field = fields.find(f => f.id === fid)
    setResizing({ id: fid, startX: e.clientX, startY: e.clientY, startW: field.width, startH: field.height })
  }

  async function handleSaveFields() {
    if (!docId) {
      showToast('Document not ready — please complete Step 1 first', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = fields.map(f => ({
        page: f.page, x: f.x, y: f.y,
        width: f.width, height: f.height,
        fieldType: f.fieldType, label: f.label,
        required: f.required ?? true,
      }))
      await esignSaveFields(docId, payload)

      // Only navigate back to the list when the document has already been sent
      // (PENDING / IN_REVIEW). For all other statuses — including DRAFT, whether
      // the document is brand-new or being re-edited — advance to the Send step.
      const alreadySent = ['PENDING', 'IN_REVIEW'].includes(initialDocStatus)
                       || ['PENDING', 'IN_REVIEW'].includes(doc?.status)

      if (alreadySent) {
        showToast('Fields updated successfully', 'success')
        navigate('/esign')
        return
      }

      // DRAFT (new or re-edited): advance to step 3 — Send
      setStep(2)
      showToast('Fields saved — ready to send', 'success')
    } catch (e) {
      showToast(e.message || 'Failed to save fields', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ────────────────────────────────────────────────────── */
  /* Step 2 — Send                                          */
  /* ────────────────────────────────────────────────────── */
  async function handleSend() {
    setSending(true)
    try {
      await esignSendDocument(docId, form.tokenValidDays)
      navigate('/esign')                                          // navigate first
      showToast('Document sent to ' + (form.clientEmail || doc?.clientEmail) + '!', 'success')
    } catch (e) {
      showToast(e.message || 'Failed to send document', 'error')
    } finally {
      setSending(false)
    }
  }

  /* ────────────────────────────────────────────────────── */
  /* Render                                                  */
  /* ────────────────────────────────────────────────────── */
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

          <div className="space-y-4">
            <Field label="Document Title" error={formErrors.title}>
              <input
                className={inputCls + (formErrors.title ? ' border-red-400 focus:ring-red-400' : '')}
                placeholder="e.g. Service Agreement 2025"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(fe => ({ ...fe, title: undefined })) }}
              />
            </Field>

            <Field label="Upload PDF" error={formErrors.pdf}>
              <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer
                                hover:border-purple-400 transition-colors
                                ${formErrors.pdf ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span className={`text-sm ${pdfFileName ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {pdfFileName || 'Click to upload PDF…'}
                </span>
                <input type="file" accept="application/pdf" className="hidden"
                  onChange={e => { handleFileChange(e); setFormErrors(fe => ({ ...fe, pdf: undefined })) }}/>
              </label>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client Name" error={formErrors.clientName}>
                <input
                  className={inputCls + (formErrors.clientName ? ' border-red-400 focus:ring-red-400' : '')}
                  placeholder="Jane Smith"
                  value={form.clientName}
                  onChange={e => { setForm(f => ({ ...f, clientName: e.target.value })); setFormErrors(fe => ({ ...fe, clientName: undefined })) }}
                />
              </Field>
              <Field label="Client Email" error={formErrors.clientEmail}>
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
              </Field>
            </div>

            <Field label={`Link valid for (days): ${form.tokenValidDays}`}>
              <input type="range" min={1} max={30} value={form.tokenValidDays}
                onChange={e => setForm(f => ({ ...f, tokenValidDays: +e.target.value }))}
                className="w-full accent-purple-600"/>
            </Field>
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
          {/* Banner: warn when editing a document that's already been sent */}
          {isEdit && (initialDocStatus || doc?.status) && (initialDocStatus || doc?.status) !== 'DRAFT' && (
            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200
                            dark:border-yellow-700 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <span>
                This document is <strong>{(initialDocStatus || doc?.status)?.replace('_', ' ')}</strong>.
                You can update the field placements and the changes will take effect — the client's signing
                link will still work. Use the <strong>Resend</strong> button on the list page to issue a
                fresh link if needed.
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
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                                border-2 transition-all
                                ${selectedType === t.type
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    <span className="w-3 h-3 rounded-sm shrink-0"
                      style={{ background: t.color }}/>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Click on the PDF to place a <strong className="text-gray-700 dark:text-gray-200">{selectedType}</strong> field.
                Drag to move. Resize using the handle.
              </span>
            </div>

            {pdfUrl ? (
              /* aspect-ratio: 1/1.414 = A4 portrait (595×842pt).
                 This locks the height to always be √2 × width so that
                 percentage-based field positions are stable on every resize. */
              <div
                ref={overlayRef}
                className="relative w-full"
                style={{ paddingTop: '141.4%', cursor: 'crosshair' }}
                onClick={addField}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                {/* Absolutely-fill inner wrapper so children use the padded height */}
                <div className="absolute inset-0">
                <iframe
                  src={pdfUrl + '#toolbar=0&view=FitH'}
                  className="absolute inset-0 w-full h-full border-none pointer-events-none"
                  title="PDF Preview"
                />
                {/* Field overlays */}
                {fields.map(f => {
                  const typeDef = FIELD_TYPES.find(t => t.type === f.fieldType)
                  return (
                    <div
                      key={f.id}
                      style={{
                        position: 'absolute',
                        left: `${f.x}%`, top: `${f.y}%`,
                        width: `${f.width}%`, height: `${f.height}%`,
                        background: typeDef?.bg + 'cc',
                        border: `2px dashed ${typeDef?.color}`,
                        borderRadius: 4,
                        cursor: 'grab',
                        boxSizing: 'border-box',
                      }}
                      onMouseDown={e => onDragStart(e, f.id)}
                      onClick={e => e.stopPropagation()}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: typeDef?.color,
                                     padding: '1px 4px', userSelect: 'none', display: 'block',
                                     whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.label}
                      </span>
                      {/* Remove button */}
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); removeField(f.id) }}
                        style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18,
                                 borderRadius: '50%', background: typeDef?.color, color: '#fff',
                                 border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: '18px',
                                 textAlign: 'center', display: 'flex', alignItems: 'center',
                                 justifyContent: 'center' }}
                      >×</button>
                      {/* Resize handle */}
                      <div
                        style={{ position: 'absolute', bottom: -4, right: -4, width: 12, height: 12,
                                 background: typeDef?.color, borderRadius: 2, cursor: 'se-resize' }}
                        onMouseDown={e => { e.stopPropagation(); onResizeStart(e, f.id) }}
                      />
                    </div>
                  )
                })}
                </div>{/* end absolute inset-0 inner wrapper */}
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
          </div>{/* end flex-1 PDF canvas column */}
          </div>{/* end flex gap-5 inner */}
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
            <InfoRow label="Client" value={`${form.clientName} <${form.clientEmail}>`}/>
            <InfoRow label="Fields placed" value={`${fields.length} field${fields.length !== 1 ? 's' : ''}`}/>
            <InfoRow label="Link expires" value={`${form.tokenValidDays} day${form.tokenValidDays !== 1 ? 's' : ''} after sending`}/>
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all
                       disabled:opacity-60 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
          >
            {sending ? 'Sending…' : '📧 Send Signing Invitation'}
          </button>
          <button
            onClick={() => setStep(1)}
            className="mt-3 w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700
                       dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
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

function Field({ label, children, error }) {
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
