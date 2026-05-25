import { useLocation } from 'react-router-dom'

/**
 * Wraps page content with a subtle fade + slide animation on route change.
 * Pure CSS — no framer-motion dependency.
 *
 * Re-keys on pathname change so the entrance animation replays.
 *
 * Usage (inside <BrowserRouter>):
 *   <PageTransition>
 *     <Routes>...</Routes>
 *   </PageTransition>
 */
export default function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      className="animate-fade-in-up"
      // 'backwards' applies the from-keyframe before the animation starts (no flash),
      // but does NOT retain the to-keyframe after it ends.
      // This is critical: 'both'/'forwards' would leave transform:translateY(0) on the div,
      // which makes it a containing block for position:fixed children (modals, toasts, etc.)
      // and breaks their inset-0 / viewport positioning.
      style={{ animationFillMode: 'backwards' }}
    >
      {children}
    </div>
  )
}
