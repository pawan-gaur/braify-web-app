import { useEffect, useState } from 'react'
import { esignSuggestContacts } from '../services/api'

/**
 * Recipient "memory" for the send-flow autocomplete.
 *
 * The org's address book is fetched ONCE per session and cached at module scope, so
 * suggestions are instant (filtered locally on each keystroke — no per-keystroke network).
 * Subsequent mounts reuse the cache immediately.
 */

let _cache = null        // resolved array of { name, email, useCount }
let _promise = null      // in-flight fetch (deduped)
const _subscribers = new Set()

function notify() {
  // Hand out a fresh array each time so subscribers actually re-render (a mutated
  // same-reference array would be skipped by React's Object.is bail-out).
  _subscribers.forEach(fn => fn(_cache ? [..._cache] : []))
}

/** Kicks off (or reuses) the one-time fetch. Returns a promise resolving to the list. */
export function primeEmailContacts() {
  if (_cache) return Promise.resolve(_cache)
  if (!_promise) {
    _promise = esignSuggestContacts()
      .then(list => { _cache = Array.isArray(list) ? list : []; notify(); return _cache })
      .catch(() => { _cache = []; notify(); return _cache })
  }
  return _promise
}

/**
 * Optimistically add/bump just-used recipients so they're suggestible right away,
 * before the server round-trips. Keeps the local cache consistent within the session.
 */
export function addLocalContacts(recipients = []) {
  if (!_cache) _cache = []
  let changed = false
  for (const r of recipients) {
    const email = (r?.email || '').trim().toLowerCase()
    if (!email) continue
    const name = (r?.name || '').trim()
    const existing = _cache.find(c => c.email === email)
    if (existing) {
      existing.useCount = (existing.useCount || 0) + 1
      if (name && !existing.name) existing.name = name
    } else {
      _cache.push({ email, name, useCount: 1 })
    }
    changed = true
  }
  if (changed) {
    _cache.sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
    notify()
  }
}

export default function useEmailContacts() {
  const [contacts, setContacts] = useState(_cache || [])

  useEffect(() => {
    _subscribers.add(setContacts)
    if (_cache) setContacts(_cache)
    else primeEmailContacts()
    return () => { _subscribers.delete(setContacts) }
  }, [])

  return contacts
}
