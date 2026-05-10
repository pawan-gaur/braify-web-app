import { useEffect, useRef, useState, useCallback } from 'react'
import grapesjs from 'grapesjs'
import { EDITOR_CONFIG } from './grapes-config'
import '../../styles/builder.css'

const DEVICES = ['A4 Portrait', 'A4 Landscape', 'Letter']
const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]

export default function TemplateBuilder({ initialTemplate, onSave, isSaving }) {
  const editorRef  = useRef(null)
  const mountedRef = useRef(false)

  const [activePanel, setActivePanel]   = useState('blocks')
  const [activeRight, setActiveRight]   = useState('styles')
  const [placeholders, setPlaceholders] = useState([])
  const [activeDevice, setActiveDevice] = useState('A4 Portrait')
  const [showSettings, setShowSettings] = useState(false)

  const [settings, setSettings] = useState({
    name:         initialTemplate?.name         || 'Untitled Template',
    description:  initialTemplate?.description  || '',
    pageSize:     initialTemplate?.pageSize     || 'A4',
    orientation:  initialTemplate?.orientation  || 'portrait',
    marginTop:    initialTemplate?.marginTop    ?? 20,
    marginBottom: initialTemplate?.marginBottom ?? 20,
    marginLeft:   initialTemplate?.marginLeft   ?? 15,
    marginRight:  initialTemplate?.marginRight  ?? 15,
  })

  const refreshPlaceholders = useCallback((html) => {
    const unique = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))]
    setPlaceholders(unique)
  }, [])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const editor = grapesjs.init(EDITOR_CONFIG('gjs-canvas'))
    editorRef.current = editor

    if (initialTemplate?.gjsData) {
      try { editor.loadProjectData(JSON.parse(initialTemplate.gjsData)) }
      catch { editor.setComponents(initialTemplate.htmlContent || ''); editor.setStyle(initialTemplate.cssContent || '') }
    }

    editor.on('component:update component:add component:remove', () => {
      refreshPlaceholders(editor.getHtml())
    })

    // Enable resizing on all block-level components when dropped onto canvas
    editor.on('component:add', enableResize)

    editor.on('rte:enable', () => {
      requestAnimationFrame(() => injectRteExtras(editor))
    })
    editor.on('rte:disable', () => {
      document.querySelectorAll('.rte-extras').forEach(el => el.remove())
    })

    return () => { editor.destroy(); mountedRef.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeviceChange = (deviceName) => {
    setActiveDevice(deviceName)
    editorRef.current?.setDevice(deviceName)
  }

  const handleSave = () => {
    const editor = editorRef.current
    if (!editor) return
    const html    = editor.getHtml()
    const css     = editor.getCss()
    const gjsData = JSON.stringify(editor.getProjectData())
    refreshPlaceholders(html)
    onSave({ ...settings, htmlContent: html, cssContent: css, gjsData })
  }

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  return (
    <div className="builder-shell">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between bg-sidebar text-white px-4 h-[52px] gap-3 shrink-0 border-b border-sidebar-border">
        {/* Left */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            className="bg-transparent border border-sidebar-border text-white text-sm px-3 py-1.5 rounded-lg w-52 outline-none focus:border-primary transition-colors placeholder-sidebar-muted"
            value={settings.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Template name…"
          />
          <button
            className="text-xs px-3 py-1.5 rounded-lg border border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white transition-all"
            onClick={() => setShowSettings(true)}
          >
            Page Settings
          </button>
        </div>

        {/* Center — device switcher */}
        <div className="flex gap-1 shrink-0">
          {DEVICES.map(d => (
            <button
              key={d}
              onClick={() => handleDeviceChange(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                activeDevice === d
                  ? 'bg-primary border-primary text-white'
                  : 'bg-sidebar-hover border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-sidebar-muted hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:undo')}
          >
            Undo
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-sidebar-muted hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:redo')}
          >
            Redo
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Template'}
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
          {/* Tabs */}
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
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-section">
            <div id="blocks-panel" className={activePanel === 'blocks' ? '' : 'hidden'} />
            <div id="layers-panel" className={activePanel === 'layers' ? '' : 'hidden'} />
          </div>
        </div>

        {/* Canvas */}
        <div className="builder-canvas-wrap">
          <div id="gjs-canvas" />
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
              >
                {label}
              </button>
            ))}
          </div>
          <div id="style-manager-container" className={`panel-section ${activeRight === 'styles' ? '' : 'hidden'}`} />
          <div id="traits-panel"            className={`panel-section ${activeRight === 'traits' ? '' : 'hidden'}`} />
        </div>
      </div>

      {/* Page settings modal */}
      {showSettings && (
        <PageSettingsModal settings={settings} onChange={set} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

/* ── Page settings modal ─────────────────────────────────────────────────── */
function PageSettingsModal({ settings, onChange, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-navy mb-5">Page Settings</h2>

        <div className="mb-4">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            value={settings.description}
            onChange={e => onChange('description', e.target.value)}
            placeholder="Optional description…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="form-label">Page Size</label>
            <select className="form-select" value={settings.pageSize} onChange={e => onChange('pageSize', e.target.value)}>
              {['A4', 'A3', 'Letter', 'Legal'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Orientation</label>
            <select className="form-select" value={settings.orientation} onChange={e => onChange('orientation', e.target.value)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Margins (mm)</p>
        <div className="grid grid-cols-2 gap-3">
          {['Top', 'Bottom', 'Left', 'Right'].map(side => (
            <div key={side}>
              <label className="form-label">{side}</label>
              <input
                type="number" min={0} max={60}
                className="form-input"
                value={settings[`margin${side}`]}
                onChange={e => onChange(`margin${side}`, Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  )
}

/* ── Resize: enable on every block-level element dropped onto the canvas ──── */
const RESIZABLE_TAGS = new Set([
  'div', 'section', 'article', 'aside', 'main', 'header', 'footer',
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'figure', 'blockquote', 'img', 'hr', 'ul', 'ol',
])

const RESIZE_CONFIG = {
  handles: ['tl', 'tc', 'tr', 'cl', 'cr', 'bl', 'bc', 'br'],
  minWidth:  20,
  minHeight: 10,
  unitWidth:  'px',
  unitHeight: 'px',
  currentUnit: 1,
  step: 1,
}

function enableResize(component) {
  const tag = component.get('tagName')?.toLowerCase()
  if (tag && RESIZABLE_TAGS.has(tag) && !component.get('resizable')) {
    component.set('resizable', RESIZE_CONFIG)
  }
  // Recurse into children so nested cols / table cells are also resizable
  component.components().each(child => enableResize(child))
}

/* ── RTE extras: font-size + color + highlight ───────────────────────────── */
function injectRteExtras(editor) {
  const toolbar = document.querySelector('.gjs-rte-toolbar')
  if (!toolbar || toolbar.querySelector('.rte-extras')) return

  const canvasDoc = editor.Canvas.getDocument()
  const wrapper   = document.createElement('div')
  wrapper.className = 'rte-extras'

  // Font size
  const sizeSelect = document.createElement('select')
  sizeSelect.className = 'rte-size-select'
  sizeSelect.title = 'Font size'
  sizeSelect.innerHTML = `<option value="">px</option>` +
    FONT_SIZES.map(s => `<option value="${s}">${s}</option>`).join('')

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

  // Text color
  wrapper.appendChild(sizeSelect)
  wrapper.appendChild(makeColorPicker(canvasDoc, 'A', '#000', 'Text color',
    (color) => canvasDoc.execCommand('foreColor', false, color)))

  // Highlight color
  wrapper.appendChild(makeColorPicker(canvasDoc, 'H', '#ffff00', 'Highlight',
    (color) => canvasDoc.execCommand('hiliteColor', false, color),
    'rte-bg-label'))

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
