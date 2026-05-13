import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuditLogs, getOrganizations } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import { useAuth, ROLES } from '../context/AuthContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Audit Log' },
]

/* ── Action badge colours ── */
const ACTION_BADGE = {
  CREATED:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATED:          'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  DELETED:          'bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400',
  RESTORED:         'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PASSWORD_CHANGED: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  AVATAR_UPDATED:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DEACTIVATED:      'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  ACTIVATED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SESSION_REVOKED:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SENT:             'bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400',
  FEATURES_UPDATED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CANCELLED:        'bg-gray-100   text-gray-600   dark:bg-gray-700/40   dark:text-gray-400',
}

/* ── Action icon paths ── */
const ACTION_ICON = {
  CREATED:          'M12 4v16m8-8H4',
  UPDATED:          'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  DELETED:          'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  RESTORED:         'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  PASSWORD_CHANGED: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  AVATAR_UPDATED:   'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  DEACTIVATED:      'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  ACTIVATED:        'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  SESSION_REVOKED:  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  SENT:             'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
  FEATURES_UPDATED: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  CANCELLED:        'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
}

/* ── Resource type labels ── */
const RESOURCE_LABEL = {
  TEMPLATE:       { label: 'PDF Template',   color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
  EMAIL_TEMPLATE: { label: 'Email Template', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' },
  USER:           { label: 'User / Profile', color: 'bg-sky-50    text-sky-600    dark:bg-sky-900/20    dark:text-sky-400' },
  ORGANIZATION:   { label: 'Organization',   color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
  E_SIGN:         { label: 'E-Sign',         color: 'bg-teal-50   text-teal-600   dark:bg-teal-900/20   dark:text-teal-400' },
}

/* ── Feature key → human label ── */
const FEATURE_LABEL = {
  PDF_TEMPLATES:   'PDF Templates',
  EMAIL_TEMPLATES: 'Email Templates',
  E_SIGN:          'E-Sign',
}
const featureLabel = (key) => FEATURE_LABEL[key] || key

/* ── Resource type filter options ── */
const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'TEMPLATE',       label: 'PDF Template' },
  { value: 'EMAIL_TEMPLATE', label: 'Email Template' },
  { value: 'E_SIGN',         label: 'E-Sign' },
  { value: 'ORGANIZATION',   label: 'Organization' },
  { value: 'USER',           label: 'User / Profile' },
]

/* ── Action filter options (role-aware) ── */
const ALL_ACTIONS  = ['ALL', 'CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'SENT',
                      'FEATURES_UPDATED', 'CANCELLED',
                      'PASSWORD_CHANGED', 'AVATAR_UPDATED',
                      'DEACTIVATED', 'ACTIVATED', 'SESSION_REVOKED']
const USER_ACTIONS = ['ALL', 'CREATED', 'UPDATED', 'DELETED', 'RESTORED',
                      'SENT', 'PASSWORD_CHANGED', 'AVATAR_UPDATED']

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

/* ── Scope description ── */
function scopeLabel(role) {
  switch (role) {
    case ROLES.PLATFORM_ADMIN: return 'Showing all activity across the entire platform. Use the filters to scope by organisation or resource type.'
    case ROLES.ORG_ADMIN:      return 'Showing all activity within your organization.'
    case ROLES.ADMIN:          return 'Showing activity by Admin and User roles in your organization.'
    default:                   return 'Showing only your own activity.'
  }
}

/* ══════════════════════════════════════════════════════════════════
   ChangeDetail — renders the `changes` / metadata of a log entry
   in a human-readable, expandable panel below the main row
   ══════════════════════════════════════════════════════════════════ */
function ChangeDetail({ entry }) {
  const { changes, action, resourceType } = entry

  /* ── ORGANIZATION: features diff ── */
  if (resourceType === 'ORGANIZATION') {
    /* FEATURES_UPDATED / UPDATED with feature diff */
    const featuresDiff = changes?.features
    if (featuresDiff && typeof featuresDiff === 'object' && !Array.isArray(featuresDiff)) {
      const fromList = Array.isArray(featuresDiff.from) ? featuresDiff.from : []
      const toList   = Array.isArray(featuresDiff.to)   ? featuresDiff.to   : []
      const added    = toList.filter(f => !fromList.includes(f))
      const removed  = fromList.filter(f => !toList.includes(f))
      const kept     = toList.filter(f => fromList.includes(f))

      return (
        <div className="px-5 py-3 bg-purple-50/60 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-900/20">
          <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
            Feature Changes
          </p>
          <div className="flex flex-wrap gap-2">
            {added.map(f => (
              <span key={f} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1
                                       bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400
                                       rounded-full border border-emerald-200 dark:border-emerald-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                {featureLabel(f)}
              </span>
            ))}
            {removed.map(f => (
              <span key={f} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1
                                       bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400
                                       rounded-full border border-rose-200 dark:border-rose-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                </svg>
                {featureLabel(f)}
              </span>
            ))}
            {kept.map(f => (
              <span key={f} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1
                                       bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400
                                       rounded-full border border-gray-200 dark:border-gray-700">
                {featureLabel(f)}
              </span>
            ))}
            {added.length === 0 && removed.length === 0 && kept.length === 0 && (
              <span className="text-xs text-gray-400 italic">No features assigned</span>
            )}
          </div>
          {(added.length > 0 || removed.length > 0) && (
            <p className="text-[11px] text-gray-400 mt-2">
              {added.length > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{added.length} added</span>}
              {added.length > 0 && removed.length > 0 && <span className="mx-1">·</span>}
              {removed.length > 0 && <span className="text-rose-600 dark:text-rose-400">−{removed.length} removed</span>}
              {kept.length > 0 && <span className="text-gray-400 ml-1">· {kept.length} unchanged</span>}
            </p>
          )}
        </div>
      )
    }

    /* CREATED org — initial feature list */
    if (action === 'CREATED' && changes?.features && Array.isArray(changes.features)) {
      const features = changes.features
      return (
        <div className="px-5 py-3 bg-emerald-50/60 dark:bg-emerald-900/10 border-t border-emerald-100 dark:border-emerald-900/20">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
            Initial Features Assigned
          </p>
          <div className="flex flex-wrap gap-2">
            {features.length === 0
              ? <span className="text-xs text-gray-400 italic">No features assigned at creation</span>
              : features.map(f => (
                  <span key={f} className="text-xs font-semibold px-2.5 py-1
                                           bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400
                                           rounded-full border border-emerald-200 dark:border-emerald-800">
                    {featureLabel(f)}
                  </span>
                ))
            }
          </div>
        </div>
      )
    }
  }

  /* ── TEMPLATE / EMAIL_TEMPLATE: field-level diff ── */
  if ((resourceType === 'TEMPLATE' || resourceType === 'EMAIL_TEMPLATE') && changes && typeof changes === 'object') {
    const fields = Object.entries(changes)
    if (fields.length === 0) return null
    return (
      <div className="px-5 py-3 bg-blue-50/40 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/20">
        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
          Changes
        </p>
        <div className="space-y-1.5">
          {fields.map(([field, diff]) => {
            const from = diff?.from ?? '—'
            const to   = diff?.to   ?? '—'
            return (
              <div key={field} className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-gray-500 dark:text-gray-400 capitalize min-w-[80px]">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-rose-500 dark:text-rose-400 line-through truncate max-w-[160px]">{String(from)}</span>
                <svg className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[160px]">{String(to)}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── E_SIGN: metadata ── */
  if (resourceType === 'E_SIGN' && changes && typeof changes === 'object') {
    const entries = Object.entries(changes).filter(([k]) => k !== 'action')
    const actionMeta = changes.action
    if (entries.length === 0) return null
    return (
      <div className="px-5 py-3 bg-teal-50/40 dark:bg-teal-900/10 border-t border-teal-100 dark:border-teal-900/20">
        <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">
          Details{actionMeta ? ` · ${actionMeta}` : ''}
        </p>
        <div className="flex flex-wrap gap-3">
          {entries.map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── USER: generic changes ── */
  if (resourceType === 'USER' && changes && typeof changes === 'object') {
    const fields = Object.entries(changes)
    if (fields.length === 0) return null
    return (
      <div className="px-5 py-3 bg-sky-50/40 dark:bg-sky-900/10 border-t border-sky-100 dark:border-sky-900/20">
        <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide mb-2">Changes</p>
        <div className="space-y-1.5">
          {fields.map(([field, diff]) => (
            <div key={field} className="flex items-start gap-2 text-xs">
              <span className="font-semibold text-gray-500 dark:text-gray-400 capitalize min-w-[80px]">{field}</span>
              {diff?.from !== undefined && (
                <>
                  <span className="text-rose-500 line-through truncate max-w-[160px]">{String(diff.from)}</span>
                  <svg className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                  <span className="text-emerald-600 font-medium truncate max-w-[160px]">{String(diff.to)}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

/* Returns true if this entry has any detail worth expanding */
function hasDetail(entry) {
  if (!entry.changes && entry.resourceType !== 'E_SIGN') return false
  if (entry.resourceType === 'ORGANIZATION') return true
  if (entry.changes && Object.keys(entry.changes).length > 0) return true
  return false
}

/* ── Resolve org name from organizationId ── */
function resolveOrgName(entry, orgs, me) {
  if (!entry.organizationId) return '—'
  // PLATFORM_ADMIN has the full org list loaded
  if (me?.role === ROLES.PLATFORM_ADMIN) {
    const org = orgs.find(o => o.id === entry.organizationId)
    return org?.name ?? entry.organizationId   // fallback to ID if not found
  }
  // All other roles can only see their own org's entries
  return me?.organizationName ?? '—'
}

/* ══════════════════════════════════════════════════════════════════
   AuditLogPage
   ══════════════════════════════════════════════════════════════════ */
export default function AuditLogPage() {
  useDocumentTitle('Audit Log')
  const navigate     = useNavigate()
  const toast        = useToast()
  const { user: me } = useAuth()

  const isPlatformAdmin = me?.role === ROLES.PLATFORM_ADMIN
  const isUser          = me?.role === ROLES.USER

  /* ── State ── */
  const [data,         setData]         = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page,         setPage]         = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [orgFilter,    setOrgFilter]    = useState('')
  const [orgs,         setOrgs]         = useState([])
  const [expandedId,   setExpandedId]   = useState(null)   // which row is expanded

  const SIZE = 20

  useEffect(() => {
    if (!isPlatformAdmin) return
    getOrganizations().then(setOrgs).catch(() => {})
  }, [isPlatformAdmin])

  useEffect(() => { setPage(0) }, [typeFilter, orgFilter])

  const fetchLog = useCallback(() => {
    setLoading(true)
    getAuditLogs(page, SIZE, typeFilter || null, orgFilter || null)
      .then(setData)
      .catch(err => toast.error(err.message || 'Could not load audit log.'))
      .finally(() => setLoading(false))
  }, [page, typeFilter, orgFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchLog() }, [fetchLog])

  const displayed = actionFilter === 'ALL'
    ? data.content
    : data.content.filter(e => e.action === actionFilter)

  const visibleActions = isUser ? USER_ACTIONS : ALL_ACTIONS

  const canOpenResource = (entry) =>
    (entry.resourceType === 'TEMPLATE' || entry.resourceType === 'EMAIL_TEMPLATE' ||
     entry.resourceType === 'E_SIGN') &&
    entry.action !== 'DELETED' && entry.action !== 'CANCELLED'

  const openResource = (entry) => {
    if (entry.resourceType === 'EMAIL_TEMPLATE') navigate(`/email-builder/${entry.templateId}`)
    else if (entry.resourceType === 'TEMPLATE')  navigate(`/builder/${entry.templateId}`)
    else if (entry.resourceType === 'E_SIGN')    navigate(`/esign/${entry.templateId}`)
  }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">{scopeLabel(me?.role)}</p>
        </div>
        <span className="badge badge-indigo text-xs">{data.totalElements} total events</span>
      </div>

      {/* Server-side filters row */}
      <div className="flex flex-wrap items-center gap-3 mt-4 mb-3">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {RESOURCE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {isPlatformAdmin && (
          <select
            value={orgFilter}
            onChange={e => setOrgFilter(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Organizations</option>
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}

        {(typeFilter || orgFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setOrgFilter('') }}
            className="text-xs text-gray-400 hover:text-primary transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Action filter pills */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {visibleActions.map(a => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
              actionFilter === a
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading audit log…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-sm">No events found{actionFilter !== 'ALL' ? ` for "${actionFilter.replace(/_/g, ' ')}"` : ''}.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="w-6 px-3 py-3" />
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Resource</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Performed By</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Timestamp</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map(entry => {
                const resInfo    = RESOURCE_LABEL[entry.resourceType] || { label: entry.resourceType, color: 'bg-gray-100 text-gray-600' }
                const badgeCls   = ACTION_BADGE[entry.action] || 'bg-gray-100 text-gray-600'
                const iconD      = ACTION_ICON[entry.action]  || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                const isExpanded = expandedId === entry.id
                const expandable = hasDetail(entry)
                const orgName    = resolveOrgName(entry, orgs, me)

                return (
                  <>
                    <tr
                      key={entry.id}
                      className={`border-t border-gray-50 dark:border-gray-800 transition-colors group
                        ${isExpanded ? 'bg-gray-50 dark:bg-gray-800/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}
                        ${expandable ? 'cursor-pointer' : ''}`}
                      onClick={() => expandable && toggleExpand(entry.id)}
                    >
                      {/* Expand chevron */}
                      <td className="w-6 pl-3 pr-0 py-3.5">
                        {expandable ? (
                          <svg
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150
                              ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                          </svg>
                        ) : (
                          <span className="w-3.5 h-3.5 block" />
                        )}
                      </td>

                      {/* Action badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${badgeCls}`}>
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconD}/>
                          </svg>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Resource name + ID */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800 dark:text-gray-200 leading-tight max-w-[200px] truncate">
                          {entry.templateName || '—'}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px]">
                          {entry.templateId}
                        </p>
                      </td>

                      {/* Resource type chip */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${resInfo.color}`}>
                          {resInfo.label}
                        </span>
                      </td>

                      {/* Organization */}
                      <td className="px-4 py-3.5">
                        {orgName === '—' ? (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        ) : (
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300
                                           bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-md
                                           max-w-[140px] truncate inline-block">
                            {orgName}
                          </span>
                        )}
                      </td>

                      {/* Performed by */}
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                        {entry.performedBy || 'system'}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(entry.timestamp)}
                      </td>

                      {/* Open / hint */}
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        {canOpenResource(entry) && (
                          <button
                            onClick={() => openResource(entry)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity
                                       text-xs px-2.5 py-1 rounded-lg border border-gray-200
                                       dark:border-gray-600 text-gray-500 dark:text-gray-400
                                       hover:border-primary hover:text-primary"
                          >
                            Open
                          </button>
                        )}
                        {expandable && !canOpenResource(entry) && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-gray-400">
                            {isExpanded ? 'Collapse' : 'Details'}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {isExpanded && (
                      <tr key={`${entry.id}-detail`} className="border-t-0">
                        <td colSpan={8} className="p-0">
                          <ChangeDetail entry={entry} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Page {page + 1} of {data.totalPages} · {data.totalElements} events
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-ghost btn-sm disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-ghost btn-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
