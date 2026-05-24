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
      style={{ animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}
