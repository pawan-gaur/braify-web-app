import { Link } from 'react-router-dom'
import { useAuth, ROLES, roleAtLeast } from '../../context/AuthContext'

/** Slim banner while the workspace is on its free Pro trial. Org admins get the upgrade link. */
export default function TrialBanner() {
  const { entitlements, user } = useAuth()
  if (!entitlements?.trial) return null
  const days = entitlements.trialDaysLeft ?? 0
  const canManage = roleAtLeast(user?.role, ROLES.ORG_ADMIN) && user?.role !== ROLES.PLATFORM_ADMIN
  const urgent = days <= 3

  return (
    <div role="status"
      className={`flex items-center justify-center gap-3 flex-wrap px-4 py-2 text-sm border-b ${urgent
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
        : 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand/10 dark:text-brand-300 dark:border-brand/20'}`}>
      <span>
        <span className="font-semibold">Pro trial:</span>{' '}
        {days > 0 ? `${days} day${days === 1 ? '' : 's'} left` : 'ends today'} — after that your workspace moves to the Free plan.
      </span>
      {canManage
        ? <Link to="/settings/billing" className="font-semibold underline underline-offset-2">Upgrade to Pro</Link>
        : <span className="text-xs opacity-80">Ask your org admin to upgrade.</span>}
    </div>
  )
}
