/**
 * Returns a same-origin app path ("/x?y#z") for a post-login destination, or null.
 *
 * Parses with the URL parser — the same way the browser would — so tricks like "//evil.com",
 * "/\\evil.com" or control characters ("/\t/evil.com", which the parser turns into
 * "//evil.com") can never leave the app or make history.replaceState throw.
 */
export function safeAppPath(next) {
  if (typeof next !== 'string' || !next.startsWith('/')) return null
  try {
    const u = new URL(next, window.location.origin)
    if (u.origin !== window.location.origin) return null
    // "/.//evil.com" normalises to the pathname "//evil.com" — protocol-relative; refuse it.
    if (u.pathname.startsWith('//')) return null
    return u.pathname + u.search + u.hash
  } catch {
    return null
  }
}
