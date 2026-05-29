import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import {
  http,
  getOrganizations,
  updateOrganization,
  getOrgFeatures, updateOrgFeatures,
  getApiKeys, createApiKey, revokeApiKey, toggleApiKey,
  getQuotaConfig, getApiKeyUsage,
  getSubscription, assignSubscription,
  getUsersByOrg,
  getAuditLogs,
  getBranding,
} from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ApiKeyCard from '../components/ui/ApiKeyCard'
import PlanBadge from '../components/ui/PlanBadge'
import QuotaProgressBar from '../components/ui/QuotaProgressBar'
import { ALL_FEATURES, FEATURE_META } from '../config/features'
import { fmtDate, fmtDateTime, fmtRelative } from '../utils/date'

/* ── Spinner ── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
      Loading…
    </div>
  )
}

/* ── Plan helpers ── */
const PLANS = [
  { value: 'FREE',         label: 'Free',         desc: '3 users · 50 docs/mo · 512 MB · 1,000 API calls' },
  { value: 'PROFESSIONAL', label: 'Professional', desc: '25 users · 500 docs/mo · 5 GB · 10,000 API calls' },
  { value: 'ENTERPRISE',   label: 'Enterprise',   desc: 'Unlimited users, docs, storage, and API calls'    },
]

const FEATURE_BADGE = {
  PDF_TEMPLATES:   { label: 'PDF Templates',   cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  EMAIL_TEMPLATES: { label: 'Email Templates', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'       },
  E_SIGN:          { label: 'E-Sign',          cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
}

const TABS = ['Overview', 'Features', 'API Keys', 'Usage', 'Subscription', 'Users', 'Activity']

/* ─────────────────────────────────────────────────────────────── */
export default function OrgDetailPage() {
  const { orgId } = useParams()
  const navigate  = useNavigate()
  const toast     = useToast()

  const [org,       setOrg]       = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')

  useDocumentTitle(org ? org.name : 'Organization')

  // Load org on mount
  useEffect(() => {
    setLoading(true)
    // Try GET /organizations/{orgId} — may not exist as a direct endpoint;
    // fall back to listing all orgs and filtering
    http.get(`/organizations/${orgId}`)
      .then(r => setOrg(r.data))
      .catch(() => {
        // fallback: load list and find
        getOrganizations()
          .then(list => {
            const found = (Array.isArray(list) ? list : list.content ?? []).find(o => String(o.id) === String(orgId))
            setOrg(found || null)
          })
          .catch(() => toast.error('Could not load organization.'))
      })
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  const crumbs = [
    { label: 'Dashboard',      to: '/' },
    { label: 'Organizations',  to: '/organizations' },
    { label: org?.name ?? '…' },
  ]

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Spinner />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center py-20">
        <p className="text-gray-500">Organization not found.</p>
        <button className="btn btn-secondary mt-4" onClick={() => navigate('/organizations')}>
          Back to Organizations
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={crumbs} />

      {/* Header */}
      <div className="flex items-start justify-between mt-4 mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/organizations')}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${org.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {org.active ? 'Active' : 'Inactive'}
              </span>
              <PlanBadge plan={org.subscriptionPlan || 'FREE'} />
            </div>
            <code className="text-xs text-gray-400 mt-0.5">{org.code}</code>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 flex gap-1 flex-wrap mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab
                ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-700 dark:text-purple-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'Overview'      && <OverviewTab      org={org} setOrg={setOrg} orgId={orgId} />}
      {activeTab === 'Features'      && <FeaturesTab      org={org} setOrg={setOrg} orgId={orgId} />}
      {activeTab === 'API Keys'      && <ApiKeysTab       org={org} orgId={orgId} />}
      {activeTab === 'Usage'         && <UsageTab         orgId={orgId} />}
      {activeTab === 'Subscription'  && <SubscriptionTab  org={org} setOrg={setOrg} orgId={orgId} />}
      {activeTab === 'Users'         && <UsersTab         orgId={orgId} />}
      {activeTab === 'Activity'      && <ActivityTab      orgId={orgId} />}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: Overview                                                   */
/* ────────────────────────────────────────────────────────────── */
function OverviewTab({ org, setOrg, orgId }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({ name: org.name, description: org.description || '', active: org.active })
  const [saving,  setSaving]  = useState(false)
  const [branding, setBranding] = useState(null)

  useEffect(() => {
    getBranding(orgId)
      .then(setBranding)
      .catch(() => setBranding(null))
  }, [orgId])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required.'); return }
    setSaving(true)
    try {
      const updated = await updateOrganization(orgId, {
        name:        form.name,
        description: form.description,
        active:      form.active,
      })
      setOrg(prev => ({ ...prev, ...updated, name: form.name, description: form.description, active: form.active }))
      setEditing(false)
      toast.success('Organization updated.')
    } catch (err) {
      toast.error(err.message || 'Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  const color = branding?.primaryColor || '#6366f1'

  return (
    <div className="space-y-5">
      {/* Details card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Organization Details</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                         text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="form-label">Organization Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea
                className="form-input resize-none"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active</label>
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`relative w-10 h-5 rounded-full transition-colors
                  ${form.active ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                  ${form.active ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row label="Name"        value={org.name} />
            <Row label="Code"        value={<code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{org.code}</code>} />
            <Row label="Description" value={org.description || <span className="italic text-gray-300">None</span>} span />
            <Row label="Status"      value={
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold
                ${org.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${org.active ? 'bg-green-500' : 'bg-gray-400'}`}/>
                {org.active ? 'Active' : 'Inactive'}
              </span>
            } />
            <Row label="Created"     value={fmtDate(org.createdAt)} />
            <Row label="Plan"        value={<PlanBadge plan={org.subscriptionPlan || 'FREE'} />} />
          </dl>
        )}
      </div>

      {/* Organization Settings preview */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Organization Settings</h3>
        {!branding?.configured ? (
          <p className="text-sm text-gray-400 italic">No settings configured.</p>
        ) : (
          <div className="flex flex-wrap gap-6 items-start">
            {branding.logoBase64 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Logo</p>
                <img src={branding.logoBase64} alt="Org logo"
                  className="h-12 max-w-[160px] object-contain rounded-lg border border-gray-100 dark:border-gray-700 p-1"/>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Primary Color</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg shadow-sm" style={{ background: color }} />
                <code className="text-xs text-gray-500 uppercase">{color}</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, span = false }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-gray-700 dark:text-gray-200">{value}</dd>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: Features                                                   */
/* ────────────────────────────────────────────────────────────── */
function FeaturesTab({ org, setOrg, orgId }) {
  const toast = useToast()
  const [selected, setSelected] = useState(org.features || [])
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    getOrgFeatures(orgId)
      .then(data => setSelected(data.features ?? data ?? []))
      .catch(() => setSelected(org.features || []))
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = key =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateOrgFeatures(orgId, selected)
      setOrg(prev => ({ ...prev, features: selected }))
      toast.success('Features updated.')
    } catch (err) {
      toast.error(err.message || 'Failed to update features.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Important</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Removing a feature will immediately block all API key calls for that feature and hide it from all users in this organisation.
        </p>
      </div>

      {/* Feature toggles */}
      <div className="space-y-3">
        {ALL_FEATURES.map(feat => {
          const active = selected.includes(feat.key)
          return (
            <div
              key={feat.key}
              className={`card p-5 flex items-center gap-4 cursor-pointer transition-all
                ${active ? 'ring-2' : ''}`}
              style={active ? { ringColor: feat.color } : {}}
              onClick={() => toggle(feat.key)}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: feat.bg, color: feat.color }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={feat.icon}/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-gray-100">{feat.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{feat.description}</p>
              </div>
              {/* Toggle */}
              <div
                className={`w-12 h-6 rounded-full transition-colors shrink-0 relative`}
                style={{ background: active ? feat.color : '#d1d5db' }}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform
                  ${active ? 'translate-x-6' : 'translate-x-0.5'}`}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary px-8">
          {saving ? 'Saving…' : 'Save Features'}
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: API Keys                                                   */
/* ────────────────────────────────────────────────────────────── */
function ApiKeysTab({ org, orgId }) {
  const toast = useToast()
  const [keys,       setKeys]       = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createdKey, setCreatedKey] = useState(null)
  const [toggling,   setToggling]   = useState({})
  const [revoking,   setRevoking]   = useState({})
  const loadedRef = useRef(false)

  const load = useCallback(() => {
    setLoading(true)
    getApiKeys(orgId)
      .then(data => setKeys(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(err => toast.error(err.message || 'Failed to load keys.'))
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    load()
  }, [load])

  const handleToggle = async (keyId) => {
    setToggling(t => ({ ...t, [keyId]: true }))
    try {
      await toggleApiKey(orgId, keyId)
      setKeys(prev => prev.map(k => k.id === keyId ? { ...k, active: !k.active } : k))
      toast.success('Key updated.')
    } catch (err) {
      toast.error(err.message || 'Failed.')
    } finally {
      setToggling(t => { const n = { ...t }; delete n[keyId]; return n })
    }
  }

  const handleRevoke = async (keyId) => {
    setRevoking(r => ({ ...r, [keyId]: true }))
    try {
      await revokeApiKey(orgId, keyId)
      setKeys(prev => prev.filter(k => k.id !== keyId))
      toast.success('Key revoked.')
    } catch (err) {
      toast.error(err.message || 'Failed.')
    } finally {
      setRevoking(r => { const n = { ...r }; delete n[keyId]; return n })
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* API reference hint */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Keys use <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px]">X-API-Key</code> header.
          <span>
            Usage instructions are in{' '}
            <a href="/settings/api-keys" target="_blank" rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Settings → API Keys → API Reference
            </a>.
          </span>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Generate New Key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">No API keys</p>
          <p className="text-xs text-gray-400">This organization has no API keys yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map(k => (
            <ApiKeyCard
              key={k.id}
              apiKey={k}
              onToggle={handleToggle}
              onRevoke={handleRevoke}
              isToggling={!!toggling[k.id]}
              isRevoking={!!revoking[k.id]}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <AdminCreateKeyModal
          orgId={orgId}
          orgFeatures={org.features || []}
          onClose={() => setShowCreate(false)}
          onCreated={(rawKey, keyObj) => {
            setShowCreate(false)
            setCreatedKey(rawKey)
            setKeys(prev => [keyObj, ...prev])
          }}
        />
      )}

      {createdKey && (
        <KeyCreatedModal rawKey={createdKey} onClose={() => setCreatedKey(null)} />
      )}
    </div>
  )
}

/* ── Admin Create Key Modal (same as ApiKeysPage version but any org) ── */
function AdminCreateKeyModal({ orgId, orgFeatures, onClose, onCreated }) {
  const toast = useToast()
  const [name,     setName]     = useState('')
  const [features, setFeatures] = useState([])
  const [expires,  setExpires]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const allFeatMeta = [
    { key: 'PDF_TEMPLATES',   label: 'PDF Templates',   cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    { key: 'EMAIL_TEMPLATES', label: 'Email Templates', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'       },
    { key: 'E_SIGN',          label: 'E-Sign',          cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  ]
  const available = allFeatMeta.filter(f => orgFeatures.includes(f.key))

  const toggleFeature = key =>
    setFeatures(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Key name is required.'); return }
    setSaving(true)
    try {
      const res = await createApiKey(orgId, {
        name: name.trim(), allowedFeatures: features,
        expiresAt: expires ? `${expires}T23:59:59` : null,
      })
      // Backend returns { plainKey: 'brfy_...', keyMeta: { id, name, ... } }
      const rawKey = res.plainKey ?? null
      const keyObj = res.keyMeta ?? res
      onCreated(rawKey, keyObj)
      toast.success('API key created.')
    } catch (err) {
      toast.error(err.message || 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Generate API Key</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="form-label">Key Name *</label>
            <input className="form-input" placeholder="e.g. CI/CD" value={name} onChange={e => setName(e.target.value)} required/>
          </div>
          {available.length > 0 && (
            <div>
              <label className="form-label">Allowed Features</label>
              <div className="space-y-2">
                {available.map(f => (
                  <label key={f.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded accent-indigo-600 w-4 h-4"
                      checked={features.includes(f.key)} onChange={() => toggleFeature(f.key)}/>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.cls}`}>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="form-label">Expiry <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="date" className="form-input" value={expires} onChange={e => setExpires(e.target.value)}
              min={new Date().toISOString().substring(0, 10)}/>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Generating…' : 'Generate Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Key Created Modal ── */
function KeyCreatedModal({ rawKey, onClose }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    if (!rawKey) return
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">API Key Created</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Copy this key now — it will never be shown again.
            </p>
          </div>
          {rawKey && (
            <code className="block w-full bg-gray-900 text-green-400 text-sm font-mono px-4 py-3 rounded-xl break-all">
              {rawKey}
            </code>
          )}
          <div className="flex gap-3">
            {rawKey && (
              <button onClick={copy}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            )}
            <button onClick={onClose} className="flex-1 btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: Usage                                                      */
/* ────────────────────────────────────────────────────────────── */
function UsageTab({ orgId }) {
  const toast = useToast()
  const [quota,     setQuota]     = useState(null)
  const [keyUsage,  setKeyUsage]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    Promise.all([
      getQuotaConfig(orgId).catch(() => null),
      getApiKeyUsage(orgId).catch(() => null),
    ]).then(([q, u]) => {
      setQuota(q)
      setKeyUsage(u)
    }).finally(() => setLoading(false))
  }, [orgId])

  if (loading) return <Spinner />

  const featureColors = { PDF_TEMPLATES: '#4f46e5', EMAIL_TEMPLATES: '#0891b2', E_SIGN: '#059669' }
  const featureLabels = { PDF_TEMPLATES: 'PDF Templates', EMAIL_TEMPLATES: 'Email Templates', E_SIGN: 'E-Sign' }

  return (
    <div className="space-y-5">
      {/* Quota bars */}
      {quota && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Quota Usage</h3>
          <div className="space-y-4">
            <QuotaProgressBar label="Users"         current={quota.currentUsers      ?? 0} limit={quota.maxUsers           ?? -1} />
            <QuotaProgressBar label="Documents/mo"  current={quota.currentDocs       ?? 0} limit={quota.maxDocsPerMonth    ?? -1} />
            <QuotaProgressBar label="Storage"       current={quota.currentStorageMb  ?? 0} limit={quota.maxStorageMb       ?? -1} unit=" MB" />
            <QuotaProgressBar label="API calls/mo"  current={quota.currentApiCalls   ?? 0} limit={quota.maxApiCallsPerMonth ?? -1} />
          </div>
        </div>
      )}

      {/* API key usage by feature */}
      {keyUsage && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">API Key Calls by Feature (last 30 days)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(keyUsage).map(([feat, count]) => (
              <div key={feat} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: featureColors[feat] || '#6366f1' }}>
                  {Number(count).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  {featureLabels[feat] || feat}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!quota && !keyUsage && (
        <div className="card p-12 text-center text-gray-400">
          <p>No usage data available.</p>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: Subscription                                               */
/* ────────────────────────────────────────────────────────────── */
function SubscriptionTab({ org, setOrg, orgId }) {
  const toast = useToast()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [plan,    setPlan]    = useState(org.subscriptionPlan || 'FREE')
  const [expires, setExpires] = useState('')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    getSubscription(orgId)
      .then(d => {
        setData(d)
        setPlan(d.subscriptionPlan || 'FREE')
        setExpires(d.planExpiresAt ? d.planExpiresAt.substring(0, 10) : '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await assignSubscription(orgId, { subscriptionPlan: plan, planExpiresAt: expires || null })
      setOrg(prev => ({ ...prev, subscriptionPlan: plan }))
      toast.success(`Plan updated to ${plan}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update plan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      {/* Current plan summary */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Current Subscription</h3>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Plan</p>
            <PlanBadge plan={plan} />
          </div>
          {data?.planAssignedAt && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Assigned</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(data.planAssignedAt)}</p>
            </div>
          )}
          {data?.planAssignedBy && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">By</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{data.planAssignedBy}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Expires</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {data?.planExpiresAt ? fmtDate(data.planExpiresAt) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Plan selection */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Change Plan</h3>
        <div className="space-y-3">
          {PLANS.map(p => (
            <label
              key={p.value}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${plan === p.value
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
            >
              <input type="radio" name="plan" value={p.value} checked={plan === p.value}
                onChange={() => setPlan(p.value)} className="mt-0.5 accent-indigo-600"/>
              <div className="flex-1">
                <PlanBadge plan={p.value} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="form-label">
            Plan Expiry <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={expires}
            onChange={e => setExpires(e.target.value)}
            min={new Date().toISOString().substring(0, 10)}
          />
          <p className="text-[11px] text-gray-400 mt-1">Leave blank for no expiry.</p>
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary px-8">
            {saving ? 'Saving…' : 'Assign Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: Users                                                      */
/* ────────────────────────────────────────────────────────────── */
function UsersTab({ orgId }) {
  const toast = useToast()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    getUsersByOrg(orgId)
      .then(data => setUsers(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(err => toast.error(err.message || 'Failed to load users.'))
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner />

  return (
    <div className="card p-0 overflow-hidden">
      {users.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <p className="text-sm">No users found.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {['Name', 'Email', 'Role', 'Status', 'Last Login'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {u.firstName} {u.lastName}
                  </p>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                    ${u.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400">
                  {u.lastLoginAt ? fmtRelative(u.lastLoginAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/* Tab: Activity                                                   */
/* ────────────────────────────────────────────────────────────── */
function ActivityTab({ orgId }) {
  const toast = useToast()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    getAuditLogs(0, 50, null, orgId)
      .then(data => setLogs(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(err => toast.error(err.message || 'Failed to load audit logs.'))
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner />

  return (
    <div className="card p-0 overflow-hidden">
      {logs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p className="text-sm">No audit logs found for this organisation.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {['Timestamp', 'Action', 'User', 'Details'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {logs.map((log, i) => (
              <tr key={log.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                  {fmtDateTime(log.performedAt ?? log.createdAt)}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">
                  {log.performedBy ?? log.userEmail ?? '—'}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400 max-w-[260px] truncate" title={log.details ?? log.description ?? ''}>
                  {log.details ?? log.description ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
