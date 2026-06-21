import { fmtDate, fmtRelative } from '../../utils/date'

const FEATURE_BADGE = {
  PDF_TEMPLATES:   { label: 'PDF Templates',   cls: 'bg-brand-100 text-brand-700' },
  EMAIL_TEMPLATES: { label: 'Email Templates', cls: 'bg-sky-100 text-sky-700'       },
  E_SIGN:          { label: 'E-Sign',          cls: 'bg-emerald-100 text-emerald-700' },
}

/**
 * ApiKeyCard — displays a single API key with actions.
 *
 * Props:
 *   apiKey       – key object from backend
 *   onToggle(id) – called when the active toggle is clicked
 *   onRevoke(id) – called when the revoke button is clicked
 *   isToggling   – bool, disables the toggle switch while in-flight
 *   isRevoking   – bool, disables the revoke button while in-flight
 */
export default function ApiKeyCard({ apiKey, onToggle, onRevoke, isToggling = false, isRevoking = false }) {
  const {
    id,
    name,
    keyPrefix,
    allowedFeatures = [],
    active,
    totalCalls = 0,
    lastUsedAt,
    expiresAt,
    createdBy,
    createdAt,
  } = apiKey

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* ── Top row: name + status ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-100 text-base truncate">{name}</p>
          {keyPrefix && (
            <code className="mt-1 inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg font-mono">
              {keyPrefix}…
            </code>
          )}
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0
          ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* ── Feature badges ── */}
      {allowedFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allowedFeatures.map(f => {
            const meta = FEATURE_BADGE[f]
            if (!meta) return null
            return (
              <span key={f} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>
                {meta.label}
              </span>
            )
          })}
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Calls" value={totalCalls.toLocaleString()} />
        <Stat label="Last Used"   value={lastUsedAt ? fmtRelative(lastUsedAt) : 'Never'} />
        <Stat label="Expires"     value={expiresAt  ? fmtDate(expiresAt)       : 'Never'} />
        <Stat label="Created"     value={fmtDate(createdAt)} />
      </div>

      {/* ── Created by ── */}
      {createdBy && (
        <p className="text-xs text-ink-4">
          Created by <span className="font-medium text-gray-600 dark:text-gray-300">{createdBy}</span>
        </p>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-gray-700">
        {/* Toggle switch */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={active}
            disabled={isToggling}
            onClick={() => onToggle && onToggle(id)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
              ${active ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}
              ${isToggling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
              ${active ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isToggling ? 'Updating…' : active ? 'Active' : 'Inactive'}
          </span>
        </label>

        <div className="flex-1" />

        {/* Revoke button */}
        <button
          disabled={isRevoking}
          onClick={() => {
            if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return
            onRevoke && onRevoke(id)
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors
            ${isRevoking
              ? 'border-red-200 text-red-300 cursor-not-allowed'
              : 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400'
            }`}
        >
          {isRevoking ? 'Revoking…' : 'Revoke'}
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-ink-8 dark:bg-gray-700/40 rounded-xl px-3 py-2">
      <p className="text-[10px] text-ink-4 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-0.5 truncate">{value}</p>
    </div>
  )
}
