import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getQuotaConfig, getUsageHistory } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import QuotaProgressBar from '../components/ui/QuotaProgressBar'
import PlanBadge from '../components/ui/PlanBadge'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Usage & Quotas' },
]

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function fmtMonth(year, month) {
  return `${MONTH_LABELS[month - 1]} ${year}`
}

/** Micro bar-chart row for usage history */
function UsageHistoryChart({ history, field, label, color = '#6366f1', unit = '' }) {
  if (!history?.length) return null
  const max = Math.max(...history.map(h => h[field] || 0), 1)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-end gap-1.5 h-20">
        {history.map((h, i) => {
          const val = h[field] || 0
          const pct = Math.round((val / max) * 100)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full rounded-t-sm transition-all duration-300 relative"
                style={{ height: `${Math.max(pct, 4)}%`, background: color, opacity: 0.8 }}
                title={`${fmtMonth(h.year, h.month)}: ${val.toLocaleString()}${unit}`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                                pointer-events-none opacity-0 group-hover:opacity-100
                                bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded-lg
                                whitespace-nowrap z-10 transition-opacity">
                  {val.toLocaleString()}{unit}
                </div>
              </div>
              <span className="text-[9px] text-gray-400 writing-mode-vertical hidden sm:block truncate w-full text-center">
                {MONTH_LABELS[(h.month - 1) % 12]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function UsagePage() {
  useDocumentTitle('Usage & Quotas')
  const { user } = useAuth()
  const toast    = useToast()

  const orgId = user?.organizationId

  const [config,  setConfig]  = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    Promise.all([
      getQuotaConfig(orgId),
      getUsageHistory(orgId),
    ])
      .then(([cfg, hist]) => {
        setConfig(cfg)
        // Show last 6 months, oldest first
        setHistory([...hist].reverse().slice(0, 6))
      })
      .catch(err => toast.error(err.message || 'Could not load usage data.'))
      .finally(() => setLoading(false))
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading usage data…
      </div>
    )
  }

  const now = new Date()
  const currentLabel = `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Usage &amp; Quotas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your organisation's resource consumption and current limits.
          </p>
        </div>
        {config?.plan && (
          <PlanBadge plan={config.plan} size="md" />
        )}
      </div>

      {/* ── Current month quotas ── */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            Current Month — {currentLabel}
          </h2>
          {config?.plan && (
            <span className="text-[11px] text-gray-400">
              Plan: <span className="font-semibold text-gray-600 dark:text-gray-300">{config.plan}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <QuotaProgressBar
            label="Users"
            current={config?.currentUsers ?? 0}
            limit={config?.maxUsers ?? -1}
          />
          <QuotaProgressBar
            label="Documents / month"
            current={config?.currentDocs ?? 0}
            limit={config?.maxDocsPerMonth ?? -1}
          />
          <QuotaProgressBar
            label="Storage"
            current={config?.currentStorageMb ?? 0}
            limit={config?.maxStorageMb ?? -1}
            unit=" MB"
          />
          <QuotaProgressBar
            label="API calls / month"
            current={config?.currentApiCalls ?? 0}
            limit={config?.maxApiCallsPerMonth ?? -1}
          />
        </div>

        {/* Upgrade nudge — shown when any quota ≥ 80% */}
        {config && [
          { current: config.currentUsers,      limit: config.maxUsers,           },
          { current: config.currentDocs,        limit: config.maxDocsPerMonth,   },
          { current: config.currentStorageMb,   limit: config.maxStorageMb,      },
          { current: config.currentApiCalls,    limit: config.maxApiCallsPerMonth},
        ].some(q => q.limit > 0 && q.current / q.limit >= 0.8) && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-amber-50 dark:bg-amber-900/20
                          border border-amber-200 dark:border-amber-700">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              You're approaching one or more quota limits. Contact your platform administrator to upgrade your plan.
            </p>
          </div>
        )}
      </div>

      {/* ── Usage history chart ── */}
      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-6">
            Usage History — last {history.length} months
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <UsageHistoryChart
              history={history}
              field="docsGenerated"
              label="PDFs generated"
              color="#6366f1"
            />
            <UsageHistoryChart
              history={history}
              field="esignSent"
              label="E-Sign documents sent"
              color="#8b5cf6"
            />
            <UsageHistoryChart
              history={history}
              field="storageMb"
              label="Storage used"
              color="#10b981"
              unit=" MB"
            />
            <UsageHistoryChart
              history={history}
              field="apiCalls"
              label="API calls"
              color="#f59e0b"
            />
          </div>

          {/* Raw table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">Month</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold">PDFs</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold">E-Sign</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold">Storage (MB)</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold">API Calls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...history].reverse().map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                      {fmtMonth(h.year, h.month)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {(h.docsGenerated || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {(h.esignSent || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {(h.storageMb || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {(h.apiCalls || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
