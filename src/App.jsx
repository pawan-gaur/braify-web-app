import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AppProvider, useApp }  from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ToastContainer   from './components/ui/ToastContainer'
import ProtectedRoute   from './components/auth/ProtectedRoute'
import Sidebar          from './components/layout/Sidebar'
import Navbar           from './components/layout/Navbar'
import LoginPage            from './pages/LoginPage'
import TemplatesPage        from './pages/TemplatesPage'
import BuilderPage          from './pages/BuilderPage'
import GeneratePage         from './pages/GeneratePage'
import AuditLogPage         from './pages/AuditLogPage'
import EmailTemplatesPage   from './pages/EmailTemplatesPage'
import EmailBuilderPage     from './pages/EmailBuilderPage'
import OrganizationsPage    from './pages/OrganizationsPage'
import UsersPage            from './pages/UsersPage'
import SessionsPage         from './pages/SessionsPage'
import ProfilePage          from './pages/ProfilePage'
import AcceptInvitePage     from './pages/AcceptInvitePage'
import ForgotPasswordPage   from './pages/ForgotPasswordPage'
import ResetPasswordPage    from './pages/ResetPasswordPage'
import DashboardPage        from './pages/DashboardPage'
import LandingPage          from './pages/LandingPage'
import ESignDocumentsPage   from './pages/ESignDocumentsPage'
import ESignBuilderPage     from './pages/ESignBuilderPage'
import ESignDetailPage      from './pages/ESignDetailPage'
import ESignSigningPage     from './pages/ESignSigningPage'
import ESignVerifyPage      from './pages/ESignVerifyPage'

/**
 * Smart router for /esign/:id
 * - DRAFT documents → builder (fields can still be placed / sent)
 * - Everything else  → detail/view page (read-only, signed PDF, audit trail)
 */
function ESignDocumentRouter() {
  const { id } = useParams()
  const [status, setStatus] = React.useState(null)

  React.useEffect(() => {
    import('./services/api').then(({ esignGetDocument }) =>
      esignGetDocument(id)
        .then(d => setStatus(d.status))
        .catch(() => setStatus('DRAFT')) // fallback to builder on error
    )
  }, [id])

  if (status === null) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  // DRAFT, PENDING, IN_REVIEW → builder (fields can be edited / doc can be sent)
  // COMPLETED, CANCELLED, EXPIRED → read-only detail view
  // Pass the already-fetched status as a prop so ESignBuilderPage knows
  // immediately whether to show the Send step or navigate back after saving.
  return ['DRAFT', 'PENDING', 'IN_REVIEW'].includes(status)
    ? <ESignBuilderPage initialDocStatus={status} />
    : <ESignDetailPage />
}

/* ── Authenticated shell with sidebar + navbar ─────────────────────────── */
function Shell() {
  const { collapsed } = useApp()
  const sideW = collapsed ? 'ml-16' : 'ml-56'

  return (
    <div className="flex min-h-screen bg-surface dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />
      <Navbar  />
      <main className={`flex-1 ${sideW} pt-14 transition-[margin-left] duration-300 min-w-0`}>
        <Routes>
          <Route path="/"                   element={<DashboardPage />} />
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/templates"          element={<TemplatesPage />} />
          <Route path="/builder"            element={<BuilderPage />} />
          <Route path="/builder/:id"        element={<BuilderPage />} />
          <Route path="/generate"           element={<GeneratePage />} />
          <Route path="/audit-log"          element={<AuditLogPage />} />
          <Route path="/email-templates"    element={<EmailTemplatesPage />} />
          <Route path="/email-builder"      element={<EmailBuilderPage />} />
          <Route path="/email-builder/:id"  element={<EmailBuilderPage />} />
          {/* Admin pages */}
          <Route path="/organizations"      element={<OrganizationsPage />} />
          <Route path="/users"              element={<UsersPage />} />
          <Route path="/sessions"           element={<SessionsPage />} />
          {/* E-Sign Creator */}
          <Route path="/esign"              element={<ESignDocumentsPage />} />
          <Route path="/esign/new"          element={<ESignBuilderPage />} />
          {/* /esign/:id — builder for editable docs, detail view for completed/terminal ones */}
          <Route path="/esign/:id"          element={<ESignDocumentRouter />} />
          <Route path="/esign/:id/view"     element={<ESignDetailPage />} />
          {/* Profile */}
          <Route path="/profile"            element={<ProfilePage />} />
          {/* Catch-all inside shell */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

/* ── Root router ───────────────────────────────────────────────────────── */
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  return (
    <Routes>
      {/* Public landing page */}
      <Route
        path="/"
        element={
          !loading && isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LandingPage />
        }
      />

      {/* Public — no auth required */}
      <Route
        path="/login"
        element={
          !loading && isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />
      <Route path="/accept-invite"   element={<AcceptInvitePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      {/* E-Sign public routes */}
      <Route path="/sign/:token"    element={<ESignSigningPage />} />
      <Route path="/verify/:id"     element={<ESignVerifyPage />} />

      {/* Everything else is protected */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppProvider>
              <Shell />
            </AppProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        {/* Rendered outside the auth/app tree so toasts survive route changes */}
        <ToastContainer />
      </ToastProvider>
    </BrowserRouter>
  )
}
