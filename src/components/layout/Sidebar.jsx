import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth, ROLES } from '../../context/AuthContext'

/* ─────────────────────────────────────────────
   Nav structure
   real      → renders as <NavLink>
   dummy     → renders as <button> with "Soon" chip
   minRole   → only shown when user role >= this value
───────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    section: null,
    links: [
      {
        to: '/', end: true, label: 'Dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    section: 'Templates',
    links: [
      {
        to: '/templates', end: true, label: 'All Templates',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        to: '/builder', label: 'New Template',
        icon: 'M12 4v16m8-8H4',
      },
      {
        dummy: true, label: 'My Templates',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      },
      {
        dummy: true, label: 'Favourites',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      },
    ],
  },
  {
    section: 'Email',
    links: [
      {
        to: '/email-templates', label: 'Email Templates',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      },
      {
        to: '/email-builder', label: 'New Email',
        icon: 'M12 4v16m8-8H4',
      },
      {
        dummy: true, label: 'Send Email',
        icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
      },
      {
        dummy: true, label: 'Email Analytics',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
    ],
  },
  {
    section: 'E-Sign',
    links: [
      {
        to: '/esign', end: true, label: 'Documents',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        to: '/esign/new', label: 'New Document',
        icon: 'M12 4v16m8-8H4',
      },
    ],
  },
  {
    section: 'Generate',
    links: [
      {
        to: '/generate', label: 'Generate PDF',
        icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7',
      },
      {
        dummy: true, label: 'Batch Export',
        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
      },
      {
        dummy: true, label: 'Schedule Export',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
    ],
  },
  {
    section: 'Folders',
    links: [
      {
        dummy: true, label: 'Marketing',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        dot: '#f59e0b',
      },
      {
        dummy: true, label: 'Finance',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        dot: '#10b981',
      },
      {
        dummy: true, label: 'HR Documents',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        dot: '#6366f1',
      },
      {
        dummy: true, label: '+ New Folder',
        icon: 'M12 4v16m8-8H4',
        muted: true,
      },
    ],
  },
  {
    section: 'Management',
    minRole: ROLES.ADMIN,
    links: [
      {
        to: '/organizations', label: 'Organizations',
        minRole: ROLES.PLATFORM_ADMIN,
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        to: '/users', label: 'Users',
        minRole: ROLES.ADMIN,
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        to: '/sessions', label: 'Active Sessions',
        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      },
    ],
  },
  {
    section: 'Settings',
    links: [
      {
        to: '/audit-log', label: 'Audit Log',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      },
      {
        to: '/profile', label: 'My Profile',
        icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM19.121 17.804A9.001 9.001 0 0112 3a9 9 0 017.121 14.804z',
      },
      {
        dummy: true, label: 'Help & Support',
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
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
                       whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold
                       bg-gray-900 text-white shadow-lg
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
  const { user } = useAuth()
  const navigate = useNavigate()

  const visibleSections = NAV_SECTIONS
    .filter(s => !s.minRole || (ROLE_RANK[user?.role] ?? 0) >= (ROLE_RANK[s.minRole] ?? 0))
    .map(s => ({
      ...s,
      links: s.links.filter(l => !l.minRole || (ROLE_RANK[user?.role] ?? 0) >= (ROLE_RANK[l.minRole] ?? 0)),
    }))
    .filter(s => s.links.length > 0)

  const w = collapsed ? 'w-16' : 'w-56'

  return (
    <aside
      className={`fixed left-0 top-0 h-screen ${w}
                  bg-white    dark:bg-sidebar
                  border-r border-gray-200 dark:border-sidebar-border
                  flex flex-col z-50 shadow-sidebar
                  transition-[width] duration-300 overflow-hidden`}
    >
      {/* ── Brand row ── */}
      {collapsed ? (
        <div className="flex items-center justify-center py-4
                        border-b border-gray-200 dark:border-sidebar-border shrink-0">
          <Tip label="Expand sidebar">
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="w-9 h-9 flex items-center justify-center rounded-xl
                         text-gray-400 dark:text-sidebar-muted
                         hover:text-indigo-600 dark:hover:text-white
                         hover:bg-indigo-50 dark:hover:bg-sidebar-hover
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
        <div className="flex items-center gap-2 px-3 py-4
                        border-b border-gray-200 dark:border-sidebar-border shrink-0">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                       shadow-glow-sm hover:shadow-glow hover:scale-105 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            title="Home"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </button>

          {/* App name */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white font-bold text-sm leading-tight truncate">
              PDF Builder
            </p>
            <p className="text-gray-400 dark:text-sidebar-muted text-[10px] mt-0.5 truncate">
              Template Studio
            </p>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0
                       text-gray-400 dark:text-sidebar-muted
                       hover:text-indigo-600 dark:hover:text-white
                       hover:bg-indigo-50 dark:hover:bg-sidebar-hover
                       transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── New Template CTA ── */}
      <div className={`px-3 pt-4 pb-2 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <Tip label="New Template">
            <button
              onClick={() => navigate('/builder')}
              className="w-9 h-9 rounded-xl flex items-center justify-center
                         text-white shadow-glow-sm hover:shadow-glow transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </Tip>
        ) : (
          <button
            onClick={() => navigate('/builder')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       text-white text-sm font-bold shadow-glow-sm hover:shadow-glow
                       transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            New Template
          </button>
        )}
      </div>

      {/* ── Scrollable nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-1 sidebar-scroll">
        {visibleSections.map(({ section, links }, si) => (
          <div key={si} className={si > 0 ? 'pt-2' : ''}>
            {/* Section header */}
            {section && !collapsed && (
              <p className="text-gray-400 dark:text-sidebar-label
                            text-[9px] font-bold uppercase tracking-[0.18em]
                            px-3 py-1.5 mb-0.5 select-none">
                {section}
              </p>
            )}
            {section && collapsed && (
              <div className="my-1.5 mx-2 border-t border-gray-200 dark:border-sidebar-border/60" />
            )}

            <ul className="list-none m-0 p-0 space-y-0.5">
              {links.map((link) =>
                link.dummy
                  ? <DummyItem key={link.label} link={link} collapsed={collapsed} />
                  : <RealItem  key={link.to}    link={link} collapsed={collapsed} />
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-sidebar-border shrink-0">
        {collapsed ? (
          <Tip label="PDF Builder v1.0 Beta">
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              </div>
            </div>
          </Tip>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-800 dark:text-white text-[11px] font-semibold leading-tight">
                PDF Builder
              </p>
              <p className="text-gray-400 dark:text-sidebar-muted text-[10px]">v1.0.0 Beta</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ── Real NavLink item ── */
function RealItem({ link, collapsed }) {
  const { to, end, label, icon, dot } = link
  const inner = ({ isActive }) => (
    <span className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13px] font-semibold
                      transition-all duration-200 w-full
                      ${isActive
                        ? 'text-white shadow-glow-sm'
                        : 'text-gray-600 dark:text-sidebar-muted hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-sidebar-hover'
                      }
                      ${collapsed ? 'justify-center' : ''}`}
      style={isActive ? { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' } : {}}
    >
      <span className={`shrink-0 w-[18px] h-[18px] relative
        ${isActive
          ? 'text-white'
          : 'text-gray-400 dark:text-sidebar-label group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
        }`}>
        <Icon d={icon} />
        {dot && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full
                           border border-white dark:border-sidebar"
            style={{ background: dot }} />
        )}
      </span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />}
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
      <NavLink to={to} end={end} className="block group">{inner}</NavLink>
    </li>
  )
}

/* ── Dummy (coming soon) item ── */
function DummyItem({ link, collapsed }) {
  const { label, icon, dot, muted } = link
  const content = (
    <button
      disabled
      className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13px] font-semibold
                  w-full text-left cursor-not-allowed
                  text-gray-300 dark:text-sidebar-muted/60
                  transition-colors
                  ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="shrink-0 w-[18px] h-[18px] relative">
        <Icon d={icon} />
        {dot && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full
                           border border-white dark:border-sidebar"
            style={{ background: dot }} />
        )}
      </span>
      {!collapsed && (
        <>
          <span className={`flex-1 truncate ${muted ? 'text-gray-400 dark:text-sidebar-label' : ''}`}>
            {label}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5
                           bg-gray-100 dark:bg-sidebar-hover
                           text-gray-400 dark:text-sidebar-label
                           rounded-md shrink-0">
            Soon
          </span>
        </>
      )}
    </button>
  )

  if (collapsed) {
    return <li><Tip label={`${label} (coming soon)`}>{content}</Tip></li>
  }
  return <li>{content}</li>
}
