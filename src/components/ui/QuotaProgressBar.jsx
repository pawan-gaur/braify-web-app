/**
 * Compact quota usage bar.
 *
 * @param {string} label    - e.g. "Users"
 * @param {number} current  - current usage value
 * @param {number} limit    - configured limit (-1 = unlimited)
 * @param {string} unit     - optional unit suffix, e.g. "MB"
 */
export default function QuotaProgressBar({ label, current, limit, unit = '' }) {
  const unlimited = limit === -1 || limit == null
  const pct       = unlimited ? 0 : Math.min(100, Math.round((current / limit) * 100))

  const barColor = unlimited
    ? 'bg-gray-300 dark:bg-gray-600'
    : pct >= 90 ? 'bg-red-500'
    : pct >= 75 ? 'bg-amber-400'
    : 'bg-emerald-500'

  const textColor = unlimited
    ? 'text-ink-4'
    : pct >= 90 ? 'text-red-600 dark:text-red-400 font-semibold'
    : pct >= 75 ? 'text-amber-600 dark:text-amber-400'
    : 'text-gray-600 dark:text-gray-300'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-3 dark:text-gray-400 font-medium">{label}</span>
        <span className={textColor}>
          {unlimited
            ? <span className="text-ink-4 dark:text-gray-500">Unlimited</span>
            : <>{current.toLocaleString()}{unit} / {limit.toLocaleString()}{unit} <span className="text-ink-4">({pct}%)</span></>
          }
        </span>
      </div>
      <div className="h-1.5 w-full bg-ink-8 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: unlimited ? '100%' : `${pct}%`, opacity: unlimited ? 0.3 : 1 }}
        />
      </div>
    </div>
  )
}
