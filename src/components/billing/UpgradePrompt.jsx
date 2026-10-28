import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'

/**
 * Shown when the API reports a plan limit or a paid-only feature (the axios interceptor fires
 * `braify:upgrade-required`). Org admins go to Billing; everyone else is told to ask them.
 */
export default function UpgradePrompt() {
  const { user, isSigner } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const onUpgrade = (e) => setMessage(e.detail?.message || 'This needs a higher plan.')
    window.addEventListener('braify:upgrade-required', onUpgrade)
    return () => window.removeEventListener('braify:upgrade-required', onUpgrade)
  }, [])

  useEffect(() => {
    if (!message) return
    const onKey = (e) => { if (e.key === 'Escape') setMessage(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [message])

  if (!message || isSigner || user?.role === ROLES.PLATFORM_ADMIN) return null
  const canManage = user?.role === ROLES.ORG_ADMIN

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={() => setMessage(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="upgrade-title"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-modal p-6" onClick={e => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand flex items-center justify-center mb-4" aria-hidden="true">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h2 id="upgrade-title" className="text-lg font-bold text-ink dark:text-white">Upgrade to keep going</h2>
        <p className="text-sm text-ink-3 mt-2">{message}</p>
        <p className="text-sm text-ink-3 mt-2">
          {canManage
            ? 'Pro raises your limits to 500 documents a month, 5 GB storage and 25 team members, and unlocks bulk sending.'
            : 'Ask an org admin in your workspace to upgrade the plan.'}
        </p>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={() => setMessage(null)} className="btn btn-ghost btn-sm">Not now</button>
          {canManage && (
            <button onClick={() => { setMessage(null); navigate('/settings/billing') }} className="btn btn-primary btn-sm">
              See plans
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
