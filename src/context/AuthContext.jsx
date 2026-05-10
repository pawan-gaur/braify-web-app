import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { http } from '../services/api'

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

/* ── Context ─────────────────────────────────────────────────────────────── */
const AuthCtx = createContext(null)

const TOKEN_KEY = 'pdf-builder-token'

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user,    setUser]    = useState(null)   // { id, email, firstName, lastName, role, organizationId, organizationName, profilePicture, mustChangePassword }
  const [loading, setLoading] = useState(true)   // true while verifying stored token on mount

  /* ── Restore session on mount ── */
  useEffect(() => {
    if (!token) { setLoading(false); return }

    http.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setUser(r.data))
      .catch(() => {
        // Token expired or revoked — clear it
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
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
    const res = await http.post('/auth/login', { email, password, deviceInfo })
    const data = res.data
    setToken(data.token)
    setUser({
      id:                 data.userId,
      email:              data.email,
      firstName:          data.firstName,
      lastName:           data.lastName,
      role:               data.role,
      organizationId:     data.organizationId,
      organizationName:   data.organizationName,
      profilePicture:     data.profilePicture,
      mustChangePassword: data.mustChangePassword,
    })
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

  const value = {
    token,
    user,
    setUser,   // expose so ProfilePage can update user state after save
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    can,
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
