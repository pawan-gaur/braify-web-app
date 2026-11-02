import * as pdfjsLib from 'pdfjs-dist'
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

/**
 * Largest PDF we send as base64 JSON. Base64 adds ~33%, and both nginx
 * (client_max_body_size 20M) and Jackson (20M-char string limit) reject
 * anything much over ~15 MB, so stay well below that.
 */
export const MAX_PDF_BYTES = 10 * 1024 * 1024

/** Render settings tried in order until the PDF fits: [scale, jpegQuality]. 1.0 ≈ 72 DPI. */
const PASSES = [[2.0, 0.75], [1.5, 0.7], [1.25, 0.6], [1.0, 0.5]]

/** Byte size of the file behind a base64 data URL (or bare base64 string). */
export function dataUrlBytes(dataUrl) {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor(b64.length * 3 / 4) - pad
}

export const fmtMb = bytes => bytes < 1024 * 1024
  ? `${Math.round(bytes / 1024)} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`

function dataUrlToBytes(dataUrl) {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToDataUrl(bytes) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(new Blob([bytes], { type: 'application/pdf' }))
  })
}

async function renderPass(pdf, scale, quality, onProgress) {
  const { PDFDocument } = await import('pdf-lib')
  const out = await PDFDocument.create()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n, pdf.numPages)
    const page     = await pdf.getPage(n)
    const pointVp  = page.getViewport({ scale: 1 })      // page size in PDF points
    const renderVp = page.getViewport({ scale })
    canvas.width  = Math.ceil(renderVp.width)
    canvas.height = Math.ceil(renderVp.height)
    ctx.fillStyle = '#fff'                               // JPEG has no alpha — avoid black backgrounds
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // 'print' intent: draws form-field appearances (we're flattening) and skips
    // requestAnimationFrame, which pauses while the browser tab is in the background.
    await page.render({ canvasContext: ctx, viewport: renderVp, intent: 'print' }).promise
    page.cleanup()

    const jpeg = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    const img  = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()))
    // Same page size (in points) as the original, so placed field coordinates line up.
    out.addPage([pointVp.width, pointVp.height])
       .drawImage(img, { x: 0, y: 0, width: pointVp.width, height: pointVp.height })
  }
  canvas.width = canvas.height = 0
  return out.save()
}

/**
 * Returns the PDF unchanged when it is within MAX_PDF_BYTES. Otherwise rebuilds it from
 * page images (JPEG), lowering resolution until it fits. The result looks the same but
 * its text is no longer selectable. Throws if even the smallest pass is too large.
 *
 * @returns {{ dataUrl: string, compressed: boolean, originalBytes: number, bytes: number }}
 */
export async function compressPdfIfLarge(dataUrl, { maxBytes = MAX_PDF_BYTES, onProgress } = {}) {
  const originalBytes = dataUrlBytes(dataUrl)
  if (originalBytes <= maxBytes) return { dataUrl, compressed: false, originalBytes, bytes: originalBytes }

  // A private worker: pdf.js shares one PDFWorker per port, so destroying our document
  // on the global port would also tear down the worker the page's PDF preview uses.
  const webWorker = new PdfjsWorker()
  const worker    = new pdfjsLib.PDFWorker({ port: webWorker })
  try {
    const pdf = await pdfjsLib.getDocument({ data: dataUrlToBytes(dataUrl), worker }).promise
    for (const [scale, quality] of PASSES) {
      const bytes = await renderPass(pdf, scale, quality, onProgress)
      if (bytes.length <= maxBytes) {
        return { dataUrl: await bytesToDataUrl(bytes), compressed: true, originalBytes, bytes: bytes.length }
      }
    }
  } finally {
    worker.destroy()
    webWorker.terminate()
  }
  throw new Error(
    `This PDF is ${fmtMb(originalBytes)} and could not be compressed below ${fmtMb(maxBytes)}. ` +
    'Please split it into smaller documents and try again.')
}
