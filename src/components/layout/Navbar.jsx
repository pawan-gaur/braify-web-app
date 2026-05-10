import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp }  from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

/* ── Avatar component — shows profile picture or initials ─────────────── */
function UserAvatar({ user, size = 'sm' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  if (user?.profilePicture) {
    return <img src={user.profilePicture} alt="" className={`${s} rounded-full object-cover shrink-0`} />
  }
  const init = `${(user?.firstName?.[0] ?? '').toUpperCase()}${(user?.lastName?.[0] ?? '').toUpperCase()}` || 'U'
  return (
    <div className={`${s} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
      {init}
    </div>
  )
}

/* ── Role badge styling ─────────────────────────────────────────────────── */
const ROLE_META = {
  PLATFORM_ADMIN: { label: 'Platform Admin', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  ORG_ADMIN:      { label: 'Org Admin',      cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ADMIN:          { label: 'Admin',          cls: 'bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-400'    },
  USER:           { label: 'User',           cls: 'bg-gray-100   text-gray-600   dark:bg-gray-700      dark:text-gray-300'   },
}

/* ── Notification items (demo) ─────────────────────────────────────────── */
const DEMO_NOTIFS = [
  { id: 1, text: 'Invoice Template was updated',   time: '2 min ago',  read: false },
  { id: 2, text: 'PDF generated: Q1 Report.pdf',   time: '1 hr ago',   read: false },
  { id: 3, text: 'New template shared with you',   time: '3 hrs ago',  read: true  },
  { id: 4, text: 'Contract Template exported',     time: 'Yesterday',  read: true  },
]

export default function Navbar() {
  const { collapsed, darkMode, setDarkMode } = useApp()
  const { user, logout }                     = useAuth()
  const navigate                             = useNavigate()

  const [search,      setSearch]      = useState('')
  const [showNotif,   setShowNotif]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifs,      setNotifs]      = useState(DEMO_NOTIFS)
  const [signingOut,  setSigningOut]  = useState(false)

  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  const unread    = notifs.filter(n => !n.read).length
  const leftCls   = collapsed ? 'left-16' : 'left-56'
  const roleMeta  = ROLE_META[user?.role] ?? ROLE_META.USER
  const fullName  = user ? `${user.firstName} ${user.lastName}`.trim() : 'User'
  const shortName = user?.firstName || 'User'

  /* Close dropdowns on outside click */
  useEffect(() => {
    function onMouseDown(e) {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  const handleSignOut = async () => {
    setSigningOut(true)
    try { await logout() } finally { navigate('/', { replace: true }) }
  }

  return (
    <header className={`fixed top-0 right-0 ${leftCls} z-40 h-14
                        flex items-center gap-3 px-4
                        bg-white dark:bg-gray-900
                        border-b border-gray-200 dark:border-gray-700
                        shadow-sm transition-[left] duration-300`}>

      {/* ── Search bar ── */}
      <div className="flex-1 max-w-xl relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates, PDFs…"
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm
                     bg-gray-50 dark:bg-gray-800
                     border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200
                     placeholder-gray-400 dark:placeholder-gray-500
                     outline-none focus:border-primary focus:ring-2 focus:ring-primary/10
                     transition-all duration-150"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-1 ml-auto shrink-0">

        {/* Dark / Light toggle */}
        <button onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5"/>
              <path strokeLinecap="round"
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159
                   c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full
                               bg-rose-500 ring-2 ring-white dark:ring-gray-900"/>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 z-50
                            bg-white dark:bg-gray-800 rounded-2xl shadow-xl
                            border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="divide-y divide-gray-50 dark:divide-gray-700 max-h-72 overflow-y-auto">
                {notifs.map(n => (
                  <li key={n.id} className={`flex items-start gap-3 px-4 py-3 transition-colors
                                             ${n.read ? 'bg-white dark:bg-gray-800' : 'bg-indigo-50/60 dark:bg-indigo-900/20'}`}>
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
                <button className="text-xs text-primary hover:underline font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"/>

        {/* Profile avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Profile"
          >
            <UserAvatar user={user} />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                {shortName}
              </p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleMeta.cls}`}>
                {roleMeta.label}
              </span>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-400 hidden sm:block" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 z-50
                            bg-white dark:bg-gray-800 rounded-2xl shadow-xl
                            border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">

              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5 mb-1">
                  <UserAvatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleMeta.cls}`}>
                    {roleMeta.label}
                  </span>
                  {user?.organizationName && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                      {user.organizationName}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <ul className="py-1">
                {[
                  { label: 'My Profile',  to: '/profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                ].map(({ label, icon, to }) => (
                  <li key={label}>
                    <button
                      onClick={() => { if (to) { navigate(to); setShowProfile(false) } }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                 text-gray-600 dark:text-gray-300
                                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon}/>
                      </svg>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Sign out */}
              <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                             text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20
                             disabled:opacity-50 transition-colors text-left"
                >
                  {signingOut ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
                           a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                  )}
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
