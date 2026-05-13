import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { FEATURE_META } from '../config/features'

const CRUMBS = [{ label: 'Dashboard' }]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

/* ── Colour palette ──────────────────────────────────────────────────────── */
const PALETTE = {
  indigo:  { bg: 'bg-indigo-50  dark:bg-indigo-900/20',  icon: 'text-indigo-500',  bar: 'bg-indigo-500',  ring: 'bg-indigo-500',  hex: '#6366f1' },
  violet:  { bg: 'bg-violet-50  dark:bg-violet-900/20',  icon: 'text-violet-500',  bar: 'bg-violet-500',  ring: 'bg-violet-500',  hex: '#8b5cf6' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500', bar: 'bg-emerald-500', ring: 'bg-emerald-500', hex: '#10b981' },
  sky:     { bg: 'bg-sky-50     dark:bg-sky-900/20',     icon: 'text-sky-500',     bar: 'bg-sky-500',     ring: 'bg-sky-500',     hex: '#0ea5e9' },
  amber:   { bg: 'bg-amber-50   dark:bg-amber-900/20',   icon: 'text-amber-500',   bar: 'bg-amber-500',   ring: 'bg-amber-500',   hex: '#f59e0b' },
  rose:    { bg: 'bg-rose-50    dark:bg-rose-900/20',    icon: 'text-rose-500',    bar: 'bg-rose-500',    ring: 'bg-rose-500',    hex: '#f43f5e' },
  teal:    { bg: 'bg-teal-50    dark:bg-teal-900/20',    icon: 'text-teal-500',    bar: 'bg-teal-500',    ring: 'bg-teal-500',    hex: '#14b8a6' },
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color = 'indigo', onClick, badge }) {
  const c = PALETTE[color]
  return (
    <div onClick={onClick}
      className={`card flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.bg}`}>
        <svg className={`w-6 h-6 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon}/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mt-0.5 flex items-center gap-2">
          {value ?? <span className="inline-block w-12 h-7 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"/>}
          {badge != null && badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5
                             rounded-full text-[11px] font-bold bg-amber-500 text-white">{badge}</span>
          )}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-1 h-10 rounded-full ${c.ring} opacity-40 shrink-0`}/>
    </div>
  )
}

/* ── Section header ──────────────────────────────────────────────────────── */
function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Stat mini-card (inside panels) ─────────────────────────────────────── */
function MiniStat({ label, value, color = 'gray', icon }) {
  const colorMap = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    sky: 'text-sky-600 dark:text-sky-400',
    violet: 'text-violet-600 dark:text-violet-400',
    gray: 'text-gray-600 dark:text-gray-400',
  }
  return (
    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 text-center">
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <p className={`text-2xl font-bold ${colorMap[color] ?? colorMap.gray}`}>
        {value ?? <span className="inline-block w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/>}
      </p>
      <p className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</p>
    </div>
  )
}

/* ── Progress bar ────────────────────────────────────────────────────────── */
function ProgressBar({ label, value, max, color = 'indigo', suffix = '' }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const c = PALETTE[color]
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-500">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  )
}

/* ── Bar chart (single series) ───────────────────────────────────────────── */
function BarChart({ data = [], color = '#6366f1', label }) {
  const max    = Math.max(...data.map(d => d.count), 1)
  const W      = 100 / Math.max(data.length, 1)
  const BAR_W  = Math.min(W * 0.55, 14)
  const HEIGHT = 100

  return (
    <div>
      {label && <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{label}</p>}
      <div className="relative" style={{ height: HEIGHT + 32 }}>
        {[0, 0.5, 1].map(f => (
          <div key={f} className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/60"
            style={{ bottom: 24 + f * HEIGHT }}/>
        ))}
        <svg className="absolute inset-0 w-full" style={{ height: HEIGHT + 24 }}
          viewBox={`0 0 100 ${HEIGHT + 4}`} preserveAspectRatio="none">
          {data.map((d, i) => {
            const barH = max === 0 ? 0 : Math.max((d.count / max) * HEIGHT, d.count > 0 ? 4 : 0)
            const x    = i * W + W / 2 - BAR_W / 2
            return (
              <g key={i}>
                <rect x={x} y={0} width={BAR_W} height={HEIGHT}
                  fill="currentColor" className="text-gray-100 dark:text-gray-700/40" rx="2"/>
                {d.count > 0 && (
                  <rect x={x} y={HEIGHT - barH} width={BAR_W} height={barH} fill={color} rx="2" opacity="0.85">
                    <title>{d.count} in {d.label}</title>
                  </rect>
                )}
              </g>
            )
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 24 }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex items-end justify-center pb-0.5">
              <span className="text-[9px] font-medium text-gray-400 truncate text-center">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Grouped bar chart (PDF + Email) ─────────────────────────────────────── */
function GroupedBarChart({ pdfData = [], emailData = [] }) {
  const allCounts = [...pdfData, ...emailData].map(d => d.count)
  const max    = Math.max(...allCounts, 1)
  const HEIGHT = 120
  const groups = pdfData.length

  return (
    <div className="relative" style={{ height: HEIGHT + 36 }}>
      {[0, 0.5, 1].map(f => (
        <div key={f} className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/60"
          style={{ bottom: 28 + f * HEIGHT }}/>
      ))}
      <svg className="absolute left-0 right-0 w-full" style={{ height: HEIGHT + 28, bottom: 0 }}
        viewBox={`0 0 ${groups * 40} ${HEIGHT + 4}`} preserveAspectRatio="none">
        {pdfData.map((d, i) => {
          const eD  = emailData[i] ?? { count: 0 }
          const gX  = i * 40 + 4
          const pH  = Math.max((d.count / max) * HEIGHT, d.count > 0 ? 4 : 0)
          const eH  = Math.max((eD.count / max) * HEIGHT, eD.count > 0 ? 4 : 0)
          return (
            <g key={i}>
              <rect x={gX}      y={HEIGHT - pH} width={13} height={Math.max(pH, 0)} fill="#6366f1" rx="2" opacity="0.85">
                <title>{d.count} PDF in {d.label}</title>
              </rect>
              <rect x={gX + 15} y={HEIGHT - eH} width={13} height={Math.max(eH, 0)} fill="#10b981" rx="2" opacity="0.85">
                <title>{eD.count} Email in {eD.label}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 28 }}>
        {pdfData.map((d, i) => (
          <div key={i} className="flex-1 flex items-end justify-center pb-1">
            <span className="text-[9px] font-medium text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Donut chart (E-Sign status breakdown) ───────────────────────────────── */
function DonutChart({ segments = [] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return (
    <div className="w-28 h-28 rounded-full border-8 border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto">
      <span className="text-xs text-gray-400">No data</span>
    </div>
  )

  const R = 40, CX = 50, CY = 50
  const circumference = 2 * Math.PI * R
  let offset = 0

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto -rotate-90">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference
        const gap  = circumference - dash
        const el   = (
          <circle key={i} cx={CX} cy={CY} r={R}
            fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt">
            <title>{seg.label}: {seg.value}</title>
          </circle>
        )
        offset += dash
        return el
      })}
      {/* Centre hole */}
      <circle cx={CX} cy={CY} r={32} fill="white" className="dark:fill-gray-800"/>
    </svg>
  )
}

/* ── Action pill (audit log) ─────────────────────────────────────────────── */
const ACTION_COLOR = {
  CREATED: 'bg-emerald-100 text-emerald-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  DELETED: 'bg-rose-100 text-rose-700',
  RESTORED: 'bg-violet-100 text-violet-700',
  PASSWORD_CHANGED: 'bg-amber-100 text-amber-700',
  SENT: 'bg-sky-100 text-sky-700',
  FEATURES_UPDATED: 'bg-indigo-100 text-indigo-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

/* ── StatPill ────────────────────────────────────────────────────────────── */
function StatPill({ value, color }) {
  const cls = {
    indigo:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
    sky:     'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    violet:  'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
  }[color] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${cls}`}>
      {value}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()

  const isPlatformAdmin = user?.role === ROLES.PLATFORM_ADMIN
  const isOrgAdmin      = user?.role === ROLES.ORG_ADMIN || isPlatformAdmin
  const isAtLeastAdmin  = user?.role === ROLES.ADMIN || isOrgAdmin

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState(isPlatformAdmin ? 'platform' : 'overview')

  useEffect(() => {
    getDashboardStats()
      .then(s => { setStats(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* ── Skeleton ── */
  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse space-y-6">
      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-64"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-24 bg-gray-50 dark:bg-gray-800"/>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card h-64 bg-gray-50 dark:bg-gray-800"/>
        <div className="card h-64 bg-gray-50 dark:bg-gray-800"/>
      </div>
    </div>
  )

  /* ── Trend helpers ── */
  const trend = (arr) => {
    const last = arr?.at(-1)?.count ?? 0, prev = arr?.at(-2)?.count ?? 0
    if (prev === 0) return null
    const t = Math.round(((last - prev) / prev) * 100)
    return t >= 0
      ? <span className="text-emerald-500 font-semibold text-xs">↑ {t}% vs last month</span>
      : <span className="text-rose-500 font-semibold text-xs">↓ {Math.abs(t)}% vs last month</span>
  }

  const TABS_ORG = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'esign',    label: '✍️ E-Sign' },
    { id: 'team',     label: '👥 Team' },
  ]
  const TABS_PA = [
    { id: 'platform', label: '🌐 Platform' },
    { id: 'tenants',  label: '🏢 Tenants' },
    { id: 'activity', label: '📋 Activity' },
  ]
  const TABS = isPlatformAdmin ? TABS_PA : TABS_ORG

  /* ── E-Sign donut data ── */
  const esignSegments = [
    { label: 'Completed', value: stats?.esignCompleted ?? 0, color: '#10b981' },
    { label: 'Pending',   value: (stats?.esignPending ?? 0) - (stats?.esignOverdue ?? 0), color: '#f59e0b' },
    { label: 'Overdue',   value: stats?.esignOverdue  ?? 0, color: '#f43f5e' },
    { label: 'Cancelled', value: stats?.esignCancelled ?? 0, color: '#9ca3af' },
    { label: 'Expired',   value: stats?.esignExpired  ?? 0, color: '#d1d5db' },
    { label: 'Draft',     value: stats?.esignDraft    ?? 0, color: '#c7d2fe' },
  ].filter(s => s.value > 0)

  const esignSent = (stats?.esignTotal ?? 0) - (stats?.esignDraft ?? 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS}/>

      {/* ── Header ── */}
      <div className="mt-4 mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            {greeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isPlatformAdmin
              ? 'Platform-wide analytics across all organisations.'
              : `Analytics for your workspace — ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`
            }
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
              ${tab === t.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          ORG ADMIN — OVERVIEW TAB
      ════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              label="PDF Templates" value={stats?.totalPdfTemplates}
              sub={trend(stats?.pdfGrowth) ?? 'No trend yet'} color="indigo"
              onClick={() => navigate('/templates')}
            />
            <KpiCard
              icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              label="Email Templates" value={stats?.totalEmailTemplates}
              sub={trend(stats?.emailGrowth) ?? 'No trend yet'} color="emerald"
              onClick={() => navigate('/email-templates')}
            />
            <KpiCard
              icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              label="Docs Sent" value={esignSent}
              sub={trend(stats?.esignGrowth) ?? 'No trend yet'} color="sky"
              onClick={() => navigate('/esign')}
            />
            <KpiCard
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              label="Docs Signed" value={stats?.esignCompleted}
              sub={`${stats?.esignPending ?? 0} pending · ${stats?.esignOverdue ?? 0} overdue`} color="teal"
              onClick={() => navigate('/esign')}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 card">
              <SectionHeader title="Template Growth" sub="PDF & Email templates created per month"/>
              <div className="flex items-center gap-4 text-xs font-medium mb-3">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"/>PDF</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>Email</span>
              </div>
              <GroupedBarChart pdfData={stats?.pdfGrowth ?? []} emailData={stats?.emailGrowth ?? []}/>
            </div>

            <div className="card">
              <SectionHeader title="User Growth" sub="New users per month"/>
              <BarChart data={stats?.userGrowth ?? []} color="#8b5cf6"/>
            </div>
          </div>

          {/* Recent activity + quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Activity feed */}
            <div className="lg:col-span-2 card flex flex-col">
              <SectionHeader
                title="Recent Activity"
                action={
                  <button onClick={() => navigate('/audit-log')}
                    className="text-xs text-primary hover:underline font-medium">
                    Full log →
                  </button>
                }
              />
              {!stats?.recentActivity?.length
                ? <div className="flex-1 flex items-center justify-center text-gray-400 py-8 text-xs">No activity yet</div>
                : (
                  <ul className="space-y-3 overflow-y-auto max-h-60">
                    {stats.recentActivity.map((log, i) => (
                      <li key={log.id ?? i} className="flex items-start gap-2.5">
                        <span className={`shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                          ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-500'}`}>
                          {log.action?.replace('_', ' ')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{log.templateName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{log.performedBy} · {fmtDate(log.timestamp)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              }
            </div>

            {/* Quick actions */}
            <div className="card">
              <SectionHeader title="Quick Actions"/>
              <div className="space-y-2">
                {[
                  { label: 'New PDF Template',   to: '/builder',       icon: 'M12 4v16m8-8H4',         color: 'text-indigo-500' },
                  { label: 'New Email Template', to: '/email-builder', icon: 'M12 4v16m8-8H4',         color: 'text-emerald-500' },
                  { label: 'Generate PDF',       to: '/generate',      icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7', color: 'text-sky-500' },
                  { label: 'New E-Sign Doc',     to: '/esign/new',     icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', color: 'text-teal-500' },
                  ...(isOrgAdmin ? [{ label: 'Invite User', to: '/users', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'text-violet-500' }] : []),
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.to)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                               hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center
                                    group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <svg className={`w-4 h-4 ${a.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon}/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{a.label}</span>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pending invites alert */}
          {(stats?.pendingInvites ?? 0) > 0 && isOrgAdmin && (
            <div className="card border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-900/10 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
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
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          ORG ADMIN — E-SIGN TAB
      ════════════════════════════════════════════════════════ */}
      {tab === 'esign' && (
        <>
          {/* E-Sign KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <MiniStat label="Total Docs"    value={stats?.esignTotal}     color="indigo" icon="📄"/>
            <MiniStat label="Sent"          value={esignSent}             color="sky"    icon="📤"/>
            <MiniStat label="Completed"     value={stats?.esignCompleted} color="emerald" icon="✅"/>
            <MiniStat label="Pending"       value={stats?.esignPending}   color="amber"  icon="⏳"/>
            <MiniStat label="Overdue"       value={stats?.esignOverdue}   color="rose"   icon="⚠️"/>
            <MiniStat label="Cancelled"     value={stats?.esignCancelled} color="gray"   icon="❌"/>
          </div>

          {/* Performance metrics + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Donut */}
            <div className="card flex flex-col items-center">
              <SectionHeader title="Status Breakdown" sub="Current document states"/>
              <DonutChart segments={esignSegments}/>
              <div className="mt-4 w-full space-y-2">
                {esignSegments.map(s => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }}/>
                    <span className="flex-1 text-gray-600 dark:text-gray-400">{s.label}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{s.value}</span>
                    <span className="text-gray-400 w-8 text-right">{pct(s.value, stats?.esignTotal)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance stats */}
            <div className="card space-y-5">
              <SectionHeader title="Performance Metrics" sub="Signing efficiency"/>
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Avg Signing Time</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                    {stats?.esignAvgSigningHours != null
                      ? `${stats.esignAvgSigningHours}h`
                      : <span className="text-sm text-gray-400">No data yet</span>
                    }
                  </p>
                  <p className="text-xs text-emerald-600/70 mt-0.5">from sent → completed</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide mb-1">Decline / Cancel Rate</p>
                  <p className="text-3xl font-bold text-rose-700 dark:text-rose-400">
                    {stats?.esignDeclineRate != null
                      ? `${stats.esignDeclineRate}%`
                      : <span className="text-sm text-gray-400">No data yet</span>
                    }
                  </p>
                  <p className="text-xs text-rose-600/70 mt-0.5">of all sent documents</p>
                </div>
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">
                    {esignSent > 0
                      ? `${pct(stats?.esignCompleted ?? 0, esignSent)}%`
                      : <span className="text-sm text-gray-400">No data yet</span>
                    }
                  </p>
                  <p className="text-xs text-sky-600/70 mt-0.5">of sent docs fully signed</p>
                </div>
              </div>
            </div>

            {/* Monthly sent trend */}
            <div className="card">
              <SectionHeader title="Documents Sent" sub="Monthly trend — last 6 months"/>
              <BarChart data={stats?.esignGrowth ?? []} color="#0ea5e9"/>
              <div className="mt-4 space-y-2">
                <ProgressBar label="Overdue"   value={stats?.esignOverdue  ?? 0} max={stats?.esignPending ?? 1} color="rose"/>
                <ProgressBar label="Pending"   value={(stats?.esignPending ?? 0) - (stats?.esignOverdue ?? 0)} max={stats?.esignPending ?? 1} color="amber"/>
              </div>
            </div>
          </div>

          {/* Pending / overdue alert */}
          {(stats?.esignOverdue ?? 0) > 0 && (
            <div className="card border-rose-200 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-900/10 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-400">
                    {stats.esignOverdue} overdue document{stats.esignOverdue !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
                    Signing token has expired but documents haven't been submitted. Consider resending.
                  </p>
                </div>
                <button onClick={() => navigate('/esign')}
                  className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline shrink-0">
                  Review →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          ORG ADMIN — TEAM TAB
      ════════════════════════════════════════════════════════ */}
      {tab === 'team' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top users */}
            <div className="card">
              <SectionHeader title="Top Active Users" sub="By audit log activity — last 30 days"
                action={
                  <button onClick={() => navigate('/users')}
                    className="text-xs text-primary hover:underline font-medium">
                    All users →
                  </button>
                }
              />
              {!stats?.topUsers?.length
                ? <div className="flex items-center justify-center py-10 text-gray-400 text-xs">No activity in the last 30 days</div>
                : (
                  <ol className="space-y-3">
                    {stats.topUsers.map((u, i) => (
                      <li key={u.email} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          style={{ background: `hsl(${(i * 60 + 220) % 360}, 65%, 55%)` }}>
                          {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{u.activityCount}</p>
                          <p className="text-[10px] text-gray-400">actions</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )
              }
            </div>

            {/* User stats */}
            <div className="card">
              <SectionHeader title="Team Summary" sub="Current member status"/>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <MiniStat label="Total Members" value={stats?.totalUsers}    color="indigo" icon="👥"/>
                <MiniStat label="Pending Setup" value={stats?.pendingInvites} color="amber" icon="📧"/>
              </div>
              <SectionHeader title="User Growth" sub="New members per month"/>
              <BarChart data={stats?.userGrowth ?? []} color="#8b5cf6"/>
            </div>
          </div>

          {/* Full recent activity */}
          <div className="card">
            <SectionHeader title="Recent Team Actions"
              action={
                <button onClick={() => navigate('/audit-log')}
                  className="text-xs text-primary hover:underline font-medium">
                  Full audit log →
                </button>
              }
            />
            {!stats?.recentActivity?.length
              ? <div className="text-center text-gray-400 py-8 text-xs">No recent actions</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left pb-2 font-bold text-gray-400 uppercase tracking-wide">Action</th>
                        <th className="text-left pb-2 font-bold text-gray-400 uppercase tracking-wide">Resource</th>
                        <th className="text-left pb-2 font-bold text-gray-400 uppercase tracking-wide">Performed By</th>
                        <th className="text-left pb-2 font-bold text-gray-400 uppercase tracking-wide">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {stats.recentActivity.map((log, i) => (
                        <tr key={log.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                              ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-500'}`}>
                              {log.action?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{log.templateName}</td>
                          <td className="py-2 text-gray-500">{log.performedBy}</td>
                          <td className="py-2 text-gray-400 whitespace-nowrap">{fmtDate(log.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          PLATFORM ADMIN — PLATFORM TAB
      ════════════════════════════════════════════════════════ */}
      {tab === 'platform' && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              label="Active Orgs" value={stats?.activeOrganizations}
              sub={`${stats?.inactiveOrganizations ?? 0} inactive`} color="violet"
              onClick={() => navigate('/organizations')}
            />
            <KpiCard
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              label="Total Users" value={stats?.totalUsers}
              sub={`${stats?.pendingInvites ?? 0} pending setup`} color="indigo"
              onClick={() => navigate('/users')}
            />
            <KpiCard
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h3"
              label="Onboarding" value={stats?.pendingOnboarding}
              sub="Pending requests" color="amber"
              badge={stats?.pendingOnboarding}
              onClick={() => navigate('/onboarding-requests')}
            />
            <KpiCard
              icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              label="E-Sign Docs" value={stats?.esignTotal}
              sub={`${stats?.esignCompleted ?? 0} completed`} color="teal"
            />
          </div>

          {/* Tenant growth + Feature distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <SectionHeader title="New Tenants" sub="Organisations created per month — last 6 months"/>
              <BarChart data={stats?.tenantGrowth ?? []} color="#8b5cf6"/>
            </div>

            <div className="card">
              <SectionHeader title="Feature Adoption" sub="Active orgs with each module enabled"/>
              {Object.keys(stats?.featureDistribution ?? {}).length === 0
                ? <div className="text-center text-gray-400 py-8 text-xs">No feature data</div>
                : (
                  <div className="space-y-4 mt-2">
                    {Object.entries(stats.featureDistribution).map(([key, count]) => {
                      const meta   = FEATURE_META[key]
                      const total  = stats.activeOrganizations || 1
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">{meta?.icon ?? '📦'}</span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{meta?.label ?? key}</span>
                            <span className="text-xs font-bold text-gray-500">{count} / {total} orgs</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct(count, total)}%`, background: meta?.color ?? '#6366f1' }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </div>

          {/* Top users + E-Sign platform overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card lg:col-span-2">
              <SectionHeader title="Top Active Users (Platform)"
                sub="By audit actions — last 30 days"
                action={<button onClick={() => navigate('/users')} className="text-xs text-primary hover:underline font-medium">All users →</button>}
              />
              {!stats?.topUsers?.length
                ? <div className="text-center text-gray-400 py-6 text-xs">No activity in the last 30 days</div>
                : (
                  <ol className="space-y-3">
                    {stats.topUsers.map((u, i) => (
                      <li key={u.email} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          style={{ background: `hsl(${(i * 60 + 220) % 360}, 65%, 55%)` }}>
                          {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{u.activityCount}</p>
                          <p className="text-[10px] text-gray-400">actions</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )
              }
            </div>

            <div className="card">
              <SectionHeader title="Platform E-Sign" sub="Cross-org signing summary"/>
              <div className="space-y-3">
                {[
                  { label: 'Total Documents', value: stats?.esignTotal ?? 0,    color: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Completed',        value: stats?.esignCompleted ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Pending',          value: stats?.esignPending ?? 0,  color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Overdue',          value: stats?.esignOverdue ?? 0,  color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Cancelled',        value: stats?.esignCancelled ?? 0,color: 'text-gray-500' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                {stats?.esignAvgSigningHours != null && (
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">Avg Signing Time</p>
                    <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{stats.esignAvgSigningHours}h</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          PLATFORM ADMIN — TENANTS TAB
      ════════════════════════════════════════════════════════ */}
      {tab === 'tenants' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <MiniStat label="Active Tenants"   value={stats?.activeOrganizations}   color="emerald" icon="✅"/>
            <MiniStat label="Inactive Tenants" value={stats?.inactiveOrganizations} color="gray"    icon="💤"/>
            <MiniStat label="Pending Onboarding" value={stats?.pendingOnboarding}   color="amber"   icon="⏳"/>
          </div>

          {stats?.orgBreakdown?.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Organization Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Per-tenant resource and feature summary</p>
                </div>
                <button onClick={() => navigate('/organizations')} className="text-xs text-primary hover:underline font-medium">
                  Manage →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      {['Organization', 'Features', 'Users', 'PDF', 'Email', 'E-Sign', 'Total'].map(h => (
                        <th key={h} className={`px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'Organization' || h === 'Features' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {stats.orgBreakdown.map(org => (
                      <tr key={org.organizationId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500
                                            flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                              {org.organizationName?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{org.organizationName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(org.features ?? []).map(f => {
                              const m = FEATURE_META[f]
                              return m ? (
                                <span key={f} title={m.label}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{ background: m.bg, color: m.color }}>
                                  {m.icon}
                                </span>
                              ) : null
                            })}
                            {(!org.features || org.features.length === 0) && <span className="text-xs text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right"><StatPill value={org.users}          color="indigo"/></td>
                        <td className="px-5 py-3 text-right"><StatPill value={org.pdfTemplates}   color="sky"/></td>
                        <td className="px-5 py-3 text-right"><StatPill value={org.emailTemplates} color="emerald"/></td>
                        <td className="px-5 py-3 text-right"><StatPill value={org.esignDocuments} color="violet"/></td>
                        <td className="px-5 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                          {org.users + org.pdfTemplates + org.emailTemplates + org.esignDocuments}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          PLATFORM ADMIN — ACTIVITY TAB
      ════════════════════════════════════════════════════════ */}
      {tab === 'activity' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <SectionHeader title="Top Active Users" sub="Platform-wide — last 30 days"/>
              {!stats?.topUsers?.length
                ? <div className="text-center text-gray-400 py-10 text-xs">No activity in the last 30 days</div>
                : (
                  <ol className="space-y-3">
                    {stats.topUsers.map((u, i) => (
                      <li key={u.email} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          style={{ background: `hsl(${(i * 60 + 220) % 360}, 65%, 55%)` }}>
                          {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{u.activityCount}</span>
                      </li>
                    ))}
                  </ol>
                )
              }
            </div>

            <div className="card flex flex-col">
              <SectionHeader title="Recent Platform Actions"
                action={<button onClick={() => navigate('/audit-log')} className="text-xs text-primary hover:underline font-medium">Full log →</button>}
              />
              {!stats?.recentActivity?.length
                ? <div className="flex-1 flex items-center justify-center text-gray-400 py-8 text-xs">No activity yet</div>
                : (
                  <ul className="space-y-3 overflow-y-auto max-h-80">
                    {stats.recentActivity.map((log, i) => (
                      <li key={log.id ?? i} className="flex items-start gap-2.5">
                        <span className={`shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                          ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-500'}`}>
                          {log.action?.replace('_', ' ')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{log.templateName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{log.performedBy} · {fmtDate(log.timestamp)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
