import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const APP = 'Braify'

/**
 * Maps URL pathname patterns → page title segment.
 * Checked in order — first match wins.
 *
 * Rules use simple prefix / exact matching:
 *   { exact: '/path' }   — pathname must equal this value
 *   { prefix: '/path' }  — pathname must start with this value
 */
const TITLE_MAP = [
  // ── Public ──────────────────────────────────────────────────────────
  { exact:  '/',                        title: 'Document Automation Platform' },
  { exact:  '/login',                   title: 'Sign In' },
  { exact:  '/get-started',             title: 'Get Started' },
  { prefix: '/features/',               title: 'Features' },
  { prefix: '/accept-invite',           title: 'Accept Invite' },
  { prefix: '/forgot-password',         title: 'Forgot Password' },
  { prefix: '/reset-password',          title: 'Reset Password' },
  { prefix: '/sign/',                   title: 'Sign Document' },
  { prefix: '/verify/',                 title: 'Verify Document' },

  // ── Dashboard ────────────────────────────────────────────────────────
  { exact:  '/dashboard',               title: 'Dashboard' },

  // ── PDF Templates ────────────────────────────────────────────────────
  { exact:  '/templates',               title: 'PDF Templates' },
  { exact:  '/generate',                title: 'Generate PDF' },
  { prefix: '/builder',                 title: 'Template Builder' },

  // ── Email Templates ──────────────────────────────────────────────────
  { exact:  '/email-templates',         title: 'Email Templates' },
  { prefix: '/email-builder',           title: 'Email Builder' },

  // ── E-Sign ───────────────────────────────────────────────────────────
  { exact:  '/esign',                   title: 'E-Sign Documents' },
  { exact:  '/esign/new',               title: 'New E-Sign Document' },
  { exact:  '/esign/bulk',              title: 'Bulk Send — E-Sign' },
  { prefix: '/esign/',                  title: 'E-Sign Document' },

  // ── Files ────────────────────────────────────────────────────────────
  { exact:  '/files',                   title: 'Files' },

  // ── Admin ────────────────────────────────────────────────────────────
  { exact:  '/organizations',           title: 'Organizations' },
  { prefix: '/admin/organizations/',    title: 'Organization Detail' },
  { exact:  '/onboarding-requests',     title: 'Onboarding Requests' },
  { exact:  '/users',                   title: 'Users' },
  { exact:  '/sessions',                title: 'Sessions' },

  // ── Settings ─────────────────────────────────────────────────────────
  { exact:  '/settings/org-settings',   title: 'Organization Settings' },
  { exact:  '/settings/api-keys',       title: 'API Keys' },

  // ── Misc ─────────────────────────────────────────────────────────────
  { exact:  '/audit-log',               title: 'Audit Log' },
  { exact:  '/usage',                   title: 'Usage' },
  { exact:  '/shared-templates',        title: 'Shared Templates' },
  { exact:  '/api-docs',                title: 'API Docs' },
  { exact:  '/profile',                 title: 'Profile' },
]

function resolveTitle(pathname) {
  for (const rule of TITLE_MAP) {
    if (rule.exact  && pathname === rule.exact)         return rule.title
    if (rule.prefix && pathname.startsWith(rule.prefix)) return rule.title
  }
  return null
}

/**
 * Drop this component once inside <BrowserRouter>.
 * It watches location changes and keeps document.title in sync automatically.
 */
export default function TitleManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    const section = resolveTitle(pathname)
    document.title = section ? `${section} — ${APP}` : APP
  }, [pathname])

  return null
}
