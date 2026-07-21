import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { http } from '../services/api'
import { FEATURES } from '../config/features'

/* ── Role helpers ────────────────────────────────────────────────────────── */
export const ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  ORG_ADMIN:      'ORG_ADMIN',
  ADMIN:          'ADMIN',
  USER:           'USER',
}

const ROLE_RANK = {
  PLATFORM_ADMIN: 4,
  ORG_ADMIN:      3,
  ADMIN:          2,
  USER:           1,
}

/** Returns true if `role` is at least as powerful as `minRole`. */
export function roleAtLeast(role, minRole) {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0)
}

/** All feature keys — used as the fallback for PLATFORM_ADMIN. */
const ALL_FEATURE_KEYS = Object.values(FEATURES)

/**
 * Extract the features list from the raw /auth/me payload.
 * The backend may return them as:
 *   user.features            → ['PDF_TEMPLATES', ...]
 *   user.organization.features → ['PDF_TEMPLATES', ...]
 * PLATFORM_ADMIN always gets every feature.
 */
function extractFeatures(data) {
  if (!data) return []
  if (data.role === ROLES.PLATFORM_ADMIN) return ALL_FEATURE_KEYS
  return (
    data.features ??
    data.organization?.features ??
    []
  )
}

/* ── Context ─────────────────────────────────────────────────────────────── */
const AuthCtx = createContext(null)

const TOKEN_KEY = 'pdf-builder-token'
/** Remembers the last signed-in identity (name + email only — never tokens) for the
 *  "Welcome back" password-only sign-in after a session expires. */
const LAST_USER_KEY = 'braify.lastUser'

function readLastUser() {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/** Apply org theme CSS variables to :root so buttons/UI reflect brand colors */
function applyTheme(primaryColor, accentColor) {
  const root = document.documentElement
  if (primaryColor) root.style.setProperty('--brand-primary', primaryColor)
  if (accentColor)  root.style.setProperty('--brand-accent',  accentColor)
}

/** Extract featureRoleAccess from the raw /auth/me payload */
function extractFeatureRoleAccess(data) {
  if (!data || data.role === ROLES.PLATFORM_ADMIN) return null
  return data.featureRoleAccess ?? null
}

export function AuthProvider({ children }) {
  const [token,             setToken]             = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user,              setUser]              = useState(null)
  const [features,          setFeatures]          = useState([])
  const [featureRoleAccess, setFeatureRoleAccess] = useState(null)
  const [loading,           setLoading]           = useState(true)
  const [lastUser,          setLastUser]          = useState(readLastUser)

  /* ── Restore session on mount ── */
  useEffect(() => {
    if (!token) { setLoading(false); return }

    http.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        setUser(r.data)
        setFeatures(extractFeatures(r.data))
        setFeatureRoleAccess(extractFeatureRoleAccess(r.data))
        applyTheme(r.data.primaryColor, r.data.accentColor)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        setFeatures([])
        setFeatureRoleAccess(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Keep axios interceptor in sync with token changes ── */
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [token])

  const deviceInfo = () => `${navigator.userAgent.split(') ')[0].split('(')[1] || 'Browser'}`

  /* Apply a successful auth response (token + user + features + theme). */
  const applySession = useCallback((data) => {
    setToken(data.token)
    const userObj = {
      id:                 data.userId,
      email:              data.email,
      firstName:          data.firstName,
      lastName:           data.lastName,
      role:               data.role,
      organizationId:     data.organizationId,
      organizationName:   data.organizationName,
      profilePicture:     data.profilePicture,
      mustChangePassword: data.mustChangePassword,
      mustSetupMfa:       data.mustSetupMfa ?? false,
      features:           data.features ?? [],
      primaryColor:       data.primaryColor ?? null,
      accentColor:        data.accentColor  ?? null,
    }
    setUser(userObj)
    setFeatures(extractFeatures({ ...data, role: data.role }))
    setFeatureRoleAccess(extractFeatureRoleAccess(data))
    applyTheme(data.primaryColor, data.accentColor)

    // Remember this identity (name + email only) for the next "Welcome back" sign-in.
    const displayName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.email
    const remembered = { name: displayName, email: data.email }
    try { localStorage.setItem(LAST_USER_KEY, JSON.stringify(remembered)) } catch { /* ignore */ }
    setLastUser(remembered)

    return data
  }, [])

  /** Forget the remembered identity (used by "Sign in as a different user"). */
  const forgetLastUser = useCallback(() => {
    try { localStorage.removeItem(LAST_USER_KEY) } catch { /* ignore */ }
    setLastUser(null)
  }, [])

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    const res  = await http.post('/auth/login', { email, password, deviceInfo: deviceInfo() })
    const data = res.data
    // MFA required: no session yet — caller (LoginPage) collects the code and calls verifyMfa().
    if (data.mfaRequired) return { mfaRequired: true, mfaToken: data.mfaToken }
    return applySession(data)
  }, [applySession])

  /* ── MFA challenge — step 2 of login ── */
  const verifyMfa = useCallback(async (mfaToken, code) => {
    const res  = await http.post('/auth/login/mfa', { mfaToken, code, deviceInfo: deviceInfo() })
    return applySession(res.data)
  }, [applySession])

  /* ── Logout ── */
  const logout = useCallback(async () => {
    try {
      // The request interceptor attaches the CURRENT access token (which may have
      // been silently rotated since login), and the backend clears the refresh
      // cookie. Reading from state would risk sending a stale token.
      if (localStorage.getItem(TOKEN_KEY)) {
        await http.post('/auth/logout', {})
      }
    } catch { /* ignore network errors on logout */ }
    finally {
      setToken(null)
      setUser(null)
      setFeatures([])
      setFeatureRoleAccess(null)
      // NOTE: the remembered identity is intentionally KEPT on logout so the next visit
      // shows the "Welcome back" password-only prompt (Gmail-style quick re-login).
      // "Sign in as a different user" on the login page clears it via forgetLastUser().
      // Reset CSS theme variables
      document.documentElement.style.removeProperty('--brand-primary')
      document.documentElement.style.removeProperty('--brand-accent')
    }
  }, [])

  /* ── Permission helpers ── */
  const can = useCallback((action) => {
    if (!user) return false
    switch (action) {
      case 'delete':       return roleAtLeast(user.role, ROLES.ADMIN)
      case 'manageUsers':  return roleAtLeast(user.role, ROLES.ORG_ADMIN)
      case 'manageOrgs':   return user.role === ROLES.PLATFORM_ADMIN
      default:             return true
    }
  }, [user])

  /**
   * Returns true if the current user can access the given feature.
   * Checks two gates:
   *  1. The org has the feature enabled (in features list)
   *  2. The user's role is permitted by featureRoleAccess (if restrictions are configured)
   * PLATFORM_ADMIN always returns true (bypasses all restrictions).
   */
  const hasFeature = useCallback((featureKey) => {
    if (!user) return false
    if (user.role === ROLES.PLATFORM_ADMIN) return true
    // Gate 1: org feature enabled
    if (!features.includes(featureKey)) return false
    // Gate 2: role-based access (only enforced when restrictions are configured for this feature)
    if (featureRoleAccess && featureRoleAccess[featureKey]?.length > 0) {
      return featureRoleAccess[featureKey].includes(user.role)
    }
    return true
  }, [user, features, featureRoleAccess])

  const value = {
    token,
    user,
    setUser,               // expose so ProfilePage can update user state after save
    features,
    setFeatures,           // expose so org-feature updates can refresh without re-login
    featureRoleAccess,
    setFeatureRoleAccess,  // expose so BrandingPage can refresh after saving access rules
    loading,
    isAuthenticated: !!user,
    lastUser,
    forgetLastUser,
    login,
    verifyMfa,
    logout,
    can,
    hasFeature,
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
