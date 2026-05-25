import { useEffect, useRef, useState } from 'react'

/**
 * useReveal — Intersection-Observer based "fade-in on scroll" hook.
 *
 * Returns [ref, isVisible]. Attach `ref` to any element; `isVisible` flips
 * true the first time the element enters the viewport and stays true.
 *
 * Pair with the `.reveal` / `.reveal-in` utility classes (or your own CSS).
 *
 *   const [ref, visible] = useReveal()
 *   <section ref={ref} className={`reveal ${visible ? 'reveal-in' : ''}`}>
 */
export default function useReveal({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion — reveal immediately
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.unobserve(entry.target)
            break
          }
        }
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])

  return [ref, visible]
}
