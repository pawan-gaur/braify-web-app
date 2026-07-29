/**
 * Public client signing page — no user auth required.
 * URL: /sign/:token  (token = the ESIGN signing JWT)
 *
 * Fixes applied vs. original:
 *  1. Canvas getPoint() now scales by (canvas.width / rect.width) so strokes land
 *     where the user's finger/mouse actually is, regardless of CSS scaling.
 *  2. Empty-canvas guard uses a hasDrawn ref instead of comparing two toDataURL()
 *     calls (which are always equal and therefore always blocked the Apply button).
 *  3. DATE / TEXT fields: handleSignField branches on fieldType first so it reads
 *     typedText instead of trying to read the invisible canvas.
 *  4. Field overlay container uses A4 paddingTop (141.4%) so % coordinates from
 *     the builder map exactly onto the PDF at any window width.
 *  5. After Apply Signature the overlay renders the actual drawn image / typed text
 *     instead of just "✓ Signed" text.
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import BrandLogo from '../components/ui/BrandLogo'
import { useParams } from 'react-router-dom'
import { esignOpenDocument, esignSignField, esignSubmitDocument, esignUploadAttachment, esignDownloadSignSource, esignConsent } from '../services/api'
import { IconCheck } from '../components/ui/icons'
import PdfPageCanvas from '../components/esign/PdfPageCanvas'

const FIELD_COLORS = {
  SIGNATURE: { border: '#6D52E8', bg: 'rgba(109,82,232,0.12)' },
  INITIALS:  { border: '#2563eb', bg: 'rgba(37,99,235,0.12)'  },
  DATE:      { border: '#059669', bg: 'rgba(5,150,105,0.12)'  },
  TEXT:      { border: '#d97706', bg: 'rgba(217,119,6,0.12)'  },
  CHECKBOX:  { border: '#4f46e5', bg: 'rgba(79,70,229,0.12)'  },
  STAMP:     { border: '#0891b2', bg: 'rgba(8,145,178,0.12)'  },
}

/** A checkbox value is "checked" when truthy. */
const isChecked = v => v === 'true' || v === true

const TEXTUAL_TYPES = ['TEXT', 'DATE']

// ─── Canvas helpers ──────────────────────────────────────────────────────────

/** Returns canvas-space {x, y} corrected for CSS-to-pixel scaling. */
function getCanvasPoint(e, canvas) {
  const rect   = canvas.getBoundingClientRect()
  const src    = e.touches ? e.touches[0] : e
  const scaleX = canvas.width  / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  }
}

/**
 * Rendered content of a SIGNED field: the value on top and the "signer name +
 * timestamp" caption below. The caption adapts to the field's height so it never
 * overlaps the value: tall fields show name and timestamp on two lines; short
 * fields collapse them to a single linear line ("Name · timestamp").
 */
function SignedFieldInner({ sigMethod, sigValue, signerName, dateStr, caption, fontSizePx }) {
  const ref = useRef(null)
  const [compact, setCompact] = useState(false)
  useLayoutEffect(() => {
    const measure = () => {
      const h = ref.current?.clientHeight || 0
      setCompact(h < 54)   // not enough room for a two-line caption → go linear
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro && ref.current) ro.observe(ref.current)
    return () => ro?.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {sigMethod === 'TYPE' ? (
          <span style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#1e293b', fontSize: fontSizePx || 13, lineHeight: 1.1,
                         padding: '2px 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
            {sigValue}
          </span>
        ) : sigValue ? (
          <img src={sigValue} alt="signature"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 2 }} />
        ) : (
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconCheck className="w-3 h-3" /> Signed
          </span>
        )}
      </div>
      {(signerName || dateStr) && (
        <div title={caption}
          style={{ color: '#2563eb', textAlign: 'center', padding: '1px 3px', lineHeight: 1.1,
                   borderTop: '1px solid rgba(37,99,235,0.35)', flexShrink: 0 }}>
          {compact ? (
            <div style={{ fontSize: 6.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {signerName}{signerName && dateStr ? ' · ' : ''}{dateStr}
            </div>
          ) : (
            <>
              {signerName && <div style={{ fontSize: 7, fontWeight: 600, wordBreak: 'break-word' }}>{signerName}</div>}
              {dateStr && <div style={{ fontSize: 6.5, wordBreak: 'break-word' }}>{dateStr}</div>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ESignSigningPage() {
  const { token } = useParams()

  const [doc,        setDoc]        = useState(null)
  const [pdfUrl,     setPdfUrl]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [fields,     setFields]     = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)   // doc status returned after submit

  /* multi-page PDF rendering */
  const [pdfPageCount,   setPdfPageCount]   = useState(1)
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1)
  const [pdfRenderFailed, setPdfRenderFailed] = useState(false)  // fall back to iframe if pdfjs can't load
  const [viewMode, setViewMode] = useState('PAGED')   // PAGED (page-by-page) | CONTINUOUS (whole document)

  /* modal state */
  const [activeField, setActiveField] = useState(null)
  const [modalTab,    setModalTab]    = useState('DRAW')   // DRAW | TYPE | UPLOAD
  const [typedText,   setTypedText]   = useState('')
  const [typedFontSize, setTypedFontSize] = useState(12)   // signer's font-size choice for TEXT/DATE
  const [saving,      setSaving]      = useState(false)
  const [applyToAll,  setApplyToAll]  = useState(false)    // duplicate this value to every matching field
  const [pdfScale,    setPdfScale]    = useState(1)        // rendered px per PDF point (WYSIWYG font sizing)
  /* ESIGN/UETA electronic-records-&-signatures consent gate */
  const [consented,   setConsented]   = useState(false)
  const [agreeChecked, setAgreeChecked] = useState(false)
  const [consentBusy, setConsentBusy] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)  // intent-to-sign modal

  /* "adopt once, click to apply" — the signer's reusable value per field type
     (SIGNATURE / INITIALS / DATE). After the first time they fill one, clicking
     another field of the same type applies the same value without re-drawing. */
  const [adopted,     setAdopted]     = useState({})       // fieldType -> { value, method }
  const [applyingId,  setApplyingId]  = useState(null)     // field currently being auto-applied
  const [applyingAll, setApplyingAll] = useState(false)

  /* post-submission attachment state */
  const [attachments,  setAttachments]  = useState([])
  const [uploading,    setUploading]    = useState(false)
  const [attachError,  setAttachError]  = useState('')
  const [dragOver,     setDragOver]     = useState(false)

  /* canvas refs */
  const canvasRef  = useRef(null)
  const drawingRef = useRef(false)
  const lastPt     = useRef(null)
  const hasDrawn   = useRef(false)   // tracks whether the user has drawn anything
  const pageWrapRef = useRef(null)   // page canvas wrapper — scrolled to top on page change

  /* ── Which fields belong to the signatory holding this token ──────────────
   * The backend tags the token with currentSignatoryId; a field is "mine" when it
   * matches (unassigned fields default to the first signatory). Legacy single-signer
   * documents have no currentSignatoryId, so every field is mine. */
  const mySignatoryId  = doc?.currentSignatoryId || null
  const coSignatories  = doc?.signatories || []
  const firstSigId     = coSignatories[0]?.id
  /** Fields the sender pre-filled — read-only to every signer, never their responsibility. */
  const isPrefilled    = f => f.filledBy === 'CREATOR'
  const isMine         = f => !isPrefilled(f) && (!mySignatoryId || (f.signatoryId || firstSigId) === mySignatoryId)
  const myFields       = fields.filter(isMine)
  /** On-screen px for a field's text so it matches the final PDF (points × render scale). */
  const fieldFontPx    = f => Math.max(6, (f.fontSize || 12) * pdfScale)
  const mySignatory    = coSignatories.find(s => s.id === mySignatoryId)
  const isMultiParty   = coSignatories.length > 1
  // Consent gate: already consented on the server (reload-safe) OR just accepted this session.
  const hasConsent     = consented || !!mySignatory?.consentedAt
  async function handleConsent() {
    setConsentBusy(true)
    try {
      const updated = await esignConsent(token)
      setDoc(updated)          // carries the new consentedAt on the signatory
      setConsented(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setConsentBusy(false)
    }
  }

  /* ── Load document ── */
  useEffect(() => {
    esignOpenDocument(token)
      .then(d => {
        setDoc(d)
        setFields(d.fields || [])
        // Load the PDF SAME-ORIGIN so pdf.js can render it page-by-page. Using the cloud
        // pre-signed URL directly fails CORS in pdf.js and forces the single-page fallback
        // (all fields collapse onto one page). Legacy docs still carry embedded base64.
        if (d.sourcePdfBase64) {
          const bytes = Uint8Array.from(atob(d.sourcePdfBase64), c => c.charCodeAt(0))
          setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
        } else {
          esignDownloadSignSource(token)
            .then(blob => setPdfUrl(URL.createObjectURL(blob)))
            .catch(() => { if (d.sourcePdfUrl) setPdfUrl(d.sourcePdfUrl) })  // last-resort fallback
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  /* ── Canvas drawing ── */
  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
  }

  function startDraw(e) {
    e.preventDefault()
    drawingRef.current = true
    hasDrawn.current   = true
    const pt  = getCanvasPoint(e, canvasRef.current)
    lastPt.current = pt
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#1e293b'
    ctx.fill()
  }

  const onDraw = useCallback(e => {
    if (!drawingRef.current || !lastPt.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pt     = getCanvasPoint(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPt.current.x, lastPt.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPt.current = pt
  }, [])

  function stopDraw() { drawingRef.current = false; lastPt.current = null }

  function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const ctx    = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Draw the image preserving its aspect ratio (contained + centred), so an
        // uploaded signature/stamp is never stretched to the canvas shape.
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const w = img.width * scale, h = img.height * scale
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
        hasDrawn.current = true
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  /* ── Open modal (also used to EDIT an already-applied field before submit) ── */
  function openModal(field) {
    setActiveField(field)
    setApplyToAll(false)
    setTypedFontSize(field.fontSize || 12)   // seed size picker from the field's current size

    // If the field was already signed, pre-fill the editor with its current value
    // so the signer can adjust rather than re-enter from scratch.
    const existing       = field.signed ? (field._signedValue  || field.value)         : null
    const existingMethod = field.signed ? (field._signedMethod || field.signingMethod) : null

    if (field.fieldType === 'STAMP') {
      // Stamp = image upload only.
      setModalTab('UPLOAD')
      setTypedText('')
      hasDrawn.current = false
      setTimeout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (existing) {
          const img = new Image()
          img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); hasDrawn.current = true }
          img.src = existing
        } else {
          hasDrawn.current = false
        }
      }, 0)
    } else if (field.fieldType === 'DATE') {
      setModalTab('TYPE')
      setTypedText(existing || new Date().toISOString().split('T')[0])
      hasDrawn.current = false
      setTimeout(() => clearCanvas(), 0)
    } else if (field.fieldType === 'TEXT') {
      setModalTab('TYPE')
      setTypedText(existing || '')
      hasDrawn.current = false
      setTimeout(() => clearCanvas(), 0)
    } else if (existing && existingMethod === 'TYPE') {
      // Editing a typed signature/initials
      setModalTab('TYPE')
      setTypedText(existing)
      hasDrawn.current = false
      setTimeout(() => clearCanvas(), 0)
    } else if (existing && (existingMethod === 'DRAW' || existingMethod === 'UPLOAD')) {
      // Editing a drawn/uploaded signature → re-render the existing image onto the canvas
      setModalTab(existingMethod)
      setTypedText('')
      hasDrawn.current = false
      setTimeout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          hasDrawn.current = true
        }
        img.src = existing
      }, 0)
    } else {
      // Fresh field
      setModalTab('DRAW')
      setTypedText('')
      hasDrawn.current = false
      setTimeout(() => clearCanvas(), 0)
    }
  }

  /* Field types whose value can be reused ("adopted") across fields. TEXT is per-field. */
  const REUSABLE = ['SIGNATURE', 'INITIALS', 'DATE']

  /* ── Core: persist a value onto a field and update local state ── */
  async function signFieldWith(field, value, method, extra = {}) {
    const timeZone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return undefined } })()
    const updated = await esignSignField(token, field.id, { signingMethod: method, value, timeZone, ...extra })
    setFields(prev => prev.map(f =>
      f.id === field.id
        ? { ...f, ...updated, signed: true, _signedValue: value, _signedMethod: method }
        : f
    ))
  }

  /* ── Click a field: reuse the adopted value if we have one, else open the modal ── */
  function handleFieldClick(field) {
    if (!isMine(field)) return
    // Checkboxes toggle in place — no modal.
    if (field.fieldType === 'CHECKBOX') {
      const checked = isChecked(field._signedValue ?? field.value)
      setApplyingId(field.id)
      signFieldWith(field, checked ? 'false' : 'true', 'TYPE')
        .catch(e => alert(e.message))
        .finally(() => setApplyingId(null))
      return
    }
    // Already applied → re-open the editor so the signer can change it before submitting.
    if (field.signed) { openModal(field); return }
    const a = adopted[field.fieldType]
    if (a) {
      setApplyingId(field.id)
      signFieldWith(field, a.value, a.method)
        .catch(e => alert(e.message))
        .finally(() => setApplyingId(null))
    } else {
      openModal(field)
    }
  }

  /* ── Duplicate one value to every remaining field of the same type (all pages) ── */
  async function applyValueToType(fieldType, value, method, excludeId) {
    const targets = fields.filter(f =>
      isMine(f) && !f.signed && f.fieldType === fieldType && f.id !== excludeId)
    for (const f of targets) {
      try { await signFieldWith(f, value, method) }
      catch { /* keep going; failures stay unsigned */ }
    }
  }

  /* ── Apply the adopted value to every remaining field the signer owns ── */
  async function applyAdoptedToAll() {
    const targets = fields.filter(f => isMine(f) && !f.signed && adopted[f.fieldType])
    if (!targets.length) return
    setApplyingAll(true)
    for (const f of targets) {
      try { await signFieldWith(f, adopted[f.fieldType].value, adopted[f.fieldType].method) }
      catch { /* keep going; failures stay unsigned */ }
    }
    setApplyingAll(false)
  }

  /* ── Apply signature from the modal (and adopt it for reuse) ── */
  async function handleSignField() {
    if (!activeField) return
    setSaving(true)

    let value  = ''
    let method = 'TYPE'

    try {
      if (activeField.fieldType === 'DATE' || activeField.fieldType === 'TEXT') {
        // ── Date / plain text ────────────────────────────────────────────────
        value = typedText.trim()
        if (!value) { setSaving(false); return }
        method = 'TYPE'

      } else if (modalTab === 'TYPE') {
        // ── Typed cursive signature ──────────────────────────────────────────
        value = typedText.trim()
        if (!value) { setSaving(false); return }
        method = 'TYPE'

      } else {
        // ── DRAW or UPLOAD — read canvas ─────────────────────────────────────
        if (!hasDrawn.current) {
          // Nothing drawn → don't submit
          setSaving(false)
          return
        }
        value  = canvasRef.current?.toDataURL('image/png') || ''
        method = modalTab   // 'DRAW' or 'UPLOAD'
      }

      // Carry the signer's font-size choice for text/date fields (WYSIWYG into the PDF).
      const extra = TEXTUAL_TYPES.includes(activeField.fieldType) ? { fontSize: typedFontSize } : {}
      await signFieldWith(activeField, value, method, extra)

      // Remember this value so the signer can click other same-type fields to auto-fill them.
      if (REUSABLE.includes(activeField.fieldType)) {
        setAdopted(a => ({ ...a, [activeField.fieldType]: { value, method } }))
      }

      // Duplicate to every remaining field of the same type across all pages.
      if (applyToAll && REUSABLE.includes(activeField.fieldType)) {
        await applyValueToType(activeField.fieldType, value, method, activeField.id)
      }

      setActiveField(null)
      clearCanvas()
      setTypedText('')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── Submit ── */
  // Opens the intent-to-sign confirmation modal (replaces the native confirm dialog).
  function handleSubmit() {
    const unsignedRequired = myFields.filter(f => f.required && !f.signed)
    if (unsignedRequired.length > 0) {
      alert(`Please sign all required fields (${unsignedRequired.length} remaining)`)
      return
    }
    setShowSubmitConfirm(true)
  }

  // Performs the actual submission once the signer confirms intent.
  async function doSubmit() {
    setSubmitting(true)
    try {
      const res = await esignSubmitDocument(token)
      setSubmitStatus(res?.status || null)
      setShowSubmitConfirm(false)
      setSubmitted(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Upload supporting attachment after submission ── */
  async function handleAttachFiles(fileList) {
    const files = Array.from(fileList)
    if (!files.length) return
    setAttachError('')
    const allowedTypes = doc?.allowedClientUploadFileTypes || []
    for (const file of files) {
      if (attachments.length >= 5) { setAttachError('Maximum of 5 files reached.'); break }
      if (file.size > 10 * 1024 * 1024) { setAttachError(`"${file.name}" exceeds the 10 MB limit.`); continue }

      // Client-side file-type validation (mirrors server-side check)
      if (allowedTypes.length > 0) {
        const ext = (file.name.split('.').pop() || '').toLowerCase()
        if (!allowedTypes.some(t => t.toLowerCase() === ext)) {
          const allowedList = allowedTypes.map(t => '.' + t.toUpperCase()).join(', ')
          setAttachError(`"${file.name}" is not an allowed file type. Accepted: ${allowedList}`)
          continue
        }
      }

      setUploading(true)
      try {
        const meta = await esignUploadAttachment(token, file)
        setAttachments(prev => [...prev, meta])
      } catch (e) {
        setAttachError(e.message || 'Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    }
  }

  /* ── Loading / error / success screens ── */
  if (loading) return <Center><Spinner/></Center>
  if (error)   return (
    <Center>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-4 text-gray-400">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Unable to open document</h1>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </Center>
  )
  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Success banner ── */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          {submitStatus === 'PARTIALLY_SIGNED' ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Your part is signed!</h1>
              <p className="text-gray-500 text-sm">
                Thank you, <strong>{mySignatory?.name || doc?.clientName}</strong>. The remaining
                signatories still need to sign — you'll receive the final signed document by email
                once everyone has completed it.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Signed!</h1>
              <p className="text-gray-500 text-sm">
                Thank you, <strong>{mySignatory?.name || doc?.clientName}</strong>. Your signed
                document will be emailed to you shortly.
              </p>
            </>
          )}
        </div>

        {/* ── Optional attachment upload card (only shown when creator enabled it) ── */}
        {doc?.allowClientUpload && <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
            <h2 className="text-base font-bold text-gray-800">Upload Supporting Documents</h2>
            <span className="ml-1 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Attach any supporting documents (e.g. ID copy, proof of address). Up to 5 files, 10 MB each.
            {doc?.allowedClientUploadFileTypes?.length > 0 && (
              <span className="block mt-1 font-semibold text-gray-600">
                Accepted types: {doc.allowedClientUploadFileTypes.map(t => '.' + t.toUpperCase()).join(', ')}
              </span>
            )}
          </p>

          {/* Drop zone */}
          {attachments.length < 5 && (
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors
                          ${dragOver
                            ? 'border-accent-400 bg-accent-50'
                            : 'border-gray-200 bg-gray-50 hover:border-accent-300 hover:bg-accent-50/50'}`}
              onDragOver={e  => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e      => { e.preventDefault(); setDragOver(false); handleAttachFiles(e.dataTransfer.files) }}
            >
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p className="text-sm text-gray-500">
                Drag &amp; drop files here, or{' '}
                <span className="text-accent font-semibold">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                {doc?.allowedClientUploadFileTypes?.length > 0
                  ? doc.allowedClientUploadFileTypes.map(t => '.' + t.toUpperCase()).join(', ')
                  : 'Any file type'} · Max 10 MB each
              </p>
              <input type="file" className="hidden" multiple
                accept={doc?.allowedClientUploadFileTypes?.length > 0
                  ? doc.allowedClientUploadFileTypes.map(t => '.' + t).join(',')
                  : undefined}
                onChange={e => { handleAttachFiles(e.target.files); e.target.value = '' }}/>
            </label>
          )}

          {attachments.length >= 5 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700">
              Maximum of 5 attachments reached.
            </div>
          )}

          {/* Uploading indicator */}
          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-accent">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0"/>
              Uploading…
            </div>
          )}

          {/* Error message */}
          {attachError && (
            <p className="mt-3 text-xs text-red-500">{attachError}</p>
          )}

          {/* Uploaded files list */}
          {attachments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {attachments.map(a => (
                <li key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="w-5 h-5 shrink-0 text-gray-400">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={attachFileIcon(a.contentType)}/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.fileName}</p>
                    <p className="text-xs text-gray-400">{formatBytes(a.fileSize)}</p>
                  </div>
                  <span className="text-green-500 shrink-0"><IconCheck className="w-4 h-4" /></span>
                </li>
              ))}
            </ul>
          )}
        </div>}

        <p className="text-center text-xs text-gray-400 mt-6">
          You can close this page at any time. Your signature has been recorded.
        </p>
      </div>
    </div>
  )

  const allRequiredSigned = myFields.filter(f => f.required).every(f => f.signed)
  const signedCount       = myFields.filter(f => f.signed).length

  /* Change page and scroll the page canvas back to the top so the signer starts clean. */
  const changePage = (p) => {
    const next = Math.min(pdfPageCount, Math.max(1, p))
    if (next === pdfCurrentPage) return
    setPdfCurrentPage(next)
    requestAnimationFrame(() =>
      pageWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  /* Segmented toggle: single-page (paged) vs. whole-document (continuous scroll). */
  const renderViewToggle = () => {
    if (pdfPageCount <= 1 || pdfRenderFailed) return null
    const base = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
    const on   = 'bg-accent text-white'
    const off  = 'text-gray-600 hover:text-gray-900'
    return (
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          <button type="button" onClick={() => setViewMode('PAGED')}
            className={`${base} ${viewMode === 'PAGED' ? on : off}`}>
            Single page
          </button>
          <button type="button" onClick={() => setViewMode('CONTINUOUS')}
            className={`${base} ${viewMode === 'CONTINUOUS' ? on : off}`}>
            Whole document
          </button>
        </div>
      </div>
    )
  }

  /* Prev / Page X of Y / Next pager. On the last page, Next becomes Submit Document.
     Rendered both above and below the page canvas so the signer never scrolls back up. */
  const renderPager = (pos) => {
    if (pdfPageCount <= 1) return null
    const isLast = pdfCurrentPage >= pdfPageCount
    return (
      <div className={`flex items-center justify-center gap-3 ${pos === 'top' ? 'mb-3' : 'mt-4'}`}>
        <button type="button" onClick={() => changePage(pdfCurrentPage - 1)} disabled={pdfCurrentPage <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ‹ Prev
        </button>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <span>Page</span>
          <select
            value={pdfCurrentPage}
            onChange={e => changePage(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none
                       focus:border-accent cursor-pointer tabular-nums"
            title="Jump to page"
          >
            {Array.from({ length: pdfPageCount }, (_, i) => i + 1).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span>of {pdfPageCount}</span>
        </div>
        {isLast ? (
          <button type="button" onClick={handleSubmit} disabled={submitting || !allRequiredSigned}
            className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold
                       hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {submitting ? 'Submitting…' : 'Submit Document'}
          </button>
        ) : (
          <button type="button" onClick={() => changePage(pdfCurrentPage + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600
                       hover:bg-gray-50 transition-colors">
            Next ›
          </button>
        )}
      </div>
    )
  }

  const isSignatureOrInitials = activeField &&
    (activeField.fieldType === 'SIGNATURE' || activeField.fieldType === 'INITIALS')
  const isDateOrText = activeField &&
    (activeField.fieldType === 'DATE' || activeField.fieldType === 'TEXT')
  const isStamp = activeField && activeField.fieldType === 'STAMP'

  // How many OTHER unsigned fields of the same type the signer owns (for "apply to all").
  const matchingUnsignedCount = activeField && REUSABLE.includes(activeField.fieldType)
    ? myFields.filter(f => f.fieldType === activeField.fieldType && !f.signed && f.id !== activeField.id).length
    : 0
  const fieldTypeLabel = { SIGNATURE: 'signature', INITIALS: 'initials', DATE: 'date' }

  /* A single field overlay box — used by both the per-page canvas view and the iframe fallback. */
  const renderField = (f) => {
    // Sender pre-filled fields: read-only, show the value, no signer caption / no interaction.
    if (isPrefilled(f)) {
      const sig = f.fieldType === 'SIGNATURE' || f.fieldType === 'INITIALS' || f.fieldType === 'STAMP'
      return (
        <div
          key={f.id}
          title="Pre-filled by sender"
          style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`, width: `${f.width}%`, height: `${f.height}%`,
            border: '1px solid #cbd5e1', background: 'rgba(100,116,139,0.06)',
            borderRadius: 4, boxSizing: 'border-box', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}
        >
          {f.fieldType === 'CHECKBOX' ? (
            <span style={{ fontSize: 16, color: '#334155' }}>{isChecked(f.value) ? '☑' : '☐'}</span>
          ) : sig && f.value ? (
            <SignedFieldInner sigMethod={f.signingMethod} sigValue={f.value} />
          ) : (
            <span style={{ fontSize: f.value ? fieldFontPx(f) : 13, lineHeight: 1.1, color: '#1e293b', fontWeight: 500, textAlign: 'center',
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none' }}>
              {f.value || f.label}
            </span>
          )}
        </div>
      )
    }

    // Checkbox (signer-owned): click toggles in place — no modal, no image.
    if (f.fieldType === 'CHECKBOX') {
      const mine    = isMine(f)
      const checked = isChecked(f._signedValue ?? f.value)
      const colors  = FIELD_COLORS.CHECKBOX
      return (
        <div
          key={f.id}
          onClick={() => mine && !submitted && handleFieldClick(f)}
          title={mine ? 'Click to toggle' : undefined}
          style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`, width: `${f.width}%`, height: `${f.height}%`,
            border: `2px dashed ${mine ? colors.border : '#cbd5e1'}`,
            background: checked ? 'rgba(22,163,74,0.08)' : (mine ? colors.bg : 'rgba(148,163,184,0.10)'),
            borderRadius: 4, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: mine && !submitted ? 'pointer' : 'default',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700,
                         color: checked ? '#16a34a' : (mine ? colors.border : '#94a3b8') }}>
            {applyingId === f.id ? '…' : (checked ? '☑' : '☐')}
          </span>
        </div>
      )
    }
    const colors      = FIELD_COLORS[f.fieldType] || FIELD_COLORS.SIGNATURE
    const isSigned    = !!f.signed
    const mine        = isMine(f)
    const borderColor = isSigned ? '#16a34a' : (mine ? colors.border : '#cbd5e1')
    const bgColor     = isSigned ? 'rgba(22,163,74,0.07)' : (mine ? colors.bg : 'rgba(148,163,184,0.10)')

    // Prefer the value signed in THIS session, else the value returned by the server
    // (so later signatories see the actual signatures already applied by earlier ones).
    const sigValue  = f._signedValue  || f.value
    const sigMethod = f._signedMethod || f.signingMethod
    // Prefer the backend-formatted timestamp (rendered in the SIGNER's timezone with GMT offset).
    const dateStr   = f.signedAtDisplay || fmtSignedAt(f.signedAt)
    const caption   = f.signerName
      ? (dateStr ? `${f.signerName} (${dateStr})` : f.signerName)
      : dateStr

    return (
      <div
        key={f.id}
        style={{
          position:   'absolute',
          left:       `${f.x}%`,
          top:        `${f.y}%`,
          width:      `${f.width}%`,
          height:     `${f.height}%`,
          border:     `2px dashed ${borderColor}`,
          background: bgColor,
          borderRadius: 4,
          cursor:     mine ? 'pointer' : 'default',
          boxSizing:  'border-box',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => handleFieldClick(f)}
        title={mine && isSigned ? 'Click to edit' : undefined}
      >
        {isSigned ? (
          <>
            <SignedFieldInner
              sigMethod={sigMethod}
              sigValue={sigValue}
              signerName={f.fieldType === 'STAMP' ? undefined : f.signerName}
              dateStr={f.fieldType === 'STAMP' ? undefined : dateStr}
              caption={f.fieldType === 'STAMP' ? undefined : caption}
              fontSizePx={TEXTUAL_TYPES.includes(f.fieldType) ? fieldFontPx(f) : undefined}
            />
            {mine && !submitted && (
              // Edit affordance — lets the signer change this entry before submitting.
              <span
                style={{
                  position: 'absolute', top: 2, right: 2, zIndex: 2,
                  width: 16, height: 16, borderRadius: 4,
                  background: '#16a34a', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)', pointerEvents: 'none',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </span>
            )}
          </>
        ) : mine ? (
          <span style={{ fontSize: 10, color: colors.border, fontWeight: 700, textAlign: 'center', padding: '0 4px', userSelect: 'none' }}>
            {applyingId === f.id
              ? 'Applying…'
              : adopted[f.fieldType]
                ? 'Click to apply'
                : `${f.required ? '* ' : ''}${f.label}`}
          </span>
        ) : (
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textAlign: 'center', padding: '0 4px', userSelect: 'none' }}>
            Other signer
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Topbar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center
                         justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <BrandLogo size={32} />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{doc?.title}</p>
            <p className="text-xs text-gray-400">Braify e-Sign</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{signedCount}/{myFields.length} signed</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !allRequiredSigned}
            className="px-4 py-2 rounded-xl text-sm text-white font-semibold
                       disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
            style={{ background: allRequiredSigned ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#9ca3af' }}
          >
            {submitting ? 'Submitting…' : 'Submit Document'}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div className="h-1 bg-accent transition-all duration-500"
          style={{ width: myFields.length ? `${(signedCount / myFields.length) * 100}%` : '0%' }}/>
      </div>

      {/* "Signing as" banner (multi-party documents) */}
      {mySignatory && isMultiParty && (
        <div className="bg-accent-50 border-b border-accent-100 px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-gray-700">
            You're signing as <strong>{mySignatory.name}</strong>
            <span className="text-gray-400"> ({mySignatory.email})</span>
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">
            {coSignatories.length} signatories, {doc?.signingMode === 'SEQUENTIAL' ? 'sign in order' : 'sign in any order'}
          </span>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* PDF + overlays */}
        <div className="flex-1 overflow-y-auto">
          {!pdfUrl ? (
            <div className="flex items-center justify-center h-full min-h-96">
              <Spinner/>
            </div>
          ) : pdfRenderFailed ? (
            /* Fallback: single-page iframe (e.g. if the PDF can't be fetched for canvas
             * rendering). % coords map against an A4 box, matching legacy single-page docs. */
            <div className="relative w-full" style={{ paddingTop: '141.4%' }}>
              <div className="absolute inset-0">
                <iframe
                  src={pdfUrl + '#toolbar=0&view=FitH'}
                  className="absolute inset-0 w-full h-full border-none pointer-events-none"
                  title="Document to sign"
                />
                {fields.map(renderField)}
              </div>
            </div>
          ) : (
            /* Canvas render — either page-by-page (PAGED) or the whole document (CONTINUOUS). */
            <div className="p-3">
              {renderViewToggle()}

              {viewMode === 'CONTINUOUS' ? (
                /* Whole document: every page stacked so the signer can scroll straight through. */
                <div className="space-y-5">
                  {Array.from({ length: pdfPageCount }, (_, i) => i + 1).map(pageNum => (
                    <div key={pageNum}>
                      {pdfPageCount > 1 && (
                        <p className="text-center text-xs text-gray-400 mb-1">Page {pageNum} of {pdfPageCount}</p>
                      )}
                      <div className="relative w-full max-w-4xl mx-auto border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <PdfPageCanvas
                          source={pdfUrl}
                          pageNumber={pageNum}
                          onPageCountChange={setPdfPageCount}
                          onViewport={vp => setPdfScale(vp.scale || 1)}
                          onError={() => setPdfRenderFailed(true)}
                        />
                        <div className="absolute inset-0">
                          {fields.filter(f => (f.page || 1) === pageNum).map(renderField)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {renderPager('top')}

                  <div ref={pageWrapRef} className="relative w-full max-w-4xl mx-auto border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm scroll-mt-4">
                    <PdfPageCanvas
                      source={pdfUrl}
                      pageNumber={pdfCurrentPage}
                      onPageCountChange={setPdfPageCount}
                      onViewport={vp => setPdfScale(vp.scale || 1)}
                      onError={() => setPdfRenderFailed(true)}
                    />
                    <div className="absolute inset-0">
                      {fields.filter(f => (f.page || 1) === pdfCurrentPage).map(renderField)}
                    </div>
                  </div>

                  {renderPager('bottom')}

                  {pdfPageCount > 1 && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                      This document has {pdfPageCount} pages — use Prev / Next to review and sign every page.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar — field checklist */}
        <div className="w-56 bg-white border-l border-gray-200 p-4 overflow-y-auto hidden md:block shrink-0">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Fields to Sign
          </h3>
          <div className="space-y-2">
            {myFields.map(f => {
              const colors = FIELD_COLORS[f.fieldType] || FIELD_COLORS.SIGNATURE
              return (
                <button
                  key={f.id}
                  onClick={() => { setPdfCurrentPage(f.page || 1); handleFieldClick(f) }}
                  title={f.signed ? 'Click to edit' : undefined}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left
                              border transition-colors
                              ${f.signed
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-accent-300 bg-white text-gray-700 hover:bg-accent-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: f.signed ? '#16a34a' : colors.border }}/>
                  <span className="flex-1 truncate text-xs font-medium">{f.label}</span>
                  {f.required && !f.signed && <span className="text-red-400 text-xs font-bold shrink-0">*</span>}
                  {f.signed           && <span className="text-green-500 shrink-0"><IconCheck className="w-3.5 h-3.5" /></span>}
                </button>
              )
            })}
          </div>

          {/* Fill every remaining field with the signature/initials/date you already provided */}
          {myFields.some(f => !f.signed && adopted[f.fieldType]) && (
            <button
              onClick={applyAdoptedToAll}
              disabled={applyingAll}
              className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white
                         disabled:opacity-60 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6D52E8,#5a3fd6)' }}
            >
              {applyingAll ? 'Applying…' : 'Apply to all remaining fields'}
            </button>
          )}

          {myFields.length > 0 && allRequiredSigned && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-green-600 font-semibold text-center inline-flex items-center justify-center gap-1 w-full">Your fields are signed <IconCheck className="w-3.5 h-3.5" /></p>
              <p className="text-[11px] text-gray-400 text-center mt-1.5 leading-snug">
                Review your entries, then submit. Click any signed field to edit it before submitting.
              </p>
            </div>
          )}

          {/* Co-signer status (multi-party documents) */}
          {isMultiParty && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Signatories</h3>
              <div className="space-y-2">
                {coSignatories.map(s => {
                  const isMe = s.id === mySignatoryId
                  const signed = s.status === 'SIGNED'
                  return (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${signed ? 'bg-green-500' : 'bg-gray-300'}`}/>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-gray-700 truncate">
                          {s.name}{isMe && <span className="text-accent font-semibold"> (you)</span>}
                        </span>
                      </span>
                      <span className={`shrink-0 ${signed ? 'text-green-600' : 'text-gray-400'}`}>
                        {signed ? 'Signed' : (s.status === 'VIEWED' ? 'Viewed' : 'Pending')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Signing Modal ── */}
      {activeField && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setActiveField(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {activeField.signed ? 'Edit' : 'Sign'}: <span className="text-accent-700">{activeField.label}</span>
              </h2>
              <button
                onClick={() => setActiveField(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* ── SIGNATURE / INITIALS: tab switcher + canvas or type input ── */}
            {isSignatureOrInitials && (
              <>
                <div className="flex gap-2 mb-4">
                  {['DRAW', 'TYPE', 'UPLOAD'].map(t => (
                    <button
                      key={t}
                      onClick={() => { setModalTab(t); clearCanvas(); setTypedText('') }}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                                  ${modalTab === t
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-accent-300'}`}
                    >
                      {t === 'DRAW' ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          Draw
                        </span>
                      ) : t === 'TYPE' ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          Type
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          Upload
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Draw / Upload canvas */}
                {(modalTab === 'DRAW' || modalTab === 'UPLOAD') && (
                  <>
                    {/*
                     * width/height set the internal pixel resolution.
                     * CSS w-full stretches it visually but getCanvasPoint() scales
                     * the coordinates back, so drawing lands in the right place.
                     */}
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={160}
                      className="border-2 border-dashed border-gray-300 rounded-xl w-full touch-none"
                      style={{ background: '#f8fafc', cursor: modalTab === 'DRAW' ? 'crosshair' : 'default' }}
                      onMouseDown={modalTab === 'DRAW' ? startDraw : undefined}
                      onMouseMove={modalTab === 'DRAW' ? onDraw   : undefined}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                      onTouchStart={modalTab === 'DRAW' ? startDraw : undefined}
                      onTouchMove={modalTab  === 'DRAW' ? onDraw   : undefined}
                      onTouchEnd={stopDraw}
                    />
                    {modalTab === 'DRAW' && (
                      <button onClick={clearCanvas}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
                        Clear
                      </button>
                    )}
                    {modalTab === 'UPLOAD' && (
                      <label className="mt-3 flex items-center gap-2 cursor-pointer text-sm text-accent hover:text-accent-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        Choose image file
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
                      </label>
                    )}
                  </>
                )}

                {/* Typed cursive */}
                {modalTab === 'TYPE' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Type your signature…"
                      value={typedText}
                      onChange={e => setTypedText(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                                 focus:border-accent outline-none text-2xl text-gray-800"
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                    />
                    <p className="text-xs text-gray-400 mt-2">This typed text will be used as your signature</p>
                  </div>
                )}
              </>
            )}

            {/* ── DATE / TEXT: direct input ── */}
            {isDateOrText && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {activeField.fieldType === 'DATE' ? 'Select date' : 'Enter text'}
                </label>
                <input
                  type={activeField.fieldType === 'DATE' ? 'date' : 'text'}
                  value={typedText}
                  autoFocus
                  onChange={e => setTypedText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                             focus:border-accent outline-none text-lg"
                />
                <label className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  Font size
                  <select value={typedFontSize} onChange={e => setTypedFontSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-gray-200 text-sm">
                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map(s => (
                      <option key={s} value={s}>{s} pt</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* ── STAMP: image upload only (aspect-preserved) ── */}
            {isStamp && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Upload stamp image
                </label>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border-2 border-dashed border-gray-300 rounded-xl w-full"
                  style={{ background: '#f8fafc' }}
                />
                <label className="mt-3 flex items-center gap-2 cursor-pointer text-sm text-accent hover:text-accent-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  Choose stamp image (PNG or JPG)
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
                </label>
                <p className="text-xs text-gray-400 mt-2">The stamp is placed with its aspect ratio preserved — it won't be stretched.</p>
              </div>
            )}

            {/* Duplicate to every other field of the same type (all pages) */}
            {matchingUnsignedCount > 0 && (
              <label className="mt-4 flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={e => setApplyToAll(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-accent shrink-0"
                />
                <span className="text-sm text-gray-700 leading-snug">
                  Apply to <strong>all {matchingUnsignedCount} remaining {fieldTypeLabel[activeField.fieldType] || 'matching'} field{matchingUnsignedCount > 1 ? 's' : ''}</strong> in this document
                  <span className="block text-xs text-gray-400 mt-0.5">Fills every page at once — no need to visit each one.</span>
                </span>
              </label>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setActiveField(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600
                           font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignField}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold
                           disabled:opacity-60 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6D52E8,#5a3fd6)' }}
              >
                {saving
                  ? 'Saving…'
                  : applyToAll && matchingUnsignedCount > 0
                    ? `Apply to all ${matchingUnsignedCount + 1}`
                    : (activeField.signed ? 'Update' : 'Apply Signature')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Intent-to-sign confirmation (replaces the native confirm dialog) ── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Sign &amp; submit</h2>
            </div>
            <div className="px-6 py-4 text-sm text-gray-600">
              <p>By submitting, I agree that my electronic signature is the legal equivalent of my
                handwritten signature, that I intend to sign and be bound by this document, and that
                <strong> I cannot make changes after submitting</strong>.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowSubmitConfirm(false)} disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={doSubmit} disabled={submitting}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Sign & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ESIGN/UETA electronic-records-&-signatures consent gate ── */}
      {!hasConsent && !submitted && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Consent to use electronic records &amp; signatures</h2>
            </div>
            <div className="px-6 py-4 text-sm text-gray-600 space-y-3 max-h-[50vh] overflow-y-auto">
              <p>To sign this document electronically, please review and agree to the following:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You consent to receive and sign this document, and related records, in <strong>electronic form</strong> rather than on paper.</li>
                <li>Your electronic signature is <strong>legally binding</strong> and is the equivalent of your handwritten signature.</li>
                <li>You may request a paper copy, or withdraw your consent, by contacting the sender. Withdrawing consent means you will be unable to complete signing electronically.</li>
                <li>To view and sign you need a modern web browser and a device that can display PDF documents.</li>
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={agreeChecked} onChange={e => setAgreeChecked(e.target.checked)} className="mt-0.5"/>
                <span>I have read the disclosure above and I agree to use electronic records and signatures.</span>
              </label>
              <button onClick={handleConsent} disabled={!agreeChecked || consentBusy}
                className="btn btn-accent w-full mt-4 disabled:opacity-40">
                {consentBusy ? 'Recording…' : 'I Agree — Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Small helpers ── */
function Center({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  )
}

function Spinner() {
  return <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"/>
}

/** Compact signature-caption timestamp, e.g. "Jun 29, 2026 15:00". */
function fmtSignedAt(dt) {
  if (!dt) return ''
  try {
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function attachFileIcon(contentType) {
  if (contentType?.startsWith('image/'))
    return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  if (contentType === 'application/pdf')
    return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  if (contentType?.includes('word') || contentType?.includes('document'))
    return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
  if (contentType?.includes('sheet') || contentType?.includes('excel'))
    return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
}
