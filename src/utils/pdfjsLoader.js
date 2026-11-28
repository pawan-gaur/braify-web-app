/**
 * Shared, lazy pdf.js loader. pdfjs-dist and its worker are only fetched — and the worker
 * only spawned — the first time a PDF is actually loaded, not when a page module is imported.
 *
 * This is the ONLY place that assigns GlobalWorkerOptions.workerPort, so modules can't
 * clobber each other's worker.
 *
 * The worker is bundled via Vite's ?worker (a .js chunk) rather than ?url (a .mjs file),
 * which some prod static hosts serve with a non-JS MIME type and refuse to load — leaving
 * PDFs blank in prod while they work in dev.
 */

let pdfjsPromise = null

const loadLib        = () => import('pdfjs-dist')
const loadWorkerCtor = () => import('pdfjs-dist/build/pdf.worker.min.mjs?worker').then(m => m.default)

/** Resolves to the pdfjs-dist module with the shared global worker port set (once). */
export function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([loadLib(), loadWorkerCtor()])
      .then(([pdfjsLib, PdfjsWorker]) => {
        pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker()
        return pdfjsLib
      })
      .catch(err => { pdfjsPromise = null; throw err })   // allow a retry after a failed chunk load
  }
  return pdfjsPromise
}

/**
 * A private pdf.js worker, for callers that destroy their documents/worker afterwards
 * (destroying a document on the shared global port would tear down the worker the page's
 * PDF preview uses). Caller must call `worker.destroy()` and `webWorker.terminate()`.
 */
export async function createPrivatePdfWorker() {
  const [pdfjsLib, PdfjsWorker] = await Promise.all([loadLib(), loadWorkerCtor()])
  const webWorker = new PdfjsWorker()
  const worker    = new pdfjsLib.PDFWorker({ port: webWorker })
  return { pdfjsLib, webWorker, worker }
}
