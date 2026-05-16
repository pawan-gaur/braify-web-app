/**
 * Date / time utilities — all backend timestamps are UTC.
 *
 * Root cause of the timezone bug:
 *   Spring Boot serializes LocalDateTime as "2026-05-16T09:51:00" (no 'Z').
 *   JavaScript's new Date("2026-05-16T09:51:00") treats strings without a
 *   timezone indicator as LOCAL time, so the UTC value is displayed as-is
 *   instead of being shifted to the user's local timezone.
 *
 * Fix:
 *   parseUtc() appends 'Z' when the string has no timezone indicator.
 *   new Date("2026-05-16T09:51:00Z") is always parsed as UTC, and
 *   toLocaleString() / toLocaleDateString() then shift to the browser's timezone.
 *
 *   The backend JacksonConfig also now serializes LocalDateTime with a trailing
 *   'Z', so this utility is correct both for legacy data and new responses.
 */

/**
 * Parse a backend ISO timestamp as UTC.
 * Safe to call with null / undefined — returns null.
 *
 * @param {string|null|undefined} iso
 * @returns {Date|null}
 */
export function parseUtc(iso) {
  if (!iso) return null
  const s = String(iso).trim()
  // Already contains explicit timezone info → parse as-is
  if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s)
  // No timezone indicator → treat as UTC by appending Z
  return new Date(s + 'Z')
}

/**
 * Format a backend timestamp as date + time in the user's local timezone.
 *
 * @param {string|null}  iso
 * @param {Intl.DateTimeFormatOptions} [opts]
 * @returns {string}
 *
 * @example
 * fmtDateTime('2026-05-16T09:51:00')
 * // → "16 May 2026, 03:21 pm"  (for a UTC+5:30 browser)
 */
export function fmtDateTime(iso, opts) {
  const d = parseUtc(iso)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleString(undefined, opts ?? {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Format a backend timestamp as date only in the user's local timezone.
 *
 * @param {string|null}  iso
 * @param {Intl.DateTimeFormatOptions} [opts]
 * @returns {string}
 *
 * @example
 * fmtDate('2026-05-16T09:51:00')
 * // → "16 May 2026"
 */
export function fmtDate(iso, opts) {
  const d = parseUtc(iso)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleDateString(undefined, opts ?? {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/**
 * Format a backend timestamp for e-sign / audit contexts (en-GB locale,
 * short month, 24-hour time).
 *
 * @param {string|null} iso
 * @returns {string}
 *
 * @example
 * fmtDateTimeGB('2026-05-16T09:51:00')
 * // → "16 May 2026, 15:21"  (for UTC+5:30)
 */
export function fmtDateTimeGB(iso) {
  const d = parseUtc(iso)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Relative time label: "2 minutes ago", "3 hours ago", "5 days ago".
 * For timestamps older than 30 days, falls back to fmtDate().
 *
 * @param {string|null} iso
 * @returns {string}
 */
export function fmtRelative(iso) {
  const d = parseUtc(iso)
  if (!d || isNaN(d)) return '—'
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days  < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return fmtDate(iso)
}
