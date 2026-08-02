/**
 * Signature capture modal for the builder (sender pre-signs their own fields).
 * Three tabs — Draw (canvas), Type (rendered text), Upload (image file).
 * onApply({ value, method }): value is a PNG data-URL for DRAW/UPLOAD, or the typed
 * string for TYPE; method is DRAW | TYPE | UPLOAD (matches the signing flow).
 */
import { useEffect, useRef, useState } from 'react'

function canvasPoint(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  const src = e.touches ? e.touches[0] : e
  return {
    x: (src.clientX - rect.left) * (canvas.width / rect.width),
    y: (src.clientY - rect.top) * (canvas.height / rect.height),
  }
}

export default function SignatureCaptureModal({ open, kind = 'SIGNATURE', uploadOnly = false, initialValue, initialMethod, onClose, onApply }) {
  const [tab, setTab]   = useState(uploadOnly ? 'UPLOAD' : 'DRAW')     // DRAW | TYPE | UPLOAD
  const [typed, setTyped] = useState('')
  const [uploaded, setUploaded] = useState(null)  // data-URL
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const hasDrawn  = useRef(false)

  useEffect(() => {
    if (!open) return
    if (uploadOnly) { setTab('UPLOAD'); if (initialValue) setUploaded(initialValue); return }
    // Seed from an existing value so "re-sign" is an edit, not a blank slate.
    if (initialMethod === 'TYPE' && initialValue) { setTab('TYPE'); setTyped(initialValue) }
    else if (initialMethod === 'UPLOAD' && initialValue) { setTab('UPLOAD'); setUploaded(initialValue) }
    else { setTab('DRAW') }
  }, [open])

  useEffect(() => {
    if (!open || tab !== 'DRAW') return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    hasDrawn.current = false
  }, [open, tab])

  if (!open) return null

  const label = kind === 'INITIALS' ? 'Initials' : kind === 'STAMP' ? 'Stamp' : 'Signature'

  function start(e) {
    e.preventDefault()
    drawing.current = true
    const c = canvasRef.current, ctx = c.getContext('2d')
    const p = canvasPoint(e, c)
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
  }
  function move(e) {
    if (!drawing.current) return
    e.preventDefault()
    const c = canvasRef.current, ctx = c.getContext('2d')
    const p = canvasPoint(e, c)
    ctx.lineTo(p.x, p.y); ctx.stroke()
    hasDrawn.current = true
  }
  function end() { drawing.current = false }
  function clearCanvas() {
    const c = canvasRef.current, ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    hasDrawn.current = false
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploaded(reader.result)
    reader.readAsDataURL(file)
  }

  function canApply() {
    if (tab === 'TYPE')   return typed.trim().length > 0
    if (tab === 'UPLOAD') return !!uploaded
    return hasDrawn.current
  }

  function apply() {
    if (tab === 'TYPE')   return onApply({ value: typed.trim(), method: 'TYPE' })
    if (tab === 'UPLOAD') return onApply({ value: uploaded, method: 'UPLOAD' })
    return onApply({ value: canvasRef.current.toDataURL('image/png'), method: 'DRAW' })
  }

  const TABS = uploadOnly
    ? [{ key: 'UPLOAD', label: 'Upload' }]
    : [
        { key: 'DRAW',   label: 'Draw'   },
        { key: 'TYPE',   label: 'Type'   },
        { key: 'UPLOAD', label: 'Upload' },
      ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Add your {label.toLowerCase()}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-accent-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'DRAW' && (
            <div>
              <canvas ref={canvasRef} width={440} height={160}
                className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white touch-none cursor-crosshair"
                onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
              <button onClick={clearCanvas} className="mt-2 text-xs text-gray-500 hover:text-red-500">Clear</button>
            </div>
          )}
          {tab === 'TYPE' && (
            <div>
              <input type="text" value={typed} onChange={e => setTyped(e.target.value)}
                placeholder={`Type your ${label.toLowerCase()}`}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500" />
              {typed.trim() && (
                <div className="mt-3 h-24 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                  <span style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 26, color: '#111827' }}>{typed}</span>
                </div>
              )}
            </div>
          )}
          {tab === 'UPLOAD' && (
            <div>
              <input type="file" accept="image/*" onChange={handleUpload}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100" />
              {uploaded && (
                <div className="mt-3 h-28 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                  <img src={uploaded} alt="preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={apply} disabled={!canApply()} className="btn btn-accent btn-sm disabled:opacity-40">Apply</button>
        </div>
      </div>
    </div>
  )
}
