/** Shared labels / helpers for the Platform Admin support-ticket pages. */

export const TICKET_STATUSES = [
  { value: 'OPEN',        label: 'Open',        cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',       dot: 'bg-rose-500' },
  { value: 'IN_PROGRESS', label: 'In progress', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',   dot: 'bg-amber-500' },
  { value: 'RESOLVED',    label: 'Resolved',    cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',   dot: 'bg-green-500' },
  { value: 'IGNORED',     label: 'Ignored',     cls: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',   dot: 'bg-slate-400' },
]
export const STATUS_META = Object.fromEntries(TICKET_STATUSES.map(s => [s.value, s]))

/** List tabs → the `status` query the backend takes (comma-separated). */
export const TICKET_TABS = [
  { value: 'active',      label: 'Needs attention', status: 'OPEN,IN_PROGRESS', counts: ['OPEN', 'IN_PROGRESS'] },
  { value: 'OPEN',        label: 'Open',            status: 'OPEN',             counts: ['OPEN'] },
  { value: 'IN_PROGRESS', label: 'In progress',     status: 'IN_PROGRESS',      counts: ['IN_PROGRESS'] },
  { value: 'RESOLVED',    label: 'Resolved',        status: 'RESOLVED',         counts: ['RESOLVED'] },
  { value: 'IGNORED',     label: 'Ignored',         status: 'IGNORED',          counts: ['IGNORED'] },
  { value: 'all',         label: 'All',             status: '',                 counts: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'IGNORED'] },
]

export function tabStatus(tab) {
  return (TICKET_TABS.find(t => t.value === tab) ?? TICKET_TABS[0]).status
}

export function tabCount(tab, counts) {
  const t = TICKET_TABS.find(x => x.value === tab)
  if (!t || !counts) return null
  return t.counts.reduce((sum, s) => sum + (Number(counts[s]) || 0), 0)
}

/** "java.lang.NullPointerException" → "NullPointerException" */
export function shortType(type) {
  if (!type) return ''
  const i = type.lastIndexOf('.')
  return i >= 0 ? type.slice(i + 1) : type
}

export const ACTOR_LABEL = {
  USER: 'User', SIGNER: 'Signer', API_KEY: 'API key', SYSTEM: 'System', ANONYMOUS: 'Anonymous',
}

/** A reference code the user was shown, e.g. ERR-7F3K2Q (case-insensitive). */
export function isReference(text) {
  return /^ERR-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(String(text || '').trim().toUpperCase())
}

export const ROLE_LABEL = { PLATFORM_ADMIN: 'Platform Admin', ORG_ADMIN: 'Org Admin', ADMIN: 'Admin', USER: 'User' }
