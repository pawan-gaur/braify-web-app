import { useEffect, useRef, useState } from 'react'
import { useToastState } from '../../context/ToastContext'

/* ── Per-type config ────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  error: {
    bar:    'bg-red-500',
    icon:   'text-red-500',
    border: 'border-red-100 dark:border-red-800/50',
    bg:     'bg-white dark:bg-gray-800',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    bar:    'bg-emerald-500',
    icon:   'text-emerald-500',
    border: 'border-emerald-100 dark:border-emerald-800/50',
    bg:     'bg-white dark:bg-gray-800',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bar:    'bg-amber-400',
    icon:   'text-amber-500',
    border: 'border-amber-100 dark:border-amber-800/50',
    bg:     'bg-white dark:bg-gray-800',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  info: {
    bar:    'bg-sky-500',
    icon:   'text-sky-500',
    border: 'border-sky-100 dark:border-sky-800/50',
    bg:     'bg-white dark:bg-gray-800',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

/* ── Single toast item ──────────────────────────────────────────────────── */
function ToastItem({ toast, onRemove }) {
  const cfg              = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info
  const [visible, setVisible] = useState(false)   // drives entrance animation
  const [progress, setProgress] = useState(100)   // 100 → 0 over toast.duration ms
  const intervalRef      = useRef(null)
  const startRef         = useRef(null)
  const remainingRef     = useRef(toast.duration)
  const pausedRef        = useRef(false)

  /* Entrance animation on mount */
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /* Progress countdown */
  const startCountdown = () => {
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed  = Date.now() - startRef.current
      const pct      = Math.max(0, 100 - (elapsed / remainingRef.current) * 100)
      setProgress(pct)
      if (pct === 0) dismiss()
    }, 30)
  }

  const pauseCountdown = () => {
    if (pausedRef.current) return
    pausedRef.current = true
    remainingRef.current -= Date.now() - startRef.current
    clearInterval(intervalRef.current)
  }

  const resumeCountdown = () => {
    if (!pausedRef.current) return
    pausedRef.current = false
    startCountdown()
  }

  useEffect(() => {
    startCountdown()
    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    clearInterval(intervalRef.current)
    setVisible(false)
    // wait for exit animation before removing from DOM
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div
      onMouseEnter={pauseCountdown}
      onMouseLeave={resumeCountdown}
      style={{
        transform:  visible ? 'translateX(0)'    : 'translateX(calc(100% + 24px))',
        opacity:    visible ? 1                  : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        maxWidth:   '360px',
        width:      '100%',
      }}
      className={`relative flex items-start gap-3 rounded-xl shadow-lg
                  border ${cfg.border} ${cfg.bg} p-4 overflow-hidden`}
    >
      {/* Coloured left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cfg.bar}`}/>

      {/* Icon */}
      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.icon}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.iconPath}/>
      </svg>

      {/* Message */}
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-200 leading-snug pr-1">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={dismiss}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md
                   text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-700">
        <div
          className={`h-full ${cfg.bar} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

/* ── Container — fixed bottom-right ─────────────────────────────────────── */
export default function ToastContainer() {
  const { toasts, remove } = useToastState()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end"
      aria-live="polite"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  )
}
