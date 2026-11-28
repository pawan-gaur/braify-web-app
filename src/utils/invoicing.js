/** Shared helpers for invoicing pages. Keep METRICS in sync with BillingMetric.java. */

export const METRICS = [
  { key: 'EMAILS',     label: 'Emails sent',      unit: 'email',    hint: 'Every email incl. CC copies, e-sign and system emails' },
  { key: 'ESIGN_DOCS', label: 'E-sign documents', unit: 'document', hint: 'Documents sent for signature' },
  { key: 'PDFS',       label: 'PDFs generated',   unit: 'PDF',      hint: 'In the app, by API and in bulk' },
  { key: 'SMS',        label: 'SMS sent',         unit: 'SMS',      hint: 'SMS reminders' },
  { key: 'API_CALLS',  label: 'API calls',        unit: 'call',     hint: 'External API calls' },
  { key: 'STORAGE_GB', label: 'Storage',          unit: 'GB',       hint: 'Peak storage in the period' },
  { key: 'USERS',      label: 'Active users',     unit: 'user',     hint: 'Peak active users in the period' },
]

export const PLANS = [
  { value: 'FREE', label: 'Free' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

export const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'INR', 'UGX', 'TZS', 'RWF', 'ZAR', 'NGN', 'AED']

export const PAYMENT_TERMS = [0, 7, 15, 30, 45, 60]

/** "KES 1,234.50" — falls back to plain number formatting for odd codes. */
export function formatMoney(amount, currency) {
  const n = Number(amount ?? 0)
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 6, minimumFractionDigits: 2 }).format(n)
  } catch {
    return `${currency || ''} ${n.toLocaleString(undefined, { maximumFractionDigits: 6 })}`.trim()
  }
}

const iso = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

/** Quick periods (UTC): this month to date, last month. */
export function quickPeriods(now = new Date()) {
  const y = now.getUTCFullYear(), m = now.getUTCMonth()
  return {
    thisMonth: { from: iso(new Date(Date.UTC(y, m, 1))), to: iso(now) },
    lastMonth: { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) },
  }
}

/** Empty price list in the given currency with every metric present but off. */
export function emptyRateCard(currency = 'USD', plan) {
  const metrics = {}
  METRICS.forEach(m => { metrics[m.key] = { enabled: false, unitPrice: 0, included: 0 } })
  return { currency, plan, monthlyFee: 0, metrics }
}

/** Server card → editor state with every metric row present. */
export function toEditable(card) {
  const base = emptyRateCard(card?.currency, card?.plan)
  return { ...base, ...card, metrics: { ...base.metrics, ...(card?.metrics || {}) } }
}

/** Editor state → request body (only enabled metrics, numbers as strings for exact decimals). */
export function toRequest(card) {
  const metrics = {}
  for (const [k, v] of Object.entries(card.metrics || {})) {
    if (v?.enabled) metrics[k] = { enabled: true, unitPrice: String(v.unitPrice ?? 0), included: Number(v.included) || 0 }
  }
  return { ...(card.plan ? { plan: card.plan } : {}), currency: (card.currency || '').trim().toUpperCase(), monthlyFee: String(card.monthlyFee ?? 0), metrics }
}

export const INVOICE_STATUS = {
  DRAFT:   { label: 'Draft',   cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
  ISSUING: { label: 'Issuing', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  ISSUED:  { label: 'Issued',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  PARTIALLY_PAID: { label: 'Partly paid', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
  PAID:    { label: 'Paid',    cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
  OVERDUE: { label: 'Overdue', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  VOID:    { label: 'Void',    cls: 'bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300 line-through' },
}

export const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'MOBILE_MONEY',  label: 'Mobile money' },
  { value: 'CARD',          label: 'Card' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'CASH',          label: 'Cash' },
  { value: 'OTHER',         label: 'Other' },
]

/** Issued and still collectable. */
export const isOpen = status => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(status)

export const REMINDER_LABEL = key => key === 'D-3' ? '3 days before due' : key === 'D0' ? 'On the due date' : `${key.slice(2)} days overdue`

/** Save a downloaded Blob under a file name. */
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "1 Nov 2026 – 30 Nov 2026" from two yyyy-MM-dd strings (UTC). */
export function fmtPeriod(from, to) {
  const f = s => {
    if (!s) return '—'
    const [y, m, d] = s.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }
  return `${f(from)} – ${f(to)}`
}

/** File name for a downloaded invoice (mirrors the backend's naming). */
export function invoiceFileName(inv, suffix = '.pdf') {
  const base = inv?.number || `draft-${inv?.orgName || ''}-${inv?.periodFrom || ''}`
  return base.replace(/[^A-Za-z0-9._-]+/g, '-') + suffix
}
