import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resolveShortLink } from '../services/api'

/** /s/:code — opens the in-app page an SMS short link stands for (e.g. a signing link). */
export default function ShortLinkPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    resolveShortLink(code)
      // The API only ever stores app-relative paths; refuse anything else (no open redirect).
      .then(({ path }) => (path?.startsWith('/') && !path.startsWith('//') ? navigate(path, { replace: true }) : setError('Invalid link.')))
      .catch(e => setError(e.message || 'This link has expired or doesn’t exist.'))
  }, [code, navigate])

  return (
    <div className="min-h-screen grid place-items-center bg-ink-9 dark:bg-gray-900 px-6">
      {error ? (
        <div className="card p-8 max-w-sm text-center">
          <p className="font-bold text-ink dark:text-white">Link unavailable</p>
          <p className="text-sm text-ink-3 mt-2">{error}</p>
          <p className="text-sm text-ink-3 mt-2">Check your email for the signing invitation, or sign in to see documents sent to you.</p>
          <Link to="/login" className="btn btn-primary mt-5 inline-flex">Sign in</Link>
        </div>
      ) : (
        <p className="text-sm text-ink-3">Opening…</p>
      )}
    </div>
  )
}
