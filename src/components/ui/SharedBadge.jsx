/**
 * Small badge shown on template cards that are forks (shared with EDIT permission).
 * Displays a chain-link icon and the source organisation's name.
 *
 * @param {string} sourceOrgName  - name of the org that shared the template
 * @param {string} size           - 'sm' (default) | 'md'
 */
export default function SharedBadge({ sourceOrgName, size = 'sm' }) {
  const px = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[10px] gap-1'
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap
                  bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300
                  ${px}`}
      title={`Shared by ${sourceOrgName}`}
    >
      {/* Chain-link icon */}
      <svg
        className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
      {sourceOrgName}
    </span>
  )
}
