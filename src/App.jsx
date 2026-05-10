import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
