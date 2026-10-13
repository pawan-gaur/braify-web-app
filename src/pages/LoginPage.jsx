import { useEffect, useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { useAuth, ACCOUNT_TYPES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

/** Only same-app paths are accepted as a post-login destination (no open redirects). */
function safePath(p) {
  // Browsers treat "/\\host" like "//host", so backslashes are rejected too.
  return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.includes('\\') ? p : null
}

export default function LoginPage() {
  useDocumentTitle('Sign In')
  const { login, requestLoginCode, loginWithCode, verifyMfa, lastUser } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [params]  = useSearchParams()

  // Destination: ?next= (links in signing emails) → the page that bounced here → home.
  const nextParam  = safePath(params.get('next'))
  const emailParam = params.get('email') || ''
  const from = nextParam || location.state?.from?.pathname || '/'

  const [email,    setEmail]    = useState(emailParam)
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [info,     setInfo]     = useState(null)

  // Sign-in method: 'password' or 'code' (one-time code emailed to the address).
  // Signing-email links (?next=/my-documents) open straight on the code flow.
  const [method,    setMethod]    = useState(nextParam === '/my-documents' ? 'code' : 'password')
  const [codeSent,  setCodeSent]  = useState(false)
  const [otp,       setOtp]       = useState('')
  const [cooldown,  setCooldown]  = useState(0)

  // MFA challenge step — set once the password/code is accepted and MFA is required
  const [mfaToken, setMfaToken] = useState(null)
  const [code,     setCode]     = useState('')

  // "Welcome back" quick sign-in: when a previous user is remembered on this device,
  // show a password-only prompt. "Sign in as a different user" reveals the full form.
  // A link that names a different email always starts on the full form.
  const [differentUser, setDifferentUser] = useState(
    !!emailParam && !!lastUser && lastUser.email?.toLowerCase() !== emailParam.toLowerCase())
  const remembered = !!lastUser && !differentUser
  const firstName  = lastUser?.name?.split(' ')[0] || ''
  const emailToUse = (remembered ? lastUser.email : email).trim()

  const errMsg = (err) => err?.response?.data?.message || err?.message || 'Something went wrong.'

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  /** Signers land on their dashboard (or inbox, from an email link); Braify users go where they were headed. */
  const finish = (session) => {
    const signerDest = ['/dashboard', '/my-documents'].includes(from) ? from : '/dashboard'
    navigate(session?.accountType === ACCOUNT_TYPES.SIGNER ? signerDest : from, { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emailToUse || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await login(emailToUse, password)
      if (res?.mfaRequired) {
        setMfaToken(res.mfaToken)     // switch to the verification-code step
        return
      }
      finish(res)
    } catch (err) {
      setError(errMsg(err) || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const sendCode = async (e) => {
    e?.preventDefault()
    if (!emailToUse) { setError('Enter your email address.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await requestLoginCode(emailToUse)
      setCodeSent(true)
      setOtp('')
      setCooldown(res?.resendAfterSeconds ?? 60)
      setInfo(`If ${emailToUse} can sign in, we've sent a ${res?.ttlMinutes ?? 10}-minute code to it.`)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!otp.trim()) { setError('Enter the code from your email.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await loginWithCode(emailToUse, otp.trim())
      if (res?.mfaRequired) {
        setMfaToken(res.mfaToken)
        return
      }
      finish(res)
    } catch (err) {
      setError(errMsg(err))
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
      finish(await verifyMfa(mfaToken, code.trim()))
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const switchMethod = (m) => {
    setMethod(m)
    setCodeSent(false)
    setOtp('')
    setPassword('')
    setError(null)
    setInfo(null)
  }

  const heading = mfaToken ? 'Verify it’s you'
    : remembered ? `Welcome back, ${firstName}`
    : 'Welcome back'
  const subheading = mfaToken ? 'Enter your authenticator code to continue.'
    : method === 'code'
      ? (codeSent ? 'Enter the code we emailed you.' : 'We’ll email you a one-time sign-in code — no password needed.')
      : remembered ? 'Enter your password to sign in.'
      : 'Sign in to your Braify workspace or view documents sent to you.'

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{heading}</h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2">{subheading}</p>
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
          {info && !error && !mfaToken && method === 'code' && codeSent && (
            <div className="alert-info border rounded-xl px-4 py-3 mb-5 text-sm">
              {info}
            </div>
          )}

          {/* Method switch */}
          {!mfaToken && (
            <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl bg-gray-100 dark:bg-gray-800" role="tablist">
              {[['password', 'Password'], ['code', 'Email code']].map(([m, label]) => (
                <button key={m} type="button" role="tab" aria-selected={method === m}
                  onClick={() => switchMethod(m)}
                  className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                    method === m
                      ? 'bg-white dark:bg-gray-700 text-ink dark:text-white shadow-soft'
                      : 'text-ink-4 hover:text-ink-2 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Email — or the remembered-account chip (shared by both methods) */}
          {!mfaToken && !(method === 'code' && codeSent) && (
            <div className="mb-5">
              {remembered ? (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600
                                bg-gray-50 dark:bg-gray-800 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-accent text-white flex items-center justify-center font-bold shrink-0">
                    {(firstName[0] || lastUser.email[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{lastUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lastUser.email}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus={!emailParam}
                    className="form-input"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Password sign-in ── */}
          {!mfaToken && method === 'password' && (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  autoFocus={remembered || !!emailParam}
                  className="form-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <SubmitButton loading={loading} busyLabel="Signing in…">Sign in</SubmitButton>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              No password yet?{' '}
              <button type="button" onClick={() => switchMethod('code')}
                className="text-brand font-semibold hover:text-brand-hover">
                Sign in with an email code
              </button>
            </p>
          </form>
          )}

          {/* ── Email code sign-in: step 1 (send) ── */}
          {!mfaToken && method === 'code' && !codeSent && (
          <form onSubmit={sendCode} className="space-y-5">
            <SubmitButton loading={loading} busyLabel="Sending code…">Email me a code</SubmitButton>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Received documents to sign? Use the email address they were sent to.
            </p>
          </form>
          )}

          {/* ── Email code sign-in: step 2 (verify) ── */}
          {!mfaToken && method === 'code' && codeSent && (
          <form onSubmit={handleCodeSubmit} className="space-y-5">
            <div>
              <label className="form-label">Sign-in code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={8}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="form-input text-center font-mono text-lg tracking-[0.3em]"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Sent to <span className="font-semibold text-ink-2 dark:text-gray-300">{emailToUse}</span>
              </p>
            </div>
            <SubmitButton loading={loading} busyLabel="Verifying…">Sign in</SubmitButton>
            <div className="flex items-center justify-between text-xs">
              <button type="button"
                onClick={() => { setCodeSent(false); setOtp(''); setError(null); setInfo(null) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ← Change email
              </button>
              <button type="button" disabled={cooldown > 0 || loading} onClick={sendCode}
                className="font-semibold text-brand hover:text-brand-hover disabled:text-gray-400 disabled:cursor-not-allowed">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
          )}

          {/* Social sign-in (disabled — no Google OAuth backend yet) */}
          {!mfaToken && !remembered && method === 'password' && (
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
            <SubmitButton loading={loading} busyLabel="Verifying…">Verify</SubmitButton>
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

        {!mfaToken && remembered && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Not you?{' '}
            <button type="button"
              onClick={() => { setDifferentUser(true); setEmail(''); setPassword(''); setCodeSent(false); setError(null) }}
              className="text-brand font-semibold hover:text-brand-hover">
              Sign in as a different user
            </button>
          </p>
        )}
        {!mfaToken && !remembered && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            {lastUser ? (
              <button type="button"
                onClick={() => { setDifferentUser(false); setPassword(''); setCodeSent(false); setError(null) }}
                className="text-brand font-semibold hover:text-brand-hover">
                ← Back to {firstName}
              </button>
            ) : (
              <>Don’t have an account?{' '}
                <Link to="/get-started" className="text-brand font-semibold hover:text-brand-hover">Get started</Link>
              </>
            )}
          </p>
        )}
      </div>
    </AuthLayout>
  )
}

function SubmitButton({ loading, busyLabel, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn btn-accent w-full gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {busyLabel}
        </>
      ) : children}
    </button>
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

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
           l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
           m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0
           01-4.132 5.411m0 0L21 21"/>
    </svg>
  )
}
