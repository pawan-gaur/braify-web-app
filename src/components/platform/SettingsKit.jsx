/**
 * Reusable presentational controls for the Platform Settings screens.
 * Pure UI — no business logic. Used by PlatformSecurityPoliciesPage,
 * PlatformUserAccessPage, etc.
 */

/* ── Gradient toggle switch ───────────────────────────────────────────────── */
export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
                  transition-colors duration-200 ease-spring outline-none
                  focus-visible:ring-2 focus-visible:ring-brand/40
                  ${checked ? 'bg-gradient-accent' : 'bg-ink-6 dark:bg-gray-600'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-soft
                        transition-transform duration-200 ease-spring
                        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

/* ── Compact <select> ─────────────────────────────────────────────────────── */
export function SelectField({ value, onChange, options, numeric = false, disabled = false }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(numeric ? Number(e.target.value) : e.target.value)}
      className="rounded-input border border-ink-7 dark:border-gray-600
                 bg-white dark:bg-gray-700 text-ink dark:text-gray-200 text-sm font-medium
                 pl-3 pr-8 py-1.5 outline-none cursor-pointer
                 focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ── A single labelled setting row (label/desc left, control right) ───────── */
export function SettingRow({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink dark:text-gray-100">{title}</p>
        {desc && <p className="text-xs text-ink-4 mt-0.5 leading-snug">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ── A grouped card section with icon header + "Admin only" badge ─────────── */
export function SettingsGroup({ iconPath, title, badge = true, footnote, children }) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-accent grid place-items-center text-white shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={iconPath} /></svg>
          </span>
          <h3 className="text-[15px] font-bold text-ink dark:text-gray-100 tracking-tight">{title}</h3>
        </div>
        {badge && <AdminBadge />}
      </div>
      <div className="divide-y divide-ink-7 dark:divide-gray-700/70">{children}</div>
      {footnote && (
        <p className="flex items-start gap-1.5 text-[11px] text-ink-4 mt-3 pt-3 border-t border-ink-7 dark:border-gray-700/70">
          <svg className="w-3.5 h-3.5 shrink-0 mt-px" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>{footnote}</span>
        </p>
      )}
    </div>
  )
}

/* ── "Admin only" pill ────────────────────────────────────────────────────── */
export function AdminBadge() {
  return (
    <span className="badge badge-brand gap-1 text-[11px]">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Admin only
    </span>
  )
}

/* ── Info banner shown atop a settings detail page ────────────────────────── */
export function InfoBanner({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-input px-4 py-3 mb-6 text-sm
                    bg-brand-50 border border-brand-200 text-brand-700
                    dark:bg-brand-900/20 dark:border-brand-900/40 dark:text-brand-300">
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
      </svg>
      <span className="leading-snug">{children}</span>
    </div>
  )
}
