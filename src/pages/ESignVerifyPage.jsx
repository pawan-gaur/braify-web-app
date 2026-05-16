/**
 * Public document verification page — no auth required.
 * URL: /verify/:id
 *
 * Shows:
 *  - Document status (COMPLETED = verified)
 *  - Client name, email
 *  - Completion timestamp
 *  - SHA-256 hash for tamper-detection
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { esignVerifyDocument } from '../services/api'

export default function ESignVerifyPage() {
  const { id } = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    esignVerifyDocument(id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900">Braify e-Sign</span>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 w-full max-w-md p-8">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Verified badge */}
            <div className="text-center mb-6">
              {data.verified ? (
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
                  </svg>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {data.verified ? 'Document Verified ✓' : 'Not Yet Complete'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {data.verified
                  ? 'This document was electronically signed via Braify e-Sign'
                  : 'This document has not been fully signed yet'}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <InfoRow label="Document Title"   value={data.title}/>
              <InfoRow label="Signed By"        value={`${data.clientName} (${data.clientEmail})`}/>
              <InfoRow label="Status"           value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${data.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {data.status}
                </span>
              }/>
              {data.completedAt && (
                <InfoRow label="Completed At"   value={fmtDate(data.completedAt)}/>
              )}
              {data.signedPdfHash && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Document Hash (SHA-256)
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 break-all bg-gray-50
                                border border-gray-200 rounded-lg px-3 py-2">
                    {data.signedPdfHash}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Compare this hash with your downloaded PDF to verify document integrity.
                  </p>
                </div>
              )}
            </div>

            {/* Document ID */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Document ID: <span className="font-mono">{data.documentId}</span>
              </p>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Powered by <span className="font-semibold text-purple-600">Braify e-Sign</span>
      </p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500 font-medium shrink-0 mr-3">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  )
}

import { parseUtc } from '../utils/date'
function fmtDate(iso) {
  const d = parseUtc(iso)
  if (!d) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}
