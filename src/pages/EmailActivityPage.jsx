/**
 * Email Activity — audit log of every outbound email.
 * Role-scoped by the backend: PLATFORM_ADMIN sees all orgs (with an org filter),
 * ORG_ADMIN sees only their own organization's emails.
 */
import { useState, useEffect, useCallback } from 'react'
import { emailLogsList, getOrganizations } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { fmtDateTimeGB as fmtDate } from '../utils/date'

const CRUMBS = [{ label: 'Dashboard', to: '/' }, { label: 'Email Activity' }]

const CATEGORIES = [
  ['ESIGN_INVITATION', 'E-Sign invitation'],
  ['ESIGN_REMINDER',   'E-Sign reminder'],
  ['ESIGN_COMPLETION', 'E-Sign completion'],
  ['ESIGN_CC',         'E-Sign CC notice'],
  ['USER_INVITE',      'User invite'],
  ['PASSWORD_RESET',   'Password reset'],
  ['BULK_EMAIL',       'Bulk email'],
  ['TEMPLATE_SEND',    'Template send'],
  ['ONBOARDING',       'Onboarding'],
  ['API_EMAIL',        'API email'],
  ['OTHER',            'Other'],
]
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES)

const CATEGORY_COLOR = {
  ESIGN_INVITATION: 'bg-indigo-100 text-indigo-700',
  ESIGN_REMINDER:   'bg-amber-100 text-amber-700',
  ESIGN_COMPLETION: 'bg-green-100 text-green-700',
  ESIGN_CC:         'bg-slate-100 text-slate-600',
  USER_INVITE:      'bg-blue-100 text-blue-700',
  PASSWORD_RESET:   'bg-purple-100 text-purple-700',
  BULK_EMAIL:       'bg-teal-100 text-teal-700',
  TEMPLATE_SEND:    'bg-cyan-100 text-cyan-700',
  ONBOARDING:       'bg-pink-100 text-pink-700',
  API_EMAIL:        'bg-fuchsia-100 text-fuchsia-700',
  OTHER:            'bg-gray-100 text-gray-600',
}

export default function EmailActivityPage() {
  const { user } = useAuth()
  const isPlatform = user?.role === ROLES.PLATFORM_ADMIN

  const [data,     setData]     = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(0)
  const [search,   setSearch]   = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState('')
  const [status,   setStatus]   = useState('')
  const [recipientType, setRecipientType] = useState('')  // '' | 'TO' | 'CC'
  const [orgFilter, setOrgFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [orgs,     setOrgs]     = useState([])
  const [expandedId, setExpandedId] = useState(null)

  // Org list for the platform-admin filter
  useEffect(() => {
    if (!isPlatform) return
    getOrganizations().then(list => setOrgs(Array.isArray(list) ? list : (list?.content || []))).catch(() => {})
  }, [isPlatform])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset to first page whenever a filter changes
  useEffect(() => { setPage(0) }, [debounced, category, status, recipientType, orgFilter, fromDate, toDate])

  const fetchLogs = useCallback(() => {
    setLoading(true)
    emailLogsList({
      page, size: 20,
      search: debounced || undefined,
      category: category || undefined,
      status: status || undefined,
      recipientType: recipientType || undefined,
      orgId: isPlatform ? (orgFilter || undefined) : undefined,
      dateFrom: fromDate ? new Date(fromDate + 'T00:00:00').toISOString() : undefined,
      dateTo:   toDate   ? new Date(toDate   + 'T23:59:59').toISOString() : undefined,
    })
      .then(setData)
      .catch(() => setData({ content: [], totalElements: 0, totalPages: 0 }))
      .finally(() => setLoading(false))
  }, [page, debounced, category, status, recipientType, orgFilter, fromDate, toDate, isPlatform])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const hasFilters = debounced || category || status || recipientType || orgFilter || fromDate || toDate
  const clearFilters = () => {
    setSearch(''); setDebounced(''); setCategory(''); setStatus(''); setRecipientType(''); setOrgFilter(''); setFromDate(''); setToDate('')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      <div className="mt-4 mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Email Activity</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isPlatform
            ? 'Every email sent across all organizations.'
            : 'Every email sent from your organization.'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipient, subject, sender…"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900
                       text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-400 lg:col-span-2"
          />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
            <option value="">All categories</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
            <option value="">All statuses</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <select value={recipientType} onChange={e => setRecipientType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
            <option value="">To &amp; CC</option>
            <option value="TO">Primary (To) only</option>
            <option value="CC">CC only</option>
          </select>
          {isPlatform && (
            <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
              <option value="">All organizations</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100" />
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300
                         border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Subject</th>
                {isPlatform && <th className="px-4 py-3">Organization</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isPlatform ? 6 : 5} className="px-4 py-16 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"/>
                </td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={isPlatform ? 6 : 5} className="px-4 py-16 text-center text-gray-400">
                  No emails match these filters.
                </td></tr>
              ) : data.content.map(row => (
                <RowGroup key={row.id} row={row} isPlatform={isPlatform}
                          expanded={expandedId === row.id}
                          onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Page {page + 1} of {data.totalPages} · {data.totalElements.toLocaleString()} emails</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
              Prev
            </button>
            <button disabled={page >= data.totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RowGroup({ row, isPlatform, expanded, onToggle }) {
  const failed = row.status === 'FAILED'
  return (
    <>
      <tr onClick={onToggle}
          className="border-b border-gray-50 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer">
        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{fmtDate(row.createdAt)}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLOR[row.category] || 'bg-gray-100 text-gray-600'}`}>
            {CATEGORY_LABEL[row.category] || row.category}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${failed ? 'text-red-600' : 'text-green-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${failed ? 'bg-red-500' : 'bg-green-500'}`}/>
            {failed ? 'Failed' : 'Sent'}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[240px] truncate">
          {row.cc && (
            <span className="mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 align-middle">CC</span>
          )}
          {row.recipient}
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[280px] truncate">{row.subject || <span className="text-gray-300">—</span>}</td>
        {isPlatform && <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{row.orgName || <span className="text-gray-300">—</span>}</td>}
      </tr>
      {expanded && (
        <tr className="bg-gray-50 dark:bg-gray-900/40">
          <td colSpan={isPlatform ? 6 : 5} className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-xs">
              <Detail label="Recipient" value={row.recipient} />
              <Detail label="Sender name" value={row.senderName} />
              <Detail label="Subject" value={row.subject} />
              {row.ccEmails?.length > 0 && <Detail label="CC" value={row.ccEmails.join(', ')} />}
              <Detail label="Provider message ID" value={row.providerMessageId} mono />
              <Detail label="Related" value={row.relatedType ? `${row.relatedType}${row.relatedId ? ' · ' + row.relatedId : ''}` : null} mono />
              {failed && <Detail label="Error" value={row.errorMessage} className="text-red-600 sm:col-span-2 lg:col-span-3" />}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Detail({ label, value, mono, className = '' }) {
  return (
    <div className={className}>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</span>
      <span className={`text-gray-700 dark:text-gray-200 break-all ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  )
}
