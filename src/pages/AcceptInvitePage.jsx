import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { validateInviteToken, acceptInvite } from '../services/api'

export default function AcceptInvitePage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const token      = params.get('token') || ''

  const [tokenInfo,   setTokenInfo]   = useState(null)
  const [validating,  setValidating]  = useState(true)
  const [tokenError,  setTokenError]  = useState(null)
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    if (!token) { setTokenError('No invitation token provided.'); setValidating(false); return }
    validateInviteToken(token)
      .then(setTokenInfo)
      .catch(err => setTokenError(err.message || 'Invalid or expired invitation link.'))
      .finally(() => setValidating(false))
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    try {
      await acceptInvite(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Failed to set password.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Layout shell ── */
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
          {validating ? (
            <div className="flex flex-col items-center gap-4 py-8 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p>Validating your invitation…</p>
            </div>
          ) : tokenError ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Link Invalid</h2>
              <p className="text-sm text-gray-500 mb-6">{tokenError}</p>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">All set!</h2>
              <p className="text-sm text-gray-500 mb-6">Your password has been set. You can now sign in.</p>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Accept Invitation</h1>
              <p className="text-sm text-gray-500 mb-6">
                Hi <strong>{tokenInfo?.firstName}</strong>! Set a password for <strong>{tokenInfo?.email}</strong>.
              </p>

              {error && (
                <div className="mb-4 flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                                rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPw
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full btn btn-primary py-2.5 justify-center mt-2">
                  {submitting ? 'Setting password…' : 'Set Password & Activate Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
