import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp }  from '../../context/AppContext'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'
import { useAuth } from '../../context/AuthContext'

/* ── Avatar component — shows profile picture or initials ─────────────── */
function UserAvatar({ user, size = 'sm' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  if (user?.profilePicture) {
    return <img src={user.profilePicture} alt="" className={`${s} rounded-full object-cover shrink-0`} />
  }
  const init = `${(user?.firstName?.[0] ?? '').toUpperCase()}${(user?.lastName?.[0] ?? '').toUpperCase()}`
    || (user?.email?.[0] ?? 'U').toUpperCase()
  return (
    <div className={`${s} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: 'linear-gradient(135deg, #2F5BF0 0%, #6D52E8 100%)' }}>
      {init}
    </div>
  )
}

/* ── Role badge styling ─────────────────────────────────────────────────── */
const ROLE_META = {
  PLATFORM_ADMIN: { label: 'Platform Admin', cls: 'bg-accent-100 text-accent-700 dark:bg-accent-700/30 dark:text-accent-400' },
  ORG_ADMIN:      { label: 'Org Admin',      cls: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' },
  ADMIN:          { label: 'Admin',          cls: 'bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-400'    },
  USER:           { label: 'User',           cls: 'bg-gray-100   text-gray-600   dark:bg-gray-700      dark:text-gray-300'   },
  SIGNER:         { label: 'Signer',         cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export default function Navbar() {
  const { collapsed, darkMode, setDarkMode } = useApp()
  const { user, logout, isSigner }           = useAuth()
  const navigate                             = useNavigate()

  const [showProfile, setShowProfile] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  const profileRef = useRef(null)

  const leftCls   = collapsed ? 'left-16' : 'left-60'
  const roleMeta  = ROLE_META[user?.role] ?? ROLE_META.USER
  const fullName  = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User'
  const shortName = user?.firstName || user?.email?.split('@')[0] || 'User'

  /* Close dropdowns on outside click */
  useEffect(() => {
    function onMouseDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])


  const handleSignOut = async () => {
    setSigningOut(true)
    try { await logout() } finally { navigate('/', { replace: true }) }
  }

  return (
    <header className={`fixed top-0 right-0 ${leftCls} z-40 h-14
                        flex items-center gap-3 px-4
                        bg-white dark:bg-gray-900
                        border-b border-ink-7 dark:border-gray-700
                        shadow-sm transition-[left] duration-300`}>

      {/* ── Search (Braify users; signer sessions can't search the org) ── */}
      {isSigner ? <div className="flex-1" /> : <GlobalSearch />}

      {/* ── Right controls ── */}
      <div className="flex items-center gap-1 ml-auto shrink-0">

        {/* Dark / Light toggle */}
        <button onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     text-ink-3 dark:text-gray-400
                     hover:bg-ink-8 dark:hover:bg-gray-800 transition-colors">
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
        {!isSigner && <NotificationBell />}

        {/* Divider */}
        <div className="w-px h-6 bg-ink-7 dark:bg-gray-700 mx-1"/>

        {/* Profile avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                       hover:bg-ink-8 dark:hover:bg-gray-800 transition-colors"
            title="Profile"
          >
            <UserAvatar user={user} />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-ink dark:text-gray-100 leading-tight">
                {shortName}
              </p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleMeta.cls}`}>
                {roleMeta.label}
              </span>
            </div>
            <svg className="w-3.5 h-3.5 text-ink-4 hidden sm:block" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 z-50
                            bg-white dark:bg-gray-800 rounded-2xl shadow-xl
                            border border-ink-7 dark:border-gray-700 overflow-hidden animate-fade-in">

              {/* User info header */}
              <div className="px-4 py-3 border-b border-ink-7 dark:border-gray-700">
                <div className="flex items-center gap-2.5 mb-1">
                  <UserAvatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink dark:text-gray-100 truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-ink-4 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleMeta.cls}`}>
                    {roleMeta.label}
                  </span>
                  {user?.organizationName && (
                    <span className="text-[10px] text-ink-4 truncate max-w-[120px]">
                      {user.organizationName}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <ul className="py-1">
                {[
                  isSigner
                    ? { label: user?.hasPassword ? 'Change password' : 'Set a password', to: '/my-documents/account', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
                    : { label: 'My Profile',  to: '/profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                ].map(({ label, icon, to }) => (
                  <li key={label}>
                    <button
                      onClick={() => { if (to) { navigate(to); setShowProfile(false) } }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                 text-ink-2 dark:text-gray-300
                                 hover:bg-ink-8 dark:hover:bg-gray-700 transition-colors text-left">
                      <svg className="w-4 h-4 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon}/>
                      </svg>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Sign out */}
              <div className="border-t border-ink-7 dark:border-gray-700 py-1">
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
