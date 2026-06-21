import { useState } from 'react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-accent-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}>
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
        </div>

        <div className="card dark:bg-gray-800 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                If <strong>{email}</strong> is registered, you'll receive a password reset link within a few minutes.
              </p>
              <Link to="/login" className="btn btn-primary">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Forgot password?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200
                                dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full btn btn-primary py-2.5 justify-center">
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-400">
                Remember it?{' '}
                <Link to="/login" className="text-brand hover:text-brand-hover font-semibold">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
