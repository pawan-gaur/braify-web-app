import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * List state (page, page size, filters, search, tab…) kept in the URL query string, so opening a
 * record and pressing Back — or refreshing, or sharing the link — returns to the same page with
 * the same filters.
 *
 *   const [q, setQ] = useUrlState({ page: 0, size: 20, status: '', search: '' })
 *   setQ({ status: 'PENDING', page: 0 })          // patch (merged)
 *   setQ(prev => ({ page: prev.page + 1 }))       // or an updater
 *
 * - Types follow the defaults: numbers → Number, booleans → 'true'/'false', strings as-is.
 * - Values equal to their default are left out of the URL (clean links).
 * - `prefix` namespaces keys when one page has two lists (e.g. prefix 'b' → `b_page`).
 * - Updates use history.replace, so filtering/paging doesn't add Back steps; query keys this
 *   hook doesn't own (e.g. `tab`, `checkout`) are preserved.
 * - Several patches in the same tick are merged into one navigation.
 * - The list's current query string is remembered for this browser tab, so "← Back" buttons,
 *   breadcrumbs and post-save redirects can return to it with {@link listUrl}.
 */
export default function useUrlState(defaults, { prefix = '' } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const key = k => (prefix ? `${prefix}_${k}` : k)

  // Defaults are a literal at the call site — keep the first one so memo deps stay stable.
  const defaultsRef = useRef(defaults)
  const defs = defaultsRef.current

  const state = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const out = {}
    for (const [k, d] of Object.entries(defs)) {
      const raw = params.get(key(k))
      out[k] = raw === null ? d : coerce(raw, d)
    }
    return out
  }, [location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { rememberListSearch(location.pathname, location.search) }, [location.pathname, location.search])

  const pending = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const setState = useCallback(patch => {
    const base = pending.current ?? stateRef.current
    const next = { ...base, ...(typeof patch === 'function' ? patch(base) : patch) }
    const first = pending.current === null
    pending.current = next
    if (!first) return
    queueMicrotask(() => {
      const target = pending.current
      pending.current = null
      // Read the live URL (not a render snapshot) so keys owned by others are kept.
      const params = new URLSearchParams(window.location.search)
      for (const [k, d] of Object.entries(defs)) {
        const v = target[k]
        if (v === undefined || v === null || v === d || (v === '' && d === '')) params.delete(key(k))
        else params.set(key(k), String(v))
      }
      const search = params.toString()
      if (`?${search}` === window.location.search || (!search && !window.location.search)) return
      navigate({ pathname: window.location.pathname, search: search ? `?${search}` : '', hash: window.location.hash },
               { replace: true, state: window.history.state?.usr })
    })
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setState]
}

function coerce(raw, d) {
  if (typeof d === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : d
  }
  if (typeof d === 'boolean') return raw === 'true'
  return raw
}

const LIST_KEY = path => `braify:list:${path}`

function rememberListSearch(path, search) {
  try { sessionStorage.setItem(LIST_KEY(path), search || '') } catch { /* storage unavailable */ }
}

/**
 * The list page at `path` as the user last left it (page, filters, tab…), e.g. "/esign?page=1".
 * Use for in-app Back buttons, breadcrumbs and "after save" redirects instead of the bare path.
 */
export function listUrl(path) {
  try {
    const search = sessionStorage.getItem(LIST_KEY(path))
    return search ? path + search : path
  } catch {
    return path
  }
}
