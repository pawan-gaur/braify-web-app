import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AppProvider, useApp }  from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { FEATURES } from './config/features'
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
import ESignBulkPage        from './pages/ESignBulkPage'
import ESignDetailPage      from './pages/ESignDetailPage'
import ESignSigningPage     from './pages/ESignSigningPage'
import ESignVerifyPage      from './pages/ESignVerifyPage'
import GetStartedPage       from './pages/GetStartedPage'
import OnboardingRequestsPage from './pages/OnboardingRequestsPage'
import OrgSettingsPage       from './pages/BrandingPage'
import UsagePage             from './pages/UsagePage'
import SharedTemplatesPage   from './pages/SharedTemplatesPage'
import ApiDocsPage           from './pages/ApiDocsPage'
import OrgDetailPage         from './pages/OrgDetailPage'
import ApiKeysPage           from './pages/ApiKeysPage'
import FilesPage             from './pages/FilesPage'
import FeatureDetailPage     from './pages/FeatureDetailPage'
import PageTransition        from './components/ui/PageTransition'
import TitleManager          from './components/ui/TitleManager'

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

/**
 * FeatureRoute — renders `children` only if the user's org has the feature.
 * Redirects to /dashboard with a friendly "not available" if not.
 */
function FeatureRoute({ feature, children }) {
  const { hasFeature } = useAuth()
  if (!hasFeature(feature)) return <Navigate to="/dashboard" replace />
  return children
}

/* ── Authenticated shell with sidebar + navbar ─────────────────────────── */
function Shell() {
  const { collapsed } = useApp()
  const sideW = collapsed ? 'ml-16' : 'ml-60'

  return (
    <div className="flex min-h-screen bg-surface dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />
      <Navbar  />
      <main className={`flex-1 ${sideW} pt-14 transition-[margin-left] duration-300 ease-spring min-w-0`}>
        <PageTransition>
        <Routes>
          <Route path="/"        element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ── PDF Templates (feature-gated) ── */}
          <Route path="/templates"   element={<FeatureRoute feature={FEATURES.PDF_TEMPLATES}><TemplatesPage /></FeatureRoute>} />
          <Route path="/builder"     element={<FeatureRoute feature={FEATURES.PDF_TEMPLATES}><BuilderPage /></FeatureRoute>} />
          <Route path="/builder/:id" element={<FeatureRoute feature={FEATURES.PDF_TEMPLATES}><BuilderPage /></FeatureRoute>} />
          <Route path="/generate"    element={<FeatureRoute feature={FEATURES.PDF_TEMPLATES}><GeneratePage /></FeatureRoute>} />

          {/* ── Email Templates (feature-gated) ── */}
          <Route path="/email-templates"   element={<FeatureRoute feature={FEATURES.EMAIL_TEMPLATES}><EmailTemplatesPage /></FeatureRoute>} />
          <Route path="/email-builder"     element={<FeatureRoute feature={FEATURES.EMAIL_TEMPLATES}><EmailBuilderPage /></FeatureRoute>} />
          <Route path="/email-builder/:id" element={<FeatureRoute feature={FEATURES.EMAIL_TEMPLATES}><EmailBuilderPage /></FeatureRoute>} />

          {/* ── E-Sign (feature-gated) ── */}
          <Route path="/esign"          element={<FeatureRoute feature={FEATURES.E_SIGN}><ESignDocumentsPage /></FeatureRoute>} />
          <Route path="/esign/new"      element={<FeatureRoute feature={FEATURES.E_SIGN}><ESignBuilderPage /></FeatureRoute>} />
          <Route path="/esign/bulk"     element={<FeatureRoute feature={FEATURES.E_SIGN}><ESignBulkPage /></FeatureRoute>} />
          <Route path="/esign/:id"      element={<FeatureRoute feature={FEATURES.E_SIGN}><ESignDocumentRouter /></FeatureRoute>} />
          <Route path="/esign/:id/view" element={<FeatureRoute feature={FEATURES.E_SIGN}><ESignDetailPage /></FeatureRoute>} />

          {/* ── File Storage (feature-gated) ── */}
          <Route path="/files" element={<FeatureRoute feature={FEATURES.FILE_STORAGE}><FilesPage /></FeatureRoute>} />

          {/* ── Audit log (always available) ── */}
          <Route path="/audit-log" element={<AuditLogPage />} />

          {/* ── Admin pages ── */}
          <Route path="/organizations"              element={<OrganizationsPage />} />
          <Route path="/admin/organizations/:orgId" element={<OrgDetailPage />} />
          <Route path="/onboarding-requests"        element={<OnboardingRequestsPage />} />
          <Route path="/users"                 element={<UsersPage />} />
          <Route path="/sessions"              element={<SessionsPage />} />

          {/* ── Profile ── */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* ── Settings ── */}
          <Route path="/settings/org-settings" element={<OrgSettingsPage />} />
          <Route path="/settings/api-keys"   element={<ApiKeysPage />} />
          <Route path="/usage"              element={<UsagePage />} />
          <Route path="/shared-templates"   element={<SharedTemplatesPage />} />
          <Route path="/api-docs"           element={<ApiDocsPage />} />

          {/* Catch-all inside shell */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </PageTransition>
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
      <Route path="/get-started"      element={<GetStartedPage />} />
      <Route path="/features/:slug"   element={<FeatureDetailPage />} />
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
      <TitleManager />
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
