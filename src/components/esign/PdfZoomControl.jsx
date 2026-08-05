/**
 * Zoom control for the PDF viewer (− / % / + with a Fit reset). 1 = fit width, up to 3×.
 * Pair with a wrapper whose width is `${zoom*100}%` inside an `overflow-x-auto` container,
 * and pass the same `zoom` to <PdfPageCanvas zoom={zoom}/> so it re-renders sharply.
 */
export function clampZoom(z) {
  return Math.min(3, Math.max(1, Math.round(z * 100) / 100))
}

export default function PdfZoomControl({ zoom, setZoom, className = '' }) {
  const btn = 'w-8 h-8 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 ' +
    'hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className={`flex justify-center mb-3 ${className}`}>
      <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700
                      bg-white dark:bg-gray-800 px-1 py-0.5 shadow-sm">
        <button type="button" title="Zoom out" onClick={() => setZoom(z => clampZoom(z - 0.25))}
          disabled={zoom <= 1} className={btn}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
          </svg>
        </button>
        <span className="min-w-[3rem] text-center text-sm font-medium text-gray-700 dark:text-gray-200 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" title="Zoom in" onClick={() => setZoom(z => clampZoom(z + 0.25))}
          disabled={zoom >= 3} className={btn}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        {zoom !== 1 && (
          <button type="button" title="Reset zoom" onClick={() => setZoom(1)}
            className="ml-1 px-2 h-8 text-xs font-medium text-accent-600 dark:text-accent-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            Fit
          </button>
        )}
      </div>
    </div>
  )
}
