import { METRICS, COMMON_CURRENCIES, PLANS } from '../../utils/invoicing'

/**
 * Edits a price list: plan (defaults only), currency, monthly fee, and per-usage prices with an
 * included allowance. Controlled: `value` / `onChange(next)`.
 */
export default function RateCardEditor({ value, onChange, showPlan = false, currencyLocked = false, disabled = false }) {
  const set = patch => onChange({ ...value, ...patch })
  const setMetric = (key, patch) => onChange({ ...value, metrics: { ...value.metrics, [key]: { ...value.metrics[key], ...patch } } })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {showPlan && (
          <div>
            <label className="form-label" htmlFor="rc-plan">Plan</label>
            <select id="rc-plan" className="form-select" value={value.plan || ''} disabled={disabled}
              onChange={e => set({ plan: e.target.value })}>
              <option value="">Select a plan</option>
              {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="form-label" htmlFor="rc-currency">Currency</label>
          <input id="rc-currency" className="form-input uppercase" list="rc-currencies" maxLength={3}
            value={value.currency || ''} disabled={disabled || currencyLocked}
            title={currencyLocked ? "Uses the organisation's billing currency" : undefined}
            onChange={e => set({ currency: e.target.value.toUpperCase() })} placeholder="USD" />
          <datalist id="rc-currencies">{COMMON_CURRENCIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="form-label" htmlFor="rc-fee">Monthly fee</label>
          <input id="rc-fee" type="number" min="0" step="0.01" className="form-input" disabled={disabled}
            value={value.monthlyFee ?? ''} onChange={e => set({ monthlyFee: e.target.value })} />
          <p className="text-[11px] text-gray-400 mt-1">Prorated by days for partial periods.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 dark:bg-gray-900/40">
              <th className="px-3 py-2">Charge for</th>
              <th className="px-3 py-2 w-40">Price per unit</th>
              <th className="px-3 py-2 w-40">Included / month</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map(m => {
              const v = value.metrics?.[m.key] || { enabled: false, unitPrice: 0, included: 0 }
              return (
                <tr key={m.key} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-1" checked={!!v.enabled} disabled={disabled}
                        onChange={e => setMetric(m.key, { enabled: e.target.checked })} />
                      <span>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{m.label}</span>
                        <span className="block text-[11px] text-gray-400">{m.hint}</span>
                      </span>
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" step="0.000001" className="form-input" aria-label={`${m.label} price per ${m.unit}`}
                        disabled={disabled || !v.enabled} value={v.unitPrice ?? 0}
                        onChange={e => setMetric(m.key, { unitPrice: e.target.value })} />
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">/ {m.unit}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" step="1" className="form-input" aria-label={`${m.label} included per month`}
                      disabled={disabled || !v.enabled} value={v.included ?? 0}
                      onChange={e => setMetric(m.key, { included: e.target.value })} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400">Only usage above the included amount is charged. Unticked items are not charged.</p>
    </div>
  )
}
