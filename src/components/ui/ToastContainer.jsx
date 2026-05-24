import { useEffect, useRef, useState } from 'react'
import { useToastState } from '../../context/ToastContext'

/* ─── Per-type config — Apple/Sonner aesthetic ──────────────────────────── */
const TYPE_CONFIG = {
  error: {
    icon:     'text-danger',
    iconBg:   'bg-rose-50',
    iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    icon:     'text-success',
    iconBg:   'bg-emerald-50',
    iconPath: 'M5 13l4 4L19 7',
  },
  warning: {
    icon:     'text-warning',
    iconBg:   'bg-amber-50',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  info: {
    icon:     'text-brand',
    iconBg:   'bg-brand-50',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

/* ─── Single toast item ─────────────────────────────────────────────────── */
function ToastItem({ toast, onRemove, index }) {
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info
  const [visible, setVisible] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const startXRef    = useRef(0)
  const draggingRef  = useRef(false)
  const timerRef     = useRef(null)
  const remainingRef = useRef(toast.duration)
  const startedAtRef = useRef(null)
  const pausedRef    = useRef(false)

  /* Entrance */
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /* Auto-dismiss timer */
  const start = () => {
    startedAtRef.current = Date.now()
    timerRef.current = setTimeout(dismiss, remainingRef.current)
  }
  const pause = () => {
    if (pausedRef.current) return
    pausedRef.current = true
    remainingRef.current -= Date.now() - startedAtRef.current
    clearTimeout(timerRef.current)
  }
  const resume = () => {
    if (!pausedRef.current) return
    pausedRef.current = false
    start()
  }

  useEffect(() => {
    start()
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = () => {
    clearTimeout(timerRef.current)
    setVisible(false)
    setTimeout(() => onRemove(toast.id), 250)
  }

  /* Swipe-to-dismiss */
  const onPointerDown = (e) => {
    startXRef.current = e.clientX
    draggingRef.current = true
    pause()
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    const dx = e.clientX - startXRef.current
    if (dx > 0) setSwipeX(dx)
  }
  const onPointerUp = () => {
    draggingRef.current = false
    if (swipeX > 80) {
      // dismiss with continued slide
      setSwipeX(window.innerWidth)
      setTimeout(() => onRemove(toast.id), 200)
    } else {
      setSwipeX(0)
      resume()
    }
  }

  // Stack offset — older toasts compress slightly
  const stackOffset = index * -8
  const stackScale = 1 - index * 0.03

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={pause}
      onMouseLeave={resume}
      style={{
        transform: visible
          ? `translate3d(${swipeX}px, ${stackOffset}px, 0) scale(${stackScale})`
          : 'translate3d(0, 24px, 0) scale(0.9)',
        opacity: visible ? 1 - (swipeX / 200) : 0,
        transition: draggingRef.current
          ? 'none'
          : 'transform 250ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease',
        touchAction: 'pan-y',
      }}
      className="select-none cursor-grab active:cursor-grabbing
                 relative flex items-center gap-3
                 min-w-[320px] max-w-[400px] pl-3 pr-4 py-3
                 rounded-full
                 bg-white/95 backdrop-blur-xl
                 border border-ink-7
                 shadow-float"
    >
      {/* Icon */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.iconBg}`}>
        <svg className={`w-4 h-4 ${cfg.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={cfg.iconPath}/>
        </svg>
      </div>

      {/* Message */}
      <p className="flex-1 text-[14px] font-medium text-ink leading-snug">
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss() }}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full
                   text-ink-4 hover:text-ink hover:bg-ink-8 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

/* ─── Container — bottom-right (Sonner-style stacked) ───────────────────── */
export default function ToastContainer() {
  const { toasts, remove } = useToastState()

  if (toasts.length === 0) return null

  // Reverse so newest is on top of the stack visually
  const reversed = [...toasts].reverse()

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end"
      aria-live="polite"
    >
      {reversed.map((t, i) => (
        <ToastItem
          key={t.id}
          toast={t}
          onRemove={remove}
          index={i}
        />
      ))}
    </div>
  )
}
