import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import EmptyState from '../components/ui/EmptyState'
import SignerDocumentRow, { useSignerDocActions } from '../components/signer/SignerDocumentRow'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import VerifyEmailCard from '../components/signer/VerifyEmailCard'
import { signerListDocuments, needsEmailVerification } from '../services/api'

const CRUMBS = [{ label: 'Dashboard', to: '/dashboard' }, { label: 'My signatures' }]
const PAGE_SIZE = 20

/* Inbox tabs — keys match the backend buckets. */
const TABS = [
  { key: 'ACTION',   label: 'Needs your signature', empty: { variant: 'success', title: 'You’re all caught up',
      description: 'No documents are waiting for your signature right now.' } },
  { key: 'UPCOMING', label: 'Waiting on others',   empty: { variant: 'inbox', title: 'Nothing queued',
      description: 'Documents appear here when another person has to sign before you.' } },
  { key: 'SIGNED',   label: 'Signed',              empty: { variant: 'documents', title: 'No signed documents yet',
      description: 'Everything you sign is kept here, with the final copy once all parties have signed.' } },
  { key: 'OTHER',    label: 'Expired, cancelled & CC', empty: { variant: 'inbox', title: 'Nothing here',
      description: 'Expired or cancelled requests, and documents you were copied on, show up here.' } },
]

/**
 * Signer inbox ("My signatures") — every document sent to the signed-in email for
 * signature, across all organizations. Shared by signer-portal sessions and Braify users.
 */
export default function MyDocumentsPage() {
  useDocumentTitle('My signatures')
  const { user, isSigner } = useAuth()
  const [params, setParams] = useSearchParams()

  const tab    = TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'ACTION'
  const orgId  = params.get('org') || ''
  const [search, setSearch] = useState('')
  const [query,  setQuery]  = useState('')
  const [page,   setPage]   = useState(0)

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [mustVerify, setMustVerify] = useState(false)

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // Back to page 1 whenever the tab or filters change — reset during render so the
  // list is fetched once, not once for the stale page and again for page 1.
  const filterKey = `${tab}|${orgId}|${query}`
  const [pageKey, setPageKey] = useState(filterKey)
  if (pageKey !== filterKey) {
    setPageKey(filterKey)
    setPage(0)
  }

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    signerListDocuments({ tab, orgId: orgId || undefined, search: query || undefined, page, size: PAGE_SIZE })
      .then(setData)
      .catch(e => needsEmailVerification(e) ? setMustVerify(true) : setError(e.message))
      .finally(() => setLoading(false))
  }, [tab, orgId, query, page])

  useEffect(() => { load() }, [load])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }

  const { busyId, sign, view, download } = useSignerDocActions(load)

  const counts = data?.counts || {}
  const orgs   = data?.organizations || []
  const items  = data?.items || []
  const total  = data?.total ?? 0
  const pages  = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeTab = TABS.find(t => t.key === tab)
  const filtered = !!(orgId || query)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="mt-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">My signatures</h1>
        <p className="text-sm text-ink-3 mt-1">
          Documents sent to <span className="font-semibold text-ink-2 dark:text-gray-300">{user?.email}</span> for
          signature, from every organization.
        </p>
      </div>

      {mustVerify ? (
        <VerifyEmailCard email={user?.email} onVerified={() => { setMustVerify(false); load() }} />
      ) : (<>

      {/* Nudge: signers without a password can add one for faster sign-in */}
      {isSigner && user?.hasPassword === false && (
        <div className="alert-info border rounded-xl px-4 py-3 mb-6 text-sm flex items-center justify-between gap-3 flex-wrap">
          <span>Tired of waiting for codes? Set a password and sign in with it next time.</span>
          <Link to="/my-documents/account" className="font-semibold underline underline-offset-2">Set a password</Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-8 dark:bg-gray-800 rounded-xl mb-4 overflow-x-auto" role="tablist">
        {TABS.map(t => {
          const n = counts[t.key] ?? 0
          const on = t.key === tab
          return (
            <button key={t.key} role="tab" aria-selected={on}
              onClick={() => setParam('tab', t.key === 'ACTION' ? null : t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                ${on ? 'bg-white dark:bg-gray-700 text-ink dark:text-white shadow-soft'
                     : 'text-ink-3 hover:text-ink dark:text-gray-400 dark:hover:text-gray-200'}`}>
              {t.label}
              <span className={`min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none
                ${t.key === 'ACTION' && n > 0 ? 'bg-brand text-white'
                  : on ? 'bg-ink-8 text-ink-2 dark:bg-gray-600 dark:text-gray-200'
                  : 'bg-white/70 text-ink-3 dark:bg-gray-700 dark:text-gray-400'}`}>
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by document or organization"
          className="form-input flex-1"
          aria-label="Search documents"
        />
        {orgs.length > 1 && (
          <select value={orgId} onChange={e => setParam('org', e.target.value)}
            className="form-select sm:w-64" aria-label="Filter by organization">
            <option value="">All organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name || 'Unknown organization'}</option>)}
          </select>
        )}
      </div>

      {/* List */}
      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="skeleton h-24 rounded-card" />)}
        </div>
      ) : error ? (
        <div className="alert-error border rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={load} className="font-semibold underline underline-offset-2">Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          {filtered
            ? <EmptyState variant="search" size="compact" title="No matching documents"
                description="Try a different search or organization."
                secondaryAction={{ label: 'Clear filters', onClick: () => { setSearch(''); setParam('org', null) } }} />
            : <EmptyState size="compact" {...activeTab.empty}
                secondaryAction={tab === 'ACTION' && (counts.SIGNED ?? 0) > 0
                  ? { label: 'View signed documents', onClick: () => setParam('tab', 'SIGNED') }
                  : undefined} />}
        </div>
      ) : (
        <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          {items.map(doc => (
            <SignerDocumentRow key={doc.id} doc={doc} busy={busyId === doc.id}
              onSign={() => sign(doc)} onView={() => view(doc)} onDownload={() => download(doc)} />
          ))}
        </ul>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-5 text-sm text-ink-3">
          <span>Page {page + 1} of {pages} · {total} documents</span>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-outline btn-sm" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
