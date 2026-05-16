const PLAN_STYLES = {
  FREE:         { label: 'Free',         cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  PROFESSIONAL: { label: 'Professional', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  ENTERPRISE:   { label: 'Enterprise',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
}

/**
 * Coloured pill showing the subscription plan tier.
 * @param {string} plan  - FREE | PROFESSIONAL | ENTERPRISE
 * @param {string} size  - 'sm' (default) | 'md'
 */
export default function PlanBadge({ plan, size = 'sm' }) {
  const meta = PLAN_STYLES[plan] || PLAN_STYLES.FREE
  const px   = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
  return (
    <span className={`inline-flex items-center font-bold rounded-full whitespace-nowrap ${px} ${meta.cls}`}>
      {meta.label}
    </span>
  )
}
