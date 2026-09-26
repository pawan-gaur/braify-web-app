import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getDashboardAnalytics } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { FEATURES, FEATURE_META } from '../config/features'
import { fmtDateTime as fmtDate } from '../utils/date'
import { IconTrendDown, IconArrowRight } from '../components/ui/icons'
import {
  PipelineBand, SparkKpi, AttentionPanel, attentionCount, ActivityFeed, QuickCreate, NewMenu,
  createActions, TrendChart,
} from '../components/dashboard/OverviewKit'

const CRUMBS = [{ label: 'Dashboard' }]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

/* ── Colour palette ──────────────────────────────────────────────────────── */
const PALETTE = {
  indigo:  { bg: 'bg-brand-50   dark:bg-brand-900/20',   icon: 'text-brand',       bar: 'bg-brand',       ring: 'bg-brand',       hex: '#2F5BF0', grad: 'from-[#2F5BF0] to-[#6D52E8]' },
  violet:  { bg: 'bg-accent-50  dark:bg-accent-900/20',  icon: 'text-accent',      bar: 'bg-accent',      ring: 'bg-accent',      hex: '#6D52E8', grad: 'from-[#8B6DF7] to-[#5B3FD6]' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500', bar: 'bg-emerald-500', ring: 'bg-emerald-500', hex: '#10b981', grad: 'from-[#16B981] to-[#0EA5E9]' },
  sky:     { bg: 'bg-sky-50     dark:bg-sky-900/20',     icon: 'text-sky-500',     bar: 'bg-sky-500',     ring: 'bg-sky-500',     hex: '#0ea5e9', grad: 'from-[#38BDF8] to-[#2F5BF0]' },
  amber:   { bg: 'bg-amber-50   dark:bg-amber-900/20',   icon: 'text-amber-500',   bar: 'bg-amber-500',   ring: 'bg-amber-500',   hex: '#f59e0b', grad: 'from-[#FB923C] to-[#FBBF24]' },
  rose:    { bg: 'bg-rose-50    dark:bg-rose-900/20',    icon: 'text-rose-500',    bar: 'bg-rose-500',    ring: 'bg-rose-500',    hex: '#f43f5e', grad: 'from-[#FB7185] to-[#EC4899]' },
  teal:    { bg: 'bg-teal-50    dark:bg-teal-900/20',    icon: 'text-teal-500',    bar: 'bg-teal-500',    ring: 'bg-teal-500',    hex: '#14b8a6', grad: 'from-[#2DD4BF] to-[#16B981]' },
  slate:   { bg: 'bg-slate-100  dark:bg-slate-800/40',   icon: 'text-slate-500',   bar: 'bg-slate-400',   ring: 'bg-slate-400',   hex: '#64748b', grad: 'from-[#94A3B8] to-[#64748B]' },
}

const DATE_PRESETS = [
  { id: '7d',     label: '7 days'  },
  { id: '30d',    label: '30 days' },
  { id: '90d',    label: '90 days' },
  { id: 'custom', label: 'Custom'  },
]

const ACTION_COLOR = {
  CREATED:          'bg-emerald-100 text-emerald-700',
  UPDATED:          'bg-blue-100 text-blue-700',
  DELETED:          'bg-rose-100 text-rose-700',
  RESTORED:         'bg-accent-100 text-accent-700',
  PASSWORD_CHANGED: 'bg-amber-100 text-amber-700',
  SENT:             'bg-sky-100 text-sky-700',
  FEATURES_UPDATED: 'bg-brand-100 text-brand-700',
  CANCELLED:        'bg-red-100 text-red-700',
}

/* ─────────────────────────────────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────── */

function KpiCard({ icon, label, value, sub, color = 'indigo', onClick, badge }) {
  const c = PALETTE[color]
  return (
    <div onClick={onClick}
      className={`bento flex items-center gap-4 ${onClick ? 'bento-hover cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                       bg-gradient-to-br ${c.grad} shadow-soft`}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon}/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-ink-4 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-tight mt-0.5 flex items-center gap-2">
          {value ?? <span className="inline-block w-12 h-7 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"/>}
          {badge != null && badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5
                             rounded-full text-[11px] font-bold bg-amber-500 text-white">{badge}</span>
          )}
        </p>
        {sub && <p className="text-xs text-ink-4 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[15px] font-bold text-ink dark:text-gray-100 tracking-tight">{title}</h2>
        {sub && <p className="text-xs text-ink-4 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function MiniStat({ label, value, color = 'gray', icon }) {
  const colorMap = {
    indigo:  'text-brand dark:text-brand-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber:   'text-amber-600 dark:text-amber-400',
    rose:    'text-rose-600 dark:text-rose-400',
    sky:     'text-sky-600 dark:text-sky-400',
    violet:  'text-accent dark:text-accent-400',
    gray:    'text-ink-2 dark:text-gray-400',
  }
  return (
    <div className="bg-ink-8 dark:bg-gray-900/40 rounded-input p-4 text-center">
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <p className={`text-2xl font-extrabold tracking-tight ${colorMap[color] ?? colorMap.gray}`}>
        {value ?? <span className="inline-block w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/>}
      </p>
      <p className="text-[11px] text-ink-4 font-medium mt-0.5">{label}</p>
    </div>
  )
}

function ProgressBar({ label, value, max, color = 'indigo', suffix = '' }) {
  const p = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const c = PALETTE[color]
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-ink-2 dark:text-gray-400">{label}</span>
        <span className="text-ink-4">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-ink-8 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${c.grad} transition-all duration-500`} style={{ width: `${p}%` }}/>
      </div>
    </div>
  )
}

function StatPill({ value, color }) {
  const cls = {
    indigo:  'bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400',
    sky:     'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    violet:  'bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
    amber:   'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    rose:    'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  }[color] ?? 'bg-ink-8 text-ink-3'
  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${cls}`}>
      {value}
    </span>
  )
}

/* ── Charts ──────────────────────────────────────────────────────────────── */

function BarChart({ data = [], color = '#6D52E8', label, exportRef }) {
  return (
    <div>
      {label && <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{label}</p>}
      <TrendChart series={[{ label: label ?? 'Count', color, data }]} exportRef={exportRef} height={140} />
    </div>
  )
}

function GroupedBarChart({ pdfData = [], emailData = [], exportRef }) {
  return (
    <TrendChart exportRef={exportRef} series={[
      { label: 'PDF', color: '#6D52E8', data: pdfData },
      { label: 'Email', color: '#0ea5e9', data: emailData },
    ]} />
  )
}

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
        const el = (
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
      <circle cx={CX} cy={CY} r={32} fill="white" className="dark:fill-gray-800"/>
    </svg>
  )
}

/* ── Funnel chart — Sent → Viewed → Signed ───────────────────────────────── */
function FunnelChart({ steps = [], exportRef }) {
  const maxVal = Math.max(...steps.map(s => s.value), 1)
  return (
    <div ref={exportRef} className="space-y-2">
      {steps.map((step, i) => {
        const width = Math.max((step.value / maxVal) * 100, 8)
        const dropPct = i > 0 && steps[i - 1].value > 0
          ? Math.round(((steps[i - 1].value - step.value) / steps[i - 1].value) * 100)
          : null
        return (
          <div key={step.label}>
            {dropPct !== null && (
              <div className="flex items-center gap-2 my-1 pl-4">
                <div className="w-px h-4 bg-ink-6 dark:bg-gray-700"/>
                <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-semibold"><IconTrendDown className="w-3 h-3"/> {dropPct}% drop-off</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-20 text-right shrink-0">
                <span className="text-xs font-semibold text-ink-2 dark:text-gray-400">{step.label}</span>
              </div>
              <div className="flex-1 relative h-9 bg-ink-8 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                  style={{ width: `${width}%`, background: step.color }}>
                  <span className="text-white text-xs font-bold">{step.value}</span>
                </div>
              </div>
              <div className="w-12 text-right shrink-0">
                <span className="text-xs font-bold text-ink dark:text-gray-300">
                  {pct(step.value, steps[0]?.value)}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Horizontal bar (template ranking) ───────────────────────────────────── */
function HorizBar({ label, value, max, rank, color = 'linear-gradient(90deg,#2F5BF0,#6D52E8)' }) {
  const w = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-xs font-bold text-ink-4 text-right shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-medium text-ink-2 dark:text-gray-300 truncate">{label}</span>
          <span className="text-xs font-bold text-brand shrink-0 ml-2">{value}</span>
        </div>
        <div className="h-2 bg-ink-8 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${w}%`, background: color }}/>
        </div>
      </div>
    </div>
  )
}

/* ── Date range picker ───────────────────────────────────────────────────── */
function DateRangePicker({ preset, setPreset, from, setFrom, to, setTo }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 glass rounded-lg p-1">
        {DATE_PRESETS.map(p => (
          <button key={p.id} onClick={() => setPreset(p.id)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all
              ${preset === p.id
                ? 'bg-gradient-accent text-white shadow-soft'
                : 'text-ink-3 hover:text-ink dark:hover:text-gray-300'}`}>
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1
                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"/>
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1
                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"/>
        </div>
      )}
    </div>
  )
}

/* ── PNG export button ───────────────────────────────────────────────────── */
function ExportPngButton({ targetRef, filename = 'chart' }) {
  const handle = async () => {
    const el = targetRef?.current
    if (!el) return
    try {
      const mod = await import('html2canvas').catch(() => null)
      if (mod?.default) {
        const canvas = await mod.default(el, { backgroundColor: '#ffffff', scale: 2 })
        const a = document.createElement('a')
        a.download = `${filename}.png`
        a.href = canvas.toDataURL('image/png')
        a.click()
      } else {
        window.print()
      }
    } catch {
      window.print()
    }
  }
  return (
    <button onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                 text-xs font-semibold text-ink-3 hover:text-brand hover:border-brand-300 transition-colors">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      PNG
    </button>
  )
}

/* ── Scheduled reports panel ─────────────────────────────────────────────── */
function ScheduledReportsPanel({ orgId }) {
  const key   = `braify-scheduled-reports-${orgId ?? 'default'}`
  const init  = JSON.parse(localStorage.getItem(key) ?? 'null') ??
                { enabled: false, frequency: 'weekly', email: '', format: 'PDF', dayOfWeek: 'Monday' }
  const [cfg, setCfg]       = useState(init)
  const [saved, setSaved]   = useState(false)
  const update = patch => setCfg(prev => ({ ...prev, ...patch }))
  const save   = () => {
    localStorage.setItem(key, JSON.stringify(cfg))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card">
      <SectionHeader title="Scheduled Reports" sub="Receive analytics summaries by email automatically"/>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enable scheduled reports</p>
            <p className="text-xs text-gray-400 mt-0.5">Receive a PDF summary delivered to your inbox</p>
          </div>
          <button onClick={() => update({ enabled: !cfg.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${cfg.enabled ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${cfg.enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
          </button>
        </div>

        {cfg.enabled && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Frequency</label>
              <div className="flex gap-2">
                {['weekly', 'monthly'].map(f => (
                  <button key={f} onClick={() => update({ frequency: f })}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all capitalize
                      ${cfg.frequency === f
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {cfg.frequency === 'weekly' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Send on</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => (
                    <button key={d} onClick={() => update({ dayOfWeek: d })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${cfg.dayOfWeek === d
                          ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Report format</label>
              <div className="flex gap-2">
                {['PDF', 'CSV'].map(f => (
                  <button key={f} onClick={() => update({ format: f })}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                      ${cfg.format === f
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Deliver to email</label>
              <input type="email" value={cfg.email} onChange={e => update({ email: e.target.value })}
                placeholder="reports@yourcompany.com"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5
                           text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                           focus:outline-none focus:ring-2 focus:ring-brand"/>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} className="btn btn-primary text-sm px-4 py-2">Save preferences</button>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              Saved
            </span>
          )}
          <span className="text-[11px] text-gray-400">Settings saved locally — backend scheduling coming soon.</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user, hasFeature } = useAuth()
  const navigate = useNavigate()
  const can = {
    pdf:   hasFeature(FEATURES.PDF_TEMPLATES),
    email: hasFeature(FEATURES.EMAIL_TEMPLATES),
    esign: hasFeature(FEATURES.E_SIGN),
  }

  const isPlatformAdmin = user?.role === ROLES.PLATFORM_ADMIN
  const isOrgAdmin      = user?.role === ROLES.ORG_ADMIN || isPlatformAdmin

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState(isPlatformAdmin ? 'platform' : 'overview')

  // Analytics date range
  const [preset, setPreset] = useState('30d')
  const [from,   setFrom]   = useState('')
  const [to,     setTo]     = useState('')

  // Chart export refs
  const chartRef1 = useRef(null)
  const chartRef2 = useRef(null)
  const chartRef3 = useRef(null)

  const loadStats = useCallback(() => {
    getDashboardStats()
      .then(s => { setStats(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // Auto-refresh on live-activity tabs
  useEffect(() => {
    if (!['activity', 'team'].includes(tab)) return
    const id = setInterval(loadStats, 30_000)
    return () => clearInterval(id)
  }, [tab, loadStats])

  /* ── Analytics tab: live role-scoped, period-filtered data ── */
  const [analytics, setAnalytics] = useState(null)

  // Resolve the selected preset / custom range to a number of days.
  const periodDays = (() => {
    if (preset === '7d')  return 7
    if (preset === '90d') return 90
    if (preset === 'custom' && from && to) {
      const ms = new Date(to) - new Date(from)
      const d = Math.round(ms / 86_400_000) + 1
      return d > 0 ? d : 30
    }
    return 30
  })()

  const loadAnalytics = useCallback(() => {
    getDashboardAnalytics(periodDays)
      .then(setAnalytics)
      .catch(() => {})
  }, [periodDays])

  // Fetch on entering the Analytics tab + whenever the period changes, then poll.
  useEffect(() => {
    if (tab !== 'analytics') return
    loadAnalytics()
    const id = setInterval(loadAnalytics, 30_000)
    return () => clearInterval(id)
  }, [tab, loadAnalytics])

  /* ── Skeleton (matches new hero layout shape) ── */
  if (loading) return (
    <div className="dash max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="space-y-2">
        <div className="skeleton h-8 w-72"/>
        <div className="skeleton h-4 w-56"/>
      </div>
      <div className="skeleton h-10 w-80 rounded-2xl"/>
      <div className="skeleton h-40 rounded-[22px]"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-[20px]"/>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 skeleton h-72 rounded-[20px]"/>
        <div className="skeleton h-72 rounded-[20px]"/>
      </div>
    </div>
  )

  const TABS_ORG = [
    { id: 'overview',  label: 'Overview',  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
    { id: 'analytics', label: 'Analytics', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
    { id: 'esign',     label: 'E-Sign',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> },
    { id: 'team',      label: 'Team',      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  ]
  const TABS_PA = [
    { id: 'platform',  label: 'Platform',  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { id: 'tenants',   label: 'Tenants',   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
    { id: 'analytics', label: 'Analytics', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
    { id: 'activity',  label: 'Activity',  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
  ]
  const TABS = isPlatformAdmin ? TABS_PA : TABS_ORG

  /* ── E-Sign computed values ── */
  const esignSent = (stats?.esignTotal ?? 0) - (stats?.esignDraft ?? 0)
  const esignSegments = [
    { label: 'Completed', value: stats?.esignCompleted ?? 0, color: '#10b981' },
    { label: 'Pending',   value: (stats?.esignPending ?? 0) - (stats?.esignOverdue ?? 0), color: '#f59e0b' },
    { label: 'Overdue',   value: stats?.esignOverdue  ?? 0, color: '#f43f5e' },
    { label: 'Cancelled', value: stats?.esignCancelled ?? 0, color: '#9ca3af' },
    { label: 'Expired',   value: stats?.esignExpired  ?? 0, color: '#d1d5db' },
    { label: 'Draft',     value: stats?.esignDraft    ?? 0, color: '#c7d2fe' },
  ].filter(s => s.value > 0)

  const esignFunnel = [
    { label: 'Sent',   value: esignSent,                                            color: '#2F5BF0' },
    { label: 'Viewed', value: stats?.esignViewed ?? Math.round(esignSent * 0.82),   color: '#0ea5e9' },
    { label: 'Signed', value: stats?.esignCompleted ?? 0,                           color: '#10b981' },
  ]

  const topUsers       = stats?.topUsers       ?? []

  /* ── Analytics tab: prefer the live, period-scoped analytics payload ── */
  const aTopTemplates   = analytics?.topTemplates   ?? []
  const aLeastTemplates = analytics?.leastTemplates ?? []
  const aActivity       = analytics?.activity       ?? []
  const aFunnel = analytics?.esignFunnel
    ? [
        { label: 'Sent',   value: analytics.esignFunnel.sent,   color: '#2F5BF0' },
        { label: 'Viewed', value: analytics.esignFunnel.viewed, color: '#0ea5e9' },
        { label: 'Signed', value: analytics.esignFunnel.signed, color: '#10b981' },
      ]
    : esignFunnel

  return (
    <div className="dash max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumbs items={CRUMBS}/>

      {/* ── Header — greeting, what needs attention, refresh + new ── */}
      <div className="mt-4 mb-6 flex items-end justify-between gap-4 flex-wrap animate-fade-in-up">
        <div>
          <h1 className="display-2 text-[#16143A] dark:text-white font-extrabold">
            {greeting()}, <span className="text-gradient">{user?.firstName}</span>
          </h1>
          <p className="text-sm text-[#625F80] dark:text-gray-400 mt-1.5">
            {isPlatformAdmin
              ? 'Platform overview across all organisations'
              : (() => {
                  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
                  const n = attentionCount(stats, isOrgAdmin, can)
                  return n ? `${date} · ${n} ${n === 1 ? 'thing needs' : 'things need'} you` : `${date} · You’re all caught up`
                })()
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadStats} title="Refresh"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#3A3858] dark:text-gray-300
                       bg-white/80 dark:bg-white/[0.04] border border-[#ECE8FA] dark:border-gray-700 hover:border-[#D6CCFB] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          {!isPlatformAdmin && <NewMenu actions={createActions({ can, isOrgAdmin })} onNavigate={navigate}/>}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div role="tablist" aria-label="Dashboard sections" className="dash-tabs flex gap-1 rounded-2xl p-1 mb-6 w-fit max-w-full overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
              ${tab === t.id
                ? 'text-white shadow-[0_8px_20px_rgba(109,82,232,0.30)]'
                : 'text-[#625F80] dark:text-gray-400 hover:text-[#16143A] dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-white/[0.04]'}`}
            style={tab === t.id ? { backgroundImage: 'linear-gradient(120deg,#2F5BF0,#6D52E8)' } : undefined}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          ORG — OVERVIEW TAB (Apple-style: focus + drilldown)
      ════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-5 animate-fade-in-up">

          {/* ─── Pipeline band: the same Design → Sign → Track story as the landing page ─── */}
          <PipelineBand stats={stats} esignSent={esignSent} can={can} onNavigate={navigate}/>

          {/* ─── KPI cards with sparklines ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {can.pdf && (
              <SparkKpi label="PDF templates" value={stats?.totalPdfTemplates} series={stats?.pdfGrowth}
                color="#6D52E8" onClick={() => navigate('/templates')}/>
            )}
            {can.email && (
              <SparkKpi label="Email templates" value={stats?.totalEmailTemplates} series={stats?.emailGrowth}
                color="#0ea5e9" onClick={() => navigate('/email-templates')}/>
            )}
            {can.esign && (
              <SparkKpi label="Sign rate" series={stats?.esignGrowth} color="#10b981"
                value={esignSent > 0 ? `${pct(stats?.esignCompleted ?? 0, esignSent)}%` : '—'}
                sub={`${(stats?.esignCompleted ?? 0).toLocaleString()} of ${esignSent.toLocaleString()} signed`}
                onClick={() => navigate('/esign')}/>
            )}
            <SparkKpi label="Team" value={stats?.totalUsers} series={stats?.userGrowth} color="#d97706"
              sub={isOrgAdmin && stats?.pendingInvites ? `${stats.pendingInvites} ${stats.pendingInvites === 1 ? 'invite' : 'invites'} pending` : undefined}
              onClick={isOrgAdmin ? () => navigate('/users') : undefined}/>
          </div>

          {/* ─── Needs attention + activity  |  Quick create ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 dash-card p-5 space-y-6">
              <AttentionPanel stats={stats} isOrgAdmin={isOrgAdmin} can={can} onNavigate={navigate}/>
              <ActivityFeed stats={stats} onNavigate={navigate} onRefresh={loadStats}/>
            </div>
            <div className="dash-card p-5">
              <QuickCreate actions={createActions({ can, isOrgAdmin })} onNavigate={navigate}/>
            </div>
          </div>

          {/* ─── Documents over time ─── */}
          <div className="dash-card p-5">
            <SectionHeader title="Documents over time" sub="Created and sent per month"/>
            <TrendChart series={[
              can.pdf   && { label: 'PDF templates',   color: '#6D52E8', data: stats?.pdfGrowth   ?? [] },
              can.email && { label: 'Email templates', color: '#0ea5e9', data: stats?.emailGrowth ?? [] },
              can.esign && { label: 'E-sign sent',     color: '#10b981', data: stats?.esignGrowth ?? [] },
            ].filter(Boolean)}/>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          ANALYTICS TAB (ORG + PLATFORM ADMIN)
          1. Custom date range
          2. Template usage analytics
          3. Per-user / per-org activity
          4. E-Sign funnel
          5. Scheduled reports
          6. Exportable charts
      ════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <>
          {/* ① Date range picker */}
          <div className="card mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Analytics Period</h2>
                <p className="text-xs text-gray-400 mt-0.5">Filter all panels by time range</p>
              </div>
              <DateRangePicker preset={preset} setPreset={setPreset} from={from} setFrom={setFrom} to={to} setTo={setTo}/>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* ② Template usage analytics */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader title="Template Usage" sub={`Most-used PDF & Email templates — last ${periodDays} days`}/>
                <ExportPngButton targetRef={chartRef1} filename="template-usage"/>
              </div>
              <div ref={chartRef1} className="space-y-3">
                {aTopTemplates.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-xs">
                    No template activity in the selected period.
                  </div>
                ) : (
                  aTopTemplates.slice(0, 5).map((t, i) => (
                    <HorizBar key={t.id ?? i} rank={i + 1} label={t.name}
                      value={t.uses ?? 0}
                      max={aTopTemplates[0]?.uses ?? 1}
                      color="#2F5BF0"/>
                  ))
                )}
              </div>

              {/* Least used */}
              {aLeastTemplates.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Least Used</p>
                  <div className="space-y-1">
                    {aLeastTemplates.slice(0, 3).map((t, i) => (
                      <div key={t.id ?? i} className="flex items-center justify-between text-xs py-1">
                        <span className="text-gray-500 dark:text-gray-400 truncate">{t.name}</span>
                        <span className="font-bold text-rose-500 shrink-0 ml-2">{t.uses ?? 0} uses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ③ Per-user / per-org activity breakdown */}
            <div className="card">
              <SectionHeader
                title="Most Active Users"
                sub={`Audit actions per person — last ${periodDays} days`}
              />
              {aActivity.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-xs">No activity data in selected period</div>
              ) : (
                <div className="space-y-3">
                  {aActivity.slice(0, 8).map((u, i) => {
                    const maxAct = aActivity[0]?.activityCount ?? 1
                    return (
                      <div key={u.email ?? i} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          style={{ background: `hsl(${(i * 60 + 220) % 360}, 65%, 55%)` }}>
                          {(u.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{u.name}</span>
                            <span className="text-xs font-bold text-brand dark:text-brand-400 shrink-0 ml-2">{u.activityCount}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-brand transition-all duration-500"
                              style={{ width: `${pct(u.activityCount, maxAct)}%` }}/>
                          </div>
                          {u.email && u.email !== u.name && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{u.email}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ④ E-Sign funnel analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader title="E-Sign Conversion Funnel" sub={`Sent → Viewed → Signed — last ${periodDays} days`}/>
                <ExportPngButton targetRef={chartRef2} filename="esign-funnel"/>
              </div>
              <div ref={chartRef2}>
                <FunnelChart steps={aFunnel}/>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {aFunnel.map(step => (
                    <div key={step.label} className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{step.value}</p>
                      <p className="text-[11px] text-gray-400">{step.label}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: step.color }}>
                        {pct(step.value, aFunnel[0]?.value)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ① Scheduled reports */}
            <ScheduledReportsPanel orgId={user?.organizationId}/>
          </div>

          {/* ⑥ Export section */}
          <div className="card mb-6">
            <SectionHeader title="Export Charts" sub="Download analytics as PNG or print to PDF"/>
            <div className="flex flex-wrap gap-3">
              <ExportPngButton targetRef={chartRef1} filename="template-usage"/>
              <ExportPngButton targetRef={chartRef2} filename="esign-funnel"/>
              <ExportPngButton targetRef={chartRef3} filename="activity-breakdown"/>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-300
                           text-xs font-semibold text-brand hover:bg-brand-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Print / Save as PDF
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          ORG — E-SIGN TAB
      ════════════════════════════════════════ */}
      {tab === 'esign' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <MiniStat label="Total Docs"  value={stats?.esignTotal}     color="indigo"  icon={<svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}/>
            <MiniStat label="Sent"        value={esignSent}             color="sky"     icon={<svg className="w-5 h-5 text-sky-400"    fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>}/>
            <MiniStat label="Completed"   value={stats?.esignCompleted} color="emerald" icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}/>
            <MiniStat label="Pending"     value={stats?.esignPending}   color="amber"   icon={<svg className="w-5 h-5 text-amber-400"   fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}/>
            <MiniStat label="Overdue"     value={stats?.esignOverdue}   color="rose"    icon={<svg className="w-5 h-5 text-rose-400"    fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}/>
            <MiniStat label="Cancelled"   value={stats?.esignCancelled} color="gray"    icon={<svg className="w-5 h-5 text-gray-400"    fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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

            <div className="card">
              <SectionHeader title="Conversion Funnel" sub="Sent → Viewed → Signed"/>
              <FunnelChart steps={esignFunnel}/>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold text-brand dark:text-brand-400">{esignSent}</p>
                    <p className="text-[10px] text-gray-400">Sent</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-sky-600 dark:text-sky-400">
                      {esignSent > 0 ? `${pct(esignFunnel[1]?.value ?? 0, esignSent)}%` : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400">View rate</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {esignSent > 0 ? `${pct(stats?.esignCompleted ?? 0, esignSent)}%` : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400">Sign rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card space-y-4">
              <SectionHeader title="Performance" sub="Signing efficiency"/>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Avg Signing Time</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {stats?.esignAvgSigningHours != null ? `${stats.esignAvgSigningHours}h`
                    : <span className="text-sm text-gray-400">No data yet</span>}
                </p>
                <p className="text-xs text-emerald-600/70 mt-0.5">from sent → completed</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide mb-1">Decline / Cancel Rate</p>
                <p className="text-3xl font-bold text-rose-700 dark:text-rose-400">
                  {stats?.esignDeclineRate != null ? `${stats.esignDeclineRate}%`
                    : <span className="text-sm text-gray-400">No data yet</span>}
                </p>
                <p className="text-xs text-rose-600/70 mt-0.5">of all sent documents</p>
              </div>
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">
                  {esignSent > 0 ? `${pct(stats?.esignCompleted ?? 0, esignSent)}%`
                    : <span className="text-sm text-gray-400">No data yet</span>}
                </p>
                <p className="text-xs text-sky-600/70 mt-0.5">of sent docs fully signed</p>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <div className="flex items-center justify-between mb-1">
              <SectionHeader title="Documents Sent" sub="Monthly trend — last 6 months"/>
              <ExportPngButton targetRef={chartRef3} filename="esign-trend"/>
            </div>
            <BarChart data={stats?.esignGrowth ?? []} color="#0ea5e9" exportRef={chartRef3}/>
          </div>

          {(stats?.esignOverdue ?? 0) > 0 && (
            <div className="card border-rose-200 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-900/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 shrink-0 text-rose-500">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-400">
                    {stats.esignOverdue} overdue document{stats.esignOverdue !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
                    Signing token has expired but documents haven't been submitted. Consider resending.
                  </p>
                </div>
                <button onClick={() => navigate('/esign')} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline shrink-0">Review <IconArrowRight className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          ORG — TEAM TAB
      ════════════════════════════════════════ */}
      {tab === 'team' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <SectionHeader title="Top Active Users" sub="By audit log activity — last 30 days"
                action={<button onClick={() => navigate('/users')} className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">All users <IconArrowRight className="w-3.5 h-3.5"/></button>}
              />
              {!topUsers.length
                ? <div className="flex items-center justify-center py-10 text-gray-400 text-xs">No activity in the last 30 days</div>
                : (
                  <ol className="space-y-3">
                    {topUsers.map((u, i) => (
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
                          <p className="text-sm font-bold text-brand dark:text-brand-400">{u.activityCount}</p>
                          <p className="text-[10px] text-gray-400">actions</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )
              }
            </div>

            <div className="card">
              <SectionHeader title="Team Summary" sub="Current member status"/>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <MiniStat label="Total Members" value={stats?.totalUsers}     color="indigo" icon={<svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}/>
                <MiniStat label="Pending Setup" value={stats?.pendingInvites} color="amber"  icon={<svg className="w-5 h-5 text-amber-400"   fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}/>
              </div>
              <SectionHeader title="User Growth" sub="New members per month"/>
              <BarChart data={stats?.userGrowth ?? []} color="#6D52E8"/>
            </div>
          </div>

          <div className="card">
            <SectionHeader title="Recent Team Actions"
              action={<button onClick={() => navigate('/audit-log')} className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">Full audit log <IconArrowRight className="w-3.5 h-3.5"/></button>}
            />
            {!stats?.recentActivity?.length
              ? <div className="text-center text-gray-400 py-8 text-xs">No recent actions</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        {['Action', 'Resource', 'Performed By', 'When'].map(h => (
                          <th key={h} className="text-left pb-2 font-bold text-gray-400 uppercase tracking-wide pr-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {stats.recentActivity.map((log, i) => (
                        <tr key={log.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2 pr-3">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                              ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-500'}`}>
                              {log.action?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{log.templateName}</td>
                          <td className="py-2 pr-3 text-gray-500">{log.performedBy}</td>
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

      {/* ════════════════════════════════════════
          PLATFORM ADMIN — PLATFORM TAB
      ════════════════════════════════════════ */}
      {tab === 'platform' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              label="Active Orgs" value={stats?.activeOrganizations}
              sub={`${stats?.inactiveOrganizations ?? 0} inactive`} color="violet"
              onClick={() => navigate('/organizations')}/>
            <KpiCard icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              label="Total Users" value={stats?.totalUsers}
              sub={`${stats?.pendingInvites ?? 0} pending setup`} color="indigo"
              onClick={() => navigate('/users')}/>
            <KpiCard icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h3"
              label="Onboarding" value={stats?.pendingOnboarding}
              sub="Pending requests" color="amber" badge={stats?.pendingOnboarding}
              onClick={() => navigate('/onboarding-requests')}/>
            <KpiCard icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              label="E-Sign Docs" value={stats?.esignTotal}
              sub={`${stats?.esignCompleted ?? 0} completed`} color="teal"/>
          </div>

          {/* ─── Service usage across the platform ─── */}
          <div className="mb-2"><SectionHeader title="Service Usage" sub="Created, sent, and generated across all organisations"/></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              label="Emails Sent" value={stats?.totalEmailsSent ?? 0}
              sub={`${(stats?.totalBulkEmailJobs ?? 0).toLocaleString()} campaigns`} color="sky"
              onClick={() => navigate('/bulk-email')}/>
            <KpiCard icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              label="PDF Templates" value={stats?.totalPdfTemplates ?? 0}
              sub={`${(stats?.totalPdfsGenerated ?? 0).toLocaleString()} PDFs generated`} color="indigo"
              onClick={() => navigate('/templates')}/>
            <KpiCard icon="M7 8h10M7 12h6m5 8l-4-3H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-1 1.73"
              label="Email Templates" value={stats?.totalEmailTemplates ?? 0}
              sub="reusable layouts" color="emerald"
              onClick={() => navigate('/email-templates')}/>
            <KpiCard icon="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
              label="Files Stored" value={stats?.totalFiles ?? 0}
              sub={`${(stats?.totalStorageMb ?? 0).toLocaleString()} MB`} color="amber"
              onClick={() => navigate('/files')}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <SectionHeader title="New Tenants" sub="Organisations created per month — last 6 months"/>
              <BarChart data={stats?.tenantGrowth ?? []} color="#6D52E8"/>
            </div>
            <div className="card">
              <SectionHeader title="Feature Adoption" sub="Active orgs with each module enabled"/>
              {Object.keys(stats?.featureDistribution ?? {}).length === 0
                ? <div className="text-center text-gray-400 py-8 text-xs">No feature data</div>
                : (
                  <div className="space-y-4 mt-2">
                    {Object.entries(stats.featureDistribution).map(([key, count]) => {
                      const meta  = FEATURE_META[key]
                      const total = stats.activeOrganizations || 1
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-4 h-4 shrink-0" style={{ color: meta?.color ?? '#2F5BF0' }}>
                              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={meta?.icon ?? 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'}/>
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{meta?.label ?? key}</span>
                            <span className="text-xs font-bold text-gray-500">{count} / {total} orgs</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct(count, total)}%`, background: meta?.color ?? '#2F5BF0' }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card lg:col-span-2">
              <SectionHeader title="Top Active Users (Platform)" sub="By audit actions — last 30 days"
                action={<button onClick={() => navigate('/users')} className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">All users <IconArrowRight className="w-3.5 h-3.5"/></button>}
              />
              {!topUsers.length
                ? <div className="text-center text-gray-400 py-6 text-xs">No activity in the last 30 days</div>
                : (
                  <ol className="space-y-3">
                    {topUsers.map((u, i) => (
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
                        <span className="text-sm font-bold text-brand dark:text-brand-400 shrink-0">{u.activityCount}</span>
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
                  { label: 'Total Documents', value: stats?.esignTotal ?? 0,     color: 'text-brand dark:text-brand-400' },
                  { label: 'Completed',        value: stats?.esignCompleted ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Pending',          value: stats?.esignPending ?? 0,   color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Overdue',          value: stats?.esignOverdue ?? 0,   color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Cancelled',        value: stats?.esignCancelled ?? 0, color: 'text-gray-500' },
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

      {/* ════════════════════════════════════════
          PLATFORM ADMIN — TENANTS TAB
      ════════════════════════════════════════ */}
      {tab === 'tenants' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard color="emerald" label="Active Tenants" value={stats?.activeOrganizations}
              sub="Live organisations"
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <KpiCard color="slate" label="Inactive Tenants" value={stats?.inactiveOrganizations}
              sub="Suspended"
              icon="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <KpiCard color="amber" label="Pending Onboarding" value={stats?.pendingOnboarding}
              sub="Awaiting approval"
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </div>

          {stats?.orgBreakdown?.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Organization Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Per-tenant resource and feature summary</p>
                </div>
                <button onClick={() => navigate('/organizations')} className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">Manage <IconArrowRight className="w-3.5 h-3.5"/></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      {['Organization', 'Features', 'Users', 'PDF Tpl', 'Email Tpl', 'E-Sign', 'Emails Sent', 'PDFs Gen', 'Files'].map(h => (
                        <th key={h} className={`px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'Organization' || h === 'Features' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {stats.orgBreakdown.map(org => (
                      <tr key={org.organizationId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500
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
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon}/>
                                  </svg>
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
                        <td className="px-5 py-3 text-right"><StatPill value={org.emailsSent ?? 0}    color="sky"/></td>
                        <td className="px-5 py-3 text-right"><StatPill value={org.pdfsGenerated ?? 0} color="amber"/></td>
                        <td className="px-5 py-3 text-right" title={`${(org.storageMb ?? 0).toLocaleString()} MB stored`}>
                          <StatPill value={org.files ?? 0} color="rose"/>
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

      {/* ════════════════════════════════════════
          PLATFORM ADMIN — ACTIVITY TAB
          ⑦ Real-time activity feed
      ════════════════════════════════════════ */}
      {tab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <SectionHeader title="Top Active Users" sub="Platform-wide — last 30 days"/>
            {!topUsers.length
              ? <div className="text-center text-gray-400 py-10 text-xs">No activity in the last 30 days</div>
              : (
                <ol className="space-y-3">
                  {topUsers.map((u, i) => (
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
                      <span className="text-sm font-bold text-brand dark:text-brand-400 shrink-0">{u.activityCount}</span>
                    </li>
                  ))}
                </ol>
              )
            }
          </div>
          <div className="dash-card p-5"><ActivityFeed stats={stats} onNavigate={navigate} onRefresh={loadStats}/></div>
        </div>
      )}
    </div>
  )
}
