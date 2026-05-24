import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'
import { FEATURES } from '../../config/features'

/* ─── Command catalog ────────────────────────────────────────────────────── */
function buildCommands(navigate, ctx) {
  const { isOrgAdmin, isPlatformAdmin, hasFeature } = ctx

  const cmds = []
  const add = (cmd) => cmds.push(cmd)

  // Navigation
  add({ id: 'nav-dashboard',  group: 'Navigate', label: 'Dashboard',       hint: 'Home',   action: () => navigate('/dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3' })

  if (hasFeature(FEATURES.PDF_TEMPLATES)) {
    add({ id: 'nav-templates',  group: 'Navigate', label: 'PDF Templates',    action: () => navigate('/templates'),  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z' })
    add({ id: 'create-pdf',     group: 'Create',   label: 'New PDF template', hint: '⇧N',  action: () => navigate('/builder'),    icon: 'M12 4v16m8-8H4' })
    add({ id: 'generate-pdf',   group: 'Create',   label: 'Generate PDF',     action: () => navigate('/generate'),   icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M7 10l5-7 5 7' })
  }
  if (hasFeature(FEATURES.EMAIL_TEMPLATES)) {
    add({ id: 'nav-email',      group: 'Navigate', label: 'Email Templates',  action: () => navigate('/email-templates'), icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
    add({ id: 'create-email',   group: 'Create',   label: 'New email template', action: () => navigate('/email-builder'), icon: 'M12 4v16m8-8H4' })
  }
  if (hasFeature(FEATURES.E_SIGN)) {
    add({ id: 'nav-esign',      group: 'Navigate', label: 'E-Sign Documents', action: () => navigate('/esign'),      icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' })
    add({ id: 'create-esign',   group: 'Create',   label: 'New e-sign document', action: () => navigate('/esign/new'), icon: 'M12 4v16m8-8H4' })
  }
  if (hasFeature(FEATURES.FILE_STORAGE)) {
    add({ id: 'nav-files',      group: 'Navigate', label: 'Files',            action: () => navigate('/files'),      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' })
  }

  // Admin
  if (isOrgAdmin) {
    add({ id: 'admin-users',     group: 'Admin', label: 'Manage users',          action: () => navigate('/users'),         icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857' })
    add({ id: 'admin-sessions',  group: 'Admin', label: 'Active sessions',       action: () => navigate('/sessions'),      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
    add({ id: 'admin-usage',     group: 'Admin', label: 'Usage & quotas',        action: () => navigate('/usage'),         icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10' })
    add({ id: 'admin-org',       group: 'Admin', label: 'Organization settings', action: () => navigate('/settings/org-settings'), icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z' })
    add({ id: 'admin-api-keys',  group: 'Admin', label: 'API keys',              action: () => navigate('/settings/api-keys'), icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' })
    add({ id: 'admin-shared',    group: 'Admin', label: 'Shared templates',      action: () => navigate('/shared-templates'), icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684' })
  }
  if (isPlatformAdmin) {
    add({ id: 'pa-orgs',         group: 'Platform', label: 'Organizations',     action: () => navigate('/organizations'),       icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5' })
    add({ id: 'pa-onboarding',   group: 'Platform', label: 'Onboarding requests', action: () => navigate('/onboarding-requests'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' })
  }

  // Personal
  add({ id: 'nav-profile',      group: 'Personal', label: 'My profile',  action: () => navigate('/profile'),   icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' })
  add({ id: 'nav-audit',        group: 'Personal', label: 'Audit log',   action: () => navigate('/audit-log'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' })

  return cmds
}

/* ─── Fuzzy filter ───────────────────────────────────────────────────────── */
function score(cmd, q) {
  if (!q) return 1
  const qLower = q.toLowerCase()
  const lbl = cmd.label.toLowerCase()
  if (lbl.startsWith(qLower)) return 100
  if (lbl.includes(qLower))   return 50
  // Subsequence match
  let qi = 0
  for (let i = 0; i < lbl.length && qi < qLower.length; i++) {
    if (lbl[i] === qLower[qi]) qi++
  }
  return qi === qLower.length ? 10 : 0
}

/* ─── Main palette ───────────────────────────────────────────────────────── */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { user, hasFeature } = useAuth()
  const isPlatformAdmin = user?.role === ROLES.PLATFORM_ADMIN
  const isOrgAdmin = user?.role === ROLES.ORG_ADMIN || isPlatformAdmin

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  const allCmds = useMemo(
    () => buildCommands(navigate, { isOrgAdmin, isPlatformAdmin, hasFeature }),
    [navigate, isOrgAdmin, isPlatformAdmin, hasFeature]
  )

  const results = useMemo(() => {
    return allCmds
      .map(c => ({ c, s: score(c, query) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ c }) => c)
  }, [allCmds, query])

  // Group results
  const grouped = useMemo(() => {
    const map = new Map()
    for (const c of results) {
      if (!map.has(c.group)) map.set(c.group, [])
      map.get(c.group).push(c)
    }
    return map
  }, [results])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Keyboard navigation
  const run = useCallback((cmd) => {
    onClose()
    setTimeout(() => cmd.action(), 50)
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter')     { e.preventDefault(); if (results[active]) run(results[active]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, onClose, run])

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4
                 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-card shadow-modal border border-ink-7
                   overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-7">
          <svg className="w-5 h-5 text-ink-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0) }}
            placeholder="Search commands..."
            className="flex-1 bg-transparent outline-none text-[15px] text-ink placeholder-ink-5"
          />
          <kbd className="kbd">esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-ink-3">No matching commands.</p>
              <p className="text-xs text-ink-5 mt-1">Try a different keyword.</p>
            </div>
          ) : (
            (() => {
              let idx = -1
              return Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group} className="mb-1.5 last:mb-0">
                  <p className="text-eyebrow px-4 py-1.5">{group}</p>
                  {items.map(cmd => {
                    idx++
                    const i = idx
                    const isActive = i === active
                    return (
                      <div
                        key={cmd.id}
                        data-idx={i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => run(cmd)}
                        className={`mx-2 px-3 py-2.5 rounded-input flex items-center gap-3 cursor-pointer
                          transition-colors duration-100
                          ${isActive ? 'bg-brand-50 text-brand' : 'text-ink hover:bg-ink-9'}`}
                      >
                        <svg className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand' : 'text-ink-4'}`}
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={cmd.icon}/>
                        </svg>
                        <span className="flex-1 text-sm font-medium truncate">{cmd.label}</span>
                        {cmd.hint && <kbd className="kbd">{cmd.hint}</kbd>}
                        {isActive && (
                          <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h14"/>
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            })()
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-ink-7 bg-ink-9">
          <div className="flex items-center gap-3 text-[11px] text-ink-4">
            <span className="flex items-center gap-1"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="kbd">↵</kbd> run</span>
          </div>
          <p className="text-[11px] text-ink-5">Braify Command Palette</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Global trigger hook ────────────────────────────────────────────────── */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return { open, setOpen, close: () => setOpen(false), openPalette: () => setOpen(true) }
}
