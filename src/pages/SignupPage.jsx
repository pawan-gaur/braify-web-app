import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

/**
 * Instant self-serve sign-up: details → emailed code → workspace created on the Free plan
 * and signed in. Enterprise / assisted onboarding stays at /contact-sales.
 */
export default function SignupPage() {
  useDocumentTitle('Get Started')
  const { signupStart, signupComplete } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', organizationName: '', email: '', password: '' })
  const [showPw,   setShowPw]   = useState(false)
  const [step,     setStep]     = useState('details')   // 'details' | 'code'
  const [code,     setCode]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [exists,   setExists]   = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const payload = () => ({
    ...form,
    email: form.email.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    organizationName: form.organizationName.trim(),
  })

  const sendCode = async (e) => {
    e?.preventDefault()
    setError(null); setExists(false)
    const p = payload()
    if (!p.firstName || !p.organizationName || !p.email || !p.password) {
      setError('Please fill in your name, organisation, email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await signupStart(p)
      setStep('code')
      setCode('')
      setCooldown(res?.resendAfterSeconds ?? 60)
    } catch (err) {
      setExists(err.status === 409 && /already exists/i.test(err.message))
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const finish = async (e) => {
    e.preventDefault()
    if (!code.trim()) { setError('Enter the code we emailed you.'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await signupComplete(payload(), code.trim())
      // Org MFA can't be required yet for a brand-new workspace, but stay correct if it is.
      navigate(res?.mfaRequired ? `/login?email=${encodeURIComponent(form.email.trim())}` : '/dashboard?welcome=1', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headerRight={
        <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          Already have an account? <span className="text-brand font-semibold">Sign in</span>
        </Link>
      }
    >
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {step === 'details' ? 'Create your workspace' : 'Check your email'}
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2">
            {step === 'details'
              ? 'Start free — PDF templates, email templates, e-signature and file storage. No credit card.'
              : <>We sent a 6-digit code to <span className="font-semibold text-gray-700 dark:text-gray-200">{form.email.trim()}</span>.</>}
          </p>
        </div>

        {error && (
          <div className="alert-error border rounded-xl px-4 py-3 mb-5 text-sm">
            {error}
            {exists && <> <Link to={`/login?email=${encodeURIComponent(form.email.trim())}`} className="font-semibold underline">Sign in</Link></>}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={sendCode} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label" htmlFor="su-first">First name</label>
                <input id="su-first" className="form-input" autoComplete="given-name" autoFocus
                  value={form.firstName} onChange={set('firstName')} />
              </div>
              <div>
                <label className="form-label" htmlFor="su-last">Last name</label>
                <input id="su-last" className="form-input" autoComplete="family-name"
                  value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="su-org">Organisation name</label>
              <input id="su-org" className="form-input" autoComplete="organization" placeholder="Acme Inc."
                value={form.organizationName} onChange={set('organizationName')} />
            </div>
            <div>
              <label className="form-label" htmlFor="su-email">Work email</label>
              <input id="su-email" type="email" className="form-input" autoComplete="email" placeholder="you@company.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="form-label" htmlFor="su-pw">Password</label>
              <div className="relative">
                <input id="su-pw" type={showPw ? 'text' : 'password'} className="form-input pr-16" autoComplete="new-password"
                  value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Choose a strong password — we'll tell you if it doesn't meet the security policy.</p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-accent w-full justify-center disabled:opacity-60">
              {loading ? 'Sending code…' : 'Create workspace'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              By continuing you agree to the <Link to="/terms" className="underline">Terms</Link> and{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        ) : (
          <form onSubmit={finish} className="space-y-5">
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8}
              aria-label="Verification code" placeholder="123456"
              value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="form-input text-center font-mono text-lg tracking-[0.3em]"
            />
            <button type="submit" disabled={loading} className="btn btn-accent w-full justify-center disabled:opacity-60">
              {loading ? 'Creating your workspace…' : 'Verify & create workspace'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => { setStep('details'); setError(null) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ← Edit details
              </button>
              <button type="button" disabled={cooldown > 0 || loading} onClick={sendCode}
                className="font-semibold text-brand hover:text-brand-hover disabled:text-gray-400 disabled:cursor-not-allowed">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Need enterprise features or help onboarding your team?{' '}
          <Link to="/contact-sales" className="text-brand font-semibold hover:text-brand-hover">Contact sales</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
