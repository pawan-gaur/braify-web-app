import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { fmtDateTime as fmtDate } from '../../utils/date'
import { IconArrowRight } from '../ui/icons'

/* ─────────────────────────────────────────────────────────────────────────
   Dashboard overview kit — "Lavender dawn" workspace.
   Pipeline band, spark KPIs, needs-attention list, grouped activity feed,
   quick-create grid and a multi-series trend chart. Every piece reads the
   existing /dashboard stats payload; nothing here invents numbers.
───────────────────────────────────────────────────────────────────────── */

const fmt = n => (n == null ? '—' : typeof n === 'string' ? n : Number(n).toLocaleString())

/** "+2 this month" / "−1 vs last month" from a monthly series, or null. */
export function monthDelta(series) {
  if (!series || series.length < 2) return null
  const last = series.at(-1)?.count ?? 0
  const prev = series.at(-2)?.count ?? 0
  const d = last - prev
  if (last === 0 && prev === 0) return null
  if (d === 0) return { text: 'Same as last month', dir: 0 }
  return d > 0
    ? { text: `+${d.toLocaleString()} this month`, dir: 1 }
    : { text: `${d.toLocaleString()} vs last month`, dir: -1 }
}

/* ── Sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ data = [], color = '#6D52E8' }) {
  const gid = useId()
  if (!data.length) return <div className="h-8" />
  const W = 120, H = 32
  const max = Math.max(...data, 1)
  const step = data.length > 1 ? W / (data.length - 1) : W
  const pts = data.map((v, i) => [i * step, H - 3 - (v / max) * (H - 8)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* ── Spark KPI card ────────────────────────────────────────────────────── */
export function SparkKpi({ label, value, series, sub, color = '#6D52E8', onClick }) {
  const delta = monthDelta(series)
  return (
    <button onClick={onClick} disabled={!onClick}
      className="dash-card text-left p-4 flex flex-col gap-1 disabled:cursor-default group">
      <span className="text-[12px] font-medium text-[#625F80] dark:text-gray-400">{label}</span>
      <span className="text-[28px] leading-none font-bold tracking-tight text-[#16143A] dark:text-white tabular-nums">{fmt(value)}</span>
      <Sparkline data={(series ?? []).map(d => d.count)} color={color} />
      <span className={`text-[12px] ${delta?.dir === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#8B88A6] dark:text-gray-500'}`}>
        {sub ?? delta?.text ?? 'No change yet'}
      </span>
    </button>
  )
}

/* ── Pipeline band ─────────────────────────────────────────────────────── */
const STAGE_ICONS = {
  templates: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 5h16M10 10v10',
  pdfs:      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z',
  emails:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  sent:      'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
  viewed:    'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  signed:    'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
}

export function PipelineBand({ stats, esignSent, can, onNavigate }) {
  const stages = [
    can.pdf || can.email ? { key: 'templates', label: 'Templates', value: (stats?.totalPdfTemplates ?? 0) + (stats?.totalEmailTemplates ?? 0), color: '#8B6DF7', to: can.pdf ? '/templates' : '/email-templates' } : null,
    can.pdf   ? { key: 'pdfs',   label: 'PDFs generated', value: stats?.totalPdfsGenerated, color: '#2F5BF0', to: '/generate' } : null,
    can.email ? { key: 'emails', label: 'Emails sent',    value: stats?.totalEmailsSent,    color: '#0ea5e9', to: '/bulk-email' } : null,
    can.esign ? { key: 'sent',   label: 'Sent to sign',   value: esignSent,                 color: '#6D52E8', to: '/esign' } : null,
    can.esign ? { key: 'viewed', label: 'Viewed',         value: stats?.esignViewed,        color: '#0891b2', to: '/esign' } : null,
    can.esign ? { key: 'signed', label: 'Signed',         value: stats?.esignCompleted,     color: '#10b981', to: '/esign' } : null,
  ].filter(Boolean)

  if (!stages.length) return null

  // conversion chip between consecutive e-sign stages
  const conv = (a, b) => (a && a > 0 && b != null ? Math.round((b / a) * 100) : null)

  return (
    <section aria-label="Document pipeline"
      className="dash-band relative overflow-clip rounded-[22px] p-4 md:p-5">
      <div className="flex items-center justify-between mb-3.5 px-0.5">
        <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#6D52E8] dark:text-[#B79CFF]">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-60" />
            <span className="relative w-2 h-2 rounded-full bg-teal-500" />
          </span>
          Your document pipeline
        </span>
        <span className="text-[11px] text-[#8B88A6] dark:text-gray-500">All time</span>
      </div>

      <ol className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr gap-2.5">
        {stages.map((s, i) => {
          const next = stages[i + 1]
          const rate = ['sent', 'viewed'].includes(s.key) && next ? conv(s.value, next.value) : null
          return (
            <li key={s.key} className="relative">
              <button onClick={() => onNavigate(s.to)}
                className="w-full h-full text-left rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-white dark:border-white/10
                           backdrop-blur px-3.5 py-3 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,60,160,0.14)]
                           transition-all duration-300 group">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `${s.color}1a`, color: s.color }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STAGE_ICONS[s.key]} />
                  </svg>
                </span>
                <span className="block text-[22px] leading-none font-bold tracking-tight text-[#16143A] dark:text-white tabular-nums">{fmt(s.value)}</span>
                <span className="block mt-1 text-[12px] text-[#625F80] dark:text-gray-400">{s.label}</span>
              </button>
              {rate != null && (
                <span className="hidden lg:flex absolute z-10 top-1/2 -right-[19px] -translate-y-1/2 items-center justify-center
                                 min-w-[34px] h-5 px-1 rounded-full bg-[#16143A] text-white text-[10px] font-semibold tabular-nums
                                 dark:bg-white dark:text-[#16143A]"
                  title={`${rate}% of ${s.label.toLowerCase()} moved to ${next.label.toLowerCase()}`}>
                  {rate}%
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ── Needs attention ───────────────────────────────────────────────────── */
export function AttentionPanel({ stats, isOrgAdmin, can, onNavigate }) {
  const items = []
  const overdue = stats?.esignOverdue ?? 0
  const pending = Math.max((stats?.esignPending ?? 0) - overdue, 0)
  const invites = stats?.pendingInvites ?? 0
  const quota = stats?.docsQuotaPercent ?? null
  const denied = (stats?.recentActivity ?? []).filter(l => String(l.action ?? '').includes('DENIED')).length

  if (can.esign && overdue > 0)
    items.push({ tone: 'rose', title: `${overdue} e-sign ${overdue === 1 ? 'document is' : 'documents are'} overdue`, action: 'Review', to: '/esign' })
  if (can.esign && pending > 0)
    items.push({ tone: 'violet', title: `${pending} ${pending === 1 ? 'document is' : 'documents are'} awaiting signature`, action: 'View', to: '/esign' })
  if (isOrgAdmin && invites > 0)
    items.push({ tone: 'amber', title: `${invites} team ${invites === 1 ? 'invite hasn’t' : 'invites haven’t'} been accepted`, action: 'Manage', to: '/users' })
  if (quota != null && quota >= 80)
    items.push({ tone: 'amber', title: `You’ve used ${quota}% of this month’s quota`, action: 'Usage', to: '/usage' })
  if (denied > 0)
    items.push({ tone: 'slate', title: `Access denied ×${denied} in recent activity`, action: 'Audit log', to: '/audit-log' })

  const TONE = {
    rose:   'bg-rose-500',
    violet: 'bg-[#6D52E8]',
    amber:  'bg-amber-500',
    slate:  'bg-slate-400',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[15px] font-bold text-[#16143A] dark:text-white">Needs attention</h2>
        <span className="text-[11px] font-semibold text-[#8B88A6]">{items.length || 'None'}</span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 px-3.5 py-3">
          <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          </span>
          <span className="text-[13px] text-emerald-800 dark:text-emerald-300">You’re all caught up — nothing needs you right now.</span>
        </div>
      ) : (
        <ul className="divide-y divide-[#F0ECFA] dark:divide-gray-700/60">
          {items.map(it => (
            <li key={it.title}>
              <button onClick={() => onNavigate(it.to)}
                className="w-full flex items-center gap-3 py-2.5 text-left group">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TONE[it.tone]}`} />
                <span className="flex-1 text-[13.5px] text-[#3A3858] dark:text-gray-300">{it.title}</span>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#6D52E8] dark:text-[#B79CFF]">
                  {it.action}
                  <IconArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Count of attention items, for the greeting subtitle. */
export function attentionCount(stats, isOrgAdmin, can) {
  const overdue = stats?.esignOverdue ?? 0
  const pending = Math.max((stats?.esignPending ?? 0) - overdue, 0)
  const denied = (stats?.recentActivity ?? []).some(l => String(l.action ?? '').includes('DENIED'))
  return [
    can.esign && overdue > 0, can.esign && pending > 0,
    isOrgAdmin && (stats?.pendingInvites ?? 0) > 0,
    (stats?.docsQuotaPercent ?? 0) >= 80, denied,
  ].filter(Boolean).length
}

/* ── Grouped activity feed ─────────────────────────────────────────────── */
const ACTION_TONE = {
  CREATED:  'bg-[#F3F0FF] text-[#5B3FD6] dark:bg-accent-900/30 dark:text-accent-300',
  UPDATED:  'bg-[#EAF1FE] text-[#2447C9] dark:bg-brand-900/30 dark:text-brand-300',
  DELETED:  'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  RESTORED: 'bg-[#F3F0FF] text-[#5B3FD6] dark:bg-accent-900/30 dark:text-accent-300',
  SENT:     'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  SIGNED:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  COMPLETED:'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED:'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}
const actionLabel = a => String(a ?? '').replaceAll('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())

/** Collapse consecutive identical events (same action, target and person) into one row with a count. */
function groupActivity(items) {
  const out = []
  for (const log of items) {
    const key = `${log.action}|${log.templateName}|${log.performedBy}`
    const last = out.at(-1)
    if (last && last.key === key) last.count += 1
    else out.push({ key, log, count: 1 })
  }
  return out
}

export function ActivityFeed({ stats, onNavigate, onRefresh }) {
  const [live, setLive] = useState(false)
  const refreshRef = useRef(onRefresh)
  refreshRef.current = onRefresh

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => refreshRef.current?.(), 30_000)
    return () => clearInterval(id)
  }, [live])

  const groups = useMemo(() => groupActivity(stats?.recentActivity ?? []), [stats])

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[15px] font-bold text-[#16143A] dark:text-white">Recent activity</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setLive(l => !l)} aria-pressed={live}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border transition-colors
              ${live ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                     : 'border-[#E6E1F5] text-[#625F80] dark:border-gray-700 dark:text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-[#C9C4E0]'}`} />
            {live ? 'Live · 30s' : 'Live off'}
          </button>
          <button onClick={() => onNavigate('/audit-log')}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#6D52E8] dark:text-[#B79CFF] hover:underline">
            Full log <IconArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!groups.length ? (
        <p className="text-[13px] text-[#8B88A6] py-6 text-center">No activity yet — create a template to get started.</p>
      ) : (
        <ul className="space-y-1 max-h-[300px] overflow-y-auto pr-1 -mr-1">
          {groups.map(({ key, log, count }, i) => (
            <li key={`${key}-${i}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#F7F5FF] dark:hover:bg-white/[0.03] transition-colors">
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold
                                ${ACTION_TONE[log.action] ?? 'bg-[#F1EEFB] text-[#5A5775] dark:bg-gray-700 dark:text-gray-300'}`}>
                {actionLabel(log.action)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#16143A] dark:text-gray-200 truncate">{log.templateName}</p>
                <p className="text-[11.5px] text-[#8B88A6] dark:text-gray-500 truncate">{log.performedBy} · {fmtDate(log.timestamp)}</p>
              </div>
              {count > 1 && (
                <span className="shrink-0 text-[11px] font-bold text-[#6D52E8] bg-[#F3F0FF] dark:bg-accent-900/30 dark:text-accent-300 rounded-full px-2 py-0.5 tabular-nums">
                  ×{count}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Quick create ──────────────────────────────────────────────────────── */
export function createActions({ can, isOrgAdmin }) {
  return [
    can.pdf   && { label: 'PDF template',   sub: 'Drag-and-drop builder', to: '/builder',       color: '#6D52E8', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z' },
    can.email && { label: 'Email template', sub: 'Branded HTML email',    to: '/email-builder', color: '#0ea5e9', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    can.esign && { label: 'E-sign document', sub: 'Send for signature',   to: '/esign/new',     color: '#0d9488', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    can.pdf   && { label: 'Generate PDF',   sub: 'From a template',       to: '/generate',      color: '#2F5BF0', icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7' },
    isOrgAdmin && { label: 'Invite teammate', sub: 'Add to your org',     to: '/users',         color: '#d97706', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  ].filter(Boolean)
}

export function QuickCreate({ actions, onNavigate }) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-[#16143A] dark:text-white mb-2.5">Quick create</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a, i) => (
          <button key={a.label} onClick={() => onNavigate(a.to)}
            className={`group text-left rounded-xl p-3 border border-transparent hover:border-[#E6E1F5] dark:hover:border-gray-700
                        hover:bg-white dark:hover:bg-white/[0.03] hover:shadow-[0_10px_24px_rgba(76,60,160,0.10)] transition-all
                        ${actions.length % 2 === 1 && i === actions.length - 1 ? 'col-span-2' : ''}`}
            style={{ background: `${a.color}0f` }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105"
              style={{ background: `${a.color}1f`, color: a.color }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d={a.icon} />
              </svg>
            </span>
            <span className="block text-[13px] font-semibold text-[#16143A] dark:text-gray-100">{a.label}</span>
            <span className="block text-[11.5px] text-[#8B88A6] dark:text-gray-500">{a.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── "New" menu for the header ─────────────────────────────────────────── */
export function NewMenu({ actions, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  if (!actions.length) return null
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white
                   shadow-[0_10px_24px_rgba(109,82,232,0.35)] hover:-translate-y-px transition-all"
        style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0,#6D52E8)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeWidth={2.2} d="M12 5v14M5 12h14"/></svg>
        New
      </button>
      {open && (
        <div role="menu"
          className="absolute right-0 mt-2 w-60 z-30 rounded-2xl bg-white dark:bg-gray-800 border border-[#ECE8FA] dark:border-gray-700
                     shadow-[0_24px_60px_rgba(76,60,160,0.18)] p-1.5">
          {actions.map(a => (
            <button key={a.label} role="menuitem" onClick={() => { setOpen(false); onNavigate(a.to) }}
              className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-[#F7F5FF] dark:hover:bg-white/[0.04]">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${a.color}1a`, color: a.color }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                </svg>
              </span>
              <span className="text-[13px] font-medium text-[#16143A] dark:text-gray-100">{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Trend chart (multi-series area/line) ──────────────────────────────── */
/**
 * series: [{ label, color, data: [{ label, count }] }] — all series share the
 * same month labels. Renders smooth lines with a soft area under each, month
 * labels, and a hover column that shows every series' value for that month.
 */
export function TrendChart({ series = [], height = 170, exportRef, emptyText = 'No activity in this period yet' }) {
  const [hover, setHover] = useState(null)
  const labels = series[0]?.data?.map(d => d.label) ?? []
  const n = labels.length
  const all = series.flatMap(s => s.data.map(d => d.count))
  const max = Math.max(...all, 1)
  const empty = all.every(v => !v)
  const W = 600, H = height, PAD_T = 12, PAD_B = 4
  // points sit at the centre of each month column so they line up with the labels
  const x = i => ((i + 0.5) / Math.max(n, 1)) * W
  const y = v => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B)

  const smooth = pts => pts.map((p, i) => {
    if (!i) return `M${p[0]} ${p[1]}`
    const [px, py] = pts[i - 1]
    const cx = (px + p[0]) / 2
    return `C${cx} ${py} ${cx} ${p[1]} ${p[0]} ${p[1]}`
  }).join(' ')

  return (
    <div ref={exportRef} className="relative">
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-2 text-[12px] text-[#625F80] dark:text-gray-400">
          {series.map(s => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      )}
      <div className="relative" style={{ height }}>
        {[0, 0.5, 1].map(f => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-[#ECE8FA] dark:border-gray-700/60"
            style={{ top: PAD_T + f * (H - PAD_T - PAD_B) }} />
        ))}
        {empty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12.5px] text-[#8B88A6] bg-white/80 dark:bg-gray-800/80 rounded-full px-3 py-1 border border-[#ECE8FA] dark:border-gray-700">
              {emptyText}
            </span>
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              {series.map((s, si) => (
                <linearGradient key={si} id={`tc-${si}-${s.color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={s.color} stopOpacity="0.22" />
                  <stop offset="1" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {series.map((s, si) => {
              const pts = s.data.map((d, i) => [x(i), y(d.count)])
              const d = smooth(pts)
              return (
                <g key={s.label}>
                  <path d={`${d} L${x(n - 1)} ${H} L${x(0)} ${H} Z`} fill={`url(#tc-${si}-${s.color.slice(1)})`} />
                  <path d={d} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </g>
              )
            })}
            {hover != null && (
              <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="#C9BDF7" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
        )}

        {/* hover columns + tooltip */}
        {!empty && (
          <div className="absolute inset-0 flex">
            {labels.map((l, i) => (
              <div key={l + i} className="flex-1 relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {hover === i && (
                  <div className={`absolute top-1 z-10 whitespace-nowrap rounded-xl bg-[#16143A] text-white px-2.5 py-1.5 text-[11.5px]
                                   shadow-lg ${i > n / 2 ? 'right-1/2' : 'left-1/2'}`}>
                    <p className="font-semibold mb-0.5">{l}</p>
                    {series.map(s => (
                      <p key={s.label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        {s.label}: <span className="font-semibold tabular-nums">{s.data[i]?.count ?? 0}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex mt-2">
        {labels.map((l, i) => (
          <span key={l + i} className={`flex-1 text-center text-[11px] ${hover === i ? 'text-[#16143A] dark:text-white font-semibold' : 'text-[#A3A0BC]'}`}>{l}</span>
        ))}
      </div>
    </div>
  )
}
