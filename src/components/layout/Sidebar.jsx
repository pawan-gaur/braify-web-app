import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth, ROLES } from '../../context/AuthContext'
import { FEATURES } from '../../config/features'
import { getPendingOnboardingCount } from '../../services/api'
import CommandPalette, { useCommandPalette } from '../ui/CommandPalette'

/* ─────────────────────────────────────────────
   Nav structure — REAL ITEMS ONLY
   "Coming Soon" placeholders removed for a calmer sidebar.
───────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    section: null,
    links: [
      {
        to: '/dashboard', end: true, label: 'Dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    section: 'Documents',
    links: [
      {
        to: '/templates', label: 'PDF Templates',
        feature: FEATURES.PDF_TEMPLATES,
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        to: '/email-templates', label: 'Email Templates',
        feature: FEATURES.EMAIL_TEMPLATES,
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      },
      {
        to: '/esign', end: true, label: 'E-Sign',
        feature: FEATURES.E_SIGN,
        icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
      },
      {
        to: '/files', end: true, label: 'Files',
        feature: FEATURES.FILE_STORAGE,
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      },
      {
        to: '/generate', label: 'Generate PDF',
        feature: FEATURES.PDF_TEMPLATES,
        icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7',
      },
    ],
  },
  {
    section: 'Admin',
    minRole: ROLES.ADMIN,
    links: [
      {
        to: '/organizations', label: 'Organizations',
        minRole: ROLES.PLATFORM_ADMIN,
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        to: '/onboarding-requests', label: 'Onboarding',
        minRole: ROLES.PLATFORM_ADMIN,
        pendingBadge: true,
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h3',
      },
      {
        to: '/users', label: 'Users',
        minRole: ROLES.ADMIN,
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        to: '/sessions', label: 'Sessions',
        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      },
      {
        to: '/shared-templates', label: 'Shared with us',
        icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      },
      {
        to: '/usage', label: 'Usage',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
    ],
  },
  {
    section: 'Settings',
    links: [
      {
        to: '/settings/org-settings', label: 'Organization',
        minRole: ROLES.ADMIN,
        icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      },
      {
        to: '/settings/api-keys', label: 'API Keys',
        minRole: ROLES.ORG_ADMIN,
        icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      },
      {
        to: '/api-docs', label: 'API Docs',
        minRole: ROLES.ADMIN,
        icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      },
      {
        to: '/audit-log', label: 'Audit Log',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      },
    ],
  },
]

/* ── Icon helper ── */
function Icon({ d, className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

/* ── Tooltip wrapper (shown when sidebar is collapsed) ── */
function Tip({ label, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                       whitespace-nowrap rounded-chip px-2.5 py-1.5 text-xs font-semibold
                       bg-ink text-white shadow-float
                       opacity-0 group-hover/tip:opacity-100
                       transition-opacity duration-150 z-[100]">
        {label}
      </span>
    </div>
  )
}

const ROLE_RANK = { PLATFORM_ADMIN: 4, ORG_ADMIN: 3, ADMIN: 2, USER: 1 }

export default function Sidebar() {
  const { collapsed, setCollapsed } = useApp()
  const { user, hasFeature } = useAuth()
  const navigate = useNavigate()
  const [pendingOnboarding, setPendingOnboarding] = useState(0)
  const palette = useCommandPalette()

  // Poll pending onboarding count for PLATFORM_ADMIN
  useEffect(() => {
    if (user?.role !== ROLES.PLATFORM_ADMIN) return
    const fetch = () =>
      getPendingOnboardingCount()
        .then(d => setPendingOnboarding(d.count ?? 0))
        .catch(() => {})
    fetch()
    const interval = setInterval(fetch, 60_000)
    return () => clearInterval(interval)
  }, [user?.role])

  const visibleSections = NAV_SECTIONS
    // Gate section by role
    .filter(s => !s.minRole || (ROLE_RANK[user?.role] ?? 0) >= (ROLE_RANK[s.minRole] ?? 0))
    .map(s => ({
      ...s,
      links: s.links
        // Gate link by role
        .filter(l => !l.minRole || (ROLE_RANK[user?.role] ?? 0) >= (ROLE_RANK[l.minRole] ?? 0))
        // Gate link by feature
        .filter(l => !l.feature || hasFeature(l.feature)),
    }))
    .filter(s => s.links.length > 0)

  const w = collapsed ? 'w-16' : 'w-60'

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen ${w}
                    bg-white dark:bg-sidebar
                    border-r border-ink-7 dark:border-sidebar-border
                    flex flex-col z-50
                    transition-[width] duration-300 ease-spring overflow-hidden`}
      >
        {/* ── Brand + collapse ── */}
        {collapsed ? (
          <div className="flex items-center justify-center py-4 border-b border-ink-7 dark:border-sidebar-border shrink-0">
            <Tip label="Expand sidebar">
              <button
                onClick={() => setCollapsed(false)}
                className="w-9 h-9 flex items-center justify-center rounded-input
                           text-ink-3 dark:text-sidebar-muted
                           hover:text-brand dark:hover:text-white
                           hover:bg-brand-50 dark:hover:bg-sidebar-hover
                           transition-colors duration-150"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                </svg>
              </button>
            </Tip>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-ink-7 dark:border-sidebar-border shrink-0">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-input bg-brand flex items-center justify-center shrink-0
                         hover:bg-brand-hover transition-colors duration-200"
              title="Home"
            >
              <span className="text-white text-sm font-bold">B</span>
            </button>
            <span className="flex-1 font-semibold text-ink dark:text-white tracking-tight">
              Braify
            </span>
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse"
              className="w-7 h-7 flex items-center justify-center rounded-chip shrink-0
                         text-ink-4 hover:text-ink hover:bg-ink-8
                         dark:text-sidebar-muted dark:hover:bg-sidebar-hover
                         transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── ⌘K Search trigger ── */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          {collapsed ? (
            <Tip label="Search (⌘K)">
              <button
                onClick={palette.openPalette}
                className="w-9 h-9 mx-auto flex items-center justify-center rounded-input
                           text-ink-3 hover:text-brand hover:bg-brand-50
                           dark:text-sidebar-muted dark:hover:bg-sidebar-hover
                           transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
            </Tip>
          ) : (
            <button
              onClick={palette.openPalette}
              className="group w-full flex items-center gap-2 px-2.5 py-2 rounded-input
                         border border-ink-7 dark:border-sidebar-border
                         bg-ink-9 dark:bg-sidebar-hover
                         text-ink-4 dark:text-sidebar-muted
                         hover:border-ink-6 hover:text-ink-3
                         transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span className="flex-1 text-left text-[13px]">Search…</span>
              <kbd className="kbd">⌘K</kbd>
            </button>
          )}
        </div>

        {/* ── Scrollable nav ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-2 sidebar-scroll">
          {visibleSections.map(({ section, links }, si) => (
            <div key={si}>
              {section && !collapsed && (
                <p className="text-ink-4 dark:text-sidebar-label
                              text-[10px] font-semibold uppercase tracking-[0.12em]
                              px-3 py-1.5 mb-0.5 select-none">
                  {section}
                </p>
              )}
              {section && collapsed && si > 0 && (
                <div className="my-2 mx-3 border-t border-ink-7 dark:border-sidebar-border/60" />
              )}

              <ul className="list-none m-0 p-0 space-y-0.5">
                {links.map((link) => (
                  <RealItem
                    key={link.to}
                    link={link}
                    collapsed={collapsed}
                    badge={link.pendingBadge ? pendingOnboarding : 0}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer — Profile pinned to bottom ── */}
        <div className="border-t border-ink-7 dark:border-sidebar-border shrink-0">
          <button
            onClick={() => navigate('/profile')}
            className={`group w-full flex items-center gap-2.5 px-3 py-3
                        hover:bg-ink-9 dark:hover:bg-sidebar-hover transition-colors
                        ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0
                            text-white text-xs font-bold shadow-soft">
              {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-ink dark:text-white truncate leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-ink-4 dark:text-sidebar-muted truncate">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            )}
            {!collapsed && (
              <svg className="w-4 h-4 text-ink-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* ── Command Palette (global) ── */}
      <CommandPalette open={palette.open} onClose={palette.close} />
    </>
  )
}

/* ── Real NavLink item ── */
function RealItem({ link, collapsed, badge = 0 }) {
  const { to, end, label, icon } = link
  const inner = ({ isActive }) => (
    <span className={`flex items-center gap-3 px-2.5 py-2 rounded-input text-[13px] font-medium
                      transition-all duration-200 ease-spring w-full
                      ${isActive
                        ? 'bg-brand text-white shadow-soft'
                        : 'text-ink-2 hover:text-ink hover:bg-ink-9 dark:text-sidebar-muted dark:hover:text-white dark:hover:bg-sidebar-hover'
                      }
                      ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={`shrink-0 w-[18px] h-[18px] relative
        ${isActive ? 'text-white' : 'text-ink-4 dark:text-sidebar-label'}`}>
        <Icon d={icon} />
        {collapsed && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full
                           bg-warning text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                          flex items-center justify-center shrink-0
                          ${isActive ? 'bg-white/30 text-white' : 'bg-warning text-white'}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
  )

  if (collapsed) {
    return (
      <li>
        <Tip label={label}>
          <NavLink to={to} end={end} className="block">{inner}</NavLink>
        </Tip>
      </li>
    )
  }
  return (
    <li>
      <NavLink to={to} end={end} className="block">{inner}</NavLink>
    </li>
  )
}
