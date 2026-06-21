import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getOrganizations, searchOrganizations,
  createOrganization, updateOrganization, deleteOrganization,
  getOrgFeatures, updateOrgFeatures,
  getSubscription, assignSubscription,
  getQuotaConfig, updateQuotaConfig,
  getBranding,
} from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import { ALL_FEATURES, FEATURE_META } from '../config/features'
import PlanBadge from '../components/ui/PlanBadge'
import QuotaProgressBar from '../components/ui/QuotaProgressBar'
import { IconCheck, IconX } from '../components/ui/icons'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Organizations' },
]

import { fmtDate, fmtDateTime } from '../utils/date'

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function FeaturePill({ featureKey, size = 'sm' }) {
  const meta = FEATURE_META[featureKey]
  if (!meta) return null
  const px  = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1 ${px} rounded-full font-semibold whitespace-nowrap`}
      style={{ background: meta.bg, color: meta.color }}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon}/>
      </svg>
      {meta.label}
    </span>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function OrganizationsPage() {
  useDocumentTitle('Organizations')
  const navigate = useNavigate()
  const toast    = useToast()

  const [orgs,        setOrgs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [query,       setQuery]       = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [editOrg,     setEditOrg]     = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [featOrg,     setFeatOrg]     = useState(null)   // org whose features modal is open
  const [planOrg,     setPlanOrg]     = useState(null)   // org whose plan modal is open
  const [quotaOrg,    setQuotaOrg]    = useState(null)   // org whose quota modal is open
  const [brandingOrg, setBrandingOrg] = useState(null)   // org whose branding modal is open
  const [view, setView] = useView('braify-organizations-view')

  const [form, setForm] = useState({
    name: '', code: '', description: '', features: [],
  })

  const load = useCallback((q = '') => {
    setLoading(true)
    const fn = q.trim() ? searchOrganizations(q) : getOrganizations()
    fn.then(setOrgs)
      .catch(err => toast.error(err.message || 'Could not load organizations.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!query.trim()) { load(); return }
    const t = setTimeout(() => load(query), 350)
    return () => clearTimeout(t)
  }, [query, load])

  const openCreate = () => {
    setEditOrg(null)
    setForm({ name: '', code: '', description: '', features: [] })
    setShowForm(true)
  }
  const openEdit = (org) => {
    setEditOrg(org)
    setForm({
      name:        org.name,
      code:        org.code,
      description: org.description || '',
      features:    org.features    || [],
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditOrg(null) }

  const codify = v => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (v) => {
    setForm(f => ({ ...f, name: v, code: editOrg ? f.code : codify(v) }))
  }

  const toggleFeature = (key) => {
    setForm(f => ({
      ...f,
      features: f.features.includes(key)
        ? f.features.filter(k => k !== key)
        : [...f.features, key],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required.')
      return
    }
    setSaving(true)
    try {
      if (editOrg) {
        await updateOrganization(editOrg.id, {
          name: form.name, description: form.description, features: form.features,
        })
        toast.success('Organization updated.')
      } else {
        await createOrganization({
          name: form.name, code: form.code, description: form.description, features: form.features,
        })
        toast.success('Organization created.')
      }
      closeForm()
      load(query)
    } catch (err) {
      toast.error(err.message || 'Failed to save organization.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (org) => {
    if (!confirm(`Delete organization "${org.name}"? This is a soft delete.`)) return
    try {
      await deleteOrganization(org.id)
      toast.success('Organization deleted.')
      load(query)
    } catch (err) {
      toast.error(err.message || 'Delete failed.')
    }
  }

  const handleFeaturesUpdated = (orgId, newFeatures) => {
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, features: newFeatures } : o))
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Organizations</h1>
          <p className="text-sm text-ink-3 mt-1">Manage all tenant organizations and their feature access.</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button onClick={openCreate} className="btn btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New Organization
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          className="form-input pl-9"
          placeholder="Search by name or code…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="card flex items-center justify-center py-20 text-ink-4 gap-3">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      ) : orgs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-ink-4">
          <svg className="w-10 h-10 mb-3 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <p className="text-sm">{query ? `No organizations match "${query}".` : 'No organizations yet.'}</p>
        </div>
      ) : view === 'grid' ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map(org => (
            <div key={org.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/admin/organizations/${org.id}`)}
                    className="font-bold text-brand-600 hover:text-brand-800 hover:underline text-left truncate block"
                  >
                    {org.name}
                  </button>
                  <code className="text-[11px] bg-ink-8 dark:bg-gray-700 px-2 py-0.5 rounded text-ink-3 dark:text-gray-400 mt-1 inline-block">
                    {org.code}
                  </code>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0
                  ${org.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${org.active ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                  {org.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {org.description && (
                <p className="text-xs text-ink-4 line-clamp-2">{org.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <PlanBadge plan={org.subscriptionPlan || 'FREE'} />
                {org.features?.length > 0 && org.features.map(f => <FeaturePill key={f} featureKey={f} />)}
              </div>

              <p className="text-[11px] text-ink-4 mt-auto">Created {fmtDate(org.createdAt)}</p>

              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-ink-7 dark:border-gray-700">
                <button onClick={() => navigate(`/users?orgId=${org.id}`)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-brand-400 hover:text-brand-600 transition-colors">
                  Users
                </button>
                <button onClick={() => setFeatOrg(org)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-accent-400 hover:text-accent-600 transition-colors">
                  Features
                </button>
                <button onClick={() => setPlanOrg(org)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-amber-400 hover:text-amber-600 transition-colors">
                  Plan
                </button>
                <button onClick={() => setQuotaOrg(org)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                  Quotas
                </button>
                <button onClick={() => openEdit(org)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-primary hover:text-primary transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(org)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-7 dark:border-gray-700 bg-ink-8 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Code</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Features</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {orgs.map(org => (
                <tr key={org.id} className="hover:bg-ink-8 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate(`/admin/organizations/${org.id}`)}
                      className="font-semibold text-brand-600 hover:text-brand-800 hover:underline text-left"
                    >
                      {org.name}
                    </button>
                    {org.description && (
                      <p className="text-xs text-ink-4 mt-0.5 truncate max-w-[200px]">{org.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-ink-8 dark:bg-gray-700 px-2 py-0.5 rounded text-ink-2 dark:text-gray-300">
                      {org.code}
                    </code>
                  </td>
                  {/* Plan column */}
                  <td className="px-5 py-3.5">
                    <PlanBadge plan={org.subscriptionPlan || 'FREE'} />
                  </td>
                  {/* Features column */}
                  <td className="px-5 py-3.5">
                    {org.features?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {org.features.map(f => <FeaturePill key={f} featureKey={f} />)}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-4 dark:text-gray-600 italic">No features</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold
                      ${org.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${org.active ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                      {org.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-4">{fmtDate(org.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                      <button
                        onClick={() => navigate(`/users?orgId=${org.id}`)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-brand-400 hover:text-brand-600 transition-colors"
                        title="View users"
                      >
                        Users
                      </button>
                      <button
                        onClick={() => setFeatOrg(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-accent-400 hover:text-accent-600 transition-colors"
                        title="Manage features"
                      >
                        Features
                      </button>
                      <button
                        onClick={() => setPlanOrg(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-amber-400 hover:text-amber-600 transition-colors"
                        title="Manage subscription plan"
                      >
                        Plan
                      </button>
                      <button
                        onClick={() => setQuotaOrg(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                        title="Manage quotas"
                      >
                        Quotas
                      </button>
                      <button
                        onClick={() => setBrandingOrg(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-pink-400 hover:text-pink-600 transition-colors"
                        title="View organization settings"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => openEdit(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-primary hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200
                                   text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <OrgFormModal
          editOrg={editOrg}
          form={form}
          saving={saving}
          onClose={closeForm}
          onSubmit={handleSave}
          onNameChange={handleNameChange}
          onFieldChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          onToggleFeature={toggleFeature}
          codify={codify}
        />
      )}

      {/* ── Manage Features Modal ── */}
      {featOrg && (
        <ManageFeaturesModal
          org={featOrg}
          onClose={() => setFeatOrg(null)}
          onUpdated={(newFeatures) => { handleFeaturesUpdated(featOrg.id, newFeatures); setFeatOrg(null) }}
        />
      )}

      {/* ── Plan Assignment Modal ── */}
      {planOrg && (
        <PlanModal
          org={planOrg}
          onClose={() => setPlanOrg(null)}
          onUpdated={(plan) => {
            setOrgs(prev => prev.map(o => o.id === planOrg.id ? { ...o, subscriptionPlan: plan } : o))
            setPlanOrg(null)
          }}
        />
      )}

      {/* ── Quota Override Modal ── */}
      {quotaOrg && (
        <QuotaModal
          org={quotaOrg}
          onClose={() => setQuotaOrg(null)}
        />
      )}

      {/* ── Branding Preview Modal ── */}
      {brandingOrg && (
        <BrandingPreviewModal
          org={brandingOrg}
          onClose={() => setBrandingOrg(null)}
        />
      )}
    </div>
  )
}

/* ── Org Create / Edit modal ─────────────────────────────────────────────── */
function OrgFormModal({ editOrg, form, saving, onClose, onSubmit, onNameChange, onFieldChange, onToggleFeature, codify }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
            {editOrg ? 'Edit Organization' : 'New Organization'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
          {/* Name & Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Organization Name *</label>
              <input
                className="form-input"
                placeholder="Acme Corp"
                value={form.name}
                onChange={e => onNameChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Code *</label>
              <input
                className="form-input font-mono"
                placeholder="acme-corp"
                value={form.code}
                onChange={e => onFieldChange('code', codify(e.target.value))}
                disabled={!!editOrg}
                required
              />
              {!editOrg && (
                <p className="text-xs text-gray-400 mt-1">Auto-generated. Cannot change later.</p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input resize-none"
              rows={2}
              placeholder="Optional description…"
              value={form.description}
              onChange={e => onFieldChange('description', e.target.value)}
            />
          </div>

          {/* Feature Assignment */}
          <div>
            <label className="form-label mb-2">
              Assign Features
              <span className="ml-1.5 text-[10px] text-gray-400 font-normal normal-case tracking-normal">
                ({form.features.length} selected)
              </span>
            </label>
            <div className="space-y-2">
              {ALL_FEATURES.map(feat => {
                const active = form.features.includes(feat.key)
                return (
                  <label
                    key={feat.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${active
                        ? 'border-opacity-100'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    style={active ? { borderColor: feat.color, background: feat.bg } : {}}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded accent-brand"
                      checked={active}
                      onChange={() => onToggleFeature(feat.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 shrink-0" style={{ color: feat.color }}>
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={feat.icon}/>
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {feat.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{feat.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Saving…' : editOrg ? 'Save Changes' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Plan Assignment modal ───────────────────────────────────────────────── */
const PLANS = [
  { value: 'FREE',         label: 'Free',         desc: '3 users · 50 docs/mo · 512 MB · 1,000 API calls', cls: 'border-gray-200 dark:border-gray-600' },
  { value: 'PROFESSIONAL', label: 'Professional', desc: '25 users · 500 docs/mo · 5 GB · 10,000 API calls', cls: 'border-brand-300 dark:border-brand-600' },
  { value: 'ENTERPRISE',   label: 'Enterprise',   desc: 'Unlimited users, docs, storage, and API calls',    cls: 'border-amber-300 dark:border-amber-600'  },
]

function PlanModal({ org, onClose, onUpdated }) {
  const toast = useToast()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [plan,    setPlan]    = useState('FREE')
  const [expires, setExpires] = useState('')

  useEffect(() => {
    getSubscription(org.id)
      .then(d => {
        setData(d)
        setPlan(d.subscriptionPlan || 'FREE')
        setExpires(d.planExpiresAt ? d.planExpiresAt.substring(0, 10) : '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [org.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await assignSubscription(org.id, {
        subscriptionPlan: plan,
        planExpiresAt: expires || null,
      })
      toast.success(`Plan updated to ${plan} for ${org.name}.`)
      onUpdated(plan)
    } catch (err) {
      toast.error(err.message || 'Failed to update plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Subscription Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : (
            <>
              {data?.planAssignedAt && (
                <div className="text-xs text-gray-400">
                  Current plan assigned <span className="font-medium">{fmtDate(data.planAssignedAt)}</span>
                  {data.planAssignedBy && <> by <span className="font-medium">{data.planAssignedBy}</span></>}
                </div>
              )}

              <div className="space-y-2">
                {PLANS.map(p => (
                  <label
                    key={p.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${plan === p.value ? p.cls + ' bg-gray-50 dark:bg-gray-700/40' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.value}
                      checked={plan === p.value}
                      onChange={() => setPlan(p.value)}
                      className="mt-0.5 accent-brand"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <PlanBadge plan={p.value} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="form-label">Plan Expiry <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={expires}
                  onChange={e => setExpires(e.target.value)}
                  min={new Date().toISOString().substring(0, 10)}
                />
                <p className="text-[11px] text-gray-400 mt-1">Leave blank for no expiry.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'Saving…' : 'Assign Plan'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Quota Override modal ─────────────────────────────────────────────────── */
function QuotaModal({ org, onClose }) {
  const toast = useToast()
  const [config,  setConfig]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({ maxUsers: '', maxDocsPerMonth: '', maxStorageMb: '', maxApiCallsPerMonth: '' })

  useEffect(() => {
    getQuotaConfig(org.id)
      .then(d => {
        setConfig(d)
        setForm({
          maxUsers:             d.maxUsers           ?? '',
          maxDocsPerMonth:      d.maxDocsPerMonth    ?? '',
          maxStorageMb:         d.maxStorageMb       ?? '',
          maxApiCallsPerMonth:  d.maxApiCallsPerMonth ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [org.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateQuotaConfig(org.id, {
        maxUsers:            Number(form.maxUsers)            || -1,
        maxDocsPerMonth:     Number(form.maxDocsPerMonth)     || -1,
        maxStorageMb:        Number(form.maxStorageMb)        || -1,
        maxApiCallsPerMonth: Number(form.maxApiCallsPerMonth) || -1,
      })
      toast.success(`Quotas updated for ${org.name}.`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update quotas.')
    } finally {
      setSaving(false)
    }
  }

  const numInput = (label, key, unit = '') => (
    <div>
      <label className="form-label">{label} {unit && <span className="text-gray-400 font-normal">({unit})</span>}</label>
      <input
        type="number"
        min={-1}
        className="form-input"
        placeholder="-1 = unlimited"
        value={form[key]}
        onChange={e => set(key, e.target.value)}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Usage Quotas</h2>
            <p className="text-xs text-gray-400 mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : (
            <>
              {/* Current usage bars */}
              {config && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-3">Current usage (this month)</p>
                  <QuotaProgressBar label="Users"          current={config.currentUsers      ?? 0} limit={config.maxUsers           ?? -1} />
                  <QuotaProgressBar label="Documents/mo"   current={config.currentDocs       ?? 0} limit={config.maxDocsPerMonth    ?? -1} />
                  <QuotaProgressBar label="Storage"        current={config.currentStorageMb  ?? 0} limit={config.maxStorageMb       ?? -1} unit=" MB" />
                  <QuotaProgressBar label="API calls/mo"   current={config.currentApiCalls   ?? 0} limit={config.maxApiCallsPerMonth ?? -1} />
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set custom limits below. Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">-1</code> for unlimited.
                Defaults are determined by the subscription plan.
              </p>

              {numInput('Max Users', 'maxUsers')}
              {numInput('Max Documents / month', 'maxDocsPerMonth')}
              {numInput('Max Storage', 'maxStorageMb', 'MB')}
              {numInput('Max API calls / month', 'maxApiCallsPerMonth')}
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="btn btn-primary flex-1">
            {saving ? 'Saving…' : 'Save Limits'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Organization Settings Preview modal ─────────────────────────────────── */
function BrandingPreviewModal({ org, onClose }) {
  const [branding, setBranding] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getBranding(org.id)
      .then(setBranding)
      .catch(() => setBranding(null))
      .finally(() => setLoading(false))
  }, [org.id])

  const color = branding?.primaryColor || '#2F5BF0'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Organization Settings</h2>
            <p className="text-xs text-gray-400 mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : !branding?.configured ? (
            <p className="text-sm text-gray-400 text-center py-6 italic">
              This organisation has not configured settings yet.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Logo */}
              {branding.logoBase64 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Logo</p>
                  <img src={branding.logoBase64} alt="Org logo" className="h-12 max-w-full object-contain rounded-lg border border-gray-100 dark:border-gray-700 p-1" />
                </div>
              )}
              {/* Color */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: color }} />
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Primary Colour</p>
                  <p className="text-xs font-mono text-gray-400 uppercase">{color}</p>
                </div>
              </div>
              {/* Email sender */}
              {(branding.emailSenderName || branding.emailReplyTo) && (
                <div className="text-xs space-y-1">
                  {branding.emailSenderName && (
                    <p><span className="text-gray-400">Sender:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{branding.emailSenderName}</span></p>
                  )}
                  {branding.emailReplyTo && (
                    <p><span className="text-gray-400">Reply-to:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{branding.emailReplyTo}</span></p>
                  )}
                </div>
              )}
              {/* Footer */}
              {branding.footerText && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Footer</p>
                  <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/40 px-3 py-2 rounded-lg italic">
                    {branding.footerText}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button onClick={onClose} className="btn btn-secondary w-full">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Manage Features modal (for existing orgs) ───────────────────────────── */
function ManageFeaturesModal({ org, onClose, onUpdated }) {
  const toast = useToast()
  const [selected, setSelected] = useState(org.features || [])
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  // Load latest features from backend when modal opens
  useEffect(() => {
    setLoading(true)
    getOrgFeatures(org.id)
      .then(data => setSelected(data.features ?? data ?? []))
      .catch(() => setSelected(org.features || []))
      .finally(() => setLoading(false))
  }, [org.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateOrgFeatures(org.id, selected)
      toast.success(`Features updated for ${org.name}.`)
      onUpdated(selected)
    } catch (err) {
      toast.error(err.message || 'Failed to update features.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Manage Features</h2>
            <p className="text-xs text-gray-400 mt-0.5">{org.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Steps guide */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mb-5">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">How to add a feature</p>
            <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5 list-decimal list-inside">
              <li>Toggle the feature checkbox below to enable or disable it.</li>
              <li>Click <strong>Save Changes</strong> — the org gains access immediately.</li>
              <li>Users in the org will see the new module in their sidebar on next page load.</li>
            </ol>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : (
            <div className="space-y-3">
              {ALL_FEATURES.map(feat => {
                const active = selected.includes(feat.key)
                return (
                  <label
                    key={feat.key}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${active
                        ? 'border-opacity-100'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    style={active ? { borderColor: feat.color, background: feat.bg } : {}}
                  >
                    {/* Toggle */}
                    <div className="relative mt-0.5">
                      <input type="checkbox" className="sr-only" checked={active} onChange={() => toggle(feat.key)} />
                      <div
                        className={`w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0`}
                        style={{ background: active ? feat.color : '#d1d5db' }}
                        onClick={() => toggle(feat.key)}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform
                          ${active ? 'translate-x-4' : 'translate-x-0.5'}`}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 shrink-0" style={{ color: feat.color }}>
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={feat.icon}/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{feat.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{feat.description}</p>
                        </div>
                      </div>
                      {/* Feature status badge */}
                      <div className="mt-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={active
                            ? { background: feat.color, color: '#fff' }
                            : { background: '#f3f4f6', color: '#9ca3af' }
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {active ? <IconCheck className="w-3 h-3" /> : <IconX className="w-3 h-3" />}
                            {active ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

