/**
 * Support tickets — unexpected server errors raised automatically (Platform Admin only).
 * One ticket per distinct error; repeats add occurrences. Filters live in the URL.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supportTicketsList, supportTicketsSummary, supportTicketAssignees, getOrganizations } from '../services/api'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import useUrlState from '../hooks/useUrlState'
import { useToast } from '../context/ToastContext'
import { fmtRelative, fmtDateTime } from '../utils/date'
import { TICKET_TABS, tabStatus, tabCount, shortType } from '../utils/supportTickets'
import StatusBadge from '../components/support/TicketStatusBadge'

const CRUMBS = [{ label: 'Dashboard', to: '/' }, { label: 'Support tickets' }]
const SORTS = [
  { value: '',         label: 'Last seen' },
  { value: 'count',    label: 'Most occurrences' },
  { value: 'affected', label: 'Most affected' },
  { value: 'created',  label: 'Newest' },
]
const FIELD = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100'

export default function SupportTicketsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [q, setQ] = useUrlState({ tab: 'active', page: 0, search: '', area: '', org: '', assignee: '', from: '', to: '', sort: '' })
  const [search, setSearch] = useState(q.search)
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [assignees, setAssignees] = useState([])

  useEffect(() => {
    getOrganizations().then(list => setOrgs(Array.isArray(list) ? list : (list?.content || []))).catch(() => {})
    supportTicketAssignees().then(setAssignees).catch(() => {})
  }, [])

  const loadSummary = useCallback(() => {
    supportTicketsSummary().then(setSummary).catch(() => {})
  }, [])
  useEffect(() => { loadSummary() }, [loadSummary])

  // Debounce the search box into the URL (resets to page 1).
  useEffect(() => {
    if (search.trim() === q.search) return
    const t = setTimeout(() => setQ({ search: search.trim(), page: 0 }), 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoading(true)
    supportTicketsList({
      status: tabStatus(q.tab), page: q.page, size: 20, q: q.search, area: q.area, orgId: q.org,
      assigneeId: q.assignee, from: q.from, to: q.to, sort: q.sort,
    })
      .then(setData)
      .catch(err => { toast.error(err.message); setData({ content: [], totalElements: 0, totalPages: 0 }) })
      .finally(() => setLoading(false))
  }, [q.tab, q.page, q.search, q.area, q.org, q.assignee, q.from, q.to, q.sort, toast])
  useEffect(() => { load() }, [load])

  const hasFilters = q.search || q.area || q.org || q.assignee || q.from || q.to
  const clearFilters = () => { setSearch(''); setQ({ search: '', area: '', org: '', assignee: '', from: '', to: '', page: 0 }) }
  const refresh = () => { load(); loadSummary() }
  const counts = summary?.counts

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      <div className="mt-4 mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Support tickets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Unexpected server errors, raised automatically. Each distinct error has one ticket; repeats are counted on it.
          </p>
        </div>
        <button onClick={refresh} className="btn btn-secondary shrink-0">Refresh</button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-ink-8 dark:bg-gray-800 rounded-xl p-1 mb-4 overflow-x-auto" role="tablist">
        {TICKET_TABS.map(t => {
          const active = q.tab === t.value
          const n = tabCount(t.value, counts)
          return (
            <button key={t.value} role="tab" aria-selected={active} onClick={() => setQ({ tab: t.value, page: 0 })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                ${active ? 'bg-gradient-accent text-white shadow-soft' : 'text-ink-3 dark:text-gray-400 hover:text-ink dark:hover:text-gray-200'}`}>
              {t.label}
              {n != null && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold leading-5 text-center
                  ${active ? 'bg-white/25 text-white' : 'bg-white dark:bg-gray-700 text-ink-3 dark:text-gray-300'}`}>{n}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search tickets"
            placeholder="Reference (ERR-…), ticket #, error, user…"
            className={`${FIELD} focus:outline-none focus:ring-2 focus:ring-accent-400 lg:col-span-2`} />
          <select value={q.area} onChange={e => setQ({ area: e.target.value, page: 0 })} className={FIELD} aria-label="Functionality">
            <option value="">All functionality</option>
            {(summary?.areas || []).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={q.org} onChange={e => setQ({ org: e.target.value, page: 0 })} className={FIELD} aria-label="Organization">
            <option value="">All organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={q.assignee} onChange={e => setQ({ assignee: e.target.value, page: 0 })} className={FIELD} aria-label="Assignee">
            <option value="">Anyone assigned</option>
            <option value="none">Unassigned</option>
            {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="shrink-0">Last seen from</span>
            <input type="date" value={q.from} max={q.to || undefined} onChange={e => setQ({ from: e.target.value, page: 0 })} className={`${FIELD} flex-1 min-w-0`} />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="shrink-0">to</span>
            <input type="date" value={q.to} min={q.from || undefined} onChange={e => setQ({ to: e.target.value, page: 0 })} className={`${FIELD} flex-1 min-w-0`} />
          </label>
          <div className="flex gap-2">
            <select value={q.sort} onChange={e => setQ({ sort: e.target.value, page: 0 })} className={`${FIELD} flex-1`} aria-label="Sort">
              {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Count</th>
                <th className="px-4 py-3 text-right">Affected</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                  {hasFilters ? 'No tickets match these filters.' : q.tab === 'active' ? 'No errors need attention. 🎉' : 'No tickets here.'}
                </td></tr>
              ) : data.content.map(t => (
                <tr key={t.id} onClick={() => navigate(`/support-tickets/${t.id}`)}
                  className="border-b border-gray-50 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer align-top">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                    <a href={`/support-tickets/${t.id}`} onClick={e => { e.preventDefault(); navigate(`/support-tickets/${t.id}`) }}
                       className="font-semibold text-brand hover:underline">#{t.number}</a>
                    {t.reopenCount > 0 && <div className="mt-1 text-[10px] font-sans font-semibold text-rose-600">Reopened ×{t.reopenCount}</div>}
                  </td>
                  <td className="px-4 py-3 max-w-[460px]">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={t.feature}>{t.feature}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={`${t.errorType}: ${t.message || ''}`}>
                      <span className="font-mono text-rose-600 dark:text-rose-400">{shortType(t.errorType)}</span>
                      {t.message ? ` — ${t.message}` : ''}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5" title={t.lastActorLabel}>{t.lastActorLabel}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-200">{(t.occurrenceCount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{(t.affectedCount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300" title={fmtDateTime(t.lastSeenAt)}>{fmtRelative(t.lastSeenAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{t.assigneeName || <span className="text-gray-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Page {q.page + 1} of {data.totalPages} · {data.totalElements.toLocaleString()} tickets</span>
          <div className="flex items-center gap-1">
            <button disabled={q.page <= 0} onClick={() => setQ(p => ({ page: p.page - 1 }))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Prev</button>
            <button disabled={q.page >= data.totalPages - 1} onClick={() => setQ(p => ({ page: p.page + 1 }))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
