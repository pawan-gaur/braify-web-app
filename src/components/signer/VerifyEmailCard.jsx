import { useEffect, useState } from 'react'
import { signerRequestEmailCode, signerConfirmEmailCode } from '../../services/api'

/**
 * Shown to a Braify user whose session hasn't proven control of their mailbox yet.
 * Documents in the signer inbox are addressed to an email — a password alone isn't proof
 * of owning it (admins can set passwords), so we confirm with a one-time emailed code.
 */
export default function VerifyEmailCard({ email, onVerified }) {
  const [sent,     setSent]     = useState(false)
  const [code,     setCode]     = useState('')
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const send = async () => {
    setBusy(true); setError(null)
    try {
      const res = await signerRequestEmailCode()
      setSent(true)
      setCooldown(res?.resendAfterSeconds ?? 60)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const confirm = async (e) => {
    e.preventDefault()
    if (!code.trim()) { setError('Enter the code from your email.'); return }
    setBusy(true); setError(null)
    try {
      await signerConfirmEmailCode(code.trim())
      onVerified?.()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="card p-6 sm:p-8 max-w-lg mx-auto text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
      <h2 className="text-lg font-bold text-ink dark:text-white">Confirm it’s you</h2>
      <p className="text-sm text-ink-3 mt-2">
        These documents were sent to <span className="font-semibold text-ink-2 dark:text-gray-300">{email}</span>.
        To keep them private, we’ll email that address a one-time code. You only need to do this once per sign-in.
      </p>

      {error && <div className="alert-error border rounded-xl px-4 py-3 text-sm mt-4 text-left">{error}</div>}

      {!sent ? (
        <button onClick={send} disabled={busy} className="btn btn-primary w-full justify-center mt-6 disabled:opacity-60">
          {busy ? 'Sending code…' : 'Email me a code'}
        </button>
      ) : (
        <form onSubmit={confirm} className="mt-6 space-y-4">
          <input
            type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8}
            value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="123456" aria-label="Verification code"
            className="form-input text-center font-mono text-lg tracking-[0.3em]"
          />
          <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
            {busy ? 'Verifying…' : 'Confirm'}
          </button>
          <button type="button" onClick={send} disabled={busy || cooldown > 0}
            className="text-xs font-semibold text-brand hover:text-brand-hover disabled:text-gray-400 disabled:cursor-not-allowed">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </form>
      )}
    </div>
  )
}
