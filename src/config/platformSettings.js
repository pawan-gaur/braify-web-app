/**
 * Platform-wide settings — managed by PLATFORM_ADMIN only, inherited by every
 * organisation, org admin, admin and user across the platform.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * FRONTEND-ONLY persistence for now: settings are stored in localStorage so the
 * UI is fully functional while the backend is designed. The ONLY integration
 * points to swap later are `loadPlatformSettings()` / `savePlatformSettings()`:
 *
 *   loadPlatformSettings()  →  GET  /api/platform/settings
 *   savePlatformSettings(s) →  PUT  /api/platform/settings
 *
 * The shape below is intended to map 1:1 onto the backend document.
 * ──────────────────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'braify-platform-settings'

export const DEFAULT_PLATFORM_SETTINGS = {
  security: {
    mfa: {
      required: true,    // mandatory for all users platform-wide
      totp:     true,    // authenticator apps (Google Authenticator, Authy…)
      emailOtp: true,    // email one-time passcode fallback
    },
    password: {
      minLength:        12,
      requireUpper:     true,
      requireLower:     true,
      requireDigit:     true,
      requireSymbol:    true,
      expiryDays:       90,    // 0 = never expires
      reuseRestriction: true,
      reuseCount:       5,     // block last N passwords
    },
    lockout: {
      maxFailedAttempts: 5,
      lockoutMinutes:    30,
    },
    sessions: {
      sessionTimeoutHours: 8,
      idleTimeoutMinutes:  30,
      maxConcurrent:       3,
    },
  },
  access: {
    allowSelfSignup:                 false,
    requireEmailVerification:        true,
    defaultRole:                     'USER',
    forcePasswordChangeOnFirstLogin: true,
    allowProfileSelfEdit:            true,
  },
}

/* Deep clone via JSON — settings are plain serialisable objects. */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/* Recursively fill in any keys missing from a stored payload using defaults,
 * so newly-added settings appear with their default value. */
function withDefaults(defaults, stored) {
  if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
    return stored ?? defaults
  }
  const out = clone(defaults)
  for (const key of Object.keys(defaults)) {
    if (key in stored) {
      out[key] = (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key]))
        ? withDefaults(defaults[key], stored[key])
        : stored[key]
    }
  }
  return out
}

export function loadPlatformSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(DEFAULT_PLATFORM_SETTINGS)
    return withDefaults(DEFAULT_PLATFORM_SETTINGS, JSON.parse(raw))
  } catch {
    return clone(DEFAULT_PLATFORM_SETTINGS)
  }
}

export function savePlatformSettings(settings) {
  // TODO(backend): replace with `return http.put('/platform/settings', settings).then(r => r.data)`
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  return Promise.resolve(settings)
}

export { STORAGE_KEY as PLATFORM_SETTINGS_KEY }
