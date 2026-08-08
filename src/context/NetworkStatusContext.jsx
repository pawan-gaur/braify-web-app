import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { pingHealth } from '../services/api'

/**
 * Global connectivity state.
 *
 * status:
 *   'offline'     — the browser has no network (navigator.onLine === false). Takes priority.
 *   'server-down' — online, but the backend is unreachable (no response / gateway 5xx).
 *   'online'      — everything's fine.
 *
 * How it's driven:
 *   • `online` comes from the browser's online/offline events.
 *   • `serverUp` flips to false when api.js emits `braify:server-down` (a real request
 *     failed at the network level) and back to true on `braify:server-up`.
 *   • While server-down (and online) we poll pingHealth() every few seconds to detect
 *     recovery. No polling happens during normal use.
 */
const NetworkStatusCtx = createContext(null)

const RECOVERY_POLL_MS = 5000

export function NetworkStatusProvider({ children }) {
  const [online, setOnline]     = useState(() => navigator.onLine)
  const [serverUp, setServerUp] = useState(true)
  const pollRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const checkNow = useCallback(async () => {
    if (!navigator.onLine) return
    const up = await pingHealth()
    setServerUp(up)
    if (up) stopPolling()
  }, [stopPolling])

  // Probe the backend once on load so the banner reflects reality immediately
  // (e.g. backend already down at startup, before any real request has failed).
  useEffect(() => { checkNow() }, [checkNow])

  // Browser network up/down
  useEffect(() => {
    const goOnline  = () => { setOnline(true); checkNow() }   // re-verify the server on reconnect
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [checkNow])

  // Backend up/down signals from the axios interceptor
  useEffect(() => {
    const onDown = () => setServerUp(false)
    const onUp   = () => { setServerUp(true); stopPolling() }
    window.addEventListener('braify:server-down', onDown)
    window.addEventListener('braify:server-up', onUp)
    return () => {
      window.removeEventListener('braify:server-down', onDown)
      window.removeEventListener('braify:server-up', onUp)
    }
  }, [stopPolling])

  // Poll for recovery only while the backend is down and we're online
  useEffect(() => {
    if (!serverUp && online) {
      if (!pollRef.current) pollRef.current = setInterval(checkNow, RECOVERY_POLL_MS)
    } else {
      stopPolling()
    }
    return stopPolling
  }, [serverUp, online, checkNow, stopPolling])

  const status = !online ? 'offline' : (serverUp ? 'online' : 'server-down')

  return (
    <NetworkStatusCtx.Provider value={{ status, online, serverUp, retry: checkNow }}>
      {children}
    </NetworkStatusCtx.Provider>
  )
}

export function useNetworkStatus() {
  const ctx = useContext(NetworkStatusCtx)
  if (!ctx) throw new Error('useNetworkStatus must be used within <NetworkStatusProvider>')
  return ctx
}
