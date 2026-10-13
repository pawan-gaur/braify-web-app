import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Way back to the signer inbox from the public signing / view pages.
 * Signed-in → straight to /my-documents. Anonymous (arrived from an email link) →
 * sign-in with an email code, pre-filled, landing on the inbox afterwards.
 *
 * variant="button" — full-width secondary button for end-of-flow screens
 * variant="header" — compact link for the page top bar (shown to signed-in users only)
 */
export default function InboxLink({ email, variant = 'button' }) {
  const { isAuthenticated } = useAuth()

  if (variant === 'header') {
    if (!isAuthenticated) return null
    return (
      <Link to="/my-documents"
        className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
        <span aria-hidden="true">←</span> My signatures
      </Link>
    )
  }

  const to = isAuthenticated
    ? '/my-documents'
    : `/login?next=%2Fmy-documents${email ? `&email=${encodeURIComponent(email)}` : ''}`

  return (
    <div className="mt-6 text-center">
      <Link to={to} className="btn btn-secondary w-full justify-center">
        {isAuthenticated ? 'Back to my signatures' : 'View all documents sent to you'}
      </Link>
      {!isAuthenticated && (
        <p className="text-xs text-gray-400 mt-2">
          Sign in with a one-time code sent to your email — no password needed.
        </p>
      )}
    </div>
  )
}
