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
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { esignOpenDocument, esignSignField, esignSubmitDocument, esignUploadAttachment } from '../services/api'

const FIELD_COLORS = {
  SIGNATURE: { border: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  INITIALS:  { border: '#2563eb', bg: 'rgba(37,99,235,0.12)'  },
  DATE:      { border: '#059669', bg: 'rgba(5,150,105,0.12)'  },
  TEXT:      { border: '#d97706', bg: 'rgba(217,119,6,0.12)'  },
}

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

  /* modal state */
  const [activeField, setActiveField] = useState(null)
  const [modalTab,    setModalTab]    = useState('DRAW')   // DRAW | TYPE | UPLOAD
  const [typedText,   setTypedText]   = useState('')
  const [saving,      setSaving]      = useState(false)

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

  /* ── Load document ── */
  useEffect(() => {
    esignOpenDocument(token)
      .then(d => {
        setDoc(d)
        setFields(d.fields || [])
        if (d.sourcePdfBase64) {
          const bytes = Uint8Array.from(atob(d.sourcePdfBase64), c => c.charCodeAt(0))
          setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
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
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        hasDrawn.current = true
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  /* ── Open modal ── */
  function openModal(field) {
    setActiveField(field)
    setModalTab('DRAW')
    // Pre-fill date with today
    setTypedText(field.fieldType === 'DATE' ? new Date().toISOString().split('T')[0] : '')
    hasDrawn.current = false
    // Clear canvas on next tick (after it mounts)
    setTimeout(() => clearCanvas(), 0)
  }

  /* ── Apply signature ── */
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

      const updated = await esignSignField(token, activeField.id, { signingMethod: method, value })

      setFields(prev => prev.map(f =>
        f.id === activeField.id
          ? { ...f, ...updated, signed: true, _signedValue: value, _signedMethod: method }
          : f
      ))
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
  async function handleSubmit() {
    const unsignedRequired = fields.filter(f => f.required && !f.signed)
    if (unsignedRequired.length > 0) {
      alert(`Please sign all required fields (${unsignedRequired.length} remaining)`)
      return
    }
    if (!confirm('Submit document? You cannot make changes after submitting.')) return
    setSubmitting(true)
    try {
      await esignSubmitDocument(token)
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
    for (const file of files) {
      if (attachments.length >= 5) { setAttachError('Maximum of 5 files reached.'); break }
      if (file.size > 10 * 1024 * 1024) { setAttachError(`"${file.name}" exceeds the 10 MB limit.`); continue }
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
        <div className="text-5xl mb-4">🔒</div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Signed!</h1>
          <p className="text-gray-500 text-sm">
            Thank you, <strong>{doc?.clientName}</strong>. Your signed document will be emailed to you shortly.
          </p>
        </div>

        {/* ── Optional attachment upload card (only shown when creator enabled it) ── */}
        {doc?.allowClientUpload && <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📎</span>
            <h2 className="text-base font-bold text-gray-800">Upload Supporting Documents</h2>
            <span className="ml-1 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Attach any supporting documents (e.g. ID copy, proof of address). Up to 5 files, 10 MB each.
          </p>

          {/* Drop zone */}
          {attachments.length < 5 && (
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors
                          ${dragOver
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50'}`}
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
                <span className="text-purple-600 font-semibold">browse</span>
              </p>
              <p className="text-xs text-gray-400">Any file type · Max 10 MB each</p>
              <input type="file" className="hidden" multiple
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
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-600">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0"/>
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
                  <span className="text-xl shrink-0">{attachFileIcon(a.contentType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.fileName}</p>
                    <p className="text-xs text-gray-400">{formatBytes(a.fileSize)}</p>
                  </div>
                  <span className="text-green-500 text-base shrink-0">✓</span>
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

  const allRequiredSigned = fields.filter(f => f.required).every(f => f.signed)
  const signedCount       = fields.filter(f => f.signed).length

  const isSignatureOrInitials = activeField &&
    (activeField.fieldType === 'SIGNATURE' || activeField.fieldType === 'INITIALS')
  const isDateOrText = activeField &&
    (activeField.fieldType === 'DATE' || activeField.fieldType === 'TEXT')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Topbar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center
                         justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{doc?.title}</p>
            <p className="text-xs text-gray-400">Braify e-Sign</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{signedCount}/{fields.length} signed</span>
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
        <div className="h-1 bg-purple-600 transition-all duration-500"
          style={{ width: fields.length ? `${(signedCount / fields.length) * 100}%` : '0%' }}/>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* PDF + overlays — A4 aspect-ratio container keeps % coords aligned */}
        <div className="flex-1 overflow-y-auto">
          {pdfUrl ? (
            /*
             * paddingTop: 141.4% locks the container to A4 aspect ratio (width × √2).
             * Field x/y/width/height percentages were computed in the builder against
             * the same ratio, so they map pixel-perfectly here at any window width.
             */
            <div className="relative w-full" style={{ paddingTop: '141.4%' }}>
              <div className="absolute inset-0">
                <iframe
                  src={pdfUrl + '#toolbar=0&view=FitH'}
                  className="absolute inset-0 w-full h-full border-none pointer-events-none"
                  title="Document to sign"
                />

                {/* Field overlays */}
                {fields.map(f => {
                  const colors   = FIELD_COLORS[f.fieldType] || FIELD_COLORS.SIGNATURE
                  const isSigned = !!f.signed
                  return (
                    <div
                      key={f.id}
                      style={{
                        position:   'absolute',
                        left:       `${f.x}%`,
                        top:        `${f.y}%`,
                        width:      `${f.width}%`,
                        height:     `${f.height}%`,
                        border:     `2px dashed ${isSigned ? '#16a34a' : colors.border}`,
                        background: isSigned ? 'rgba(22,163,74,0.07)' : colors.bg,
                        borderRadius: 4,
                        cursor:     isSigned ? 'default' : 'pointer',
                        boxSizing:  'border-box',
                        overflow:   'hidden',
                        display:    'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => { if (!isSigned) openModal(f) }}
                    >
                      {isSigned ? (
                        /* Render actual signed content */
                        f._signedMethod === 'TYPE' ? (
                          <span style={{
                            fontFamily: 'cursive',
                            color: '#1e293b',
                            fontSize: 13,
                            padding: '2px 4px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            width: '100%',
                            textAlign: 'center',
                          }}>
                            {f._signedValue}
                          </span>
                        ) : f._signedValue ? (
                          <img
                            src={f._signedValue}
                            alt="signature"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ Signed</span>
                        )
                      ) : (
                        <span style={{
                          fontSize: 10, color: colors.border, fontWeight: 700,
                          textAlign: 'center', padding: '0 4px',
                          userSelect: 'none',
                        }}>
                          {f.required ? '* ' : ''}{f.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-96">
              <Spinner/>
            </div>
          )}
        </div>

        {/* Right sidebar — field checklist */}
        <div className="w-56 bg-white border-l border-gray-200 p-4 overflow-y-auto hidden md:block shrink-0">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Fields to Sign
          </h3>
          <div className="space-y-2">
            {fields.map(f => {
              const colors = FIELD_COLORS[f.fieldType] || FIELD_COLORS.SIGNATURE
              return (
                <button
                  key={f.id}
                  onClick={() => { if (!f.signed) openModal(f) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left
                              border transition-colors
                              ${f.signed
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-purple-300 bg-white text-gray-700 hover:bg-purple-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: f.signed ? '#16a34a' : colors.border }}/>
                  <span className="flex-1 truncate text-xs font-medium">{f.label}</span>
                  {f.required && !f.signed && <span className="text-red-400 text-xs font-bold shrink-0">*</span>}
                  {f.signed           && <span className="text-green-500 text-xs shrink-0">✓</span>}
                </button>
              )
            })}
          </div>

          {fields.length > 0 && allRequiredSigned && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-green-600 font-semibold text-center">All fields signed ✓</p>
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
                Sign: <span className="text-purple-700">{activeField.label}</span>
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
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                    >
                      {t === 'DRAW' ? '✏️ Draw' : t === 'TYPE' ? 'Aa Type' : '⬆️ Upload'}
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
                      <label className="mt-3 flex items-center gap-2 cursor-pointer text-sm text-purple-600 hover:text-purple-700">
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
                                 focus:border-purple-500 outline-none text-2xl text-gray-800"
                      style={{ fontFamily: 'cursive' }}
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
                             focus:border-purple-500 outline-none text-lg"
                />
              </div>
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
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
              >
                {saving ? 'Saving…' : 'Apply Signature'}
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
  return <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function attachFileIcon(contentType) {
  if (!contentType) return '📄'
  if (contentType.startsWith('image/'))       return '🖼️'
  if (contentType === 'application/pdf')      return '📑'
  if (contentType.includes('word') || contentType.includes('document')) return '📝'
  if (contentType.includes('sheet') || contentType.includes('excel'))   return '📊'
  return '📄'
}
