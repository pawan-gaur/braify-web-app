import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { AdminBadge } from '../components/platform/SettingsKit'
import { IconArrowRight } from '../components/ui/icons'

/* Platform-wide setting categories. Each routes to its own detail page. */
const CATEGORIES = [
  {
    to: '/settings/platform/security',
    title: 'Security policies',
    iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    desc: 'Authentication, passwords, lockout & sessions enforced across every organisation.',
    chips: ['Multi-factor authentication', 'Password policy', 'Lockout', 'Sessions'],
  },
  {
    to: '/settings/platform/access',
    title: 'User access',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    desc: 'Sign-up, email verification, default role and profile rules applied to every new user.',
    chips: ['Self-signup', 'Email verification', 'Default role', 'Profile editing'],
  },
  {
    to: null, // future
    title: 'New-organisation defaults',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    desc: 'Default plan, enabled features and quotas applied when a new tenant is provisioned.',
    chips: ['Default plan', 'Features', 'Quotas'],
    soon: true,
  },
]

function CategoryCard({ cat, onOpen }) {
  const clickable = !!cat.to && !cat.soon
  return (
    <div
      onClick={clickable ? () => onOpen(cat.to) : undefined}
      className={`card flex flex-col ${clickable ? 'card-hover cursor-pointer' : 'opacity-75'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-gradient-accent grid place-items-center text-white shrink-0 shadow-soft">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={cat.iconPath} /></svg>
          </span>
          <h2 className="text-[15px] font-bold text-ink dark:text-gray-100 tracking-tight truncate">{cat.title}</h2>
        </div>
        {cat.soon
          ? <span className="badge badge-gray text-[11px]">Coming soon</span>
          : <AdminBadge />}
      </div>

      <p className="text-sm text-ink-3 dark:text-gray-400 leading-snug mb-4">{cat.desc}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {cat.chips.map(c => (
          <span key={c} className="text-[11px] font-medium px-2.5 py-1 rounded-chip
                                   bg-ink-8 dark:bg-gray-700/60 text-ink-3 dark:text-gray-300">
            {c}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-1">
        {clickable ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand dark:text-brand-400">
            Configure <IconArrowRight className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-sm font-semibold text-ink-5">Not yet available</span>
        )}
      </div>
    </div>
  )
}

export default function PlatformSettingsPage() {
  useDocumentTitle('Platform settings')
  const { user } = useAuth()
  const navigate = useNavigate()

  // PLATFORM_ADMIN only.
  if (user && user.role !== ROLES.PLATFORM_ADMIN) return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={[{ label: 'Platform', to: '/dashboard' }, { label: 'Settings' }]} />

      <div className="mt-4 mb-2 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">
          Platform settings
        </h1>
        <AdminBadge />
      </div>
      <p className="text-sm text-ink-3 dark:text-gray-400 mb-8 max-w-2xl">
        Global policies &amp; configuration inherited by every organisation, admin and user.
        Only Platform Admins can change these, and every change applies platform-wide.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map(cat => (
          <CategoryCard key={cat.title} cat={cat} onOpen={navigate} />
        ))}
      </div>
    </div>
  )
}
