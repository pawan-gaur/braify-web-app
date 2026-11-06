import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../../services/api'
import { fmtRelative } from '../../utils/date'

/** Real notifications (document signed, campaign finished, trial ending…). Polls the unread count. */
export default function NotificationBell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen]     = useState(false)
  const [items, setItems]   = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const refreshCount = useCallback(() => {
    getUnreadNotificationCount().then(setUnread).catch(() => {})
  }, [])

  useEffect(() => {
    refreshCount()
    const t = setInterval(refreshCount, 60_000)
    return () => clearInterval(t)
  }, [refreshCount, pathname])

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      getNotifications({ limit: 20 }).then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
    }
  }

  const openItem = (n) => {
    if (!n.read) {
      markNotificationRead(n.id).catch(() => {})
      setItems(list => list.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnread(c => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const readAll = () => {
    markAllNotificationsRead().catch(() => {})
    setItems(list => list.map(x => ({ ...x, read: true })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-haspopup="true" aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 dark:text-gray-400 hover:bg-ink-8 dark:hover:bg-gray-800 transition-colors relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-4 text-center ring-2 ring-white dark:ring-gray-900">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-ink-7 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-7 dark:border-gray-700">
            <span className="text-sm font-bold text-ink dark:text-gray-100">Notifications</span>
            {items.some(n => !n.read) && (
              <button onClick={readAll} className="text-xs text-brand hover:underline font-medium">Mark all read</button>
            )}
          </div>
          <ul className="divide-y divide-ink-8 dark:divide-gray-700 max-h-80 overflow-y-auto">
            {loading && <li className="px-4 py-4 text-sm text-ink-4">Loading…</li>}
            {!loading && items.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-4 text-center">You’re all caught up — nothing new.</li>
            )}
            {!loading && items.map(n => (
              <li key={n.id}>
                <button onClick={() => openItem(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-ink-8 dark:hover:bg-gray-700 ${n.read ? '' : 'bg-brand-50/60 dark:bg-brand-900/20'}`}>
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-ink-6 dark:bg-gray-600' : 'bg-brand'}`} aria-hidden="true"/>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-ink-2 dark:text-gray-200 leading-snug">{n.title}</span>
                    <span className="block text-xs text-ink-4 mt-0.5">{fmtRelative(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
