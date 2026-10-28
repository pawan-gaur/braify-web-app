import { Link } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'

/** Full-page placeholder for a paid-only feature on the Free plan. */
export default function LockedFeature({ title, description }) {
  const { user } = useAuth()
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <span className="badge badge-brand">Pro</span>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white mt-3">{title}</h1>
      <p className="text-sm text-ink-3 mt-2">{description}</p>
      {user?.role === ROLES.ORG_ADMIN
        ? <Link to="/settings/billing" className="btn btn-primary mt-6 inline-flex">Upgrade to Pro</Link>
        : <p className="text-sm text-ink-3 mt-6">Ask an org admin in your workspace to upgrade the plan.</p>}
    </div>
  )
}
