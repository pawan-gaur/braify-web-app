import { useEffect, useRef, useState } from 'react'

/* ─── Channel palette ─────────────────────────────────────────────────────
 * One colour per product module, reused by every diagram on the page so a
 * "PDF" tile in the hero is the same "PDF" tile in the control plane. */
export const CHANNELS = {
  pdf:   { code: 'PDF', label: 'PDF Builder',  fg: '#2F5BF0', bg: '#EAF1FE', ring: '#BFD3FB' },
  email: { code: 'EM',  label: 'Email',        fg: '#6D52E8', bg: '#F3F0FF', ring: '#D6CCFB' },
  sign:  { code: 'SG',  label: 'E-Sign',       fg: '#0d9488', bg: '#E6F7F4', ring: '#A7E3DA' },
  files: { code: 'FS',  label: 'File Storage', fg: '#d97706', bg: '#FFF4E5', ring: '#F8D9A8' },
  stats: { code: 'AN',  label: 'Analytics',    fg: '#0891b2', bg: '#E6F6FA', ring: '#A5DDEA' },
  api:   { code: 'API', label: 'REST API',     fg: '#e11d48', bg: '#FFEEF1', ring: '#F9C0CC' },
}

export const BRAND = '#2F5BF0'
export const LINE = '#DCD6F2'

/* ─── Hooks ───────────────────────────────────────────────────────────── */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

/** Tracks whether `ref` is on screen. `once` latches true after first entry. */
export function useInView(ref, { once = false, threshold = 0.2 } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        if (once) io.disconnect()
      } else if (!once) {
        setInView(false)
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, once, threshold])
  return inView
}

/**
 * Steps 0..count-1 on an interval while the element is visible.
 * Returns [step, setStep, ref]; calling setStep pauses auto-advance for a while
 * so a user's click is not immediately overwritten.
 */
export function useCycle(count, ms = 2600) {
  const ref = useRef(null)
  const inView = useInView(ref, { threshold: 0.25 })
  const reduced = usePrefersReducedMotion()
  const [step, setStepRaw] = useState(0)
  const pausedUntil = useRef(0)

  useEffect(() => {
    if (!inView || reduced) return
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      setStepRaw(s => (s + 1) % count)
    }, ms)
    return () => clearInterval(id)
  }, [inView, reduced, count, ms])

  const setStep = s => {
    setStepRaw(s)
    pausedUntil.current = Date.now() + ms * 4
  }
  return [step, setStep, ref]
}

/* ─── Reveal on scroll ────────────────────────────────────────────────── */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, threshold: 0.12 })
  return (
    <Tag ref={ref} {...rest}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      className={`lp-reveal ${inView ? 'is-in' : ''} ${className}`}>
      {children}
    </Tag>
  )
}

/* ─── SVG packet ──────────────────────────────────────────────────────────
 * A dot that travels once along `path` every time `trigger` changes.
 * SMIL with begin="indefinite" + beginElement() restarts cleanly on demand. */
export function Packet({ path, trigger, delay = 0, dur = 0.9, color = BRAND, r = 4 }) {
  const motion = useRef(null)
  const fade = useRef(null)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        motion.current?.beginElement()
        fade.current?.beginElement()
      } catch { /* SMIL unsupported — diagram stays static */ }
    }, delay * 1000)
    return () => clearTimeout(t)
  }, [trigger, delay])
  return (
    <circle r={r} fill={color} opacity="0" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      <animateMotion ref={motion} dur={`${dur}s`} path={path} begin="indefinite" fill="freeze"
        calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.25 1" />
      <animate ref={fade} attributeName="opacity" dur={`${dur}s`} begin="indefinite" fill="freeze"
        values="0;1;1;0" keyTimes="0;0.12;0.85;1" />
    </circle>
  )
}

/* ─── Scaled stage ────────────────────────────────────────────────────────
 * Diagrams are laid out on a fixed pixel canvas (so SVG rails and HTML nodes
 * share one coordinate system) and the whole canvas is scaled to fit. */
export function ScaledStage({ width, height, className = '', children }) {
  const outer = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = outer.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={outer} className={`relative w-full overflow-clip ${className}`} style={{ height: height * scale }}>
      <div className="absolute top-0 left-1/2 origin-top"
        style={{ width, height, transform: `translateX(-50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Small building blocks ───────────────────────────────────────────── */
export function ChannelTile({ id, size = 'md', active = true, className = '' }) {
  const c = CHANNELS[id]
  const dims = size === 'sm' ? 'w-7 h-7 text-[9px]' : size === 'lg' ? 'w-11 h-11 text-[11px]' : 'w-9 h-9 text-[10px]'
  return (
    <span className={`lp-mono inline-flex items-center justify-center rounded-lg border font-semibold shrink-0
                      transition-all duration-500 ${dims} ${className}`}
      style={{
        color: c.fg,
        background: c.bg,
        borderColor: active ? c.ring : '#E6E1F5',
        opacity: active ? 1 : 0.55,
      }}>
      {c.code}
    </span>
  )
}

/** Numbered eyebrow pill: (01  THE MISSING LAYER) */
export function Eyebrow({ n, children, dark = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full border pl-1.5 pr-3.5 py-1 ${className}
                     ${dark ? 'bg-white/[0.06] border-white/10' : 'bg-white border-black/[0.07] shadow-sm'}`}>
      {n ? (
        <span className="lp-mono text-[10px] font-semibold text-white rounded-full px-2 py-0.5"
          style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0,#6D52E8)' }}>
          {n}
        </span>
      ) : (
        <span className="ml-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0,#14b8a6)' }} />
      )}
      <span className={`lp-mono text-[10.5px] tracking-[0.16em] uppercase ${dark ? 'text-white/70' : 'text-[#4A4768]'}`}>{children}</span>
    </div>
  )
}

export const GRADIENT = 'linear-gradient(100deg,#2F5BF0 0%,#6D52E8 48%,#0d9488 100%)'
export const GRADIENT_ON_DARK = 'linear-gradient(100deg,#8FA8FF 0%,#B79CFF 48%,#5EEAD4 100%)'

export function GradientText({ children, dark = false, className = '' }) {
  return (
    <span className={`text-transparent bg-clip-text ${className}`}
      style={{ backgroundImage: dark ? GRADIENT_ON_DARK : GRADIENT }}>
      {children}
    </span>
  )
}

/** Split section header: big two-line h2 left, supporting copy right. */
export function SectionHead({ n, eyebrow, title, accent, id, dark = false, children }) {
  return (
    <Reveal className="grid md:grid-cols-2 gap-8 md:gap-16 items-end mb-12 md:mb-14">
      <div>
        {eyebrow && <Eyebrow n={n} dark={dark} className="mb-6">{eyebrow}</Eyebrow>}
        <h2 id={id} className={`text-balance text-[38px] leading-[1.03] md:text-[56px] font-bold tracking-tightest
                                ${dark ? 'text-white' : 'text-[#16143A]'}`}>
          {title}
          {accent && (
            <>
              <br />
              <GradientText dark={dark}>{accent}</GradientText>
            </>
          )}
        </h2>
      </div>
      {children && (
        <p className={`text-[17px] leading-relaxed md:pb-2 max-w-md ${dark ? 'text-white/60' : 'text-[#5A5775]'}`}>{children}</p>
      )}
    </Reveal>
  )
}

/**
 * Card with a soft glow that follows the cursor. `glow` is a hex colour.
 * Renders as any tag (`as`) so it can be an <li> or <article>.
 */
export function Spotlight({ as: Tag = 'div', glow = '#6D52E8', className = '', children, ...rest }) {
  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
  }
  return (
    <Tag onMouseMove={onMove} className={`group relative isolate ${className}`} {...rest}>
      <span aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(340px circle at var(--x, 50%) var(--y, 0%), ${glow}24, transparent 65%)` }} />
      {children}
    </Tag>
  )
}

export function Check({ className = 'w-3.5 h-3.5', strokeWidth = 2.5 }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function Cross({ className = 'w-3 h-3' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function Arrow({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6l6 6-6 6" />
    </svg>
  )
}

export function Icon({ d, className = 'w-5 h-5', color, strokeWidth = 1.8 }) {
  return (
    <svg className={className} style={color ? { color } : undefined} fill="none" stroke="currentColor"
      viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
    </svg>
  )
}

export function StatusDot({ color = '#10b981', pulse = true }) {
  return (
    <span className="relative inline-flex w-2 h-2 shrink-0" aria-hidden="true">
      {pulse && <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />}
      <span className="relative w-2 h-2 rounded-full" style={{ background: color }} />
    </span>
  )
}

/** CTA buttons. `Glow` is the gradient hero CTA; `Glass` is its frosted companion. */
export function PrimaryButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16143A] text-white text-sm font-semibold
                  shadow-[0_10px_28px_rgba(17,19,22,0.22)] hover:bg-black hover:-translate-y-px transition-all active:scale-[0.98] ${className}`}>
      {children}
      <Arrow className="w-4 h-4 text-[#9db4ff] group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

export function SecondaryButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#16143A] text-sm font-semibold
                  border border-black/[0.09] hover:border-black/20 hover:-translate-y-px transition-all active:scale-[0.98] ${className}`}>
      {children}
    </button>
  )
}

export function GlowButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`lp-sheen group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold
                  shadow-[0_12px_36px_rgba(109,82,232,0.45)] hover:shadow-[0_16px_44px_rgba(109,82,232,0.6)]
                  hover:-translate-y-px transition-all active:scale-[0.98] ${className}`}
      style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0 0%,#6D52E8 60%,#8B5CF6 100%)' }}>
      <span className="relative">{children}</span>
      <Arrow className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

export function GlassButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[#16143A] text-sm font-semibold
                  bg-white/75 border border-white shadow-[0_6px_18px_rgba(76,60,160,0.10)] backdrop-blur hover:bg-white hover:-translate-y-px
                  transition-all active:scale-[0.98] ${className}`}>
      {children}
    </button>
  )
}

/** Aurora backdrop: drifting lavender / sky / mint glows over a faint dot grid. */
export function Aurora({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-clip ${className}`}>
      <div className="lp-drift absolute -top-40 -left-24 w-[680px] h-[560px] rounded-full blur-[110px] opacity-70"
        style={{ background: 'radial-gradient(closest-side, #C4B5FD, transparent)' }} />
      <div className="lp-drift-2 absolute -top-24 right-[-10%] w-[620px] h-[520px] rounded-full blur-[110px] opacity-60"
        style={{ background: 'radial-gradient(closest-side, #BAE6FD, transparent)' }} />
      <div className="lp-drift absolute bottom-[-30%] left-[30%] w-[700px] h-[480px] rounded-full blur-[120px] opacity-40"
        style={{ background: 'radial-gradient(closest-side, #A7F3D0, transparent)', animationDelay: '-8s' }} />
      <div className="lp-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  )
}
