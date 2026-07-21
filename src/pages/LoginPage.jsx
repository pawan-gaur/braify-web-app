import { useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function LoginPage() {
  useDocumentTitle('Sign In')
  const { login, verifyMfa } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const from = location.state?.from?.pathname || '/'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // MFA challenge step — set once the password is accepted and MFA is required
  const [mfaToken, setMfaToken] = useState(null)
  const [code,     setCode]     = useState('')

  const errMsg = (err) => err?.response?.data?.message || err?.message || 'Something went wrong.'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await login(email.trim(), password)
      if (res?.mfaRequired) {
        setMfaToken(res.mfaToken)     // switch to the verification-code step
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(errMsg(err) || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) { setError('Enter your verification code.'); return }
    setLoading(true)
    setError(null)
    try {
      await verifyMfa(mfaToken, code.trim())
      navigate(from, { replace: true })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headerRight={
        <Link to="/get-started" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          New here? <span className="text-brand font-semibold">Get started</span>
        </Link>
      }
    >
      <div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {mfaToken ? 'Verify it’s you' : 'Welcome back'}
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2">
            {mfaToken ? 'Enter your authenticator code to continue.' : 'Sign in to your Braify workspace.'}
          </p>
        </div>

        <div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200
                            dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                     c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {error}
            </div>
          )}

          {!mfaToken && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="form-input"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink-2 dark:text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password"
                  className="text-xs text-brand hover:text-brand-hover font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
                           l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                           m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0
                           01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent w-full gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
          )}

          {/* Social sign-in (disabled — no Google OAuth backend yet) */}
          {!mfaToken && (
            <>
              <div className="flex items-center gap-3 my-6">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs font-medium text-gray-400">Or continue with</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Google sign-in is coming soon"
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200
                           dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold
                           text-gray-500 dark:text-gray-400 opacity-60 cursor-not-allowed"
              >
                <GoogleIcon className="w-4 h-4" />
                Continue with Google
                <span className="text-[10px] font-semibold text-gray-400 border border-gray-200
                                 dark:border-gray-600 rounded-full px-1.5 py-0.5">Soon</span>
              </button>
            </>
          )}

          {/* MFA verification step */}
          {mfaToken && (
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enter the 6-digit code from your authenticator app
              <span className="text-gray-400"> (or a recovery code)</span>.
            </p>
            <input
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              className="form-input text-center font-mono text-lg tracking-[0.3em]"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent w-full gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verifying…
                </>
              ) : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setMfaToken(null); setCode(''); setError(null) }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ← Back to sign in
            </button>
          </form>
          )}
        </div>

        {!mfaToken && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Don’t have an account?{' '}
            <Link to="/get-started" className="text-brand font-semibold hover:text-brand-hover">Get started</Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"/>
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
    </svg>
  )
}
