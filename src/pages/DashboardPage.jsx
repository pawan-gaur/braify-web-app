import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [{ label: 'Dashboard' }]

/* ── Greeting helper ──────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── KPI Card ─────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, onClick }) {
  const colors = {
    indigo:  { bg: 'bg-indigo-50  dark:bg-indigo-900/20',  icon: 'text-indigo-500',  ring: 'bg-indigo-500' },
    violet:  { bg: 'bg-violet-50  dark:bg-violet-900/20',  icon: 'text-violet-500',  ring: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500', ring: 'bg-emerald-500' },
    sky:     { bg: 'bg-sky-50     dark:bg-sky-900/20',     icon: 'text-sky-500',     ring: 'bg-sky-500'    },
    amber:   { bg: 'bg-amber-50   dark:bg-amber-900/20',   icon: 'text-amber-500',   ring: 'bg-amber-500'  },
    rose:    { bg: 'bg-rose-50    dark:bg-rose-900/20',    icon: 'text-rose-500',    ring: 'bg-rose-500'   },
  }
  const c = colors[color] ?? colors.indigo
  return (
    <div
      onClick={onClick}
      className={`card flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.bg}`}>
        <svg className={`w-6 h-6 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mt-0.5">
          {value ?? <span className="inline-block w-12 h-7 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-1 h-10 rounded-full ${c.ring} opacity-40 shrink-0`} />
    </div>
  )
}

/* ── SVG Bar Chart ────────────────────────────────────────────────────── */
function BarChart({ data = [], color = '#6366f1', label }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 100 / data.length   // % width per bar group
  const BAR_W = Math.min(W * 0.55, 14)  // bar width in % units
  const HEIGHT = 120

  return (
    <div>
      {label && <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{label}</p>}
      <div className="relative" style={{ height: HEIGHT + 36 }}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <div key={f}
            className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/60"
            style={{ bottom: 28 + f * HEIGHT }} />
        ))}

        {/* SVG bars */}
        <svg className="absolute inset-0 w-full" style={{ height: HEIGHT + 28 }} viewBox={`0 0 100 ${HEIGHT + 4}`}
          preserveAspectRatio="none">
          {data.map((d, i) => {
            const barH = max === 0 ? 0 : Math.max((d.count / max) * HEIGHT, d.count > 0 ? 4 : 0)
            const x = i * W + W / 2 - BAR_W / 2
            return (
              <g key={i}>
                {/* Bar background */}
                <rect x={x} y={0} width={BAR_W} height={HEIGHT}
                  fill="currentColor" className="text-gray-100 dark:text-gray-700/40" rx="2" />
                {/* Bar fill */}
                {d.count > 0 && (
                  <rect x={x} y={HEIGHT - barH} width={BAR_W} height={barH}
                    fill={color} rx="2" opacity="0.85">
                    <title>{d.count} in {d.label}</title>
                  </rect>
                )}
              </g>
            )
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 28 }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex items-end justify-center pb-0.5">
              <span className="text-[9px] font-medium text-gray-400 truncate text-center leading-tight">
                {d.label}
              </span>
            </div>
          ))}
        </div>

        {/* Value tooltips on hover — shown as text above bar */}
        <div className="absolute inset-0 flex" style={{ bottom: 28 }}>
          {data.map((d, i) => {
            const barH = max === 0 ? 0 : (d.count / max) * HEIGHT
            return (
              <div key={i} className="flex-1 flex items-end justify-center group/bar"
                style={{ height: HEIGHT }}>
                {d.count > 0 && (
                  <span className="opacity-0 group-hover/bar:opacity-100 transition-opacity
                                   text-[10px] font-bold text-white bg-gray-800 dark:bg-gray-700
                                   rounded px-1 py-0.5 mb-1 pointer-events-none"
                    style={{ marginBottom: barH + 4 }}>
                    {d.count}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Mini sparkline (for the KPI sub-stat) ────────────────────────────── */
function Sparkline({ data = [], color = '#6366f1' }) {
  if (data.length < 2) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 60
    const y = 16 - (d.count / max) * 14
    return `${x},${y}`
  }).join(' ')
  const fill = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 60
    const y = 16 - (d.count / max) * 14
    return `${x},${y}`
  })
  const fillPts = `0,16 ${fill.join(' ')} 60,16`
  return (
    <svg width="60" height="18" viewBox="0 0 60 18" className="shrink-0">
      <polygon points={fillPts} fill={color} opacity="0.15" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Action badge (audit log) ─────────────────────────────────────────── */
const ACTION_COLOR = {
  CREATED:          'bg-emerald-100 text-emerald-700',
  UPDATED:          'bg-blue-100   text-blue-700',
  DELETED:          'bg-rose-100   text-rose-700',
  RESTORED:         'bg-violet-100 text-violet-700',
  PASSWORD_CHANGED: 'bg-amber-100  text-amber-700',
  AVATAR_UPDATED:   'bg-indigo-100 text-indigo-700',
  DEACTIVATED:      'bg-red-100    text-red-700',
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()
  const isPlatformAdmin = user?.role === ROLES.PLATFORM_ADMIN
  const isOrgAdmin      = user?.role === ROLES.ORG_ADMIN || isPlatformAdmin

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  /* ── Skeleton while loading ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse">
        <Breadcrumbs items={CRUMBS} />
        <div className="mt-4 mb-8 h-8 bg-gray-100 dark:bg-gray-800 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 bg-gray-50 dark:bg-gray-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card h-64 bg-gray-50 dark:bg-gray-800" />
          <div className="card h-64 bg-gray-50 dark:bg-gray-800" />
        </div>
      </div>
    )
  }

  const lastMonth     = stats?.pdfGrowth?.at(-1)?.count ?? 0
  const prevMonth     = stats?.pdfGrowth?.at(-2)?.count ?? 0
  const pdfTrend      = prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : null

  const lastEmailM    = stats?.emailGrowth?.at(-1)?.count ?? 0
  const prevEmailM    = stats?.emailGrowth?.at(-2)?.count ?? 0
  const emailTrend    = prevEmailM > 0 ? Math.round(((lastEmailM - prevEmailM) / prevEmailM) * 100) : null

  const trendLabel = (t) => {
    if (t === null) return null
    return t >= 0
      ? <span className="text-emerald-500 font-semibold">↑ {t}% vs last month</span>
      : <span className="text-rose-500 font-semibold">↓ {Math.abs(t)}% vs last month</span>
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* ── Header ── */}
      <div className="mt-4 mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            {greeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isPlatformAdmin && (
          <KpiCard
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            label="Organizations"
            value={stats?.totalOrganizations}
            sub="Active tenants"
            color="violet"
            onClick={() => navigate('/organizations')}
          />
        )}
        <KpiCard
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          label="Total Users"
          value={stats?.totalUsers}
          sub={stats?.pendingInvites > 0 ? `${stats.pendingInvites} invite${stats.pendingInvites !== 1 ? 's' : ''} pending` : 'All active'}
          color="indigo"
          onClick={isOrgAdmin ? () => navigate('/users') : undefined}
        />
        <KpiCard
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          label="PDF Templates"
          value={stats?.totalPdfTemplates}
          sub={trendLabel(pdfTrend) ?? 'No trend data yet'}
          color="sky"
          onClick={() => navigate('/')}
        />
        <KpiCard
          icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          label="Email Templates"
          value={stats?.totalEmailTemplates}
          sub={trendLabel(emailTrend) ?? 'No trend data yet'}
          color="emerald"
          onClick={() => navigate('/email-templates')}
        />
      </div>

      {/* ── Charts + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Chart panel — 2/3 width */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Template Growth</h2>
              <p className="text-xs text-gray-400 mt-0.5">Created per month — last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                PDF
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                Email
              </span>
            </div>
          </div>

          {/* Grouped bar chart — PDF vs Email side-by-side */}
          <GroupedBarChart
            pdfData={stats?.pdfGrowth ?? []}
            emailData={stats?.emailGrowth ?? []}
          />
        </div>

        {/* Activity feed — 1/3 width */}
        <div className="card flex flex-col">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
          {!stats?.recentActivity?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-8">
              <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-xs">No activity yet</p>
            </div>
          ) : (
            <ul className="space-y-3 flex-1 overflow-y-auto max-h-72">
              {stats.recentActivity.map((log, i) => (
                <li key={log.id ?? i} className="flex items-start gap-2.5">
                  <span className={`shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                    ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-500'}`}>
                    {log.action?.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {log.templateName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.performedBy} · {fmtDate(log.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => navigate('/audit-log')}
            className="mt-4 text-xs text-primary hover:underline font-medium text-center">
            View full audit log →
          </button>
        </div>
      </div>

      {/* ── User growth chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">User Growth</h2>
          <p className="text-xs text-gray-400 mb-3">New users per month</p>
          <BarChart data={stats?.userGrowth ?? []} color="#8b5cf6" />
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'New PDF Template', to: '/builder',        icon: 'M12 4v16m8-8H4',         color: 'text-indigo-500' },
              { label: 'New Email Template', to: '/email-builder', icon: 'M12 4v16m8-8H4',         color: 'text-emerald-500' },
              { label: 'Generate PDF',      to: '/generate',       icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7', color: 'text-sky-500' },
              ...(isOrgAdmin ? [{ label: 'Invite User', to: '/users', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'text-violet-500' }] : []),
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center
                                group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                  <svg className={`w-4 h-4 ${a.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
                <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Pending invites widget (only if any) */}
        {stats?.pendingInvites > 0 && isOrgAdmin && (
          <div className="card border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-900/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  {stats.pendingInvites} pending invite{stats.pendingInvites !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  These users haven't set their password yet.
                </p>
                <button onClick={() => navigate('/users')}
                  className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                  View Users →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Org breakdown table (Platform Admin only) ── */}
      {isPlatformAdmin && stats?.orgBreakdown?.length > 0 && (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Organization Breakdown</h2>
              <p className="text-xs text-gray-400 mt-0.5">Template and user counts per tenant</p>
            </div>
            <button onClick={() => navigate('/organizations')}
              className="text-xs text-primary hover:underline font-medium">
              Manage →
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Organization</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Users</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">PDF Templates</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Email Templates</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {stats.orgBreakdown.map(org => (
                <tr key={org.organizationId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500
                                      flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {org.organizationName?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{org.organizationName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatPill value={org.users} color="indigo" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatPill value={org.pdfTemplates} color="sky" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatPill value={org.emailTemplates} color="emerald" />
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                    {org.users + org.pdfTemplates + org.emailTemplates}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── StatPill ─────────────────────────────────────────────────────────── */
function StatPill({ value, color }) {
  const cls = {
    indigo:  'bg-indigo-50  text-indigo-700  dark:bg-indigo-900/20  dark:text-indigo-400',
    sky:     'bg-sky-50     text-sky-700     dark:bg-sky-900/20     dark:text-sky-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  }[color] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${cls}`}>
      {value}
    </span>
  )
}

/* ── GroupedBarChart: PDF + Email side-by-side ────────────────────────── */
function GroupedBarChart({ pdfData = [], emailData = [] }) {
  const allCounts = [...pdfData, ...emailData].map(d => d.count)
  const max       = Math.max(...allCounts, 1)
  const HEIGHT    = 160
  const groups    = pdfData.length

  return (
    <div className="relative" style={{ height: HEIGHT + 40 }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <div key={f}
          className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/60"
          style={{ bottom: 32 + f * HEIGHT }} />
      ))}

      <svg className="absolute left-0 right-0 w-full" style={{ height: HEIGHT + 32, bottom: 0 }}
        viewBox={`0 0 ${groups * 40} ${HEIGHT + 4}`} preserveAspectRatio="none">
        {pdfData.map((d, i) => {
          const eD  = emailData[i] ?? { count: 0 }
          const gX  = i * 40 + 4           // group x start
          const pH  = Math.max((d.count / max) * HEIGHT, d.count > 0 ? 4 : 0)
          const eH  = Math.max((eD.count / max) * HEIGHT, eD.count > 0 ? 4 : 0)
          return (
            <g key={i}>
              {/* PDF bar */}
              <rect x={gX}      y={HEIGHT - pH} width={13} height={Math.max(pH, 0)} fill="#6366f1" rx="2" opacity="0.85">
                <title>{d.count} PDF in {d.label}</title>
              </rect>
              {/* Email bar */}
              <rect x={gX + 15} y={HEIGHT - eH} width={13} height={Math.max(eH, 0)} fill="#10b981" rx="2" opacity="0.85">
                <title>{eD.count} Email in d.label</title>
              </rect>
            </g>
          )
        })}
      </svg>

      {/* X labels */}
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 32 }}>
        {pdfData.map((d, i) => (
          <div key={i} className="flex-1 flex items-end justify-center pb-1">
            <span className="text-[9px] font-medium text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
