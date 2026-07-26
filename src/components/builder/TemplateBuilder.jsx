import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import grapesjs from 'grapesjs'
import { EDITOR_CONFIG } from './grapes-config'
import PreviewDataModal from '../ui/PreviewDataModal'
import { IconCheck } from '../ui/icons'
import '../../styles/builder.css'

/* Compact relative-time label for the "saved …" status in the top bar. */
function savedAgo(ts, now) {
  if (!ts) return null
  const secs = Math.max(0, Math.round((now - ts) / 1000))
  if (secs < 45) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.round(mins / 60)}h ago`
}

/* ── Constants ────────────────────────────────────────────────────────────── */
const DEVICES = [
  { label: 'A4 Portrait',   value: 'A4 Portrait'   },
  { label: 'A4 Landscape',  value: 'A4 Landscape'  },
  { label: 'A3 Portrait',   value: 'A3 Portrait'   },
  { label: 'A3 Landscape',  value: 'A3 Landscape'  },
  { label: 'Letter',        value: 'Letter'         },
  { label: 'Legal',         value: 'Legal'          },
  { label: 'Custom',        value: 'Custom'         },
]

// Keep the toolbar page-size selector and the Settings page-size/orientation in
// sync. Without this, the canvas device (what you design against) and the
// settings sent to the PDF renderer (which drive @page size/orientation) can
// disagree — e.g. design in A4 Landscape but get a portrait PDF.
const DEVICE_TO_PAGE = {
  'A4 Portrait':  { pageSize: 'A4',     orientation: 'portrait'  },
  'A4 Landscape': { pageSize: 'A4',     orientation: 'landscape' },
  'A3 Portrait':  { pageSize: 'A3',     orientation: 'portrait'  },
  'A3 Landscape': { pageSize: 'A3',     orientation: 'landscape' },
  'Letter':       { pageSize: 'Letter', orientation: 'portrait'  },
  'Legal':        { pageSize: 'Legal',  orientation: 'portrait'  },
  'Custom':       { pageSize: 'Custom', orientation: 'portrait'  },
}
function pageToDevice(pageSize, orientation) {
  if (pageSize === 'A4') return orientation === 'landscape' ? 'A4 Landscape' : 'A4 Portrait'
  if (pageSize === 'A3') return orientation === 'landscape' ? 'A3 Landscape' : 'A3 Portrait'
  if (pageSize === 'Letter') return 'Letter'
  if (pageSize === 'Legal')  return 'Legal'
  return 'Custom'
}

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200]

const VAR_SUBTABS = ['Fields', 'Conditionals', 'Loops', 'Helpers']

const DATE_FORMATS = [
  { label: 'Jan 13, 2026',        fmt: 'MMMM D, YYYY'   },
  { label: '01/13/2026',          fmt: 'MM/DD/YYYY'      },
  { label: '13/01/2026',          fmt: 'DD/MM/YYYY'      },
  { label: '2026-01-13',          fmt: 'YYYY-MM-DD'      },
  { label: '13 Jan 2026',         fmt: 'D MMM YYYY'      },
  { label: 'Tuesday, Jan 13',     fmt: 'dddd, MMM D'     },
  { label: '1/13/26',             fmt: 'M/D/YY'          },
  { label: 'January 2026',        fmt: 'MMMM YYYY'       },
  { label: 'Unix Timestamp',      fmt: 'X'               },
]

const CURRENCIES = [
  { label: 'USD ($)',  code: 'USD', symbol: '$'  },
  { label: 'EUR (€)',  code: 'EUR', symbol: '€'  },
  { label: 'GBP (£)',  code: 'GBP', symbol: '£'  },
  { label: 'JPY (¥)',  code: 'JPY', symbol: '¥'  },
  { label: 'CAD (CA$)', code: 'CAD', symbol: 'CA$' },
  { label: 'AUD (A$)', code: 'AUD', symbol: 'A$' },
  { label: 'INR (₹)',  code: 'INR', symbol: '₹'  },
  { label: 'CHF',      code: 'CHF', symbol: 'CHF' },
  { label: 'CNY (¥)',  code: 'CNY', symbol: '¥'  },
  { label: 'BRL (R$)', code: 'BRL', symbol: 'R$' },
]

const PDF_PRESET_VARS = [
  { name: 'page_number',    label: 'Page Number'    },
  { name: 'total_pages',    label: 'Total Pages'    },
  { name: 'current_date',   label: 'Current Date'   },
  { name: 'current_time',   label: 'Current Time'   },
  { name: 'company_name',   label: 'Company Name'   },
  { name: 'company_logo',   label: 'Company Logo'   },
  { name: 'recipient_name', label: 'Recipient Name' },
  { name: 'recipient_email',label: 'Recipient Email'},
  { name: 'invoice_number', label: 'Invoice #'      },
  { name: 'invoice_date',   label: 'Invoice Date'   },
  { name: 'due_date',       label: 'Due Date'       },
  { name: 'total_amount',   label: 'Total Amount'   },
  { name: 'tax_amount',     label: 'Tax Amount'     },
  { name: 'subtotal',       label: 'Subtotal'       },
  { name: 'currency',       label: 'Currency'       },
  { name: 'reference_no',   label: 'Reference No'   },
]

/* ── Main component ───────────────────────────────────────────────────────── */
export default function TemplateBuilder({ initialTemplate, onSave, isSaving }) {
  const navigate   = useNavigate()
  const editorRef  = useRef(null)
  const mountedRef = useRef(false)

  const [lastSaved, setLastSaved] = useState(null)          // timestamp of last save
  const [now,       setNow]       = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)  // keep "saved 2m ago" fresh
    return () => clearInterval(t)
  }, [])

  const [activePanel,      setActivePanel]      = useState('blocks')
  const [activeRight,      setActiveRight]       = useState('styles')
  const [activeVarTab,     setActiveVarTab]      = useState('Fields')
  const [placeholders,     setPlaceholders]      = useState([])
  const [activeDevice,     setActiveDevice]      = useState('A4 Portrait')
  const [zoom,             setZoom]              = useState(100)
  const [showSettings,     setShowSettings]      = useState(false)
  const [showPreviewData,  setShowPreviewData]   = useState(false)
  const [blockSearch,      setBlockSearch]       = useState('')
  const [customVar,        setCustomVar]         = useState('')
  const [condVar,          setCondVar]           = useState('')
  const [condType,         setCondType]          = useState('if')
  const [loopVar,          setLoopVar]           = useState('')
  const [dateVar,          setDateVar]           = useState('')
  const [dateFmt,          setDateFmt]           = useState('MMMM D, YYYY')
  const [currVar,          setCurrVar]           = useState('')
  const [currCode,         setCurrCode]          = useState('USD')
  const [truncVar,         setTruncVar]          = useState('')
  const [truncLen,         setTruncLen]          = useState(50)
  const [caseVar,          setCaseVar]           = useState('')
  const [copied,           setCopied]            = useState(false)

  const [settings, setSettings] = useState({
    name:         initialTemplate?.name         || 'Untitled Template',
    description:  initialTemplate?.description  || '',
    pageSize:     initialTemplate?.pageSize     || 'A4',
    orientation:  initialTemplate?.orientation  || 'portrait',
    // New templates get sensible document margins (matching the backend defaults)
    // so generated PDFs aren't edge-to-edge. Existing templates keep their saved
    // values. For a free-placement design where the editor's full page must map
    // 1:1 to the PDF, set all margins to 0 in Settings.
    marginTop:    initialTemplate?.marginTop    ?? 20,
    marginBottom: initialTemplate?.marginBottom ?? 20,
    marginLeft:   initialTemplate?.marginLeft   ?? 15,
    marginRight:  initialTemplate?.marginRight  ?? 15,
  })

  const refreshPlaceholders = useCallback((html) => {
    const unique = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))]
    setPlaceholders(unique)
  }, [])

  // GrapesJS caches the canvas offset used to place its on-canvas tools (selection
  // toolbar + resize handles). When the canvas area changes height — e.g. the
  // "Placeholders:" strip appears/disappears, the window resizes, or a panel
  // toggles — that cache goes stale and the tools drift out of alignment with the
  // selected element. A ResizeObserver on the canvas area refreshes it on any change.
  useEffect(() => {
    const el = document.querySelector('.builder-canvas-wrap')
    if (!el || typeof ResizeObserver === 'undefined') return
    let raf
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const ed = editorRef.current
        if (!ed) return
        try { ed.refresh?.() } catch { /* older API */ }
        try { ed.Canvas?.refresh?.() } catch { /* no-op */ }
      })
    })
    ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  /* ── Init GrapesJS ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const editor = grapesjs.init(EDITOR_CONFIG('gjs-canvas'))
    editorRef.current = editor

    // ── Register th/td as text-type so double-click opens the RTE in tables ──
    for (const tag of ['th', 'td']) {
      editor.DomComponents.addType(tag, {
        extend: 'text',
        isComponent: el => el.tagName?.toUpperCase() === tag.toUpperCase(),
        model: { defaults: { tagName: tag, editable: true, droppable: false } },
      })
    }

    // ── Image component override ───────────────────────────────────────────────
    // • 8 resize handles, no ratio lock
    // • position:absolute + default top/left so the image can be freely placed
    //   anywhere on the page (GrapesJS updates top/left when the user drags it)
    // • width/height as CSS px so the PDF renderer always sees explicit sizes
    editor.DomComponents.addType('image', {
      extend: 'image',
      model: {
        defaults: {
          resizable: {
            handles: ['tl','tc','tr','cl','cr','bl','bc','br'],
            minWidth: 20, minHeight: 20, ratioDefault: 0,
          },
          style: { position: 'absolute', top: '20px', left: '20px', width: '200px', height: 'auto' },
          draggable: true,
          traits: [
            { type: 'text', name: 'src', label: 'Image URL' },
            { type: 'text', name: 'alt', label: 'Alt text'  },
          ],
        },
      },
    })

    editor.on('component:add', enableResize)

    if (initialTemplate?.gjsData) {
      try { editor.loadProjectData(JSON.parse(initialTemplate.gjsData)) }
      catch { editor.setComponents(initialTemplate.htmlContent || ''); editor.setStyle(initialTemplate.cssContent || '') }
    } else if (initialTemplate?.htmlContent) {
      editor.setComponents(initialTemplate.htmlContent)
      editor.setStyle(initialTemplate.cssContent || '')
      setTimeout(() => refreshPlaceholders(editor.getHtml()), 200)
    }

    // ── Track where the user drops a block from the panel ─────────────────
    // When a block is dragged from the panel and dropped onto the canvas,
    // GrapesJS fires component:add with the default top/left (20px/20px).
    // We track the mouse position over the canvas during the drag so we can
    // move the freshly-added image to the actual drop location.
    let blockDropPos   = null  // { x, y } in canvas CSS pixels (zoom-corrected)
    let blockDragging  = false

    editor.on('block:drag:start', () => {
      blockDragging = true
      blockDropPos  = null
    })

    // block:drag:stop fires with the newly created component (or null on cancel).
    // At this point the component is already in the model with the default position.
    // We update top/left to the actual drop coordinates and force-select it.
    editor.on('block:drag:stop', droppedComp => {
      blockDragging = false
      if (!droppedComp || droppedComp.get('tagName')?.toLowerCase() !== 'img') {
        blockDropPos = null
        return
      }
      if (blockDropPos) {
        // Use rAF so the DOM has rendered the component before we mutate its style
        requestAnimationFrame(() => {
          droppedComp.setStyle({
            ...droppedComp.getStyle(),
            left: Math.max(0, blockDropPos.x) + 'px',
            top:  Math.max(0, blockDropPos.y) + 'px',
          })
          editor.select(droppedComp)
        })
      } else {
        // No position captured (e.g. dropped outside canvas) — still select it
        requestAnimationFrame(() => editor.select(droppedComp))
      }
      blockDropPos = null
    })

    editor.once('load', () => {
      editor.getComponents().each(c => enableResize(c))

      const canvasDoc = editor.Canvas.getDocument()

      // Track the mouse position over the canvas during block panel drags.
      // This is the only reliable way to know WHERE the user dropped the block.
      canvasDoc.addEventListener('mousemove', e => {
        if (!blockDragging) return
        const zoom = (editor.Canvas.getZoom() ?? 100) / 100
        blockDropPos = {
          x: e.clientX / zoom,
          y: e.clientY / zoom,
        }
      })

      // ── Free-form image drag (move an already-placed image) ──────────────
      // GrapesJS's Sorter intercepts drag events on the canvas and does DOM
      // reordering even for position:absolute elements.  We use capture-phase
      // listeners so our handler fires first; we update top/left ourselves
      // and call stopPropagation() so the Sorter never sees image drags.
      let imgDrag = null

      function findByEl(el) {
        let found = null
        const walk = c => {
          if (found) return
          try { if (c.getEl() === el) { found = c; return } } catch { return }
          c.components().each(walk)
        }
        walk(editor.getWrapper())
        return found
      }

      canvasDoc.addEventListener('mousedown', e => {
        // Only intercept clicks on already-placed images, not block-panel drops
        if (e.target?.tagName !== 'IMG' || blockDragging) return
        const comp = findByEl(e.target)
        if (!comp) return
        editor.select(comp)
        const s = comp.getStyle()
        imgDrag = {
          comp,
          startX: e.clientX, startY: e.clientY,
          origLeft: parseFloat(s.left) || 0,
          origTop:  parseFloat(s.top)  || 0,
        }
        canvasDoc.body.style.cursor = 'grabbing'
        e.stopPropagation()
        e.preventDefault()
      }, true)

      canvasDoc.addEventListener('mousemove', e => {
        if (!imgDrag) return
        const { comp, startX, startY, origLeft, origTop } = imgDrag
        const zoom = (editor.Canvas.getZoom() ?? 100) / 100
        comp.setStyle({
          ...comp.getStyle(),
          left: Math.max(0, origLeft + (e.clientX - startX) / zoom) + 'px',
          top:  Math.max(0, origTop  + (e.clientY - startY) / zoom) + 'px',
        })
        e.stopPropagation()
      }, true)

      canvasDoc.addEventListener('mouseup', () => {
        if (imgDrag) {
          imgDrag = null
          canvasDoc.body.style.cursor = ''
        }
        // After a resize drag ends, sync the DOM pixel dimensions back to the
        // component model so the saved HTML always has an explicit width/height.
        // Guard: the setTimeout may fire after editor.destroy() on unmount —
        // editorRef.current is nulled in the cleanup, so we bail out safely.
        setTimeout(() => {
          if (!editorRef.current) return
          try {
            const sel = editor.getSelected()
            if (!sel || sel.get('tagName')?.toLowerCase() !== 'img') return
            const el = sel.getEl()
            if (!el) return
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (w > 0 && h > 0) {
              const cur = sel.getStyle()
              if (cur.width !== w + 'px' || cur.height !== h + 'px')
                sel.setStyle({ ...cur, width: w + 'px', height: h + 'px' })
            }
          } catch { /* editor was destroyed mid-timeout — ignore */ }
        }, 50)
      }, true)
    })

    // Debounce placeholder scanning. getHtml() serializes the WHOLE document and
    // this event fires on every component mutation — including the rapid-fire
    // component:update emitted on every mousemove while dragging/resizing an
    // image. Running getHtml() on each one makes dragging visibly laggy on a
    // non-trivial template. Placeholders can't change during a drag, so a 300ms
    // trailing debounce is invisible to the user and removes the lag.
    let phTimer = null
    const scheduleRefresh = () => {
      clearTimeout(phTimer)
      phTimer = setTimeout(() => {
        if (editorRef.current) refreshPlaceholders(editor.getHtml())
      }, 300)
    }
    editor.on('component:update component:add component:remove', scheduleRefresh)
    editor.on('rte:enable', () => requestAnimationFrame(() => injectRteExtras(editor)))
    editor.on('rte:disable', () => document.querySelectorAll('.rte-extras').forEach(el => el.remove()))

    return () => { clearTimeout(phTimer); editorRef.current = null; editor.destroy(); mountedRef.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Block search filter ─────────────────────────────────────────────────── */
  useEffect(() => {
    const delay = setTimeout(() => {
      const panel = document.getElementById('blocks-panel')
      if (!panel) return
      const q = blockSearch.toLowerCase().trim()
      panel.querySelectorAll('.gjs-block').forEach(block => {
        const label = block.querySelector('.gjs-block-label')?.textContent?.toLowerCase() || ''
        block.style.display = (!q || label.includes(q)) ? '' : 'none'
      })
      panel.querySelectorAll('.gjs-block-category').forEach(cat => {
        const visible = [...cat.querySelectorAll('.gjs-block')].some(b => b.style.display !== 'none')
        cat.style.display = visible ? '' : 'none'
      })
    }, 150)
    return () => clearTimeout(delay)
  }, [blockSearch])

  /* ── Device change ───────────────────────────────────────────────────────── */
  const handleDeviceChange = (deviceName) => {
    setActiveDevice(deviceName)
    editorRef.current?.setDevice(deviceName)
    // Mirror the choice into settings so the generated PDF uses the same page
    // size/orientation the user is designing against.
    const page = DEVICE_TO_PAGE[deviceName]
    if (page) setSettings(prev => ({ ...prev, ...page }))
  }

  /* Keep the canvas device in sync when page size/orientation change in the
     Settings modal (idempotent — re-selecting the same device is a no-op). */
  useEffect(() => {
    const device = pageToDevice(settings.pageSize, settings.orientation)
    if (device !== activeDevice) {
      setActiveDevice(device)
      editorRef.current?.setDevice(device)
    }
  }, [settings.pageSize, settings.orientation]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Zoom ────────────────────────────────────────────────────────────────── */
  const handleZoom = useCallback((newZoom) => {
    const clamped = Math.min(200, Math.max(25, newZoom))
    setZoom(clamped)
    editorRef.current?.Canvas.setZoom(clamped)
  }, [])

  /* ── Insert helpers ──────────────────────────────────────────────────────── */
  const insertAtCursor = useCallback((text) => {
    const canvasDoc = editorRef.current?.Canvas.getDocument()
    if (canvasDoc?.activeElement) {
      canvasDoc.execCommand('insertText', false, text)
    }
  }, [])

  const insertVariable = useCallback((varName) => {
    if (!varName.trim()) return
    insertAtCursor(`{{${varName.trim()}}}`)
    setPlaceholders(prev => prev.includes(varName.trim()) ? prev : [...prev, varName.trim()])
  }, [insertAtCursor])

  const insertBlock = useCallback((html) => {
    const editor = editorRef.current
    if (!editor) return
    editor.addComponents(html)
    setTimeout(() => refreshPlaceholders(editor.getHtml()), 100)
  }, [refreshPlaceholders])

  /* ── Save ────────────────────────────────────────────────────────────────── */
  const handleSave = () => {
    const editor = editorRef.current
    if (!editor) return
    const html    = editor.getHtml()
    const css     = editor.getCss()
    const gjsData = JSON.stringify(editor.getProjectData())
    refreshPlaceholders(html)
    Promise.resolve(onSave({ ...settings, htmlContent: html, cssContent: css, gjsData }))
      .then(() => setLastSaved(Date.now()))
      .catch(() => {})
  }

  /* ── Export / Copy ───────────────────────────────────────────────────────── */
  const handleExportHtml = () => {
    const editor = editorRef.current
    if (!editor) return
    const html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${settings.name}</title>\n<style>\n${editor.getCss()}\n</style>\n</head>\n<body>\n${editor.getHtml()}\n</body>\n</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${settings.name.replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyHtml = async () => {
    const editor = editorRef.current
    if (!editor) return
    try {
      await navigator.clipboard.writeText(editor.getHtml())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  /* ── Variables Panel ─────────────────────────────────────────────────────── */
  const VariablesPanel = () => {
    const SnippetInsertBtn = ({ label, onClick, title, mono }) => (
      <button
        title={title}
        onClick={onClick}
        className={`w-full text-left px-2.5 py-1.5 rounded-lg border border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white transition-all text-[11px] ${mono ? 'font-mono' : ''}`}
      >
        {label}
      </button>
    )

    return (
      <div className="builder-vars flex flex-col h-full overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex border-b border-sidebar-border shrink-0">
          {VAR_SUBTABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveVarTab(tab)}
              className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                activeVarTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-sidebar-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* ── Fields ── */}
          {activeVarTab === 'Fields' && (
            <>
              <p className="text-[10px] text-sidebar-muted">Click to insert a variable at cursor position.</p>
              <div className="flex gap-1.5">
                <input
                  className="flex-1 bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                  placeholder="variable_name"
                  value={customVar}
                  onChange={e => setCustomVar(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && customVar.trim()) { insertVariable(customVar); setCustomVar('') } }}
                />
                <button
                  className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                  onClick={() => { if (customVar.trim()) { insertVariable(customVar); setCustomVar('') } }}
                >
                  + Insert
                </button>
              </div>
              <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider pt-1">PDF Presets</p>
              <div className="grid grid-cols-1 gap-1">
                {PDF_PRESET_VARS.map(v => (
                  <button
                    key={v.name}
                    onClick={() => insertVariable(v.name)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg border border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white transition-all text-[11px] group"
                  >
                    <span>{v.label}</span>
                    <span className="font-mono text-[10px] text-sidebar-muted group-hover:text-primary">{`{{${v.name}}}`}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Conditionals ── */}
          {activeVarTab === 'Conditionals' && (
            <>
              <p className="text-[10px] text-sidebar-muted">Insert conditional blocks that show/hide content based on a variable's value.</p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-sidebar-muted mb-1 block">Variable name</label>
                  <input
                    className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                    placeholder="is_paid, show_logo…"
                    value={condVar}
                    onChange={e => setCondVar(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-sidebar-muted mb-1 block">Block type</label>
                  <select
                    className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                    value={condType}
                    onChange={e => setCondType(e.target.value)}
                  >
                    <option value="if">if — show when true</option>
                    <option value="unless">unless — show when false</option>
                    <option value="if-else">if / else — show one of two</option>
                  </select>
                </div>
                <button
                  className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                  disabled={!condVar.trim()}
                  onClick={() => {
                    const v = condVar.trim()
                    if (!v) return
                    if (condType === 'if') {
                      insertBlock(`<!-- {{#if ${v}}} --><div style="padding:8px;border:1px dashed #aaa;border-radius:4px;color:#333;">Content shown when <strong>${v}</strong> is true</div><!-- {{/if}} -->`)
                    } else if (condType === 'unless') {
                      insertBlock(`<!-- {{#unless ${v}}} --><div style="padding:8px;border:1px dashed #aaa;border-radius:4px;color:#333;">Content shown when <strong>${v}</strong> is false</div><!-- {{/unless}} -->`)
                    } else {
                      insertBlock(`<!-- {{#if ${v}}} --><div style="padding:8px;border:1px dashed #6aad6a;border-radius:4px;color:#333;">Shown when <strong>${v}</strong> is true</div><!-- {{else}} --><div style="padding:8px;border:1px dashed #ad6a6a;border-radius:4px;color:#333;">Shown when <strong>${v}</strong> is false</div><!-- {{/if}} -->`)
                    }
                  }}
                >
                  Insert Conditional Block
                </button>
              </div>
              <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider pt-2">Quick Snippets</p>
              <div className="space-y-1">
                <SnippetInsertBtn mono label="{{#if var}} … {{/if}}" title="Basic if block"
                  onClick={() => insertAtCursor('<!-- {{#if variable}} -->')} />
                <SnippetInsertBtn mono label="{{#unless var}} … {{/unless}}" title="Unless block"
                  onClick={() => insertAtCursor('<!-- {{#unless variable}} -->')} />
                <SnippetInsertBtn mono label="{{else}}" title="Else marker"
                  onClick={() => insertAtCursor('<!-- {{else}} -->')} />
                <SnippetInsertBtn mono label="{{/if}}" title="End if"
                  onClick={() => insertAtCursor('<!-- {{/if}} -->')} />
              </div>
            </>
          )}

          {/* ── Loops ── */}
          {activeVarTab === 'Loops' && (
            <>
              <p className="text-[10px] text-sidebar-muted">Repeat content for each item in an array variable.</p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-sidebar-muted mb-1 block">Array variable name</label>
                  <input
                    className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                    placeholder="items, line_items, rows…"
                    value={loopVar}
                    onChange={e => setLoopVar(e.target.value)}
                  />
                </div>
                <button
                  className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                  disabled={!loopVar.trim()}
                  onClick={() => {
                    const v = loopVar.trim()
                    if (!v) return
                    insertBlock(
                      `<!-- {{#each ${v}}} --><div style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;">{{this.name}} — {{this.value}}</div><!-- {{/each}} -->`
                    )
                  }}
                >
                  Insert Loop Block
                </button>
              </div>
              <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider pt-2">Loop Variables</p>
              <div className="space-y-1">
                <SnippetInsertBtn mono label="{{this.name}}" title="Current item property"
                  onClick={() => insertAtCursor('{{this.name}}')} />
                <SnippetInsertBtn mono label="{{this.value}}" title="Current item value"
                  onClick={() => insertAtCursor('{{this.value}}')} />
                <SnippetInsertBtn mono label="{{this.description}}" title="Current item description"
                  onClick={() => insertAtCursor('{{this.description}}')} />
                <SnippetInsertBtn mono label="{{@index}}" title="Current loop index (0-based)"
                  onClick={() => insertAtCursor('{{@index}}')} />
                <SnippetInsertBtn mono label="{{@first}}" title="True for first item"
                  onClick={() => insertAtCursor('{{@first}}')} />
                <SnippetInsertBtn mono label="{{@last}}" title="True for last item"
                  onClick={() => insertAtCursor('{{@last}}')} />
              </div>
              <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider pt-1">Invoice Line Items</p>
              <div className="space-y-1">
                <SnippetInsertBtn label="Loop Table (line_items)" title="Insert a loop table for invoice line items"
                  onClick={() => insertBlock(`<!-- {{#each line_items}} --><table width="100%" style="border-collapse:collapse;font-size:13px;"><tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">{{this.description}}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">{{this.quantity}}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">{{this.unit_price}}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">{{this.total}}</td></tr></table><!-- {{/each}} -->`)} />
              </div>
            </>
          )}

          {/* ── Helpers ── */}
          {activeVarTab === 'Helpers' && (
            <>
              {/* Date Formatter */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Date Format</p>
                <input
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                  placeholder="date_field variable"
                  value={dateVar}
                  onChange={e => setDateVar(e.target.value)}
                />
                <select
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                  value={dateFmt}
                  onChange={e => setDateFmt(e.target.value)}
                >
                  {DATE_FORMATS.map(f => <option key={f.fmt} value={f.fmt}>{f.label}</option>)}
                </select>
                <button
                  className="w-full py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-xs text-white hover:border-primary transition-all disabled:opacity-40"
                  disabled={!dateVar.trim()}
                  onClick={() => insertAtCursor(`{{formatDate ${dateVar.trim()} "${dateFmt}"}}`)}
                >
                  Insert Date Helper
                </button>
              </div>

              <div className="border-t border-sidebar-border pt-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Currency Format</p>
                <input
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                  placeholder="amount variable"
                  value={currVar}
                  onChange={e => setCurrVar(e.target.value)}
                />
                <select
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                  value={currCode}
                  onChange={e => setCurrCode(e.target.value)}
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <button
                  className="w-full py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-xs text-white hover:border-primary transition-all disabled:opacity-40"
                  disabled={!currVar.trim()}
                  onClick={() => insertAtCursor(`{{formatCurrency ${currVar.trim()} "${currCode}"}}`)}
                >
                  Insert Currency Helper
                </button>
              </div>

              <div className="border-t border-sidebar-border pt-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Truncate Text</p>
                <input
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                  placeholder="text variable"
                  value={truncVar}
                  onChange={e => setTruncVar(e.target.value)}
                />
                <input
                  type="number" min={10} max={500}
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                  value={truncLen}
                  onChange={e => setTruncLen(Number(e.target.value))}
                />
                <button
                  className="w-full py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-xs text-white hover:border-primary transition-all disabled:opacity-40"
                  disabled={!truncVar.trim()}
                  onClick={() => insertAtCursor(`{{truncate ${truncVar.trim()} ${truncLen}}}`)}
                >
                  Insert Truncate Helper
                </button>
              </div>

              <div className="border-t border-sidebar-border pt-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Case Helpers</p>
                <input
                  className="w-full bg-sidebar-hover border border-sidebar-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-sidebar-muted outline-none focus:border-primary"
                  placeholder="text variable"
                  value={caseVar}
                  onChange={e => setCaseVar(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    className="py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-xs text-white hover:border-primary transition-all disabled:opacity-40"
                    disabled={!caseVar.trim()}
                    onClick={() => insertAtCursor(`{{uppercase ${caseVar.trim()}}}`)}
                  >
                    UPPERCASE
                  </button>
                  <button
                    className="py-1.5 rounded-lg bg-sidebar-hover border border-sidebar-border text-xs text-white hover:border-primary transition-all disabled:opacity-40"
                    disabled={!caseVar.trim()}
                    onClick={() => insertAtCursor(`{{lowercase ${caseVar.trim()}}}`)}
                  >
                    lowercase
                  </button>
                </div>
              </div>

              <div className="border-t border-sidebar-border pt-3 space-y-1">
                <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Quick Snippets</p>
                {[
                  [`{{formatDate current_date "MMMM D, YYYY"}}`, 'Formatted today'],
                  [`{{formatCurrency total_amount "USD"}}`,       'USD amount'],
                  [`{{uppercase company_name}}`,                  'Company uppercase'],
                  [`{{truncate description 80}}`,                 'Truncate description'],
                ].map(([snippet, label]) => (
                  <button
                    key={snippet}
                    title={snippet}
                    onClick={() => insertAtCursor(snippet)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg border border-sidebar-border text-sidebar-muted hover:border-primary hover:text-white transition-all text-[10px] font-mono truncate"
                  >
                    {label}: {snippet}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="builder-shell">

      {/* ── Top bar ── */}
      <div className="flex items-center bg-white dark:bg-sidebar text-ink dark:text-white px-4 h-[56px] gap-4 shrink-0 border-b border-surface-border dark:border-sidebar-border">

        {/* Left: PDF/Email toggle + title + status */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Segmented PDF / Email */}
          <div className="flex bg-ink-8 dark:bg-sidebar-hover border border-surface-border dark:border-sidebar-border rounded-lg p-0.5 shrink-0">
            <button
              className="px-3.5 py-1 rounded-md text-[13px] font-semibold bg-white dark:bg-sidebar text-ink dark:text-white shadow-sm"
            >
              PDF
            </button>
            <button
              className="px-3.5 py-1 rounded-md text-[13px] font-semibold text-ink-4 dark:text-sidebar-muted hover:text-ink dark:hover:text-white transition-colors"
              onClick={() => navigate('/email-builder')}
              title="Switch to the email builder"
            >
              Email
            </button>
          </div>

          {/* Title */}
          <input
            className="bg-white dark:bg-transparent border border-surface-border dark:border-sidebar-border text-ink dark:text-white text-sm font-semibold px-3 py-1.5 rounded-lg w-56 outline-none focus:border-accent transition-colors placeholder-ink-5 dark:placeholder-sidebar-muted"
            value={settings.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Template name…"
          />

          {/* Status: device · zoom · saved (device + zoom are interactive) */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-ink-4 dark:text-sidebar-muted whitespace-nowrap">
            <select
              value={activeDevice}
              onChange={e => handleDeviceChange(e.target.value)}
              className="bg-transparent text-ink-3 dark:text-sidebar-muted text-xs outline-none cursor-pointer hover:text-ink dark:hover:text-white -ml-1"
              title="Page size"
            >
              {DEVICES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <span className="text-ink-6 dark:text-sidebar-border">·</span>
            <button onClick={() => handleZoom(zoom - 10)} className="hover:text-ink dark:hover:text-white w-4 leading-none" title="Zoom out">−</button>
            <span className="tabular-nums w-9 text-center">{zoom}%</span>
            <button onClick={() => handleZoom(zoom + 10)} className="hover:text-ink dark:hover:text-white w-4 leading-none" title="Zoom in">+</button>
            <span className="text-ink-6 dark:text-sidebar-border">·</span>
            <span className="tabular-nums">
              {isSaving ? 'saving…' : (savedAgo(lastSaved, now) ? `saved ${savedAgo(lastSaved, now)}` : 'not saved yet')}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo / redo */}
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 dark:text-sidebar-muted hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:undo')} title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11a4 4 0 010 8h-1M3 10l4-4M3 10l4 4"/></svg>
          </button>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 dark:text-sidebar-muted hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors"
            onClick={() => editorRef.current?.runCommand('core:redo')} title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H10a4 4 0 000 8h1M21 10l-4-4M21 10l-4 4"/></svg>
          </button>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 dark:text-sidebar-muted hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors"
            onClick={() => setShowSettings(true)} title="Page settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>

          <div className="w-px h-5 bg-surface-border dark:bg-sidebar-border mx-1.5" />

          <button
            className="text-[13.5px] px-3 py-1.5 rounded-lg text-ink-2 dark:text-sidebar-muted hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors"
            onClick={() => setShowPreviewData(true)} title="Preview with dynamic data"
          >
            Preview
          </button>
          <button
            className="text-[13.5px] px-3 py-1.5 rounded-lg text-ink-2 dark:text-sidebar-muted hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors"
            onClick={handleExportHtml} title="Export as HTML file"
          >
            Export
          </button>
          <button
            className="text-[13.5px] px-3 py-1.5 rounded-lg text-ink-2 dark:text-sidebar-muted hover:bg-ink-8 dark:hover:bg-sidebar-hover hover:text-ink dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
            onClick={handleCopyHtml} title="Copy HTML to clipboard"
          >
            {copied ? <><IconCheck className="w-3.5 h-3.5" />Copied</> : 'Copy'}
          </button>

          <button
            className="text-[13.5px] font-semibold px-5 py-1.5 rounded-lg bg-accent hover:bg-accent-600 text-white transition-colors disabled:opacity-60 ml-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Placeholder strip ── */}
      {placeholders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-ink-9 dark:bg-sidebar-hover px-4 py-1.5 shrink-0 border-b border-surface-border dark:border-sidebar-border">
          <span className="text-xs font-semibold text-ink-4 dark:text-slate-500 whitespace-nowrap">Placeholders:</span>
          {placeholders.map(p => (
            <span key={p} className="ph-chip font-mono">{`{{${p}}}`}</span>
          ))}
        </div>
      )}

      {/* ── Main area ── */}
      <div className="builder-main">

        {/* Left panel */}
        <div className="builder-panel-left w-[236px] bg-white dark:bg-sidebar shrink-0 border-r border-surface-border dark:border-sidebar-border flex flex-col">
          {/* Tabs */}
          <div className="flex gap-5 px-4 pt-3.5 border-b border-surface-border dark:border-sidebar-border shrink-0">
            {[['blocks', 'Blocks'], ['layers', 'Layers'], ['variables', 'Variables']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActivePanel(key)}
                className={`relative pb-3 text-[13.5px] transition-colors ${
                  activePanel === key
                    ? 'text-ink dark:text-white font-semibold after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-accent after:rounded-full'
                    : 'text-ink-4 dark:text-sidebar-muted font-medium hover:text-ink dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Block search */}
          {activePanel === 'blocks' && (
            <div className="px-3.5 pt-3.5 pb-1 shrink-0 relative">
              <svg className="w-3.5 h-3.5 text-ink-4 dark:text-sidebar-muted absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" strokeWidth={2}/><path strokeWidth={2} strokeLinecap="round" d="M21 21l-4-4"/></svg>
              <input
                className="w-full bg-ink-8 dark:bg-sidebar-hover border border-surface-border dark:border-sidebar-border rounded-lg pl-8 pr-3 py-2 text-[13px] text-ink dark:text-white placeholder-ink-4 dark:placeholder-sidebar-muted outline-none focus:border-accent transition-colors"
                placeholder="Search blocks…"
                value={blockSearch}
                onChange={e => setBlockSearch(e.target.value)}
              />
            </div>
          )}

          <div className={`flex-1 overflow-hidden ${activePanel === 'variables' ? '' : 'panel-section'}`}>
            <div id="blocks-panel"  className={activePanel === 'blocks'    ? 'h-full overflow-y-auto' : 'hidden'} />
            <div id="layers-panel"  className={activePanel === 'layers'    ? 'h-full overflow-y-auto' : 'hidden'} />
            <div                    className={activePanel === 'variables' ? 'h-full overflow-hidden flex flex-col' : 'hidden'}>
              {/* Call as a render function (not <VariablesPanel/>) so its inputs
                  stay mounted across re-renders — rendering it as an element
                  gives it a new component identity each render, which remounts
                  the subtree and drops focus while typing in its fields. */}
              {VariablesPanel()}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="builder-canvas-wrap">
          <div id="gjs-canvas" />
        </div>

        {/* Right panel */}
        <div className="builder-panel-right w-[288px] bg-white dark:bg-sidebar shrink-0 border-l border-surface-border dark:border-sidebar-border flex flex-col">
          <div className="flex gap-5 px-4 pt-3.5 border-b border-surface-border dark:border-sidebar-border shrink-0">
            {[['styles', 'Styles'], ['traits', 'Properties']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveRight(key)}
                className={`relative pb-3 text-[13.5px] transition-colors ${
                  activeRight === key
                    ? 'text-ink dark:text-white font-semibold after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-accent after:rounded-full'
                    : 'text-ink-4 dark:text-sidebar-muted font-medium hover:text-ink dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div id="style-manager-container" className={`panel-section flex-1 overflow-y-auto ${activeRight === 'styles' ? '' : 'hidden'}`} />
          <div id="traits-panel"            className={`panel-section flex-1 overflow-y-auto ${activeRight === 'traits' ? '' : 'hidden'}`} />
        </div>
      </div>

      {/* ── Page settings modal ── */}
      {showSettings && (
        <PageSettingsModal settings={settings} onChange={set} onClose={() => setShowSettings(false)} />
      )}

      {/* ── Preview with data modal ── */}
      {showPreviewData && (
        <PreviewDataModal
          getHtml={() => editorRef.current?.getHtml() || ''}
          getCss={() => editorRef.current?.getCss() || ''}
          meta={settings}
          onClose={() => setShowPreviewData(false)}
        />
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
              {['A4', 'A3', 'Letter', 'Legal', 'Custom'].map(s => <option key={s}>{s}</option>)}
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
          <button className="btn btn-primary" onClick={onClose}>Done</button>
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
  if (!tag || !RESIZABLE_TAGS.has(tag)) {
    component.components().each(child => enableResize(child))
    return
  }

  if (tag === 'img') {
    // A top-level image (dropped straight onto the page) is free-placed via
    // position:absolute. An image nested inside another block — e.g. the
    // "Image + Text" / letterhead / invoice-header blocks — must instead stay
    // in its parent's flow, or it detaches and floats to the page corner.
    const parent   = component.parent()
    const topLevel = !parent || parent.get('type') === 'wrapper'

    component.set('draggable', topLevel)
    const style = component.getStyle()
    const attrs = component.getAttributes()
    const attrW = attrs.width  && !isNaN(Number(attrs.width))  ? Number(attrs.width)  + 'px' : null
    const attrH = attrs.height && !isNaN(Number(attrs.height)) ? Number(attrs.height) + 'px' : null
    // Resolve final width/height: CSS style > HTML attribute > default
    const resolvedW = style.width  || attrW  || '200px'
    const resolvedH = style.height || attrH  || 'auto'

    if (topLevel) {
      component.setStyle({
        position: 'absolute',
        top:      '20px',
        left:     '20px',
        ...style,          // existing style wins (preserves saved top/left/etc.)
        width:    resolvedW,
        height:   resolvedH,
      })
    } else {
      // Nested image: strip any inherited absolute positioning so it renders
      // in flow inside its block, and keep an explicit size for the renderer.
      const s = { ...style, width: resolvedW, height: resolvedH }
      delete s.position; delete s.top; delete s.left
      component.setStyle(s)
    }
    // Resize config is set as a model default in addType — only set if missing
    if (!component.get('resizable')) component.set('resizable', RESIZE_CONFIG)
  } else if (!component.get('resizable')) {
    component.set('resizable', RESIZE_CONFIG)
    component.set('draggable', true)
  }

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

  wrapper.appendChild(sizeSelect)
  wrapper.appendChild(makeColorPicker(canvasDoc, 'A', '#000', 'Text color',
    (color) => canvasDoc.execCommand('foreColor', false, color)))
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
