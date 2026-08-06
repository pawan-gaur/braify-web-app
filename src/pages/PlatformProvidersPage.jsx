import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { AdminBadge } from '../components/platform/SettingsKit'
import EmailProviderForm from '../components/settings/EmailProviderForm'
import SmsProviderForm from '../components/settings/SmsProviderForm'
import CloudProviderForm from '../components/settings/CloudProviderForm'
import {
  getPlatformEmailConfig, updatePlatformEmailConfig, testPlatformEmailConfig,
  getPlatformSmsConfig, updatePlatformSmsConfig, testPlatformSmsConfig,
  getPlatformCloudConfig, updatePlatformCloudConfig,
} from '../services/api'

const TABS = [
  { id: 'email', label: 'Email',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'sms',   label: 'SMS',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z' },
  { id: 'cloud', label: 'Cloud Storage',
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
]

export default function PlatformProvidersPage() {
  useDocumentTitle('Platform provider defaults')
  const { user } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('email')
  const [loading, setLoading]     = useState(true)

  const [emailConfig, setEmailConfig] = useState(null)
  const [smsConfig, setSmsConfig]     = useState(null)
  const [cloudConfig, setCloudConfig] = useState(null)

  const [savingEmail, setSavingEmail] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [savingSms, setSavingSms] = useState(false)
  const [testingSms, setTestingSms] = useState(false)
  const [savingCloud, setSavingCloud] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      getPlatformEmailConfig(),
      getPlatformSmsConfig(),
      getPlatformCloudConfig(),
    ]).then(([email, sms, cloud]) => {
      if (email.status === 'fulfilled') setEmailConfig(email.value)
      if (sms.status === 'fulfilled')   setSmsConfig(sms.value)
      if (cloud.status === 'fulfilled') setCloudConfig(cloud.value)
    }).finally(() => setLoading(false))
  }, [])

  // PLATFORM_ADMIN only.
  if (user && user.role !== ROLES.PLATFORM_ADMIN) return <Navigate to="/dashboard" replace />

  const ok  = (res, fallback) => (res?.success ? toast.success(res.message || fallback) : toast.error(res?.message || fallback))
  const err = (e, fallback)   => toast.error(e.response?.data?.message || e.message || fallback)

  const handleSaveEmail = async (p) => { setSavingEmail(true)
    try { setEmailConfig(await updatePlatformEmailConfig(p)); toast.success('Platform email default saved.') }
    catch (e) { err(e, 'Failed to save.') } finally { setSavingEmail(false) } }
  const handleTestEmail = async (p) => { setTestingEmail(true)
    try { ok(await testPlatformEmailConfig(p), 'Test email sent.') }
    catch (e) { err(e, 'Test email failed.') } finally { setTestingEmail(false) } }

  const handleSaveSms = async (p) => { setSavingSms(true)
    try { setSmsConfig(await updatePlatformSmsConfig(p)); toast.success('Platform SMS default saved.') }
    catch (e) { err(e, 'Failed to save.') } finally { setSavingSms(false) } }
  const handleTestSms = async (p) => { setTestingSms(true)
    try { ok(await testPlatformSmsConfig(p), 'Test SMS sent.') }
    catch (e) { err(e, 'Test SMS failed.') } finally { setTestingSms(false) } }

  const handleSaveCloud = async (p) => { setSavingCloud(true)
    try { setCloudConfig(await updatePlatformCloudConfig(p)); toast.success('Platform cloud default saved.') }
    catch (e) { err(e, 'Failed to save.') } finally { setSavingCloud(false) } }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={[
        { label: 'Platform', to: '/dashboard' },
        { label: 'Settings', to: '/settings/platform' },
        { label: 'Provider defaults' },
      ]} />

      <div className="mt-4 mb-2 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">
          Provider defaults
        </h1>
        <AdminBadge />
      </div>
      <p className="text-sm text-ink-3 dark:text-gray-400 mb-8 max-w-2xl">
        Platform-wide default providers. Any organisation that hasn't configured its own
        provider inherits these settings automatically.
      </p>

      <div className="flex gap-1 p-1 bg-ink-8 dark:bg-gray-800 rounded-xl mb-8 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-gradient-accent text-white shadow-soft'
                : 'text-ink-3 hover:text-ink dark:text-gray-400 dark:hover:text-gray-200'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon}/>
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] gap-3 text-ink-4">
          <svg className="animate-spin h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      ) : (
        <>
          {activeTab === 'email' && (
            <EmailProviderForm initial={emailConfig} saving={savingEmail} testing={testingEmail}
              onSave={handleSaveEmail} onTest={handleTestEmail} showEnvFallback
              fallbackNote="This is the platform-wide default used by orgs without their own email config." />
          )}
          {activeTab === 'sms' && (
            <SmsProviderForm initial={smsConfig} saving={savingSms} testing={testingSms}
              onSave={handleSaveSms} onTest={handleTestSms}
              fallbackNote="This is the platform-wide default used by orgs without their own SMS config." />
          )}
          {activeTab === 'cloud' && (
            <CloudProviderForm initial={cloudConfig} saving={savingCloud}
              onSave={handleSaveCloud}
              fallbackNote="This is the platform-wide default used by orgs without their own cloud storage config." />
          )}
        </>
      )}
    </div>
  )
}
