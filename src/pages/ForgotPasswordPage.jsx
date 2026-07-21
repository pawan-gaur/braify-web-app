import { useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'

export default function ForgotPasswordPage() {
  const [email,       setEmail]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [sent,        setSent]        = useState(false)
  const [error,       setError]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headerRight={
        <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          ← Back to <span className="text-brand font-semibold">Sign in</span>
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 mb-6">
            If <strong className="text-gray-700 dark:text-gray-200">{email}</strong> is registered, you'll receive a password reset link within a few minutes.
          </p>
          <Link to="/login" className="btn btn-accent">Back to Sign In</Link>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200
                            dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100
                           placeholder-gray-400 dark:placeholder-gray-500
                           outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" disabled={submitting}
              className="btn btn-accent w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Remember it?{' '}
            <Link to="/login" className="text-brand hover:text-brand-hover font-semibold">Sign in</Link>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
