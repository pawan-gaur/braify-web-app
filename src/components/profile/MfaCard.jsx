import { useEffect, useState } from 'react'
import { mfaStatus, mfaSetup, mfaEnable, mfaDisable, mfaRegenerate } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong.'

/**
 * Two-factor authentication settings. Behaviour adapts to the org policy:
 *  - DISABLED → MFA is off for the org (any existing enrollment is preserved but inactive)
 *  - OPTIONAL → user may enable/disable freely
 *  - REQUIRED → user may enable; cannot disable
 */
export default function MfaCard() {
  const toast = useToast()
  const [status,  setStatus]  = useState(null)   // { orgPolicy, enabled, enrolledAt, recoveryCodesRemaining }
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState(false)

  const [setupData, setSetupData] = useState(null) // { secret, otpauthUri, qrDataUri }
  const [code,      setCode]      = useState('')
  const [recovery,  setRecovery]  = useState(null)  // string[] shown once

  const load = async () => {
    try { setStatus(await mfaStatus()) }
    catch (e) { toast.error(errMsg(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startSetup = async () => {
    setBusy(true)
    try { setSetupData(await mfaSetup()); setCode('') }
    catch (e) { toast.error(errMsg(e)) }
    finally { setBusy(false) }
  }

  const confirmEnable = async () => {
    if (!code.trim()) { toast.error('Enter the 6-digit code from your app.'); return }
    setBusy(true)
    try {
      const res = await mfaEnable(code.trim())
      setRecovery(res.recoveryCodes)
      setSetupData(null); setCode('')
      await load()
      toast.success('Two-factor authentication enabled.')
    } catch (e) { toast.error(errMsg(e)) }
    finally { setBusy(false) }
  }

  const doDisable = async () => {
    const c = window.prompt('Enter a current 6-digit code (or a recovery code) to turn off 2FA:')
    if (!c) return
    setBusy(true)
    try { await mfaDisable(c.trim()); setRecovery(null); await load(); toast.success('Two-factor authentication disabled.') }
    catch (e) { toast.error(errMsg(e)) }
    finally { setBusy(false) }
  }

  const doRegenerate = async () => {
    const c = window.prompt('Enter a current 6-digit code to generate new recovery codes:')
    if (!c) return
    setBusy(true)
    try { const res = await mfaRegenerate(c.trim()); setRecovery(res.recoveryCodes); await load(); toast.success('New recovery codes generated.') }
    catch (e) { toast.error(errMsg(e)) }
    finally { setBusy(false) }
  }

  if (loading) return <div className="card text-sm text-gray-400">Loading…</div>

  const policy  = status?.orgPolicy
  const enabled = status?.enabled

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Two-Factor Authentication (2FA)</h2>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          {enabled ? 'On' : 'Off'}
        </span>
      </div>

      {/* Recovery codes — shown once after enable/regenerate */}
      {recovery && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
            Save these recovery codes now — each works once and they won't be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm text-amber-900 dark:text-amber-200">
            {recovery.map(c => <span key={c}>{c}</span>)}
          </div>
          <button className="btn btn-ghost btn-sm mt-3"
            onClick={() => { navigator.clipboard?.writeText(recovery.join('\n')); toast.success('Copied') }}>
            Copy all
          </button>
        </div>
      )}

      {/* Policy: DISABLED */}
      {policy === 'DISABLED' && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          2FA is turned off for your organization.
          {enabled && ' Your existing setup is retained and will reactivate if your admin re-enables 2FA.'}
        </p>
      )}

      {/* Not enrolled, and org allows/requires it → enable flow */}
      {policy !== 'DISABLED' && !enabled && !setupData && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add a second step at sign-in using an authenticator app (Google Authenticator, Authy, 1Password…).
            {policy === 'REQUIRED' && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                2FA is required by policy.
              </span>
            )}
          </p>
          <button className="btn btn-primary" disabled={busy} onClick={startSetup}>
            {busy ? 'Starting…' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {/* Enrollment in progress — QR + verify */}
      {setupData && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            1. Scan this QR code with your authenticator app:
          </p>
          <img src={setupData.qrDataUri} alt="2FA QR code"
               className="w-44 h-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-2" />
          <p className="text-xs text-gray-400">
            Can't scan? Enter this key manually: <span className="font-mono text-gray-600 dark:text-gray-300">{setupData.secret}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">2. Enter the 6-digit code it shows:</p>
          <div className="flex gap-2">
            <input className="form-input font-mono tracking-widest w-40 text-center"
              placeholder="123456" value={code} onChange={e => setCode(e.target.value)} autoFocus />
            <button className="btn btn-primary" disabled={busy} onClick={confirmEnable}>
              {busy ? 'Verifying…' : 'Verify & turn on'}
            </button>
            <button className="btn btn-ghost" disabled={busy}
              onClick={() => { setSetupData(null); setCode('') }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Enrolled — manage */}
      {enabled && !setupData && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            2FA is active{status.enrolledAt ? ` since ${new Date(status.enrolledAt).toLocaleDateString()}` : ''}.
            {' '}{status.recoveryCodesRemaining} recovery code{status.recoveryCodesRemaining === 1 ? '' : 's'} remaining.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={doRegenerate}>
              Regenerate recovery codes
            </button>
            {policy !== 'REQUIRED' && (
              <button className="btn btn-ghost btn-sm text-red-600" disabled={busy} onClick={doDisable}>
                Disable 2FA
              </button>
            )}
          </div>
          {policy === 'REQUIRED' && (
            <p className="text-xs text-gray-400">2FA is required by policy, so it can't be turned off.</p>
          )}
        </div>
      )}
    </div>
  )
}
