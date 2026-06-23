/**
 * Platform-wide settings — managed by PLATFORM_ADMIN only, inherited by every
 * organisation, org admin, admin and user across the platform.
 *
 * Backed by the platform settings API (PLATFORM_ADMIN-only):
 *   loadPlatformSettings()  →  GET  /api/platform/settings
 *   savePlatformSettings(s) →  PUT  /api/platform/settings
 *
 * The shape below maps 1:1 onto the backend document; DEFAULT_PLATFORM_SETTINGS
 * is used to fill in any missing keys and as the "reset to defaults" source.
 */

import { http } from '../services/api'

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

/** GET the platform settings (PLATFORM_ADMIN only). Falls back to defaults on error. */
export function loadPlatformSettings() {
  return http.get('/platform/settings')
    .then(r => withDefaults(DEFAULT_PLATFORM_SETTINGS, r.data))
    .catch(() => clone(DEFAULT_PLATFORM_SETTINGS))
}

/** PUT the platform settings; returns the server-sanitised result. */
export function savePlatformSettings(settings) {
  return http.put('/platform/settings', settings)
    .then(r => withDefaults(DEFAULT_PLATFORM_SETTINGS, r.data))
}

/** Deep clone of the defaults — used by "reset to defaults". */
export function defaultPlatformSettings() {
  return clone(DEFAULT_PLATFORM_SETTINGS)
}
