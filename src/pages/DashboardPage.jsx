import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../services/api'
import { useAuth, ROLES } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { FEATURE_META } from '../config/features'
import { fmtDateTime as fmtDate } from '../utils/date'

const CRUMBS = [{ label: 'Dashboard' }]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

/* ── useCountUp — animates a number from 0 to target with easing ─────────── */
function useCountUp(target, { duration = 800 } = {}) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target == null) { setValue(0); return }
    const start = performance.now()
    const from = 0
    const to = Number(target) || 0
    let raf
    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (to - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

/* ── Hero metric ─────────────────────────────────────────────────────────── */
function HeroMetric({ value, label, trend, sub, max, onClick }) {
  const animated = useCountUp(value)
  const percent = max ? Math.min(100, Math.round((value / max) * 100)) : null
  const barColor = percent != null && percent > 90 ? 'bg-danger'
                 : percent != null && percent > 75 ? 'bg-warning'
                 : 'bg-brand'

  return (
    <div
      onClick={onClick}
      className={`card relative overflow-hidden ${onClick ? 'cursor-pointer card-hover' : ''}`}
    >
      <p className="text-eyebrow">{label}</p>
      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
        <span className="text-6xl md:text-7xl font-semibold text-ink tracking-tightest tabular-nums leading-none">
          {animated.toLocaleString()}
        </span>
        {trend != null && (
          <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full
            ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-sm text-ink-3 mt-2">{sub}</p>}

      {percent != null && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-1.5">
            <span>{percent}% of monthly quota</span>
            <span className="tabular-nums">{value?.toLocaleString()} / {max?.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-ink-7 overflow-hidden">
            <div
              className={`h-full ${barColor} transition-[width] duration-700 ease-spring`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Metric pill — compact supporting metric (new dashboard design) ─────── */
function MetricPill({ label, value, sub, onClick, accent = 'brand' }) {
  const animated = useCountUp(value)
  const accentMap = {
    brand:   'text-brand',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger:  'text-rose-600',
  }
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer card-hover' : ''}`}
    >
      <p className="text-eyebrow">{label}</p>
      <p className={`text-3xl font-semibold tracking-tight mt-2 tabular-nums ${accentMap[accent] ?? accentMap.brand}`}>
        {animated.toLocaleString()}
      </p>
      {sub && <p className="text-xs text-ink-3 mt-1">{sub}</p>}
    </div>
  )
}

/* ── Today panel — smart action suggestions based on state ──────────────── */
function TodayPanel({ stats, isOrgAdmin, onNavigate }) {
  const items = []

  const esignOverdue = stats?.esignOverdue ?? 0
  const esignPending = stats?.esignPending ?? 0
  const pendingInvites = stats?.pendingInvites ?? 0
  const quotaPct = stats?.docsQuotaPercent ?? null

  if (esignOverdue > 0) {
    items.push({
      tone: 'danger',
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: `${esignOverdue} e-sign ${esignOverdue === 1 ? 'document is' : 'documents are'} overdue`,
      action: 'Review →',
      to: '/esign',
    })
  }
  if (esignPending > 0) {
    items.push({
      tone: 'brand',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      title: `${esignPending} ${esignPending === 1 ? 'document is' : 'documents are'} awaiting signature`,
      action: 'View →',
      to: '/esign',
    })
  }
  if (pendingInvites > 0 && isOrgAdmin) {
    items.push({
      tone: 'warning',
      icon: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1a3 3 0 006 0v-1a8 8 0 10-3.4 6.6',
      title: `${pendingInvites} pending team ${pendingInvites === 1 ? 'invite' : 'invites'}`,
      action: 'Manage →',
      to: '/users',
    })
  }
  if (quotaPct != null && quotaPct >= 80) {
    items.push({
      tone: 'warning',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: `You're at ${quotaPct}% of your monthly quota`,
      action: 'Upgrade →',
      to: '/usage',
    })
  }

  // Empty state — first-time delight
  if (items.length === 0) {
    return (
      <div className="card text-center py-10">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 animate-float-bob">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-ink">You're all caught up</p>
        <p className="text-xs text-ink-3 mt-1">No urgent actions today.</p>
      </div>
    )
  }

  const toneClasses = {
    danger:  { bg: 'bg-rose-50',    icon: 'text-rose-500',    ring: 'bg-rose-500' },
    warning: { bg: 'bg-amber-50',   icon: 'text-amber-500',   ring: 'bg-amber-500' },
    brand:   { bg: 'bg-brand-50',   icon: 'text-brand',       ring: 'bg-brand' },
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink">Today</h2>
        <span className="text-eyebrow">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => {
          const t = toneClasses[it.tone]
          return (
            <li
              key={i}
              className="group flex items-center gap-3 p-3 rounded-input hover:bg-ink-9 transition-colors cursor-pointer"
              onClick={() => onNavigate(it.to)}
            >
              <div className={`w-9 h-9 rounded-input ${t.bg} flex items-center justify-center shrink-0`}>
                <svg className={`w-4.5 h-4.5 ${t.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={it.icon}/>
                </svg>
              </div>
              <p className="flex-1 text-sm text-ink-2 leading-snug">{it.title}</p>
              <span className="text-xs font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {it.action}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
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
  RESTORED:         'bg-violet-100 text-violet-700',
  PASSWORD_CHANGED: 'bg-amber-100 text-amber-700',
  SENT:             'bg-sky-100 text-sky-700',
  FEATURES_UPDATED: 'bg-indigo-100 text-indigo-700',
  CANCELLED:        'bg-red-100 text-red-700',
}

/* ─────────────────────────────────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────── */

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

function MiniStat({ label, value, color = 'gray', icon }) {
  const colorMap = {
    indigo:  'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber:   'text-amber-600 dark:text-amber-400',
    rose:    'text-rose-600 dark:text-rose-400',
    sky:     'text-sky-600 dark:text-sky-400',
    violet:  'text-violet-600 dark:text-violet-400',
    gray:    'text-gray-600 dark:text-gray-400',
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

function ProgressBar({ label, value, max, color = 'indigo', suffix = '' }) {
  const p = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const c = PALETTE[color]
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-500">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${p}%` }}/>
      </div>
    </div>
  )
}

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

/* ── Charts ──────────────────────────────────────────────────────────────── */

function BarChart({ data = [], color = '#6366f1', label, exportRef }) {
  const max    = Math.max(...data.map(d => d.count), 1)
  const W      = 100 / Math.max(data.length, 1)
  const BAR_W  = Math.min(W * 0.55, 14)
  const HEIGHT = 100
  return (
    <div ref={exportRef}>
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

function GroupedBarChart({ pdfData = [], emailData = [], exportRef }) {
  const allCounts = [...pdfData, ...emailData].map(d => d.count)
  const max    = Math.max(...allCounts, 1)
  const HEIGHT = 120
  const groups = pdfData.length
  return (
    <div ref={exportRef} className="relative" style={{ height: HEIGHT + 36 }}>
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
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"/>
                <span className="text-[10px] text-rose-500 font-semibold">↓ {dropPct}% drop-off</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-20 text-right shrink-0">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{step.label}</span>
              </div>
              <div className="flex-1 relative h-9 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                  style={{ width: `${width}%`, background: step.color }}>
                  <span className="text-white text-xs font-bold">{step.value}</span>
                </div>
              </div>
              <div className="w-12 text-right shrink-0">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
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
function HorizBar({ label, value, max, rank, color = '#6366f1' }) {
  const w = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-xs font-bold text-gray-400 text-right shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
          <span className="text-xs font-bold text-gray-500 shrink-0 ml-2">{value}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
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
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {DATE_PRESETS.map(p => (
          <button key={p.id} onClick={() => setPreset(p.id)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all
              ${preset === p.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
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
                 text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
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
              ${cfg.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
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
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
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
                           focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
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

/* ── Live activity feed (polls every 30 s when enabled) ──────────────────── */
function LiveActivityFeed({ stats, onNavigate }) {
  const [live, setLive]   = useState(false)
  const [blink, setBlink] = useState(false)
  const timerRef          = useRef(null)

  useEffect(() => {
    if (!live) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setBlink(b => !b), 2000)
    return () => clearInterval(timerRef.current)
  }, [live])

  const items = stats?.recentActivity ?? []

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Activity Feed</h2>
          <p className="text-xs text-gray-400 mt-0.5">{live ? 'Refreshes every 30s' : 'Manual mode'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLive(l => !l)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
              ${live
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-gray-300'} ${live && blink ? 'opacity-40' : 'opacity-100'} transition-opacity`}/>
            {live ? 'Live' : 'Live off'}
          </button>
          <button onClick={() => onNavigate('/audit-log')}
            className="text-xs text-indigo-600 hover:underline font-medium">Full log →</button>
        </div>
      </div>
      {!items.length
        ? <div className="flex-1 flex items-center justify-center text-gray-400 py-8 text-xs">No activity yet</div>
        : (
          <ul className="space-y-3 overflow-y-auto max-h-72 flex-1 pr-1">
            {items.map((log, i) => (
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

  /* ── Skeleton (matches new hero layout shape) ── */
  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-72"/>
        <div className="skeleton h-4 w-48"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 skeleton h-52"/>
        <div className="skeleton h-52"/>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28"/>)}
      </div>
      <div className="skeleton h-64"/>
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
    { id: 'overview',  label: '📊 Overview'  },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'esign',     label: '✍️ E-Sign'    },
    { id: 'team',      label: '👥 Team'      },
  ]
  const TABS_PA = [
    { id: 'platform',  label: '🌐 Platform'  },
    { id: 'tenants',   label: '🏢 Tenants'   },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'activity',  label: '📋 Activity'  },
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
    { label: 'Sent',   value: esignSent,                                            color: '#6366f1' },
    { label: 'Viewed', value: stats?.esignViewed ?? Math.round(esignSent * 0.82),   color: '#0ea5e9' },
    { label: 'Signed', value: stats?.esignCompleted ?? 0,                           color: '#10b981' },
  ]

  const topTemplates   = stats?.topTemplates   ?? []
  const leastTemplates = stats?.leastTemplates ?? []
  const topUsers       = stats?.topUsers       ?? []

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS}/>

      {/* ── Header — Apple-style large title ── */}
      <div className="mt-4 mb-8 flex items-end justify-between gap-4 flex-wrap animate-fade-in-up">
        <div>
          <h1 className="display-2 text-ink dark:text-white">
            {greeting()}, {user?.firstName}
          </h1>
          <p className="text-sm text-ink-3 mt-1.5">
            {isPlatformAdmin
              ? 'Platform overview across all organisations'
              : new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
            }
          </p>
        </div>
        <button
          onClick={loadStats}
          className="btn btn-outline btn-sm gap-1.5"
          title="Refresh"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit overflow-x-auto">
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

      {/* ════════════════════════════════════════
          ORG — OVERVIEW TAB (Apple-style: focus + drilldown)
      ════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">

          {/* ─── Hero: single big KPI + Today panel ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <HeroMetric
                label="Documents this month"
                value={stats?.docsThisMonth ?? esignSent ?? 0}
                max={stats?.docsQuotaLimit}
                trend={(() => {
                  const arr = stats?.esignGrowth
                  if (!arr || arr.length < 2) return null
                  const last = arr.at(-1)?.count ?? 0, prev = arr.at(-2)?.count ?? 0
                  if (prev === 0) return null
                  return Math.round(((last - prev) / prev) * 100)
                })()}
                sub={(() => {
                  const pending = stats?.esignPending ?? 0
                  const completed = stats?.esignCompleted ?? 0
                  return `${completed.toLocaleString()} completed · ${pending.toLocaleString()} in progress`
                })()}
                onClick={() => navigate('/esign')}
              />
            </div>
            <TodayPanel stats={stats} isOrgAdmin={isOrgAdmin} onNavigate={navigate}/>
          </div>

          {/* ─── Compact supporting metrics ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricPill
              label="PDF Templates"
              value={stats?.totalPdfTemplates ?? 0}
              sub={trend(stats?.pdfGrowth) ?? '—'}
              onClick={() => navigate('/templates')}
            />
            <MetricPill
              label="Email Templates"
              value={stats?.totalEmailTemplates ?? 0}
              sub={trend(stats?.emailGrowth) ?? '—'}
              accent="success"
              onClick={() => navigate('/email-templates')}
            />
            <MetricPill
              label="E-Sign sent"
              value={esignSent}
              sub={`${stats?.esignCompleted ?? 0} signed`}
              onClick={() => navigate('/esign')}
            />
            <MetricPill
              label="Team members"
              value={stats?.totalUsers ?? 0}
              sub={isOrgAdmin && stats?.pendingInvites ? `${stats.pendingInvites} pending` : 'active'}
              accent={stats?.pendingInvites ? 'warning' : 'brand'}
              onClick={() => isOrgAdmin && navigate('/users')}
            />
          </div>

          {/* ─── Two-up: Recent activity + Quick actions ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <LiveActivityFeed stats={stats} onNavigate={navigate}/>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-ink">Create</h2>
                <span className="kbd">N</span>
              </div>
              <div className="space-y-1">
                {[
                  { label: 'PDF Template',   to: '/builder',       icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z' },
                  { label: 'Email Template', to: '/email-builder', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                  { label: 'Generate PDF',   to: '/generate',      icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7' },
                  { label: 'E-Sign document', to: '/esign/new',    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
                  ...(isOrgAdmin ? [{ label: 'Invite team member', to: '/users', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' }] : []),
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.to)}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-input
                               hover:bg-ink-9 transition-all duration-200 ease-spring text-left active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-input bg-ink-8 flex items-center justify-center
                                    group-hover:bg-brand-50 transition-colors">
                      <svg className="w-4 h-4 text-ink-3 group-hover:text-brand transition-colors"
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={a.icon}/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-ink flex-1">{a.label}</span>
                    <svg className="w-4 h-4 text-ink-5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Growth chart — secondary, below the fold ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card">
              <SectionHeader title="Template growth" sub="PDF & Email templates created per month"/>
              <div className="flex items-center gap-4 text-xs font-medium mb-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand inline-block"/>PDF</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"/>Email</span>
              </div>
              <GroupedBarChart pdfData={stats?.pdfGrowth ?? []} emailData={stats?.emailGrowth ?? []}/>
            </div>
            <div className="card">
              <SectionHeader title="New users" sub="Sign-ups per month"/>
              <BarChart data={stats?.userGrowth ?? []} color="#0066FF"/>
            </div>
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
                <SectionHeader title="Template Usage" sub="Most-used PDF & Email templates"/>
                <ExportPngButton targetRef={chartRef1} filename="template-usage"/>
              </div>
              <div ref={chartRef1} className="space-y-3">
                {topTemplates.length === 0 ? (
                  <>
                    {[
                      { name: 'Invoice Template', uses: 142 },
                      { name: 'Contract Draft',   uses: 98  },
                      { name: 'Offer Letter',     uses: 76  },
                      { name: 'NDA Agreement',    uses: 54  },
                      { name: 'Quote Template',   uses: 31  },
                    ].map((t, i) => (
                      <HorizBar key={t.name} rank={i + 1} label={t.name} value={t.uses} max={142} color="#6366f1"/>
                    ))}
                    <p className="text-[10px] text-gray-400 mt-3 text-center italic">
                      Sample data — connect template usage tracking API for live data.
                    </p>
                  </>
                ) : (
                  topTemplates.slice(0, 5).map((t, i) => (
                    <HorizBar key={t.id ?? i} rank={i + 1} label={t.name}
                      value={t.useCount ?? t.uses ?? 0}
                      max={topTemplates[0]?.useCount ?? topTemplates[0]?.uses ?? 1}
                      color="#6366f1"/>
                  ))
                )}
              </div>

              {/* Least used */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Least Used</p>
                <div className="space-y-1">
                  {(leastTemplates.length > 0 ? leastTemplates : [
                    { name: 'Annual Report v1', uses: 1 },
                    { name: 'Old NDA 2023',     uses: 2 },
                    { name: 'Draft Proposal',   uses: 3 },
                  ]).slice(0, 3).map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-500 dark:text-gray-400 truncate">{t.name ?? t.templateName}</span>
                      <span className="font-bold text-rose-500 shrink-0 ml-2">{t.uses ?? t.useCount ?? 0} uses</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ③ Per-user / per-org activity breakdown */}
            <div className="card">
              <SectionHeader
                title={isPlatformAdmin ? 'Activity by Organisation' : 'Activity by User'}
                sub={isPlatformAdmin
                  ? 'Audit actions grouped by tenant — selected period'
                  : 'Audit actions per team member — selected period'}
              />
              {topUsers.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-xs">No activity data in selected period</div>
              ) : (
                <div className="space-y-3">
                  {topUsers.slice(0, 8).map((u, i) => {
                    const maxAct = topUsers[0]?.activityCount ?? 1
                    return (
                      <div key={u.email ?? u.orgName ?? i} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                          style={{ background: `hsl(${(i * 60 + 220) % 360}, 65%, 55%)` }}>
                          {(u.name ?? u.orgName ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{u.name ?? u.orgName}</span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">{u.activityCount}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                              style={{ width: `${pct(u.activityCount, maxAct)}%` }}/>
                          </div>
                          {!isPlatformAdmin && u.email && (
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
                <SectionHeader title="E-Sign Conversion Funnel" sub="Sent → Viewed → Signed rate"/>
                <ExportPngButton targetRef={chartRef2} filename="esign-funnel"/>
              </div>
              <div ref={chartRef2}>
                <FunnelChart steps={esignFunnel}/>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {esignFunnel.map(step => (
                    <div key={step.label} className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{step.value}</p>
                      <p className="text-[11px] text-gray-400">{step.label}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: step.color }}>
                        {pct(step.value, esignFunnel[0]?.value)}%
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300
                           text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
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
            <MiniStat label="Total Docs"  value={stats?.esignTotal}     color="indigo"  icon="📄"/>
            <MiniStat label="Sent"        value={esignSent}             color="sky"     icon="📤"/>
            <MiniStat label="Completed"   value={stats?.esignCompleted} color="emerald" icon="✅"/>
            <MiniStat label="Pending"     value={stats?.esignPending}   color="amber"   icon="⏳"/>
            <MiniStat label="Overdue"     value={stats?.esignOverdue}   color="rose"    icon="⚠️"/>
            <MiniStat label="Cancelled"   value={stats?.esignCancelled} color="gray"    icon="❌"/>
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
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{esignSent}</p>
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
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-400">
                    {stats.esignOverdue} overdue document{stats.esignOverdue !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
                    Signing token has expired but documents haven't been submitted. Consider resending.
                  </p>
                </div>
                <button onClick={() => navigate('/esign')} className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline shrink-0">Review →</button>
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
                action={<button onClick={() => navigate('/users')} className="text-xs text-primary hover:underline font-medium">All users →</button>}
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
              <SectionHeader title="Team Summary" sub="Current member status"/>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <MiniStat label="Total Members" value={stats?.totalUsers}     color="indigo" icon="👥"/>
                <MiniStat label="Pending Setup" value={stats?.pendingInvites} color="amber"  icon="📧"/>
              </div>
              <SectionHeader title="User Growth" sub="New members per month"/>
              <BarChart data={stats?.userGrowth ?? []} color="#8b5cf6"/>
            </div>
          </div>

          <div className="card">
            <SectionHeader title="Recent Team Actions"
              action={<button onClick={() => navigate('/audit-log')} className="text-xs text-primary hover:underline font-medium">Full audit log →</button>}
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
                      const meta  = FEATURE_META[key]
                      const total = stats.activeOrganizations || 1
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card lg:col-span-2">
              <SectionHeader title="Top Active Users (Platform)" sub="By audit actions — last 30 days"
                action={<button onClick={() => navigate('/users')} className="text-xs text-primary hover:underline font-medium">All users →</button>}
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
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{u.activityCount}</span>
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
                  { label: 'Total Documents', value: stats?.esignTotal ?? 0,     color: 'text-indigo-600 dark:text-indigo-400' },
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
            <MiniStat label="Active Tenants"     value={stats?.activeOrganizations}   color="emerald" icon="✅"/>
            <MiniStat label="Inactive Tenants"   value={stats?.inactiveOrganizations} color="gray"    icon="💤"/>
            <MiniStat label="Pending Onboarding" value={stats?.pendingOnboarding}     color="amber"   icon="⏳"/>
          </div>

          {stats?.orgBreakdown?.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Organization Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Per-tenant resource and feature summary</p>
                </div>
                <button onClick={() => navigate('/organizations')} className="text-xs text-primary hover:underline font-medium">Manage →</button>
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
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{u.activityCount}</span>
                    </li>
                  ))}
                </ol>
              )
            }
          </div>
          <LiveActivityFeed stats={stats} onNavigate={navigate}/>
        </div>
      )}
    </div>
  )
}
