import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
// Bundle the worker via Vite's ?worker (emits a .js chunk and instantiates it for us)
// instead of ?url. A ?url import emits a .mjs file, and many production static hosts serve
// .mjs with a non-JS MIME type, which blocks the module worker from loading — leaving the
// PDF blank in prod while it works in dev. ?worker sidesteps the MIME/path problem entirely.
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker()

/**
 * Renders a single page of a PDF to a <canvas> via pdfjs-dist.
 * The canvas fills its parent's width (and takes the page's natural height), so an
 * absolutely-positioned overlay using percentage coordinates maps onto the page exactly.
 *
 * @param source            the PDF, either a base64 string (with/without data: prefix) OR an
 *                          http(s)/blob URL (e.g. a cloud pre-signed URL)
 * @param pageNumber        1-based page to render
 * @param onPageCountChange called once the PDF is parsed with its total page count
 * @param onError           called if the PDF can't be loaded/rendered (e.g. CORS on a cloud URL),
 *                          so callers can fall back to another viewer
 */
export default function PdfPageCanvas({ source, pageNumber, onPageCountChange, onError, onViewport, zoom = 1 }) {
  const canvasRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!source || !canvasRef.current) return
    let cancelled = false
    setFailed(false)

    ;(async () => {
      try {
        const isUrl = /^(https?:|blob:)/i.test(source)
        let loadParams
        if (isUrl) {
          loadParams = { url: source }
        } else {
          const b64   = source.includes(',') ? source.split(',')[1] : source
          const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
          loadParams  = { data: bytes }
        }
        const pdf = await pdfjsLib.getDocument(loadParams).promise
        if (cancelled) return

        onPageCountChange?.(pdf.numPages)

        const safePageNum = Math.min(Math.max(pageNumber || 1, 1), pdf.numPages)
        const page        = await pdf.getPage(safePageNum)
        if (cancelled) return

        const canvas    = canvasRef.current
        if (!canvas) return
        const container = canvas.parentElement
        const cssWidth  = container ? (container.clientWidth || 600) : 600
        const viewport  = page.getViewport({ scale: 1 })
        // CSS px per PDF point — used both for the overlay font sizing (WYSIWYG) and as the
        // display width. The BUFFER is rendered at cssScale × devicePixelRatio so text stays
        // crisp on high-DPI / mobile screens (otherwise a fit-to-width A4 page is upscaled & blurry).
        const cssScale  = cssWidth / viewport.width
        const dpr       = Math.min(window.devicePixelRatio || 1, 3)
        const scaled    = page.getViewport({ scale: cssScale * dpr })

        canvas.width  = scaled.width           // high-res backing buffer
        canvas.height = scaled.height
        canvas.style.width  = '100%'           // displayed at the container's CSS width
        canvas.style.height = 'auto'

        // Report the CSS-px scale (not the DPR-inflated buffer scale) so overlay text renders
        // at the correct on-screen size and matches the final PDF.
        onViewport?.({ scale: cssScale, pageWidthPt: viewport.width, pageHeightPt: viewport.height,
                       pxWidth: cssWidth, pxHeight: scaled.height / dpr })

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: ctx, viewport: scaled }).promise
      } catch (err) {
        if (!cancelled) { console.error('PDF render error:', err); setFailed(true); onError?.(err) }
      }
    })()

    return () => { cancelled = true }
  }, [source, pageNumber, zoom])   // re-render at the new width when the zoom level changes

  if (failed) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-1 bg-gray-50 text-center px-4"
           style={{ minHeight: 360 }}>
        <p className="text-sm font-medium text-gray-500">Unable to display the PDF</p>
        <p className="text-xs text-gray-400">Please reload the page, or try a different browser.</p>
      </div>
    )
  }

  return <canvas ref={canvasRef} className="block w-full" />
}
