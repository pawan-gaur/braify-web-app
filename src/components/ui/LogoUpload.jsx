import { useRef, useState } from 'react'

/**
 * Logo picker supporting two sources:
 *  - Upload: reads a file as a base64 data-URL (backend offloads it to cloud storage).
 *  - Image URL: a direct https link to an already-hosted image.
 *
 * @param {string|null} logoBase64 - data-URL of a freshly picked file (or null)
 * @param {string|null} logoUrl    - saved logo URL (app-served for uploads, or an external URL)
 * @param {Function}    onChange   - called with { base64, url } (either/both null)
 * @param {string}      label      - field label
 */
export default function LogoUpload({ logoBase64, logoUrl, onChange, label = 'Organisation Logo' }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)

  // An uploaded logo is served from our own endpoint; anything else in logoUrl is a user URL.
  const isExternalUrl = !!logoUrl && !logoBase64 && !logoUrl.includes('/api/public/branding/')
  const [mode, setMode] = useState(isExternalUrl ? 'url' : 'upload')
  const [urlInput, setUrlInput] = useState(isExternalUrl ? logoUrl : '')

  const preview = logoBase64 || logoUrl

  const readFile = (file) => {
    setError(null)
    if (!file) return
    const ok = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp']
    if (!ok.includes(file.type)) { setError('Unsupported format. Use PNG, JPG, SVG, GIF or WebP.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be smaller than 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ base64: ev.target.result, url: null })
    reader.readAsDataURL(file)
  }

  const handleFile = (e) => readFile(e.target.files?.[0])
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]) }

  const commitUrl = (value) => {
    setUrlInput(value)
    const v = value.trim()
    if (!v) { setError(null); onChange({ base64: null, url: null }); return }
    if (!/^https?:\/\//i.test(v)) { setError('Enter a valid URL starting with http:// or https://'); return }
    setError(null)
    onChange({ base64: null, url: v })
  }

  const removeLogo = () => { setError(null); setUrlInput(''); onChange({ base64: null, url: null }) }

  const tab = (key, text) => (
    <button type="button" onClick={() => setMode(key)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
        mode === key ? 'bg-brand-600 text-white' : 'text-ink-3 hover:bg-ink-8 dark:hover:bg-gray-700'}`}>
      {text}
    </button>
  )

  return (
    <div>
      {label && <p className="form-label mb-2">{label}</p>}

      <div className="inline-flex gap-1 mb-3 p-1 rounded-xl border border-ink-7 dark:border-gray-700">
        {tab('upload', 'Upload')}
        {tab('url', 'Image URL')}
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed
            cursor-pointer transition-all select-none
            ${dragging
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
              : 'border-ink-7 dark:border-gray-700 bg-ink-8 dark:bg-gray-800/50 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/10'}
            ${preview ? 'py-4' : 'py-10'}`}
        >
          {preview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={preview} alt="Logo preview" className="max-h-20 max-w-[240px] object-contain rounded-lg"
                onClick={e => e.stopPropagation()} />
              <p className="text-xs text-ink-4">Click anywhere to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                ${dragging ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-ink-8 dark:bg-gray-700'}`}>
                <svg className={`w-6 h-6 transition-colors ${dragging ? 'text-brand-500' : 'text-ink-4'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {dragging ? 'Drop to upload' : 'Drag & drop your logo here'}
                </p>
                <p className="text-xs text-ink-4 mt-0.5">or click to browse — PNG, JPG, SVG · max 2 MB</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            type="url"
            className="form-input"
            placeholder="https://cdn.example.com/logo.png"
            value={urlInput}
            onChange={e => commitUrl(e.target.value)}
          />
          <p className="text-xs text-ink-4 mt-1.5">Paste a public https link to your logo image.</p>
          {preview && (
            <div className="mt-3 flex items-center gap-3">
              <img src={preview} alt="Logo preview"
                className="max-h-16 max-w-[200px] object-contain rounded-lg border border-ink-7 dark:border-gray-700 p-1"
                onError={() => setError('Could not load image from that URL.')} />
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          {error}
        </p>
      )}

      {preview && (
        <button type="button" onClick={removeLogo}
          className="mt-2 text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Remove logo
        </button>
      )}

      <input ref={inputRef} type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
        className="hidden" onChange={handleFile} />
    </div>
  )
}
