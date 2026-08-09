/**
 * Public reminder-unsubscribe page — no auth required.
 * URL: /esign/unsubscribe/:token  (linked from the reminder email footer)
 *
 * On load it unsubscribes the signer (identified by the signing token) from reminder emails for
 * that one document. They can re-enable with one click. Signing is unaffected.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import BrandLogo from '../components/ui/BrandLogo'
import { esignUnsubscribeReminders, esignResubscribeReminders } from '../services/api'

export default function ESignUnsubscribePage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState(null)
  const [info,    setInfo]    = useState(null)   // { documentTitle, email, optedOut }

  useEffect(() => {
    esignUnsubscribeReminders(token)
      .then(setInfo)
      .catch(e => setError(e?.response?.data?.message || e.message || 'This link isn’t valid.'))
      .finally(() => setLoading(false))
  }, [token])

  const toggle = async (optOut) => {
    setBusy(true)
    try {
      const res = optOut ? await esignUnsubscribeReminders(token) : await esignResubscribeReminders(token)
      setInfo(res)
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const optedOut = info?.optedOut

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 mb-8">
        <BrandLogo size={36} />
        <span className="text-xl font-bold text-gray-900">Braify e-Sign</span>
      </div>

      <div className="card w-full max-w-md p-8 text-center">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : error ? (
          <>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Link not valid</h1>
            <p className="text-sm text-gray-500">{error}</p>
          </>
        ) : (
          <>
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${optedOut ? 'bg-green-100' : 'bg-accent-100'}`}>
              <svg className={`w-6 h-6 ${optedOut ? 'text-green-600' : 'text-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={optedOut ? 'M5 13l4 4L19 7' : 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'}/>
              </svg>
            </div>

            <h1 className="text-lg font-bold text-gray-900 mb-1">
              {optedOut ? 'Reminders turned off' : 'Reminders are on'}
            </h1>
            <p className="text-sm text-gray-500 mb-1">
              {optedOut
                ? <>You won’t receive any more reminder emails for <strong className="text-gray-700">{info.documentTitle}</strong>.</>
                : <>You’ll keep receiving reminder emails for <strong className="text-gray-700">{info.documentTitle}</strong>.</>}
            </p>
            {info?.email && <p className="text-xs text-gray-400 mb-6">{info.email}</p>}

            <p className="text-xs text-gray-400 mb-5">
              This only affects reminder emails — you can still open and sign the document at any time.
            </p>

            <button
              onClick={() => toggle(!optedOut)}
              disabled={busy}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50
                ${optedOut
                  ? 'border border-accent-300 text-accent bg-accent-50 hover:bg-accent-100'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {busy ? 'Saving…' : optedOut ? 'Re-enable reminders' : 'Unsubscribe from reminders'}
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Need help? <Link to="/" className="text-accent font-semibold">Braify</Link>
      </p>
    </div>
  )
}
