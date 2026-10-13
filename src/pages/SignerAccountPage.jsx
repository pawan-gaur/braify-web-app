import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { signerSetPassword } from '../services/api'

/**
 * Signer-portal account settings: optionally set (or change) a password so the signer can
 * sign in with email + password instead of waiting for a code. Codes keep working either way.
 */
export default function SignerAccountPage() {
  useDocumentTitle('Account')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const hasPassword = !!user?.hasPassword

  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!next) { setError('Enter a new password.'); return }
    if (next !== confirm) { setError('The passwords don’t match.'); return }
    setSaving(true)
    try {
      const res = await signerSetPassword({ currentPassword: hasPassword ? current : null, newPassword: next })
      setUser(u => ({ ...u, hasPassword: true }))
      setCurrent(''); setNext(''); setConfirm('')
      toast.success(res?.message || 'Password saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <Link to="/my-documents" className="text-sm text-ink-3 hover:text-ink dark:hover:text-gray-200">← My signatures</Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white mt-4">
        {hasPassword ? 'Change password' : 'Set a password'}
      </h1>
      <p className="text-sm text-ink-3 mt-1 mb-6">
        {hasPassword
          ? 'You can sign in with your password or with a one-time code sent to your email.'
          : 'Optional. With a password you can sign in straight away — email codes keep working too.'}
      </p>

      <form onSubmit={submit} className="card p-6 space-y-4">
        {error && <div className="alert-error border rounded-xl px-4 py-3 text-sm">{error}</div>}

        <div>
          <label className="form-label">Email</label>
          <input className="form-input" value={user?.email || ''} disabled readOnly />
        </div>
        {hasPassword && (
          <div>
            <label className="form-label">Current password</label>
            <input type="password" autoComplete="current-password" className="form-input"
              value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
        )}
        <div>
          <label className="form-label">New password</label>
          <input type="password" autoComplete="new-password" className="form-input"
            value={next} onChange={e => setNext(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Confirm new password</label>
          <input type="password" autoComplete="new-password" className="form-input"
            value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center disabled:opacity-60">
          {saving ? 'Saving…' : hasPassword ? 'Change password' : 'Save password'}
        </button>
      </form>
    </div>
  )
}
