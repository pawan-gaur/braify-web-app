import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getApiKeys, getAllApiKeys, createApiKey, revokeApiKey, toggleApiKey } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ApiKeyCard from '../components/ui/ApiKeyCard'
import { fmtDate } from '../utils/date'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Settings' },
  { label: 'API Keys' },
]

const ALL_FEATURES = [
  { key: 'PDF_TEMPLATES',   label: 'PDF Templates',   cls: 'bg-indigo-100 text-indigo-700' },
  { key: 'EMAIL_TEMPLATES', label: 'Email Templates', cls: 'bg-sky-100 text-sky-700'       },
  { key: 'E_SIGN',          label: 'E-Sign',          cls: 'bg-emerald-100 text-emerald-700' },
]

/* ─────────────────────────────────────────────────────────────── */
export default function ApiKeysPage() {
  useDocumentTitle('API Keys')
  const { user } = useAuth()
  const isPlatformAdmin = user?.role === ROLES.PLATFORM_ADMIN

  return isPlatformAdmin
    ? <AdminApiKeysView />
    : <OrgApiKeysView />
}

/* ══════════════════════════════════════════════════════════════════
   PLATFORM ADMIN VIEW — cross-org, grouped by organisation
══════════════════════════════════════════════════════════════════ */
function AdminApiKeysView() {
  const toast = useToast()
  const [activeTab,   setActiveTab]   = useState('keys')
  const [allKeys,     setAllKeys]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterOrg,   setFilterOrg]   = useState('all')
  const [filterStatus,setFilterStatus]= useState('all')   // 'all' | 'active' | 'inactive'
  const [toggling,    setToggling]    = useState({})
  const [revoking,    setRevoking]    = useState({})

  const load = useCallback(() => {
    setLoading(true)
    getAllApiKeys()
      .then(data => setAllKeys(Array.isArray(data) ? data : []))
      .catch(err  => toast.error(err.message || 'Failed to load API keys.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  // Unique orgs from data — for filter dropdown
  const orgOptions = useMemo(() => {
    const seen = new Map()
    allKeys.forEach(k => { if (!seen.has(k.orgId)) seen.set(k.orgId, k.orgName || k.orgId) })
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [allKeys])

  // Filtered / searched keys
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allKeys.filter(k => {
      if (filterOrg    !== 'all'      && k.orgId  !== filterOrg)                            return false
      if (filterStatus === 'active'   && !k.active)                                         return false
      if (filterStatus === 'inactive' && k.active)                                          return false
      if (q && !k.name?.toLowerCase().includes(q)
            && !k.orgName?.toLowerCase().includes(q)
            && !k.keyPrefix?.toLowerCase().includes(q))                                     return false
      return true
    })
  }, [allKeys, filterOrg, filterStatus, search])

  // Group by org
  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach(k => {
      if (!map.has(k.orgId)) map.set(k.orgId, { orgId: k.orgId, orgName: k.orgName || k.orgId, keys: [] })
      map.get(k.orgId).keys.push(k)
    })
    return [...map.values()].sort((a, b) => a.orgName.localeCompare(b.orgName))
  }, [filtered])

  const handleToggle = async (orgId, keyId) => {
    setToggling(t => ({ ...t, [keyId]: true }))
    try {
      await toggleApiKey(orgId, keyId)
      setAllKeys(prev => prev.map(k => k.id === keyId ? { ...k, active: !k.active } : k))
      toast.success('API key updated.')
    } catch (err) {
      toast.error(err.message || 'Failed to toggle key.')
    } finally {
      setToggling(t => { const n = { ...t }; delete n[keyId]; return n })
    }
  }

  const handleRevoke = async (orgId, keyId) => {
    setRevoking(r => ({ ...r, [keyId]: true }))
    try {
      await revokeApiKey(orgId, keyId)
      setAllKeys(prev => prev.filter(k => k.id !== keyId))
      toast.success('API key revoked.')
    } catch (err) {
      toast.error(err.message || 'Failed to revoke key.')
    } finally {
      setRevoking(r => { const n = { ...r }; delete n[keyId]; return n })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            All API keys across every organisation.
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full">
              Platform Admin
            </span>
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {allKeys.length} total key{allKeys.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        {[
          { id: 'keys',      label: 'All Keys',     icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
          { id: 'reference', label: 'API Reference', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon}/>
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reference' && <ApiReferenceTab />}

      {activeTab === 'keys' && (
        <>
          {/* Filters bar */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                className="form-input pl-9"
                placeholder="Search by key name, org, or prefix…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {orgOptions.length > 1 && (
              <select
                className="form-input w-auto min-w-[160px]"
                value={filterOrg}
                onChange={e => setFilterOrg(e.target.value)}
              >
                <option value="all">All Organisations</option>
                {orgOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}

            <select
              className="form-input w-auto min-w-[130px]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {(search || filterOrg !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilterOrg('all'); setFilterStatus('all') }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading API keys…
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {search || filterOrg !== 'all' || filterStatus !== 'all'
                  ? 'No keys match your filters.'
                  : 'No API keys have been created yet across any organisation.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ orgId, orgName, keys }) => (
                <OrgKeyGroup
                  key={orgId}
                  orgId={orgId}
                  orgName={orgName}
                  keys={keys}
                  toggling={toggling}
                  revoking={revoking}
                  onToggle={handleToggle}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Org group with collapsible header ───────────────────────── */
function OrgKeyGroup({ orgId, orgName, keys, toggling, revoking, onToggle, onRevoke }) {
  const [open, setOpen] = useState(true)
  const activeCount   = keys.filter(k => k.active).length
  const inactiveCount = keys.length - activeCount

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{orgName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {keys.length} key{keys.length !== 1 ? 's' : ''}
            {activeCount > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">{activeCount} active</span>
            )}
            {inactiveCount > 0 && (
              <span className="ml-2 text-gray-400 font-semibold">{inactiveCount} inactive</span>
            )}
          </p>
        </div>
        <a
          href={`/admin/organizations/${orgId}`}
          onClick={e => e.stopPropagation()}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mr-2"
        >
          View org →
        </a>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Keys list */}
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
          {keys.map(k => (
            <div key={k.id} className="px-4 py-3 bg-white dark:bg-gray-800/40">
              <ApiKeyCard
                apiKey={k}
                onToggle={(keyId) => onToggle(k.orgId, keyId)}
                onRevoke={(keyId) => onRevoke(k.orgId, keyId)}
                isToggling={!!toggling[k.id]}
                isRevoking={!!revoking[k.id]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ORG USER VIEW — single org (ORG_ADMIN / ADMIN / USER)
══════════════════════════════════════════════════════════════════ */
function OrgApiKeysView() {
  const { user } = useAuth()
  const toast = useToast()
  const orgId = user?.organizationId

  const [activeTab,   setActiveTab]   = useState('keys')
  const [keys,        setKeys]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [createdKey,  setCreatedKey]  = useState(null)
  const [toggling,    setToggling]    = useState({})
  const [revoking,    setRevoking]    = useState({})

  const load = useCallback(() => {
    if (!orgId) return
    setLoading(true)
    getApiKeys(orgId)
      .then(data => setKeys(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(err  => toast.error(err.message || 'Failed to load API keys.'))
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleToggle = async (keyId) => {
    setToggling(t => ({ ...t, [keyId]: true }))
    try {
      await toggleApiKey(orgId, keyId)
      setKeys(prev => prev.map(k => k.id === keyId ? { ...k, active: !k.active } : k))
      toast.success('API key updated.')
    } catch (err) {
      toast.error(err.message || 'Failed to toggle key.')
    } finally {
      setToggling(t => { const n = { ...t }; delete n[keyId]; return n })
    }
  }

  const handleRevoke = async (keyId) => {
    setRevoking(r => ({ ...r, [keyId]: true }))
    try {
      await revokeApiKey(orgId, keyId)
      setKeys(prev => prev.filter(k => k.id !== keyId))
      toast.success('API key revoked.')
    } catch (err) {
      toast.error(err.message || 'Failed to revoke key.')
    } finally {
      setRevoking(r => { const n = { ...r }; delete n[keyId]; return n })
    }
  }

  const handleCreated = (rawKey, keyObj) => {
    setShowCreate(false)
    setCreatedKey(rawKey)
    setKeys(prev => [keyObj, ...prev])
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Manage programmatic access to your organisation.</p>
        </div>
        {activeTab === 'keys' && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Generate New Key
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        {[
          { id: 'keys',      label: 'My Keys',      icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
          { id: 'reference', label: 'API Reference', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon}/>
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: My Keys */}
      {activeTab === 'keys' && (
        loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading API keys…
          </div>
        ) : keys.length === 0 ? (
          <EmptyState onGenerate={() => setShowCreate(true)} />
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
        )
      )}

      {/* Tab: API Reference */}
      {activeTab === 'reference' && <ApiReferenceTab />}

      {showCreate && (
        <CreateKeyModal
          orgId={orgId}
          orgFeatures={user?.features ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
      {createdKey && (
        <KeyCreatedModal rawKey={createdKey} onClose={() => setCreatedKey(null)} />
      )}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────── */
function EmptyState({ onGenerate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">No API keys yet</h3>
      <p className="text-sm text-gray-400 mb-5 max-w-xs">
        Generate an API key to allow external services to access your organisation's features programmatically.
      </p>
      <button onClick={onGenerate} className="btn btn-primary gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
        </svg>
        Generate New Key
      </button>
    </div>
  )
}

/* ── Code block with copy button ─────────────────────────────── */
function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{lang}</span>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all
            ${copied ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm text-gray-100 font-mono overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  )
}

/* ── Endpoint badge ──────────────────────────────────────────── */
function MethodBadge({ method }) {
  const colours = {
    GET:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    POST:   'bg-indigo-100  text-indigo-700  dark:bg-indigo-900/40  dark:text-indigo-400',
    DELETE: 'bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-400',
    PATCH:  'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg tracking-wide ${colours[method] ?? 'bg-gray-100 text-gray-600'}`}>
      {method}
    </span>
  )
}

/* ── Collapsible endpoint doc ────────────────────────────────── */
function EndpointDoc({ method, path, title, description, requestBody, responseBody, curlExample, fetchExample }) {
  const [open, setOpen] = useState(false)
  const [codeTab, setCodeTab] = useState('curl')

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1">{path}</code>
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-6 pt-2 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requestBody && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Request Body</p>
                <CodeBlock code={requestBody} lang="json" />
              </div>
            )}
            <div className={requestBody ? '' : 'md:col-span-2'}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Response</p>
              <CodeBlock code={responseBody} lang="json" />
            </div>
          </div>

          <div>
            <div className="flex gap-1 mb-2">
              {[['curl', 'cURL'], ['fetch', 'JavaScript']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setCodeTab(id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                    ${codeTab === id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <CodeBlock code={codeTab === 'curl' ? curlExample : fetchExample} lang={codeTab === 'curl' ? 'bash' : 'javascript'} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Section heading ─────────────────────────────────────────── */
function SectionHeading({ icon, badge, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon}/>
        </svg>
      </div>
      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{children}</h2>
      {badge && (
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      )}
    </div>
  )
}

/* ── API Reference tab ───────────────────────────────────────── */
function ApiReferenceTab() {
  const BASE = 'https://your-domain.com/api/external'

  return (
    <div className="space-y-10">
      {/* Authentication */}
      <section>
        <SectionHeading icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
          Authentication
        </SectionHeading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          All external API requests must include your API key in the{' '}
          <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code>{' '}
          header. Keys are prefixed with <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">brfy_</code> and are shown only once at creation time.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl https://your-domain.com/api/external/pdf/templates \\
  -H "X-API-Key: brfy_your_api_key_here"`}
        />
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Keep your keys secure</p>
          <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1">
            <li>Never expose API keys in client-side JavaScript or public repositories.</li>
            <li>Store keys in environment variables or a secrets manager.</li>
            <li>Revoke and rotate keys immediately if they are compromised.</li>
          </ul>
        </div>
      </section>

      {/* Base URL */}
      <section>
        <SectionHeading icon="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9">
          Base URL
        </SectionHeading>
        <CodeBlock lang="text" code={BASE} />
      </section>

      {/* PDF Templates */}
      <section>
        <SectionHeading
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          badge={{ label: 'PDF_TEMPLATES', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' }}
        >
          PDF Templates
        </SectionHeading>
        <div className="space-y-3">
          <EndpointDoc
            method="GET" path="/api/external/pdf/templates" title="List PDF templates"
            description="Returns all active PDF templates belonging to your organisation."
            requestBody={null}
            responseBody={`[\n  {\n    "id": "64f2a1b3c9e1234567890abc",\n    "name": "Invoice Template",\n    "description": "Standard invoice layout",\n    "updatedAt": "2026-05-15T10:30:00Z"\n  }\n]`}
            curlExample={`curl https://your-domain.com/api/external/pdf/templates \\\n  -H "X-API-Key: brfy_your_api_key_here"`}
            fetchExample={`const res = await fetch('https://your-domain.com/api/external/pdf/templates', {\n  headers: { 'X-API-Key': 'brfy_your_api_key_here' }\n})\nconst templates = await res.json()`}
          />
          <EndpointDoc
            method="POST" path="/api/external/pdf/generate" title="Generate PDF"
            description="Renders a PDF template with your data and returns the PDF file as a binary stream."
            requestBody={`{\n  "templateId": "64f2a1b3c9e1234567890abc",\n  "data": {\n    "customerName": "Acme Corp",\n    "invoiceNumber": "INV-2026-001",\n    "amount": "1,250.00",\n    "dueDate": "2026-06-15"\n  }\n}`}
            responseBody={`// Binary PDF stream\n// Content-Type: application/pdf\n// Content-Disposition: attachment; filename="Invoice_Template.pdf"`}
            curlExample={`curl -X POST https://your-domain.com/api/external/pdf/generate \\\n  -H "X-API-Key: brfy_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"templateId":"64f2a1b3c9e1234567890abc","data":{"customerName":"Acme Corp"}}' \\\n  --output invoice.pdf`}
            fetchExample={`const res = await fetch('https://your-domain.com/api/external/pdf/generate', {\n  method: 'POST',\n  headers: {\n    'X-API-Key': 'brfy_your_api_key_here',\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify({\n    templateId: '64f2a1b3c9e1234567890abc',\n    data: { customerName: 'Acme Corp', invoiceNumber: 'INV-2026-001' },\n  }),\n})\nconst blob = await res.blob()\n// trigger download…`}
          />
        </div>
      </section>

      {/* Email Templates */}
      <section>
        <SectionHeading
          icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          badge={{ label: 'EMAIL_TEMPLATES', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' }}
        >
          Email Templates
        </SectionHeading>
        <div className="space-y-3">
          <EndpointDoc
            method="GET" path="/api/external/email/templates" title="List email templates"
            description="Returns all active email templates belonging to your organisation."
            requestBody={null}
            responseBody={`[\n  {\n    "id": "64f2a1b3c9e1234567890def",\n    "name": "Welcome Email",\n    "subject": "Welcome to {{companyName}}!",\n    "updatedAt": "2026-05-10T08:00:00Z"\n  }\n]`}
            curlExample={`curl https://your-domain.com/api/external/email/templates \\\n  -H "X-API-Key: brfy_your_api_key_here"`}
            fetchExample={`const res = await fetch('https://your-domain.com/api/external/email/templates', {\n  headers: { 'X-API-Key': 'brfy_your_api_key_here' }\n})\nconst templates = await res.json()`}
          />
          <EndpointDoc
            method="POST" path="/api/external/email/send" title="Send email"
            description="Renders an email template and sends it to the specified recipient. Subject overrides the template default."
            requestBody={`{\n  "templateId": "64f2a1b3c9e1234567890def",\n  "to": "user@example.com",\n  "subject": "Your invoice is ready",\n  "data": {\n    "customerName": "Jane Smith",\n    "invoiceNumber": "INV-2026-001"\n  }\n}`}
            responseBody={`{\n  "success": true,\n  "messageId": "resend_msg_id_abc123",\n  "to": "user@example.com",\n  "subject": "Your invoice is ready"\n}`}
            curlExample={`curl -X POST https://your-domain.com/api/external/email/send \\\n  -H "X-API-Key: brfy_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"templateId":"64f2a1b3c9e1234567890def","to":"user@example.com","data":{"customerName":"Jane"}}'`}
            fetchExample={`const res = await fetch('https://your-domain.com/api/external/email/send', {\n  method: 'POST',\n  headers: {\n    'X-API-Key': 'brfy_your_api_key_here',\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify({\n    templateId: '64f2a1b3c9e1234567890def',\n    to: 'user@example.com',\n    data: { customerName: 'Jane Smith' },\n  }),\n})\nconst result = await res.json()\nconsole.log(result.messageId)`}
          />
        </div>
      </section>

      {/* E-Sign coming soon */}
      <section>
        <SectionHeading
          icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          badge={{ label: 'E_SIGN', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' }}
        >
          E-Sign
        </SectionHeading>
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Coming soon</p>
            <p className="text-xs text-gray-400 mt-0.5">E-Sign external API endpoints are under development.</p>
          </div>
        </div>
      </section>

      {/* Error Reference */}
      <section>
        <SectionHeading icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
          Error Reference
        </SectionHeading>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Status', 'Code', 'Meaning'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { s: '400', c: 'Bad Request',          m: 'Missing or invalid parameters (e.g. missing templateId or to).' },
                { s: '401', c: 'Unauthorized',         m: 'No X-API-Key header, or the key is invalid / revoked.' },
                { s: '403', c: 'Forbidden',            m: 'Key lacks permission for this feature, or the org feature is disabled.' },
                { s: '404', c: 'Not Found',            m: 'Template not found or does not belong to your organisation.' },
                { s: '429', c: 'Too Many Requests',    m: 'Organisation has exceeded its monthly usage quota.' },
                { s: '500', c: 'Internal Server Error',m: 'Unexpected server error. Retry or contact support.' },
                { s: '501', c: 'Not Implemented',      m: 'Endpoint not yet available (e.g. E-Sign external API).' },
              ].map(row => (
                <tr key={row.s} className="bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">{row.s}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">{row.c}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{row.m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-5 py-4 text-sm text-indigo-700 dark:text-indigo-300">
        <strong>Need help?</strong> Every API request is logged. Visit the <strong>Usage</strong> tab on your organisation dashboard to monitor call counts and per-key statistics.
      </div>
    </div>
  )
}

/* ── Create Key Modal ────────────────────────────────────────── */
function CreateKeyModal({ orgId, orgFeatures, onClose, onCreated }) {
  const toast = useToast()
  const [name,     setName]     = useState('')
  const [features, setFeatures] = useState([])
  const [expires,  setExpires]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const availableFeatures = ALL_FEATURES.filter(f => orgFeatures.includes(f.key))
  const toggleFeature = key =>
    setFeatures(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Key name is required.'); return }
    setSaving(true)
    try {
      const res = await createApiKey(orgId, {
        name:            name.trim(),
        allowedFeatures: features,
        expiresAt:       expires ? `${expires}T23:59:59` : null,
      })
      const rawKey = res.plainKey ?? null
      const keyObj = res.keyMeta ?? res
      onCreated(rawKey, keyObj)
      toast.success('API key created.')
    } catch (err) {
      toast.error(err.message || 'Failed to create API key.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Generate New API Key</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="form-label">Key Name *</label>
            <input className="form-input" placeholder="e.g. Production API, CI/CD Pipeline"
              value={name} onChange={e => setName(e.target.value)} required/>
          </div>
          {availableFeatures.length > 0 && (
            <div>
              <label className="form-label">
                Allowed Features
                <span className="ml-1.5 text-[10px] text-gray-400 font-normal normal-case">(leave empty to allow all org features)</span>
              </label>
              <div className="space-y-2">
                {availableFeatures.map(f => (
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
            <label className="form-label">
              Expiry Date <span className="text-[10px] text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input type="date" className="form-input" value={expires} onChange={e => setExpires(e.target.value)}
              min={new Date().toISOString().substring(0, 10)}/>
            <p className="text-[11px] text-gray-400 mt-1">Leave blank for a key that never expires.</p>
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

/* ── Key Created Modal ───────────────────────────────────────── */
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
        <div className="px-6 py-5 space-y-5">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Copy this key now — it will never be shown again.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Store it securely. If you lose it, revoke and create a new key.
            </p>
          </div>
          {rawKey ? (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Your API Key</p>
              <code className="block w-full bg-gray-900 text-green-400 text-sm font-mono px-4 py-3 rounded-xl break-all leading-relaxed">
                {rawKey}
              </code>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-3">
              Key value not returned by the server. Check your API keys list.
            </p>
          )}
          <div className="flex gap-3">
            {rawKey && (
              <button
                onClick={copy}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                {copied ? (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copied!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>Copy to Clipboard</>
                )}
              </button>
            )}
            <button onClick={onClose} className="flex-1 btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
