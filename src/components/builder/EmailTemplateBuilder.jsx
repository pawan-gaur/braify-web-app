import { useEffect, useRef, useState, useCallback } from 'react'
import grapesjs from 'grapesjs'
import { EMAIL_EDITOR_CONFIG } from './email-grapes-config'
import PreviewDataModal from '../ui/PreviewDataModal'
import '../../styles/builder.css'

const DEVICES = ['Desktop Email', 'Tablet', 'Mobile']

const DEVICE_ICONS = {
  'Desktop Email': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  ),
  Tablet: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2}/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01"/>
    </svg>
  ),
  Mobile: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={2}/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01"/>
    </svg>
  ),
}

const CATEGORIES = [
  { value: '', label: 'None' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'marketing',     label: 'Marketing' },
  { value: 'onboarding',    label: 'Onboarding' },
  { value: 'notification',  label: 'Notification' },
  { value: 'custom',        label: 'Custom' },
]

/** Common merge-tag presets users can click to insert */
const PRESET_VARS = [
  'first_name', 'last_name', 'full_name', 'email',
  'company_name', 'company_address', 'company_logo',
  'product_name', 'order_id', 'order_date', 'order_total',
  'invoice_number', 'due_date', 'amount',
  'otp_code', 'expiry_minutes', 'reset_url',
  'unsubscribe_url', 'site_url', 'support_email',
]

export default function EmailTemplateBuilder({
  initialTemplate, libraryTemplate, onSave, isSaving, templateId, onTestSend,
}) {
  const editorRef  = useRef(null)
  const mountedRef = useRef(false)

  /* ── Panel state ── */
  const [activePanel,  setActivePanel]  = useState('blocks')
  const [activeRight,  setActiveRight]  = useState('styles')
  const [activeDevice, setActiveDevice] = useState('Desktop Email')

  /* ── Block search ── */
  const [blockSearch, setBlockSearch] = useState('')

  /* ── Merge-tag state ── */
  const [placeholders, setPlaceholders] = useState([])
  const [customVar,    setCustomVar]    = useState('')

  /* ── Test send modal ── */
  const [showTestModal,   setShowTestModal]   = useState(false)
  const [testTo,          setTestTo]          = useState('')
  const [testSending,     setTestSending]     = useState(false)

  /* ── Preview with data modal ── */
  const [showPreviewData, setShowPreviewData] = useState(false)

  /* ── Copy HTML feedback ── */
  const [copied, setCopied] = useState(false)

  /* ── Template meta — seed from library template if provided ── */
  const seedMeta = libraryTemplate
    ? {
        name:        libraryTemplate.name        || 'Untitled Email',
        description: libraryTemplate.description || '',
        subject:     '',
        previewText: '',
        fromName:    '',
        category:    libraryTemplate.category    || '',
        tags:        (libraryTemplate.tags || []).join(', '),
      }
    : {
        name:        initialTemplate?.name        || 'Untitled Email',
        description: initialTemplate?.description || '',
        subject:     initialTemplate?.subject     || '',
        previewText: initialTemplate?.previewText || '',
        fromName:    initialTemplate?.fromName    || '',
        category:    initialTemplate?.category    || '',
        tags:        initialTemplate?.tags        || '',
      }
  const [meta, setMeta] = useState(seedMeta)

  const setField = (key, val) => setMeta(prev => ({ ...prev, [key]: val }))

  /* ── Placeholder extraction ── */
  const refreshPlaceholders = useCallback((html) => {
    const unique = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))]
    setPlaceholders(unique)
  }, [])

  /* ── GrapesJS init ── */
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const editor = grapesjs.init(EMAIL_EDITOR_CONFIG('email-gjs-canvas'))
    editorRef.current = editor

    if (libraryTemplate?.htmlContent) {
      // New template seeded from the library
      editor.setComponents(libraryTemplate.htmlContent)
      refreshPlaceholders(libraryTemplate.htmlContent)
    } else if (initialTemplate?.gjsData) {
      try { editor.loadProjectData(JSON.parse(initialTemplate.gjsData)) }
      catch {
        editor.setComponents(initialTemplate.htmlContent || '')
        editor.setStyle(initialTemplate.cssContent || '')
      }
    }

    editor.on('component:update component:add component:remove', () => {
      refreshPlaceholders(editor.getHtml())
    })

    editor.on('component:add', enableResize)
    editor.on('rte:enable',  () => requestAnimationFrame(() => injectRteExtras(editor)))
    editor.on('rte:disable', () => document.querySelectorAll('.rte-extras').forEach(el => el.remove()))

    return () => { editor.destroy(); mountedRef.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Block search filter ── */
  useEffect(() => {
    const panel = document.getElementById('email-blocks-panel')
    if (!panel) return

    const applyFilter = () => {
      const q = blockSearch.toLowerCase().trim()
      const blocks = panel.querySelectorAll('.gjs-block')
      blocks.forEach(b => {
        const label = (b.querySelector('.gjs-block-label')?.textContent || '').toLowerCase()
        b.style.display = (!q || label.includes(q)) ? '' : 'none'
      })
      // Hide empty categories
      panel.querySelectorAll('.gjs-block-category').forEach(cat => {
        const visible = cat.querySelectorAll('.gjs-block:not([style*="none"])').length
        cat.style.display = visible ? '' : 'none'
      })
    }

    // Apply with small delay to ensure GrapesJS has rendered
    const t = setTimeout(applyFilter, 50)
    return () => clearTimeout(t)
  }, [blockSearch])

  /* ── Device change ── */
  const handleDeviceChange = (name) => {
    setActiveDevice(name)
    editorRef.current?.setDevice(name)
  }

  /* ── Save ── */
  const handleSave = () => {
    const editor = editorRef.current
    if (!editor) return
    const html    = editor.getHtml()
    const css     = editor.getCss()
    const gjsData = JSON.stringify(editor.getProjectData())
    refreshPlaceholders(html)
    onSave({ ...meta, htmlContent: html, cssContent: css, gjsData })
  }

  /* ── Export HTML ── */
  const handleExportHtml = () => {
    const editor = editorRef.current
    if (!editor) return
    const html = editor.getHtml()
    const css  = editor.getCss()
    const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${meta.subject || meta.name}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
  <style type="text/css">
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    ${css}
  </style>
</head>
<body>
${html}
</body>
</html>`
    const blob = new Blob([full], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${meta.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Copy HTML ── */
  const handleCopyHtml = async () => {
    const editor = editorRef.current
    if (!editor) return
    const html = editor.getHtml()
    const css  = editor.getCss()
    await navigator.clipboard.writeText(`<style>${css}</style>\n${html}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Insert text at canvas cursor ── */
  const insertAtCursor = useCallback((text) => {
    const canvasDoc = editorRef.current?.Canvas.getDocument()
    if (canvasDoc?.activeElement) {
      canvasDoc.execCommand('insertText', false, text)
    }
  }, [])

  /* ── Insert variable at cursor (updates placeholder strip) ── */
  const insertVariable = useCallback((varName) => {
    if (!varName.trim()) return
    insertAtCursor(`{{${varName.trim()}}}`)
    setPlaceholders(prev =>
      prev.includes(varName.trim()) ? prev : [...prev, varName.trim()]
    )
  }, [insertAtCursor])

  /* ── Insert a block-level HTML snippet into the GrapesJS canvas ── */
  const insertBlock = useCallback((html) => {
    const editor = editorRef.current
    if (!editor) return
    editor.addComponents(html)
    setTimeout(() => refreshPlaceholders(editor.getHtml()), 100)
  }, [refreshPlaceholders])

  /* ── Test send ── */
  const handleSendTest = async () => {
    if (!testTo.trim()) return
    setTestSending(true)
    try {
      if (onTestSend) {
        await onTestSend({ to: testTo, subject: meta.subject || meta.name })
      }
      setShowTestModal(false)
      setTestTo('')
    } finally {
      setTestSending(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="builder-shell">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-sidebar text-white px-4 gap-3 shrink-0
                      border-b border-sidebar-border py-2">

        {/* Left — meta fields */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Row 1: name + subject */}
          <div className="flex items-center gap-2">
            <input
              className="bg-transparent border border-sidebar-border text-white text-sm px-3 py-1.5
                         rounded-lg w-44 outline-none focus:border-primary transition-colors
                         placeholder-sidebar-muted"
              value={meta.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="Template name…"
            />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sidebar-muted text-xs shrink-0">Subject:</span>
              <input
                className="bg-transparent border border-sidebar-border text-white text-xs px-2 py-1.5
                           rounded-lg flex-1 min-w-0 outline-none focus:border-primary transition-colors
                           placeholder-sidebar-muted"
                value={meta.subject}
                onChange={e => setField('subject', e.target.value)}
                placeholder="Email subject line…"
              />
            </div>
          </div>
          {/* Row 2: from + preview text */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sidebar-muted text-[11px] shrink-0">From:</span>
              <input
                className="bg-transparent border border-sidebar-border text-sidebar-muted text-[11px] px-2 py-1
                           rounded-lg w-36 outline-none focus:border-primary focus:text-white transition-colors
                           placeholder-sidebar-label"
                value={meta.fromName}
                onChange={e => setField('fromName', e.target.value)}
                placeholder="Display name…"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sidebar-muted text-[11px] shrink-0">Preview:</span>
              <input
                className="bg-transparent border border-sidebar-border text-sidebar-muted text-[11px] px-2 py-1
                           rounded-lg flex-1 min-w-0 outline-none focus:border-primary focus:text-white
                           transition-colors placeholder-sidebar-label"
                value={meta.previewText}
                onChange={e => setField('previewText', e.target.value)}
                placeholder="Preheader text shown in inbox…"
              />
            </div>
          </div>
          {/* Row 3: category + tags */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sidebar-muted text-[11px] shrink-0">Category:</span>
              <select
                className="bg-sidebar-hover border border-sidebar-border text-sidebar-muted text-[11px] px-2 py-1
                           rounded-lg outline-none focus:border-primary focus:text-white transition-colors cursor-pointer"
                value={meta.category}
                onChange={e => setField('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sidebar-muted text-[11px] shrink-0">Tags:</span>
              <input
                className="bg-transparent border border-sidebar-border text-sidebar-muted text-[11px] px-2 py-1
                           rounded-lg flex-1 min-w-0 outline-none focus:border-primary focus:text-white
                           transition-colors placeholder-sidebar-label"
                value={meta.tags}
                onChange={e => setField('tags', e.target.value)}
                placeholder="invoice, welcome, promo…"
              />
            </div>
          </div>
        </div>

        {/* Center — device switcher */}
        <div className="flex gap-1 shrink-0">
          {DEVICES.map(d => (
            <button
              key={d}
              onClick={() => handleDeviceChange(d)}
              title={d}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
                activeDevice === d
                  ? 'bg-primary border-primary text-white'
                  : 'bg-sidebar-hover border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white'
              }`}
            >
              {DEVICE_ICONS[d]}
              <span className="hidden xl:inline">{d.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Undo / Redo */}
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border
                       text-sidebar-muted hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:undo')}
            title="Undo"
          >↩</button>
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border
                       text-sidebar-muted hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:redo')}
            title="Redo"
          >↪</button>

          <div className="w-px h-5 bg-sidebar-border mx-0.5" />

          {/* Copy HTML */}
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border
                       text-sidebar-muted hover:text-white transition-colors flex items-center gap-1.5"
            onClick={handleCopyHtml}
            title="Copy HTML to clipboard"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
                <span className="hidden sm:inline text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span className="hidden sm:inline">Copy HTML</span>
              </>
            )}
          </button>

          {/* Export HTML */}
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border
                       text-sidebar-muted hover:text-white transition-colors flex items-center gap-1.5"
            onClick={handleExportHtml}
            title="Download as .html file"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Preview with Data */}
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border
                       text-sidebar-muted hover:text-white transition-colors flex items-center gap-1.5"
            onClick={() => setShowPreviewData(true)}
            title="Preview with sample data — resolves {{variables}}, conditionals and loops"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Test Send */}
          <button
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border
                       text-sidebar-muted hover:text-white transition-colors flex items-center gap-1.5"
            onClick={() => setShowTestModal(true)}
            title="Send a test email"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            <span className="hidden sm:inline">Test Send</span>
          </button>

          <div className="w-px h-5 bg-sidebar-border mx-0.5" />

          {/* Save */}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Email'}
          </button>
        </div>
      </div>

      {/* ── Placeholder strip ──────────────────────────────────────────────── */}
      {placeholders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-sidebar-hover px-4 py-1.5 shrink-0
                        border-b border-sidebar-border">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Variables:</span>
          {placeholders.map(p => (
            <button
              key={p}
              onClick={() => insertVariable(p)}
              title={`Click to insert {{${p}}} at cursor`}
              className="ph-chip font-mono hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
            >{`{{${p}}}`}</button>
          ))}
        </div>
      )}

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="builder-main">

        {/* ── Left panel ── */}
        <div className="builder-panel-left w-[220px] bg-sidebar shrink-0 border-r border-sidebar-border">
          {/* Tabs */}
          <div className="flex border-b border-navy-border shrink-0">
            {[['blocks', 'Blocks'], ['layers', 'Layers'], ['vars', 'Variables']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActivePanel(key)}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activePanel === key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-sidebar-muted hover:text-white'
                }`}
              >{label}</button>
            ))}
          </div>

          {/* Block search (only shown on Blocks tab) */}
          {activePanel === 'blocks' && (
            <div className="px-2 pt-2 pb-0 shrink-0">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-sidebar-muted"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search blocks…"
                  value={blockSearch}
                  onChange={e => setBlockSearch(e.target.value)}
                  className="w-full pl-7 pr-7 py-1.5 text-[11px] bg-sidebar-hover border border-sidebar-border
                             text-white rounded-lg outline-none focus:border-primary transition-colors
                             placeholder-sidebar-muted"
                />
                {blockSearch && (
                  <button
                    onClick={() => setBlockSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-muted hover:text-white"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="panel-section">
            {/* GrapesJS-managed panels */}
            <div id="email-blocks-panel" className={activePanel === 'blocks' ? '' : 'hidden'} />
            <div id="email-layers-panel" className={activePanel === 'layers' ? '' : 'hidden'} />

            {/* Variables panel — custom React */}
            {activePanel === 'vars' && (
              <VariablesPanel
                placeholders={placeholders}
                customVar={customVar}
                setCustomVar={setCustomVar}
                insertVariable={insertVariable}
                insertBlock={insertBlock}
                insertAtCursor={insertAtCursor}
              />
            )}
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className="builder-canvas-wrap">
          <div id="email-gjs-canvas" />
        </div>

        {/* ── Right panel ── */}
        <div className="builder-panel-right w-[260px] bg-sidebar shrink-0 border-l border-sidebar-border">
          <div className="flex border-b border-navy-border shrink-0">
            {[['styles', 'Styles'], ['traits', 'Properties']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveRight(key)}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeRight === key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-sidebar-muted hover:text-white'
                }`}
              >{label}</button>
            ))}
          </div>
          <div id="email-style-manager" className={`panel-section ${activeRight === 'styles'  ? '' : 'hidden'}`} />
          <div id="email-traits-panel"  className={`panel-section ${activeRight === 'traits'  ? '' : 'hidden'}`} />
        </div>
      </div>

      {/* ── Test Send Modal ─────────────────────────────────────────────────── */}
      {showTestModal && (
        <TestSendModal
          meta={meta}
          testTo={testTo}
          setTestTo={setTestTo}
          testSending={testSending}
          onSend={handleSendTest}
          onClose={() => { setShowTestModal(false); setTestTo('') }}
          hasHandler={Boolean(onTestSend)}
        />
      )}

      {/* ── Preview with Data Modal ──────────────────────────────────────────── */}
      {showPreviewData && (
        <PreviewDataModal
          getHtml={() => editorRef.current?.getHtml() || ''}
          getCss={() => editorRef.current?.getCss() || ''}
          meta={meta}
          onClose={() => setShowPreviewData(false)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Variables Panel — 4 sub-tabs: Fields | If/Else | Loops | Helpers
───────────────────────────────────────────────────────────────────────────── */

const DATE_FORMATS = [
  { label: 'Long date',    format: 'MMMM D, YYYY',        example: 'January 15, 2024' },
  { label: 'Short date',   format: 'MMM D, YYYY',          example: 'Jan 15, 2024'     },
  { label: 'US format',    format: 'MM/DD/YYYY',           example: '01/15/2024'       },
  { label: 'EU format',    format: 'DD/MM/YYYY',           example: '15/01/2024'       },
  { label: 'ISO 8601',     format: 'YYYY-MM-DD',           example: '2024-01-15'       },
  { label: 'Full weekday', format: 'dddd, MMMM D, YYYY',   example: 'Monday, Jan 15'   },
  { label: 'Time 12h',     format: 'h:mm A',               example: '3:45 PM'          },
  { label: 'Time 24h',     format: 'HH:mm',                example: '15:45'            },
  { label: 'Date + Time',  format: 'MMMM D, YYYY h:mm A',  example: 'Jan 15 · 3:45 PM' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CHF', 'SGD', 'AED']

const VAR_SUBTABS = [
  { key: 'fields',       label: 'Fields'  },
  { key: 'conditionals', label: 'If/Else' },
  { key: 'loops',        label: 'Loops'   },
  { key: 'helpers',      label: 'Helpers' },
]

function VariablesPanel({ placeholders, customVar, setCustomVar, insertVariable, insertBlock, insertAtCursor }) {
  const [subTab, setSubTab] = useState('fields')

  /* ── Fields sub-tab state ── */
  const [search, setSearch] = useState('')
  const filteredPresets  = PRESET_VARS.filter(v => !search || v.includes(search.toLowerCase()))
  const filteredDetected = placeholders.filter(v => !search || v.includes(search.toLowerCase()))

  /* ── Conditionals sub-tab state ── */
  const [condVar, setCondVar] = useState('showContent')

  /* ── Loops sub-tab state ── */
  const [loopVar,    setLoopVar]    = useState('items')
  const [loopFields, setLoopFields] = useState('name, value')

  /* ── Helpers sub-tab state ── */
  const [dateField,      setDateField]      = useState('date_field')
  const [dateFormat,     setDateFormat]     = useState('MMMM D, YYYY')
  const [currencyField,  setCurrencyField]  = useState('amount')
  const [currencyCode,   setCurrencyCode]   = useState('USD')
  const [textField,      setTextField]      = useState('text_field')
  const [truncateLen,    setTruncateLen]    = useState('100')

  /* ── Helper: build conditional block HTML ── */
  const buildIfBlock = (varName) => `<!-- {{#if ${varName || 'conditionVar'}}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="padding:16px 32px;background:#eff6ff;border-left:4px solid #3b82f6;">
    <p style="margin:0;font-size:14px;color:#1e40af;">
      Content shown when <strong>${varName || 'conditionVar'}</strong> is truthy.
    </p>
  </td>
</tr></table>
<!-- {{/if}} -->`

  const buildIfElseBlock = (varName) => `<!-- {{#if ${varName || 'conditionVar'}}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="padding:12px 32px;background:#eff6ff;border-left:4px solid #3b82f6;">
    <p style="margin:0;font-size:14px;color:#1e40af;">✓ True — <strong>${varName || 'conditionVar'}</strong> is truthy</p>
  </td>
</tr></table>
<!-- {{else}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="padding:12px 32px;background:#f9fafb;border-left:4px solid #9ca3af;">
    <p style="margin:0;font-size:14px;color:#6b7280;">✗ False — <strong>${varName || 'conditionVar'}</strong> is falsy</p>
  </td>
</tr></table>
<!-- {{/if}} -->`

  const buildUnlessBlock = (varName) => `<!-- {{#unless ${varName || 'conditionVar'}}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="padding:16px 32px;background:#fefce8;border-left:4px solid #ca8a04;">
    <p style="margin:0;font-size:14px;color:#713f12;">
      Content shown when <strong>${varName || 'conditionVar'}</strong> is falsy or missing.
    </p>
  </td>
</tr></table>
<!-- {{/unless}} -->`

  /* ── Helper: build loop block HTML ── */
  const buildLoopBlock = (collection, fieldsStr) => {
    const fields = fieldsStr.split(',').map(f => f.trim()).filter(Boolean)
    const cells  = fields.length
      ? fields.map(f =>
          `<td style="padding:8px 10px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">{{this.${f}}}</td>`
        ).join('\n          ')
      : `<td style="padding:8px 12px;font-size:13px;color:#374151;">{{this.name}}</td>
          <td style="padding:8px 12px;font-size:13px;color:#6366f1;text-align:right;">{{this.value}}</td>`
    return `<!-- {{#each ${collection || 'items'}}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    ${cells}
  </tr>
</table>
<!-- {{/each}} -->`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex border-b border-sidebar-border shrink-0">
        {VAR_SUBTABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
              subTab === t.key
                ? 'text-primary border-b border-primary'
                : 'text-sidebar-muted hover:text-white'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Fields ── */}
      {subTab === 'fields' && (
        <div className="flex flex-col h-full">
          <div className="px-2 pt-2 pb-1 shrink-0">
            <input
              type="text"
              placeholder="Filter variables…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 text-[11px] bg-sidebar-hover border border-sidebar-border
                         text-white rounded-lg outline-none focus:border-primary transition-colors
                         placeholder-sidebar-muted"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredDetected.length > 0 && (
              <>
                <p className="text-[9px] font-bold text-sidebar-muted uppercase tracking-wider mt-3 mb-1.5 px-1">
                  In this template
                </p>
                <div className="flex flex-col gap-1">
                  {filteredDetected.map(v => <VarButton key={v} name={v} onInsert={insertVariable} detected />)}
                </div>
              </>
            )}
            <p className="text-[9px] font-bold text-sidebar-muted uppercase tracking-wider mt-3 mb-1.5 px-1">
              Common variables
            </p>
            <div className="flex flex-col gap-1">
              {filteredPresets.map(v => <VarButton key={v} name={v} onInsert={insertVariable} />)}
              {!filteredPresets.length && (
                <p className="text-[11px] text-sidebar-muted px-1 py-2 text-center">No matches</p>
              )}
            </div>
            <p className="text-[9px] font-bold text-sidebar-muted uppercase tracking-wider mt-3 mb-1.5 px-1">
              Custom
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="my_variable"
                value={customVar}
                onChange={e => setCustomVar(e.target.value.replace(/\s+/g, '_'))}
                onKeyDown={e => e.key === 'Enter' && insertVariable(customVar)}
                className="flex-1 px-2 py-1.5 text-[11px] bg-sidebar-hover border border-sidebar-border
                           text-white rounded-lg outline-none focus:border-primary font-mono min-w-0
                           placeholder-sidebar-muted"
              />
              <button
                onClick={() => { insertVariable(customVar); setCustomVar('') }}
                disabled={!customVar.trim()}
                className="px-2.5 py-1.5 text-[11px] bg-primary text-white rounded-lg
                           disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
              >+</button>
            </div>
            <p className="text-[10px] text-sidebar-muted px-1 mt-2 leading-relaxed">
              Click any variable to insert it at the cursor in the canvas.
            </p>
          </div>
        </div>
      )}

      {/* ── Conditionals ── */}
      {subTab === 'conditionals' && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          <p className="text-[10px] text-sidebar-muted leading-relaxed px-1">
            Conditionals show or hide content blocks based on variable values at send time.
          </p>

          {/* Variable name input */}
          <div>
            <label className="text-[9px] text-sidebar-muted uppercase tracking-wider block mb-1 px-1">
              Variable name
            </label>
            <input
              type="text"
              value={condVar}
              onChange={e => setCondVar(e.target.value.replace(/[\s-]/g, '_'))}
              placeholder="showContent"
              className="w-full px-2.5 py-1.5 text-[11px] bg-sidebar-hover border border-sidebar-border
                         text-white rounded-lg outline-none focus:border-primary font-mono
                         placeholder-sidebar-muted"
            />
          </div>

          {/* Snippet buttons */}
          <div className="space-y-1.5">
            <SnippetInsertBtn
              label="If Block"
              desc="Show when truthy"
              icon="M9 9l3-3 3 3M12 6v9"
              color="blue"
              onClick={() => insertBlock(buildIfBlock(condVar))}
            />
            <SnippetInsertBtn
              label="If / Else"
              desc="Different content for true & false"
              icon="M3 12h18M3 6h7m7 0h4M3 18h4m10 0h7"
              color="indigo"
              onClick={() => insertBlock(buildIfElseBlock(condVar))}
            />
            <SnippetInsertBtn
              label="Unless Block"
              desc="Show when falsy or missing"
              icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              color="amber"
              onClick={() => insertBlock(buildUnlessBlock(condVar))}
            />
          </div>

          {/* Syntax preview */}
          <div className="bg-gray-900 rounded-lg p-2.5 text-[10px] font-mono leading-relaxed">
            <span className="text-blue-400">{`<!-- {{#if ${condVar || 'conditionVar'}}} -->`}</span>
            <br /><span className="text-gray-500 pl-2">…content…</span>
            <br /><span className="text-blue-400">{`<!-- {{/if}} -->`}</span>
          </div>

          <p className="text-[10px] text-sidebar-muted px-1 leading-relaxed">
            Tip: Use the <strong className="text-white">Preview</strong> button in the toolbar
            to see conditionals resolved with real data.
          </p>
        </div>
      )}

      {/* ── Loops ── */}
      {subTab === 'loops' && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          <p className="text-[10px] text-sidebar-muted leading-relaxed px-1">
            Repeat a row for every item in an array. Provide the array variable name and the field names to render.
          </p>

          <div>
            <label className="text-[9px] text-sidebar-muted uppercase tracking-wider block mb-1 px-1">
              Collection variable
            </label>
            <input
              type="text"
              value={loopVar}
              onChange={e => setLoopVar(e.target.value.replace(/[\s-]/g, '_'))}
              placeholder="items"
              className="w-full px-2.5 py-1.5 text-[11px] bg-sidebar-hover border border-sidebar-border
                         text-white rounded-lg outline-none focus:border-primary font-mono
                         placeholder-sidebar-muted"
            />
          </div>

          <div>
            <label className="text-[9px] text-sidebar-muted uppercase tracking-wider block mb-1 px-1">
              Item fields (comma-separated)
            </label>
            <input
              type="text"
              value={loopFields}
              onChange={e => setLoopFields(e.target.value)}
              placeholder="name, value, qty"
              className="w-full px-2.5 py-1.5 text-[11px] bg-sidebar-hover border border-sidebar-border
                         text-white rounded-lg outline-none focus:border-primary font-mono
                         placeholder-sidebar-muted"
            />
          </div>

          <SnippetInsertBtn
            label="Insert Repeat Block"
            desc={`Repeats for each ${loopVar || 'item'}`}
            icon="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
            color="emerald"
            onClick={() => insertBlock(buildLoopBlock(loopVar, loopFields))}
          />

          {/* Syntax preview */}
          <div className="bg-gray-900 rounded-lg p-2.5 text-[10px] font-mono leading-relaxed">
            <span className="text-emerald-400">{`<!-- {{#each ${loopVar || 'items'}}} -->`}</span>
            {loopFields.split(',').map(f => f.trim()).filter(Boolean).map(f => (
              <span key={f}>
                <br /><span className="text-gray-400 pl-2">{`{{this.${f}}}`}</span>
              </span>
            ))}
            <br /><span className="text-emerald-400">{`<!-- {{/each}} -->`}</span>
          </div>

          {/* Quick-insert this.field chips */}
          {loopFields.trim() && (
            <div>
              <p className="text-[9px] text-sidebar-muted uppercase tracking-wider mb-1.5 px-1">
                Insert field tag at cursor
              </p>
              <div className="flex flex-wrap gap-1">
                {loopFields.split(',').map(f => f.trim()).filter(Boolean).map(f => (
                  <button
                    key={f}
                    onClick={() => insertAtCursor(`{{this.${f}}}`)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full
                               bg-emerald-900/30 border border-emerald-700/40 text-emerald-300
                               hover:border-emerald-400 hover:text-white transition-colors"
                  >{`{{this.${f}}}`}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Helpers ── */}
      {subTab === 'helpers' && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">

          {/* Date format */}
          <div className="bg-sidebar-hover rounded-lg p-2.5 space-y-2 border border-sidebar-border">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Format Date
            </p>
            <div className="flex gap-1.5">
              <input
                value={dateField}
                onChange={e => setDateField(e.target.value.replace(/\s/g, '_'))}
                placeholder="date_field"
                className="flex-1 px-2 py-1 text-[11px] bg-gray-900 border border-sidebar-border
                           text-white rounded-lg outline-none focus:border-primary font-mono
                           placeholder-sidebar-muted min-w-0"
              />
            </div>
            <select
              value={dateFormat}
              onChange={e => setDateFormat(e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] bg-gray-900 border border-sidebar-border
                         text-white rounded-lg outline-none focus:border-primary cursor-pointer"
            >
              {DATE_FORMATS.map(f => (
                <option key={f.format} value={f.format}>{f.label} — {f.example}</option>
              ))}
            </select>
            <button
              onClick={() => insertAtCursor(`{{formatDate ${dateField || 'date_field'} "${dateFormat}"}}`)}
              className="w-full py-1.5 text-[11px] bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors font-medium"
            >
              Insert Date Tag
            </button>
            <p className="text-[10px] font-mono text-blue-400 break-all px-0.5">
              {`{{formatDate ${dateField || 'date_field'} "${dateFormat}"}}`}
            </p>
          </div>

          {/* Currency format */}
          <div className="bg-sidebar-hover rounded-lg p-2.5 space-y-2 border border-sidebar-border">
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              Format Currency
            </p>
            <div className="flex gap-1.5">
              <input
                value={currencyField}
                onChange={e => setCurrencyField(e.target.value.replace(/\s/g, '_'))}
                placeholder="amount"
                className="flex-1 px-2 py-1 text-[11px] bg-gray-900 border border-sidebar-border
                           text-white rounded-lg outline-none focus:border-primary font-mono
                           placeholder-sidebar-muted min-w-0"
              />
              <select
                value={currencyCode}
                onChange={e => setCurrencyCode(e.target.value)}
                className="w-20 px-1.5 py-1 text-[11px] bg-gray-900 border border-sidebar-border
                           text-white rounded-lg outline-none focus:border-primary cursor-pointer"
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => insertAtCursor(`{{formatCurrency ${currencyField || 'amount'} "${currencyCode}"}}`)}
              className="w-full py-1.5 text-[11px] bg-emerald-600 text-white rounded-lg
                         hover:bg-emerald-700 transition-colors font-medium"
            >
              Insert Currency Tag
            </button>
            <p className="text-[10px] font-mono text-emerald-400 break-all px-0.5">
              {`{{formatCurrency ${currencyField || 'amount'} "${currencyCode}"}}`}
            </p>
          </div>

          {/* Text helpers */}
          <div className="bg-sidebar-hover rounded-lg p-2.5 space-y-2 border border-sidebar-border">
            <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h10M4 18h7"/>
              </svg>
              Text Helpers
            </p>
            <div className="flex gap-1.5">
              <input
                value={textField}
                onChange={e => setTextField(e.target.value.replace(/\s/g, '_'))}
                placeholder="text_field"
                className="flex-1 px-2 py-1 text-[11px] bg-gray-900 border border-sidebar-border
                           text-white rounded-lg outline-none focus:border-primary font-mono
                           placeholder-sidebar-muted min-w-0"
              />
              <input
                type="number"
                value={truncateLen}
                onChange={e => setTruncateLen(e.target.value)}
                placeholder="100"
                min="1"
                max="999"
                className="w-16 px-2 py-1 text-[11px] bg-gray-900 border border-sidebar-border
                           text-white rounded-lg outline-none focus:border-primary shrink-0"
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => insertAtCursor(`{{truncate ${textField || 'text'} ${truncateLen || 100}}}`)}
                className="py-1.5 text-[10px] bg-violet-600/70 text-white rounded-lg
                           hover:bg-violet-600 transition-colors font-medium"
                title={`{{truncate ${textField} ${truncateLen}}}`}
              >Truncate</button>
              <button
                onClick={() => insertAtCursor(`{{uppercase ${textField || 'text'}}}`)}
                className="py-1.5 text-[10px] bg-violet-600/70 text-white rounded-lg
                           hover:bg-violet-600 transition-colors font-medium"
                title={`{{uppercase ${textField}}}`}
              >UPPER</button>
              <button
                onClick={() => insertAtCursor(`{{lowercase ${textField || 'text'}}}`)}
                className="py-1.5 text-[10px] bg-violet-600/70 text-white rounded-lg
                           hover:bg-violet-600 transition-colors font-medium"
                title={`{{lowercase ${textField}}}`}
              >lower</button>
            </div>
            <div className="space-y-0.5">
              {[
                `{{truncate ${textField || 'text'} ${truncateLen || 100}}}`,
                `{{uppercase ${textField || 'text'}}}`,
                `{{lowercase ${textField || 'text'}}}`,
              ].map(s => (
                <p key={s} className="text-[10px] font-mono text-violet-400 break-all">{s}</p>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

/* ── VarButton ────────────────────────────────────────────────────────────── */
function VarButton({ name, onInsert, detected }) {
  return (
    <button
      onClick={() => onInsert(name)}
      title={`Insert {{${name}}}`}
      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all group
        flex items-center justify-between gap-1
        ${detected
          ? 'bg-purple-900/30 border border-purple-700/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-500'
          : 'bg-sidebar-hover border border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white'
        }`}
    >
      <span>{`{{${name}}}`}</span>
      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
      </svg>
    </button>
  )
}

/* ── SnippetInsertBtn ─────────────────────────────────────────────────────── */
const SNIPPET_COLORS = {
  blue:    'border-blue-700/50 bg-blue-900/20 text-blue-300 hover:border-blue-500 hover:bg-blue-900/40',
  indigo:  'border-indigo-700/50 bg-indigo-900/20 text-indigo-300 hover:border-indigo-500 hover:bg-indigo-900/40',
  amber:   'border-amber-700/50 bg-amber-900/20 text-amber-300 hover:border-amber-500 hover:bg-amber-900/40',
  emerald: 'border-emerald-700/50 bg-emerald-900/20 text-emerald-300 hover:border-emerald-500 hover:bg-emerald-900/40',
}
function SnippetInsertBtn({ label, desc, icon, color = 'indigo', onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all group
        flex items-center gap-2.5 ${SNIPPET_COLORS[color]}`}
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon}/>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold leading-tight">{label}</p>
        <p className="text-[10px] opacity-60 leading-tight">{desc}</p>
      </div>
      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
      </svg>
    </button>
  )
}

/* ── Test Send Modal ──────────────────────────────────────────────────────── */
function TestSendModal({ meta, testTo, setTestTo, testSending, onSend, onClose, hasHandler }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm
                      border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Send Test Email</h3>
              <p className="text-xs text-gray-400 truncate max-w-[180px]">{meta.subject || meta.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              Send to <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700
                         rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="test@example.com"
              value={testTo}
              onChange={e => setTestTo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSend()}
            />
          </div>

          {!hasHandler && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20
                            border border-amber-200 dark:border-amber-800 rounded-xl text-xs
                            text-amber-700 dark:text-amber-400">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Save the template first, then use "Test Send" to send a live preview with your actual data.</span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Merge tags ({`{{variableName}}`}) will appear as-is in the test email.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            className="px-3.5 py-2 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >Cancel</button>
          <button
            className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all
                       disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            onClick={onSend}
            disabled={!testTo.trim() || testSending}
          >
            {testSending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Send Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Resize helper ────────────────────────────────────────────────────────── */
const RESIZABLE_TAGS = new Set([
  'div', 'section', 'table', 'td', 'img', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
])
const RESIZE_CONFIG = {
  handles: ['tl', 'tc', 'tr', 'cl', 'cr', 'bl', 'bc', 'br'],
  minWidth: 20, minHeight: 10,
  unitWidth: 'px', unitHeight: 'px', currentUnit: 1, step: 1,
}
function enableResize(component) {
  const tag = component.get('tagName')?.toLowerCase()
  if (tag && RESIZABLE_TAGS.has(tag) && !component.get('resizable')) {
    component.set('resizable', RESIZE_CONFIG)
  }
  component.components().each(child => enableResize(child))
}

/* ── RTE extras (font-size + color pickers) ──────────────────────────────── */
const FONT_SIZES_LIST = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]

function injectRteExtras(editor) {
  const toolbar = document.querySelector('.gjs-rte-toolbar')
  if (!toolbar || toolbar.querySelector('.rte-extras')) return

  const canvasDoc = editor.Canvas.getDocument()
  const wrapper   = document.createElement('div')
  wrapper.className = 'rte-extras'

  const sizeSelect = document.createElement('select')
  sizeSelect.className = 'rte-size-select'
  sizeSelect.innerHTML = `<option value="">px</option>` +
    FONT_SIZES_LIST.map(s => `<option value="${s}">${s}</option>`).join('')

  sizeSelect.addEventListener('mousedown', e => e.stopPropagation())
  sizeSelect.addEventListener('click',     e => e.stopPropagation())
  sizeSelect.addEventListener('change', e => {
    e.stopPropagation()
    const size = e.target.value
    if (!size) return
    const sel = canvasDoc.getSelection()
    if (sel?.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (!range.collapsed) {
        const span = canvasDoc.createElement('span')
        span.style.fontSize = size + 'px'
        try { range.surroundContents(span) }
        catch { const f = range.extractContents(); span.appendChild(f); range.insertNode(span) }
        sel.removeAllRanges()
        const r2 = canvasDoc.createRange()
        r2.selectNodeContents(span)
        sel.addRange(r2)
      }
    }
    e.target.value = ''
  })

  wrapper.appendChild(sizeSelect)
  wrapper.appendChild(makeColorPicker(canvasDoc, 'A', '#000', 'Text color',
    color => canvasDoc.execCommand('foreColor', false, color)))
  wrapper.appendChild(makeColorPicker(canvasDoc, 'H', '#ffff00', 'Highlight',
    color => canvasDoc.execCommand('hiliteColor', false, color), 'rte-bg-label'))

  toolbar.appendChild(wrapper)
}

function makeColorPicker(canvasDoc, letter, defaultColor, title, onColor, extraLabelClass = '') {
  const btn   = document.createElement('span')
  btn.className = 'rte-color-btn'
  btn.title = title

  const label = document.createElement('span')
  label.className = `rte-color-label ${extraLabelClass}`
  label.textContent = letter
  label.style.borderBottom = `3px solid ${defaultColor}`

  const input = document.createElement('input')
  input.type  = 'color'
  input.className = 'rte-color-input'
  input.value = defaultColor

  input.addEventListener('mousedown', e => e.stopPropagation())
  input.addEventListener('click',     e => e.stopPropagation())
  input.addEventListener('input',  e => { label.style.borderBottom = `3px solid ${e.target.value}` })
  input.addEventListener('change', e => { e.stopPropagation(); onColor(e.target.value) })

  btn.addEventListener('click', e => { e.stopPropagation(); input.click() })
  btn.appendChild(label)
  btn.appendChild(input)
  return btn
}
