import { useEffect, useState } from 'react'
import { getAiStatus, aiTemplateAssist } from '../../services/api'

/**
 * Floating "Assist" bar for the PDF / email template builders.
 * Describe a change → the backend calls the configured LLM (scope-locked to template
 * editing) → the returned HTML is applied to the canvas.
 *
 * Props:
 *  - context:   'PDF' | 'EMAIL'   (selects the server-side safety profile)
 *  - getHtml:   () => string       (current canvas HTML)
 *  - onApply:   (html, mode) => void   (mode: 'REWRITE' replaces, 'INSERT' appends)
 *  - suggestions: string[]         (quick-fill chips)
 */
export default function AiAssistBar({ context = 'PDF', getHtml, onApply, suggestions = [] }) {
  const [available, setAvailable] = useState(false)
  const [provider,  setProvider]  = useState(null)
  const [instruction, setInstruction] = useState('')
  const [mode,    setMode]    = useState('REWRITE')   // REWRITE | INSERT
  const [busy,    setBusy]    = useState(false)
  const [notice,  setNotice]  = useState(null)        // { type: 'error'|'info', text }
  const [collapsed, setCollapsed] = useState(false)   // dismissed → show a small reopen pill

  useEffect(() => {
    let alive = true
    getAiStatus()
      .then(s => { if (alive) { setAvailable(!!s?.available); setProvider(s?.provider || null) } })
      .catch(() => { if (alive) setAvailable(false) })
    return () => { alive = false }
  }, [])

  // Collapsed → a small floating pill that reopens the bar.
  if (collapsed) {
    return (
      <button type="button" onClick={() => setCollapsed(false)}
        title="AI assist"
        className="absolute right-4 bottom-4 z-30 inline-flex items-center gap-1.5 rounded-full
                   border border-surface-border dark:border-sidebar-border bg-white dark:bg-sidebar
                   shadow-lg px-3.5 py-2 text-[13px] font-semibold text-accent hover:bg-accent-50 dark:hover:bg-accent/10">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"/>
        </svg>
        Assist
      </button>
    )
  }

  const run = async () => {
    const text = instruction.trim()
    if (!text || busy || !available) return
    setBusy(true)
    setNotice(null)
    try {
      const res = await aiTemplateAssist({
        context,
        mode,
        instruction: text,
        currentHtml: (getHtml?.() || ''),
      })
      if (res?.status === 'OK' && res.html) {
        onApply?.(res.html, res.mode || mode)
        setInstruction('')
        setNotice({ type: 'info', text: 'Applied — use Undo to revert if needed.' })
      } else if (res?.status === 'REFUSED') {
        setNotice({ type: 'error', text: res.message || 'That request is outside what I can help with here.' })
      } else if (res?.status === 'UNAVAILABLE') {
        setNotice({ type: 'error', text: res.message || 'AI assist is not configured.' })
      } else {
        setNotice({ type: 'error', text: res?.message || 'The AI could not complete that request.' })
      }
    } catch (e) {
      setNotice({ type: 'error', text: e?.response?.data?.message || e.message || 'Request failed.' })
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run() } }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-30 w-[min(680px,calc(100%-32px))]">
      <div className="rounded-2xl border border-surface-border dark:border-sidebar-border bg-white dark:bg-sidebar
                      shadow-[0_12px_40px_rgba(20,20,28,0.16)] px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 font-mono text-[10px] font-semibold tracking-wider text-accent
                           bg-accent-50 dark:bg-accent/15 border border-accent/30 rounded-md px-2 py-1">
            ASSIST
          </span>
          <input
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy || !available}
            placeholder={!available
              ? 'AI assist isn’t enabled yet — set it up on the backend'
              : context === 'EMAIL'
                ? 'Describe a change — “add a friendly intro above the button”'
                : 'Describe a change — “add a payment terms clause after the table”'}
            className="flex-1 min-w-0 bg-transparent text-sm text-ink dark:text-white placeholder-ink-4
                       dark:placeholder-sidebar-muted outline-none disabled:cursor-not-allowed"
          />
          {/* Mode toggle */}
          <div className="hidden sm:flex items-center bg-ink-8 dark:bg-sidebar-hover rounded-lg p-0.5 shrink-0">
            {['REWRITE', 'INSERT'].map(m => (
              <button key={m} type="button" onClick={() => setMode(m)} disabled={busy || !available}
                title={m === 'REWRITE' ? 'Replace the whole template' : 'Add a new block only'}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                  mode === m
                    ? 'bg-white dark:bg-sidebar text-ink dark:text-white shadow-sm'
                    : 'text-ink-4 dark:text-sidebar-muted hover:text-ink dark:hover:text-white'
                }`}>
                {m === 'REWRITE' ? 'Rewrite' : 'Insert'}
              </button>
            ))}
          </div>
          <button
            type="button" onClick={run} disabled={busy || !available || !instruction.trim()}
            className="shrink-0 text-[13.5px] font-semibold px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-600
                       text-white transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Working…
              </>
            ) : 'Apply'}
          </button>
          <button type="button" onClick={() => setCollapsed(true)} title="Hide"
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-ink-4 dark:text-sidebar-muted
                       hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Suggestion chips (only when usable) */}
        {available && suggestions.length > 0 && !instruction && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map(s => (
              <button key={s} type="button" onClick={() => setInstruction(s)} disabled={busy}
                className="text-xs px-2.5 py-1 rounded-full border border-surface-border dark:border-sidebar-border
                           text-ink-3 dark:text-sidebar-muted hover:border-accent hover:text-accent transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Setup hint when the backend hasn't enabled AI yet */}
        {!available && (
          <p className="mt-2 text-xs text-ink-4 dark:text-sidebar-muted leading-snug">
            To enable: set <code className="font-mono">AI_ENABLED=true</code> and a provider API key
            (e.g. <code className="font-mono">ANTHROPIC_API_KEY</code>) on the backend, then rebuild.
          </p>
        )}

        {notice && (
          <p className={`mt-2 text-xs ${notice.type === 'error' ? 'text-red-500' : 'text-ink-4 dark:text-sidebar-muted'}`}>
            {notice.text}
          </p>
        )}
      </div>
      {available && provider && (
        <p className="text-center text-[10px] text-ink-5 dark:text-sidebar-muted mt-1">
          AI edits stay within your template · powered by {provider}
        </p>
      )}
    </div>
  )
}
