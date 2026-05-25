/**
 * EmptyState — friendly, illustrated empty state component.
 *
 * Variants ship with custom inline SVG illustrations (no external deps).
 * The illustration gently bobs with a CSS animation for a touch of life.
 *
 * Usage:
 *   <EmptyState
 *     variant="documents"
 *     title="No PDF templates yet"
 *     description="Create your first template to get started."
 *     action={{ label: 'New template', onClick: () => navigate('/builder') }}
 *   />
 */

const ILLUSTRATIONS = {
  documents: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <defs>
        <linearGradient id="doc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E6F0FF"/>
          <stop offset="100%" stopColor="#BFD9FF"/>
        </linearGradient>
      </defs>
      {/* Back card */}
      <rect x="55" y="35" width="80" height="100" rx="8" fill="#F5F5F7" stroke="#E5E5E7" strokeWidth="2"/>
      {/* Front card */}
      <rect x="40" y="50" width="80" height="100" rx="8" fill="url(#doc-grad)" stroke="#0066FF" strokeWidth="2"/>
      {/* Lines */}
      <rect x="52" y="65" width="44" height="4" rx="2" fill="#0066FF" opacity="0.5"/>
      <rect x="52" y="78" width="56" height="3" rx="1.5" fill="#0066FF" opacity="0.3"/>
      <rect x="52" y="88" width="52" height="3" rx="1.5" fill="#0066FF" opacity="0.3"/>
      <rect x="52" y="98" width="48" height="3" rx="1.5" fill="#0066FF" opacity="0.3"/>
      {/* Plus circle */}
      <circle cx="140" cy="120" r="18" fill="#0066FF"/>
      <path d="M140 113v14M133 120h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  search: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <circle cx="85" cy="75" r="35" fill="#E6F0FF" stroke="#0066FF" strokeWidth="2.5"/>
      <circle cx="85" cy="75" r="22" fill="#fff"/>
      <line x1="110" y1="100" x2="135" y2="125" stroke="#0066FF" strokeWidth="4" strokeLinecap="round"/>
      {/* sparkles */}
      <circle cx="155" cy="40" r="3" fill="#0066FF" opacity="0.4"/>
      <circle cx="40" cy="120" r="3" fill="#0066FF" opacity="0.4"/>
      <circle cx="170" cy="90" r="2" fill="#0066FF" opacity="0.3"/>
    </svg>
  ),

  inbox: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <path d="M40 90 L60 50 H140 L160 90 V125 a8 8 0 01-8 8 H48 a8 8 0 01-8-8 z"
            fill="#F5F5F7" stroke="#E5E5E7" strokeWidth="2"/>
      <path d="M40 90 H75 V100 a5 5 0 005 5 h40 a5 5 0 005-5 v-10 h35"
            fill="#E6F0FF" stroke="#0066FF" strokeWidth="2"/>
    </svg>
  ),

  success: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <circle cx="100" cy="80" r="48" fill="#E6F9EE"/>
      <circle cx="100" cy="80" r="32" fill="#34C759"/>
      <path d="M85 80 L96 92 L116 70" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* confetti */}
      <rect x="40" y="50" width="6" height="2" rx="1" fill="#FF9500" transform="rotate(-20 43 51)"/>
      <rect x="160" y="60" width="6" height="2" rx="1" fill="#0066FF" transform="rotate(30 163 61)"/>
      <circle cx="50" cy="110" r="2.5" fill="#FF3B30"/>
      <circle cx="155" cy="115" r="2.5" fill="#34C759"/>
    </svg>
  ),

  shield: (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <path d="M100 30 L150 50 V90 c0 22 -20 38 -50 50 c-30 -12 -50 -28 -50 -50 V50 z"
            fill="#E6F0FF" stroke="#0066FF" strokeWidth="2.5"/>
      <path d="M82 88 L96 100 L120 76" stroke="#0066FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export default function EmptyState({
  variant = 'documents',
  title,
  description,
  action,
  secondaryAction,
  size = 'default',  // 'default' | 'compact'
}) {
  const illustration = ILLUSTRATIONS[variant] ?? ILLUSTRATIONS.documents
  const compact = size === 'compact'

  return (
    <div className={`flex flex-col items-center justify-center text-center
                     ${compact ? 'py-8' : 'py-16'} px-6`}>
      <div className="animate-float-bob mb-6">
        {illustration}
      </div>

      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-ink tracking-tight`}>
        {title}
      </h3>

      {description && (
        <p className={`${compact ? 'text-sm' : 'text-[15px]'} text-ink-3 mt-2 max-w-sm leading-relaxed`}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
          {action && (
            <button onClick={action.onClick} className="btn btn-primary">
              {action.icon}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className="btn btn-outline">
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
