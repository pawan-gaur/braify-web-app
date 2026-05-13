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

export function AuthProvider({ children }) {
  const [token,    setToken]    = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user,     setUser]     = useState(null)
  const [features, setFeatures] = useState([])   // active feature keys for the user's org
  const [loading,  setLoading]  = useState(true)

  /* ── Restore session on mount ── */
  useEffect(() => {
    if (!token) { setLoading(false); return }

    http.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        setUser(r.data)
        setFeatures(extractFeatures(r.data))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        setFeatures([])
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

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    const deviceInfo = `${navigator.userAgent.split(') ')[0].split('(')[1] || 'Browser'}`
    const res  = await http.post('/auth/login', { email, password, deviceInfo })
    const data = res.data
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
      features:           data.features ?? [],
    }
    setUser(userObj)
    setFeatures(extractFeatures({ ...data, role: data.role }))
    return data
  }, [])

  /* ── Logout ── */
  const logout = useCallback(async () => {
    try {
      if (token) {
        await http.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch { /* ignore network errors on logout */ }
    finally {
      setToken(null)
      setUser(null)
      setFeatures([])
    }
  }, [token])

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
   * Returns true if the current user's organisation has the given feature enabled.
   * PLATFORM_ADMIN always returns true (they see everything).
   */
  const hasFeature = useCallback((featureKey) => {
    if (!user) return false
    if (user.role === ROLES.PLATFORM_ADMIN) return true
    return features.includes(featureKey)
  }, [user, features])

  const value = {
    token,
    user,
    setUser,         // expose so ProfilePage can update user state after save
    features,
    setFeatures,     // expose so org-feature updates can refresh without re-login
    loading,
    isAuthenticated: !!user,
    login,
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
