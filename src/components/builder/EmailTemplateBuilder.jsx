import { useEffect, useRef, useState, useCallback } from 'react'
import grapesjs from 'grapesjs'
import { EMAIL_EDITOR_CONFIG } from './email-grapes-config'
import '../../styles/builder.css'

const DEVICES     = ['Desktop Email', 'Tablet', 'Mobile']
const FONT_SIZES  = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]

export default function EmailTemplateBuilder({ initialTemplate, onSave, isSaving }) {
  const editorRef  = useRef(null)
  const mountedRef = useRef(false)

  const [activePanel,  setActivePanel]  = useState('blocks')
  const [activeRight,  setActiveRight]  = useState('styles')
  const [placeholders, setPlaceholders] = useState([])
  const [activeDevice, setActiveDevice] = useState('Desktop Email')

  const [meta, setMeta] = useState({
    name:        initialTemplate?.name        || 'Untitled Email',
    description: initialTemplate?.description || '',
    subject:     initialTemplate?.subject     || '',
    previewText: initialTemplate?.previewText || '',
    fromName:    initialTemplate?.fromName    || '',
  })

  const refreshPlaceholders = useCallback((html) => {
    const unique = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))]
    setPlaceholders(unique)
  }, [])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const editor = grapesjs.init(EMAIL_EDITOR_CONFIG('email-gjs-canvas'))
    editorRef.current = editor

    if (initialTemplate?.gjsData) {
      try { editor.loadProjectData(JSON.parse(initialTemplate.gjsData)) }
      catch { editor.setComponents(initialTemplate.htmlContent || ''); editor.setStyle(initialTemplate.cssContent || '') }
    }

    editor.on('component:update component:add component:remove', () => {
      refreshPlaceholders(editor.getHtml())
    })

    editor.on('component:add', enableResize)

    editor.on('rte:enable',  () => requestAnimationFrame(() => injectRteExtras(editor)))
    editor.on('rte:disable', () => document.querySelectorAll('.rte-extras').forEach(el => el.remove()))

    return () => { editor.destroy(); mountedRef.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeviceChange = (name) => {
    setActiveDevice(name)
    editorRef.current?.setDevice(name)
  }

  const handleSave = () => {
    const editor = editorRef.current
    if (!editor) return
    const html    = editor.getHtml()
    const css     = editor.getCss()
    const gjsData = JSON.stringify(editor.getProjectData())
    refreshPlaceholders(html)
    onSave({ ...meta, htmlContent: html, cssContent: css, gjsData })
  }

  const setField = (key, val) => setMeta(prev => ({ ...prev, [key]: val }))

  return (
    <div className="builder-shell">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between bg-sidebar text-white px-4 h-auto gap-3 shrink-0 border-b border-sidebar-border py-2">
        {/* Left — two-row form */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Row 1: name + subject */}
          <div className="flex items-center gap-2">
            <input
              className="bg-transparent border border-sidebar-border text-white text-sm px-3 py-1.5 rounded-lg w-44 outline-none focus:border-primary transition-colors placeholder-sidebar-muted"
              value={meta.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="Email name…"
            />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sidebar-muted text-xs shrink-0">Subject:</span>
              <input
                className="bg-transparent border border-sidebar-border text-white text-xs px-2 py-1.5 rounded-lg flex-1 min-w-0 outline-none focus:border-primary transition-colors placeholder-sidebar-muted"
                value={meta.subject}
                onChange={e => setField('subject', e.target.value)}
                placeholder="Email subject line…"
              />
            </div>
          </div>
          {/* Row 2: from name + preview text */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sidebar-muted text-[11px] shrink-0">From:</span>
              <input
                className="bg-transparent border border-sidebar-border text-sidebar-muted text-[11px] px-2 py-1 rounded-lg w-36 outline-none focus:border-primary focus:text-white transition-colors placeholder-sidebar-label"
                value={meta.fromName}
                onChange={e => setField('fromName', e.target.value)}
                placeholder="Display name…"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sidebar-muted text-[11px] shrink-0">Preview:</span>
              <input
                className="bg-transparent border border-sidebar-border text-sidebar-muted text-[11px] px-2 py-1 rounded-lg flex-1 min-w-0 outline-none focus:border-primary focus:text-white transition-colors placeholder-sidebar-label"
                value={meta.previewText}
                onChange={e => setField('previewText', e.target.value)}
                placeholder="Preheader text (shown in inbox preview)…"
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
              className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
                activeDevice === d
                  ? 'bg-primary border-primary text-white'
                  : 'bg-sidebar-hover border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-sidebar-muted hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:undo')}
          >Undo</button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-sidebar-muted hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:redo')}
          >Redo</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Email'}
          </button>
        </div>
      </div>

      {/* ── Placeholder strip ── */}
      {placeholders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-sidebar-hover px-4 py-1.5 shrink-0 border-b border-sidebar-border">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Placeholders:</span>
          {placeholders.map(p => (
            <span key={p} className="ph-chip font-mono">{`{{${p}}}`}</span>
          ))}
        </div>
      )}

      {/* ── Main area ── */}
      <div className="builder-main">

        {/* Left panel */}
        <div className="builder-panel-left w-[220px] bg-sidebar shrink-0 border-r border-sidebar-border">
          <div className="flex border-b border-navy-border shrink-0">
            {[['blocks', 'Blocks'], ['layers', 'Layers']].map(([key, label]) => (
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
          <div className="panel-section">
            <div id="email-blocks-panel" className={activePanel === 'blocks' ? '' : 'hidden'} />
            <div id="email-layers-panel" className={activePanel === 'layers' ? '' : 'hidden'} />
          </div>
        </div>

        {/* Canvas */}
        <div className="builder-canvas-wrap">
          <div id="email-gjs-canvas" />
        </div>

        {/* Right panel */}
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
          <div id="email-style-manager" className={`panel-section ${activeRight === 'styles' ? '' : 'hidden'}`} />
          <div id="email-traits-panel"  className={`panel-section ${activeRight === 'traits' ? '' : 'hidden'}`} />
        </div>
      </div>
    </div>
  )
}

/* ── Resize helper (same as PDF builder) ─────────────────────────────────── */
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
  const btn = document.createElement('span')
  btn.className = 'rte-color-btn'
  btn.title = title

  const label = document.createElement('span')
  label.className = `rte-color-label ${extraLabelClass}`
  label.textContent = letter
  label.style.borderBottom = `3px solid ${defaultColor}`

  const input = document.createElement('input')
  input.type = 'color'
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
