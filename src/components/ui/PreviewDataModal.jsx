import { useState, useEffect, useMemo, useCallback } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   Template Engine — client-side Handlebars-style substitution
   Supports: {{var}}, {{#if}}…{{/if}}, {{#if}}…{{else}}…{{/if}},
             {{#unless}}…{{/unless}}, {{#each items}}…{{/each}},
             {{formatDate field "format"}}, {{formatCurrency field "USD"}},
             {{truncate field N}}, {{uppercase field}}, {{lowercase field}}
───────────────────────────────────────────────────────────────────────────── */

function getVal(data, path) {
  return path.split('.').reduce((obj, k) => obj?.[k], data)
}

const MONTHS_LONG  = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December']
const MONTHS_SHORT = MONTHS_LONG.map(m => m.slice(0, 3))
const DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_SHORT   = DAYS_LONG.map(d => d.slice(0, 3))

function formatDateStr(val, fmt) {
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  return fmt
    .replace('MMMM', MONTHS_LONG[d.getMonth()])
    .replace('MMM',  MONTHS_SHORT[d.getMonth()])
    .replace('MM',   String(d.getMonth() + 1).padStart(2, '0'))
    .replace('M',    String(d.getMonth() + 1))
    .replace('YYYY', String(d.getFullYear()))
    .replace('YY',   String(d.getFullYear()).slice(-2))
    .replace('DD',   String(d.getDate()).padStart(2, '0'))
    .replace('D',    String(d.getDate()))
    .replace('dddd', DAYS_LONG[d.getDay()])
    .replace('ddd',  DAYS_SHORT[d.getDay()])
    .replace('HH',   String(d.getHours()).padStart(2, '0'))
    .replace('H',    String(d.getHours()))
    .replace('hh',   String(d.getHours() % 12 || 12).padStart(2, '0'))
    .replace('h',    String(d.getHours() % 12 || 12))
    .replace('mm',   String(d.getMinutes()).padStart(2, '0'))
    .replace('ss',   String(d.getSeconds()).padStart(2, '0'))
    .replace('A',    d.getHours() < 12 ? 'AM' : 'PM')
    .replace('a',    d.getHours() < 12 ? 'am' : 'pm')
}

export function applyTemplateData(html, data) {
  if (!html) return ''
  let result = html

  // 1. {{#each collection}}…{{/each}} (wrapped in HTML comments)
  result = result.replace(
    /<!--\s*\{\{#each\s+(\w+)\}\}\s*-->([\s\S]*?)<!--\s*\{\{\/each\}\}\s*-->/gi,
    (_, key, tpl) => {
      const items = data[key]
      if (!Array.isArray(items) || !items.length) return ''
      return items.map(item =>
        tpl.replace(/\{\{this\.(\w+)\}\}/g, (m, f) =>
          item[f] !== undefined ? String(item[f]) : m
        )
      ).join('')
    }
  )

  // 2. {{#if var}}…{{else}}…{{/if}}
  result = result.replace(
    /<!--\s*\{\{#if\s+(\w+)\}\}\s*-->([\s\S]*?)<!--\s*\{\{else\}\}\s*-->([\s\S]*?)<!--\s*\{\{\/if\}\}\s*-->/gi,
    (_, key, truePart, falsePart) => (data[key] ? truePart : falsePart)
  )

  // 3. {{#if var}}…{{/if}} (no else)
  result = result.replace(
    /<!--\s*\{\{#if\s+(\w+)\}\}\s*-->([\s\S]*?)<!--\s*\{\{\/if\}\}\s*-->/gi,
    (_, key, content) => (data[key] ? content : '')
  )

  // 4. {{#unless var}}…{{/unless}}
  result = result.replace(
    /<!--\s*\{\{#unless\s+(\w+)\}\}\s*-->([\s\S]*?)<!--\s*\{\{\/unless\}\}\s*-->/gi,
    (_, key, content) => (!data[key] ? content : '')
  )

  // 5. {{formatDate field "format"}}
  result = result.replace(
    /\{\{formatDate\s+(\S+)\s+["']([^"']+)["']\}\}/g,
    (m, key, fmt) => {
      const val = getVal(data, key)
      if (!val) return m
      try { return formatDateStr(val, fmt) } catch { return m }
    }
  )

  // 6. {{formatCurrency field "USD"}}
  result = result.replace(
    /\{\{formatCurrency\s+(\S+)\s+["']([^"']+)["']\}\}/g,
    (m, key, currency) => {
      const val = getVal(data, key)
      if (val == null) return m
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(val))
      } catch { return m }
    }
  )

  // 7. {{truncate field N}}
  result = result.replace(
    /\{\{truncate\s+(\S+)\s+(\d+)\}\}/g,
    (m, key, len) => {
      const val = getVal(data, key)
      if (!val) return m
      const s = String(val), n = parseInt(len)
      return s.length > n ? s.slice(0, n) + '…' : s
    }
  )

  // 8. {{uppercase field}} / {{lowercase field}}
  result = result.replace(/\{\{uppercase\s+(\S+)\}\}/g, (m, key) => {
    const v = getVal(data, key); return v != null ? String(v).toUpperCase() : m
  })
  result = result.replace(/\{\{lowercase\s+(\S+)\}\}/g, (m, key) => {
    const v = getVal(data, key); return v != null ? String(v).toLowerCase() : m
  })

  // 9. Simple {{var}} — must be last
  result = result.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (m, key) => {
    const k = key.trim()
    if (k.startsWith('#') || k.startsWith('/')) return m  // block tags — already handled
    const val = getVal(data, k)
    return val !== undefined && val !== null ? String(val) : m
  })

  return result
}

/* ── Auto-generate sample data from template HTML ───────────────────────────── */
export function generateSampleData(html) {
  const data = {}

  // Helper extractors
  const helperPatterns = [
    { re: /\{\{formatDate\s+(\S+)/g,    type: 'date'     },
    { re: /\{\{formatCurrency\s+(\S+)/g, type: 'currency' },
    { re: /\{\{truncate\s+(\S+)/g,      type: 'text'     },
    { re: /\{\{uppercase\s+(\S+)/g,     type: 'text'     },
    { re: /\{\{lowercase\s+(\S+)/g,     type: 'text'     },
  ]
  helperPatterns.forEach(({ re, type }) => {
    let m
    const localRe = new RegExp(re.source, re.flags)
    while ((m = localRe.exec(html)) !== null) {
      const key = m[1].trim()
      if (!data[key]) {
        if (type === 'date')     data[key] = '2024-01-15'
        else if (type === 'currency') data[key] = 149.99
        else data[key] = 'Sample text content for preview'
      }
    }
  })

  // Conditional vars
  let m
  const ifRe = /\{\{#if\s+(\w+)\}\}/g
  while ((m = ifRe.exec(html)) !== null) {
    if (data[m[1]] === undefined) data[m[1]] = true
  }
  const unlessRe = /\{\{#unless\s+(\w+)\}\}/g
  while ((m = unlessRe.exec(html)) !== null) {
    if (data[m[1]] === undefined) data[m[1]] = false
  }

  // Loop / each collections + their fields
  const eachRe = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g
  while ((m = eachRe.exec(html)) !== null) {
    const [, collectionKey, body] = m
    if (!data[collectionKey]) {
      const fields = {}
      const fieldRe = /\{\{this\.(\w+)\}\}/g
      let f
      while ((f = fieldRe.exec(body)) !== null) {
        const fk = f[1]
        if (/price|amount|total|cost|fee/i.test(fk)) fields[fk] = 29.99
        else if (/qty|count|num|quantity/i.test(fk)) fields[fk] = 2
        else if (/url|link|href/i.test(fk))          fields[fk] = 'https://example.com'
        else if (/date/i.test(fk))                   fields[fk] = '2024-01-15'
        else                                          fields[fk] = `Sample ${fk}`
      }
      if (!Object.keys(fields).length) {
        fields.name = 'Item One'; fields.value = '$19.99'
      }
      const row1 = { ...fields }
      const row2 = Object.fromEntries(Object.entries(fields).map(([k, v]) =>
        [k, typeof v === 'number' ? +(v * 2).toFixed(2) : `Second ${k}`]
      ))
      data[collectionKey] = [row1, row2]
    }
  }

  // Simple {{var}} — skip already-resolved and block helpers
  const simpleRe = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
  while ((m = simpleRe.exec(html)) !== null) {
    const key = m[1].trim()
    if (key.startsWith('#') || key.startsWith('/')) continue
    if (data[key] !== undefined) continue
    const lk = key.toLowerCase()
    if (/date/.test(lk))                              data[key] = '2024-01-15'
    else if (/amount|price|total|cost|fee/.test(lk))  data[key] = 149.99
    else if (/count|qty|num|quantity/.test(lk))       data[key] = 3
    else if (/url|link|href/.test(lk))                data[key] = 'https://example.com'
    else if (/email/.test(lk))                        data[key] = 'user@example.com'
    else if (/phone|mobile/.test(lk))                 data[key] = '+1 (555) 123-4567'
    else if (/firstname|first_name/.test(lk))         data[key] = 'John'
    else if (/lastname|last_name/.test(lk))           data[key] = 'Doe'
    else if (/fullname|full_name|recipient/.test(lk)) data[key] = 'John Doe'
    else if (/name/.test(lk))                         data[key] = 'John Doe'
    else if (/company/.test(lk))                      data[key] = 'Acme Corporation'
    else if (/address/.test(lk))                      data[key] = '123 Main St, New York, NY 10001'
    else if (/otp|code/.test(lk))                     data[key] = '847291'
    else if (/title|subject|heading/.test(lk))        data[key] = 'Your Important Update'
    else if (/message|body|content|description/.test(lk)) data[key] = 'This is sample preview content for your email template.'
    else if (/expiry|expires|minutes/.test(lk))       data[key] = '30'
    else if (/id$/.test(lk))                          data[key] = `ORD-${Math.floor(10000 + Math.random() * 90000)}`
    else if (/logo/.test(lk))                         data[key] = 'https://placehold.co/120x40/6366f1/fff?text=LOGO'
    else if (/image|photo|avatar|thumb/.test(lk))     data[key] = 'https://placehold.co/300x200/eef2ff/6366f1?text=Image'
    else                                              data[key] = `Sample ${key.replace(/_/g, ' ')}`
  }

  return data
}

/* ─────────────────────────────────────────────────────────────────────────────
   PreviewDataModal Component
───────────────────────────────────────────────────────────────────────────── */

/**
 * PreviewDataModal
 *
 * Props:
 *   getHtml   – () => string   current editor HTML
 *   getCss    – () => string   current editor CSS
 *   meta      – { name, subject }
 *   onClose   – () => void
 */
export default function PreviewDataModal({ getHtml, getCss, meta, onClose }) {
  const [jsonText,     setJsonText]     = useState('')
  const [parsedData,   setParsedData]   = useState({})
  const [parseError,   setParseError]   = useState(null)
  const [originalHtml, setOriginalHtml] = useState('')
  const [originalCss,  setOriginalCss]  = useState('')
  const [previewTab,   setPreviewTab]   = useState('rendered') // 'rendered' | 'source'
  const [activeField,  setActiveField]  = useState(null) // highlighted field in JSON

  /* ── On mount: snapshot editor content + auto-generate data ── */
  useEffect(() => {
    const html = getHtml()
    const css  = getCss()
    setOriginalHtml(html)
    setOriginalCss(css)
    const sample = generateSampleData(html)
    const text   = JSON.stringify(sample, null, 2)
    setJsonText(text)
    setParsedData(sample)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleJsonChange = useCallback((text) => {
    setJsonText(text)
    try {
      const parsed = JSON.parse(text)
      setParsedData(parsed)
      setParseError(null)
    } catch (e) {
      setParseError(e.message)
    }
  }, [])

  const handleRegenerate = () => {
    const sample = generateSampleData(originalHtml)
    const text   = JSON.stringify(sample, null, 2)
    setJsonText(text)
    setParsedData(sample)
    setParseError(null)
  }

  /* ── Compute substituted HTML ── */
  const substitutedHtml = useMemo(() => {
    return applyTemplateData(originalHtml, parsedData)
  }, [originalHtml, parsedData])

  const iframeDoc = useMemo(() => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${meta?.subject || meta?.name || 'Preview'}</title>
  <style>
    body { margin: 0; padding: 24px; background: #d1d5db; font-family: Arial, sans-serif; }
    * { max-width: 100% !important; box-sizing: border-box; }
    ${originalCss}
  </style>
</head>
<body>${substitutedHtml}</body>
</html>`, [substitutedHtml, originalCss, meta])

  /* ── Detect variable list for summary ── */
  const detectedVars = useMemo(() => Object.keys(parsedData), [parsedData])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden
                   border border-gray-200 dark:border-gray-700"
        style={{ width: '92vw', maxWidth: 1200, height: '90vh' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
                            flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                     -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Preview with Data</h2>
              <p className="text-xs text-gray-400">
                {meta?.name || 'Email template'} · {detectedVars.length} variable{detectedVars.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Regenerate */}
            <button
              onClick={handleRegenerate}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                         text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600
                         dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Auto-fill data
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Left: JSON editor ── */}
          <div className="w-[380px] shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
                Sample Data (JSON)
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Edit values to see them applied in the preview. Arrays render loops, booleans control conditionals.
              </p>
            </div>

            {/* JSON textarea */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              <textarea
                className={`absolute inset-0 w-full h-full resize-none font-mono text-[11px] leading-relaxed
                            p-4 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200
                            focus:outline-none transition-colors
                            ${parseError
                              ? 'border-l-2 border-red-400'
                              : 'border-l-2 border-transparent focus:border-indigo-400'
                            }`}
                value={jsonText}
                onChange={e => handleJsonChange(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Error / status bar */}
            <div className={`px-4 py-2 shrink-0 border-t transition-colors ${
              parseError
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30'
            }`}>
              {parseError ? (
                <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                         c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  {parseError}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400">
                  ✓ Valid JSON · {detectedVars.length} variables
                </p>
              )}
            </div>

            {/* Variable quick-fill chips */}
            {detectedVars.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 shrink-0
                              flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {detectedVars.map(key => {
                  const val = parsedData[key]
                  const isArray   = Array.isArray(val)
                  const isBool    = typeof val === 'boolean'
                  const isNum     = typeof val === 'number'
                  return (
                    <button
                      key={key}
                      title={isArray ? `${val.length} items` : String(val)}
                      onClick={() => {
                        setActiveField(key)
                        // Toggle booleans on click
                        if (isBool) {
                          const updated = { ...parsedData, [key]: !val }
                          const text    = JSON.stringify(updated, null, 2)
                          setJsonText(text)
                          setParsedData(updated)
                        }
                      }}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all
                        ${activeField === key
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : isArray
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : isBool
                          ? (val
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500')
                          : isNum
                          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                      {isArray ? `[${val.length}] ${key}` : isBool ? `${key}: ${val}` : key}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Right: Preview ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
              {[
                { key: 'rendered', label: 'Rendered Preview', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
                { key: 'source',   label: 'HTML Source',      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setPreviewTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                              transition-colors ${
                    previewTab === tab.key
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon}/>
                  </svg>
                  {tab.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                {/* Substitution stats */}
                <SubstStat html={originalHtml} substituted={substitutedHtml} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              {previewTab === 'rendered' ? (
                <iframe
                  key={iframeDoc.length} // force remount when content changes significantly
                  title="Template preview"
                  srcDoc={iframeDoc}
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin"
                />
              ) : (
                <pre className="w-full h-full overflow-auto p-5 text-[11px] font-mono leading-relaxed
                                text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50
                                whitespace-pre-wrap break-all">
                  {substitutedHtml || '(empty)'}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Substitution stat badge ──────────────────────────────────────────────── */
function SubstStat({ html, substituted }) {
  const unresolvedCount = useMemo(() => {
    if (!substituted) return 0
    const matches = substituted.match(/\{\{[^}]+\}\}/g) || []
    return matches.length
  }, [substituted])

  const resolvedCount = useMemo(() => {
    const origCount = (html?.match(/\{\{[^}]+\}\}/g) || []).length
    return Math.max(0, origCount - unresolvedCount)
  }, [html, unresolvedCount])

  return (
    <div className="flex items-center gap-2 text-[11px]">
      {resolvedCount > 0 && (
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
          {resolvedCount} resolved
        </span>
      )}
      {unresolvedCount > 0 && (
        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {unresolvedCount} unresolved
        </span>
      )}
    </div>
  )
}
