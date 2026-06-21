import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Wraps any route element with an auth guard.
 *
 * Usage:
 *   <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
 *
 * Optional `requiredRole` prop for role gating:
 *   <Route path="/admin" element={<ProtectedRoute requiredRole="PLATFORM_ADMIN"><AdminPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  // While verifying the stored token show a full-screen loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-surface dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4 text-ink-4">
          <svg className="animate-spin h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to /login, remembering the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role gate (optional)
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-900 p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20
                          flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6
                   a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-ink dark:text-gray-100 mb-1">Access Denied</h2>
          <p className="text-sm text-ink-3 dark:text-gray-400">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  return children
}
