import { useRef, useState } from 'react'

/**
 * Shared upload area: click to browse OR drag & drop, with one consistent message
 * everywhere in the app.
 *
 * Props:
 *   onFiles(files: File[])  – called with the chosen/dropped files (one item unless `multiple`)
 *   accept                  – same syntax as <input accept>; also enforced for dropped files
 *   multiple                – allow several files
 *   hint                    – secondary line, e.g. ".xlsx · .xls · max 10 MB"
 *   selected                – { title, subtitle? } when a file is already chosen ("replace" state)
 *   size                    – 'lg' | 'md' (stacked, centred) | 'sm' (single row)
 *   invalid                 – red border (form validation)
 *   disabled
 *   className               – extra classes on the zone
 *   children                – optional custom body; replaces the default text (drag highlight still applies)
 */
export default function FileDropZone({
  onFiles, accept, multiple = false, hint, selected, size = 'md',
  invalid = false, disabled = false, className = '', children,
}) {
  const inputRef = useRef(null)
  const depth    = useRef(0)            // dragenter/leave fire for children too — count them
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState('')

  const browse = () => { if (!disabled) inputRef.current?.click() }

  const deliver = list => {
    const files = Array.from(list || [])
    if (!files.length) return
    const ok  = files.filter(f => matchesAccept(f, accept))
    const bad = files.filter(f => !matchesAccept(f, accept))
    setRejected(bad.length ? `${bad.map(f => `"${f.name}"`).join(', ')} is not a supported file type.` : '')
    if (ok.length) onFiles(multiple ? ok : [ok[0]])
  }

  const dragProps = disabled ? {} : {
    onDragEnter: e => { e.preventDefault(); depth.current += 1; setDragging(true) },
    onDragOver:  e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
    onDragLeave: e => { e.preventDefault(); depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false) },
    onDrop:      e => { e.preventDefault(); depth.current = 0; setDragging(false); deliver(e.dataTransfer.files) },
  }

  const row = size === 'sm'
  const tone = dragging ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
    : invalid  ? 'border-red-400 bg-red-50/40 dark:bg-red-900/10'
    : selected ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
    : 'border-gray-300 dark:border-gray-600 hover:border-accent-400 dark:hover:border-accent-500 hover:bg-accent-50/40 dark:hover:bg-accent-900/10'
  const pad = row ? 'p-3' : size === 'lg' ? 'p-10' : 'p-6'
  const noun = multiple ? 'files' : 'your file'

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={browse}
        onKeyDown={e => {
          // Only when the zone itself is focused — not a button inside custom children (e.g. "Remove").
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); browse() }
        }}
        {...dragProps}
        className={`group w-full border-2 border-dashed rounded-xl transition-colors outline-none
                    focus-visible:ring-2 focus-visible:ring-accent-500 ${pad} ${tone}
                    ${row ? 'flex items-center gap-3 text-left' : 'flex flex-col items-center justify-center text-center'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        {children ?? (
          <>
            <UploadIcon state={dragging ? 'drag' : selected ? 'done' : 'idle'} row={row} large={size === 'lg'} />
            <div className={`min-w-0 ${row ? 'flex-1' : ''}`}>
              {dragging ? (
                <p className="text-sm font-semibold text-accent-700 dark:text-accent-300">Drop to upload</p>
              ) : selected ? (
                <>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">{selected.title}</p>
                  {selected.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selected.subtitle}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">Drop a new file or click to replace</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Drop</span> {noun} here, or{' '}
                    <span className="font-semibold text-accent-600 dark:text-accent-400">click to browse</span>
                  </p>
                  {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
                </>
              )}
            </div>
          </>
        )}
      </div>
      {rejected && <p className="mt-1.5 text-xs text-red-500">{rejected}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={e => { deliver(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}

function UploadIcon({ state, row, large }) {
  const box = row ? 'w-9 h-9' : large ? 'w-12 h-12 mb-3' : 'w-10 h-10 mb-2'
  const bg  = state === 'drag' ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-600'
    : state === 'done' ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-400 group-hover:text-accent-500'
  return (
    <div className={`${box} shrink-0 rounded-xl flex items-center justify-center transition-colors ${bg}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {state === 'done'
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>}
      </svg>
    </div>
  )
}

/** Same rules as the browser's <input accept>: ".ext", "type/*" and exact MIME types. */
function matchesAccept(file, accept) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some(rule =>
    rule.startsWith('.') ? name.endsWith(rule)
      : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1))
      : type === rule)
}
