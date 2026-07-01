/**
 * Public, read-only document viewer for CC ("keep in the loop") recipients.
 * URL: /esign/view/:token  (token = an ESIGN_VIEW token — can only view, never sign or download)
 *
 * Shows the source PDF while the document is in progress, and the signed PDF once completed.
 * The PDF is fetched same-origin as a blob and rendered page-by-page via pdf.js, so there is no
 * built-in download control and cloud PDFs render without needing bucket CORS.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { esignOpenView, esignViewPdf } from '../services/api'
import PdfPageCanvas from '../components/esign/PdfPageCanvas'

const STATUS_LABELS = {
  DRAFT: 'Draft', PENDING: 'Pending', IN_REVIEW: 'In review',
  PARTIALLY_SIGNED: 'Partially signed', SIGNED: 'Signed',
  COMPLETED: 'Completed', EXPIRED: 'Expired', CANCELLED: 'Cancelled',
}

export default function ESignViewPage() {
  const { token } = useParams()

  const [doc,     setDoc]     = useState(null)
  const [pdfUrl,  setPdfUrl]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [pageCount, setPageCount] = useState(1)
  const [page,      setPage]      = useState(1)

  useEffect(() => {
    let objectUrl
    Promise.all([esignOpenView(token), esignViewPdf(token)])
      .then(([d, blob]) => {
        setDoc(d)
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      })
      .catch(e => setError(e?.message || 'This view link is invalid or has expired.'))
      .finally(() => setLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [token])

  if (loading) return (
    <Center><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"/></Center>
  )
  if (error) return (
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

  const completed = doc?.status === 'COMPLETED'
  const sigs = doc?.signatories || []

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between
                         sticky top-0 z-40 shadow-sm gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#6D52E8,#5a3fd6)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{doc?.title}</p>
            <p className="text-xs text-gray-400">Braify e-Sign · view only</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
            ${completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[doc?.status] || doc?.status}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
            View only
          </span>
        </div>
      </header>

      {/* Co-signer status strip */}
      {sigs.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {sigs.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2 h-2 rounded-full ${s.status === 'SIGNED' ? 'bg-green-500' : s.status === 'VIEWED' ? 'bg-blue-400' : 'bg-gray-300'}`}/>
              {s.name}
              <span className={`font-semibold ${s.status === 'SIGNED' ? 'text-green-600' : 'text-gray-400'}`}>
                · {s.status === 'SIGNED' ? 'Signed' : s.status === 'VIEWED' ? 'Viewed' : 'Pending'}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Page navigation */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 bg-gray-50 border-b border-gray-200">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600
                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ‹ Prev
          </button>
          <span className="text-sm font-medium text-gray-600">Page {page} of {pageCount}</span>
          <button type="button" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600
                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Next ›
          </button>
        </div>
      )}

      {/* PDF */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="relative w-full max-w-4xl mx-auto border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {pdfUrl
              ? <PdfPageCanvas source={pdfUrl} pageNumber={page} onPageCountChange={setPageCount} />
              : <div className="h-96 flex items-center justify-center text-gray-400 text-sm">No document to display</div>}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            This is a read-only view. {completed ? 'You are viewing the signed document.' : 'The document is still being signed.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function Center({ children }) {
  return <div className="min-h-screen flex items-center justify-center bg-gray-50">{children}</div>
}
