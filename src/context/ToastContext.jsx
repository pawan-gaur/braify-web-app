import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

let _id = 0

/**
 * Global toast provider.
 * Wrap the app with <ToastProvider> and call useToast() in any component.
 *
 * API:
 *   const toast = useToast()
 *   toast.error('Something went wrong')
 *   toast.success('Saved!')
 *   toast.warning('Check your input')
 *   toast.info('Processing…')
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'error', duration = 5000) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type, duration }])
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    error:     (msg, dur)        => add(msg, 'error',   dur),
    success:   (msg, dur)        => add(msg, 'success', dur),
    warning:   (msg, dur)        => add(msg, 'warning', dur),
    info:      (msg, dur)        => add(msg, 'info',    dur),
    // Backwards-compat shim: showToast(message, type) used across many pages
    showToast: (msg, type = 'info', dur) => add(msg, type, dur),
  }

  return (
    <ToastCtx.Provider value={{ toast, toasts, remove }}>
      {children}
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

// Used internally by ToastContainer
export const useToastState = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToastState must be used within ToastProvider')
  return { toasts: ctx.toasts, remove: ctx.remove }
}
