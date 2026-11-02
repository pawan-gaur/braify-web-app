import { Navigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { AdminBadge } from '../components/platform/SettingsKit'
import SmsProviderForm from '../components/settings/SmsProviderForm'
import { getPlatformSmsConfig, updatePlatformSmsConfig, testPlatformSmsConfig } from '../services/api'

/** Platform default SMS provider — used by every organisation that hasn't set up its own. */
export default function PlatformMessagingPage() {
  useDocumentTitle('Messaging providers')
  const { user } = useAuth()
  if (user && user.role !== ROLES.PLATFORM_ADMIN) return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Breadcrumbs items={[{ label: 'Platform', to: '/dashboard' }, { label: 'Settings', to: '/settings/platform' }, { label: 'Messaging' }]} />
      <div className="mt-4 mb-2 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Messaging providers</h1>
        <AdminBadge />
      </div>
      <p className="text-sm text-ink-3 mb-8">
        The default SMS provider for every organisation without its own. Used for e-sign SMS reminders
        (Pro plan, when an organisation turns SMS on in its reminder settings).
      </p>
      <div className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-ink dark:text-white mb-4">Default SMS provider</h2>
        <SmsProviderForm load={getPlatformSmsConfig} save={updatePlatformSmsConfig} test={testPlatformSmsConfig} />
      </div>
    </div>
  )
}
