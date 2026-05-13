/**
 * GrapesJS configuration for the PDF template builder.
 * Defines: canvas style, device sizes, block categories, custom blocks.
 */

export const EDITOR_CONFIG = (containerId) => ({
  container: `#${containerId}`,
  fromElement: false,
  height: '100%',
  width: 'auto',
  storageManager: false,
  undoManager: { trackChanges: true },

  canvas: {
    styles: [
      `data:text/css,
        body { background: #94a3b8; padding: 30px; font-family: Arial, sans-serif; }
        .gjs-frame-wrapper { background: #94a3b8; }
      `,
    ],
  },

  deviceManager: {
    devices: [
      { name: 'A4 Portrait',   width: '794px',  height: '1123px' },
      { name: 'A4 Landscape',  width: '1123px', height: '794px'  },
      { name: 'A3 Portrait',   width: '1123px', height: '1587px' },
      { name: 'A3 Landscape',  width: '1587px', height: '1123px' },
      { name: 'Letter',        width: '816px',  height: '1056px' },
      { name: 'Legal',         width: '816px',  height: '1344px' },
      { name: 'Custom',        width: '794px',  height: '1123px' },
    ],
  },

  styleManager: {
    appendTo: '#style-manager-container',
    sectors: [
      {
        name: 'Typography',
        properties: [
          'font-family', 'font-size', 'font-weight',
          'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration',
        ],
      },
      {
        name: 'Spacing',
        properties: [
          'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
          'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        ],
      },
      {
        name: 'Dimension',
        properties: ['width', 'height', 'max-width', 'min-height', 'max-height'],
      },
      {
        name: 'Decorations',
        properties: ['background-color', 'border', 'border-radius', 'opacity', 'box-shadow'],
      },
      {
        name: 'Position',
        properties: ['position', 'top', 'left', 'right', 'bottom', 'z-index'],
      },
    ],
  },

  rte: {
    actions: [
      {
        name: 'h1',
        icon: '<span class="rte-icon" style="font-weight:900;font-size:13px">H1</span>',
        attributes: { title: 'Heading 1' },
        result: rte => rte.exec('formatBlock', 'h1'),
        state: (rte, doc) => doc.queryCommandValue('formatBlock').toLowerCase() === 'h1' ? 'active' : '',
      },
      {
        name: 'h2',
        icon: '<span class="rte-icon" style="font-weight:800;font-size:12px">H2</span>',
        attributes: { title: 'Heading 2' },
        result: rte => rte.exec('formatBlock', 'h2'),
        state: (rte, doc) => doc.queryCommandValue('formatBlock').toLowerCase() === 'h2' ? 'active' : '',
      },
      {
        name: 'h3',
        icon: '<span class="rte-icon" style="font-weight:700;font-size:11px">H3</span>',
        attributes: { title: 'Heading 3' },
        result: rte => rte.exec('formatBlock', 'h3'),
        state: (rte, doc) => doc.queryCommandValue('formatBlock').toLowerCase() === 'h3' ? 'active' : '',
      },
      {
        name: 'paragraph',
        icon: '<span class="rte-icon" style="font-size:13px">¶</span>',
        attributes: { title: 'Normal paragraph' },
        result: rte => rte.exec('formatBlock', 'p'),
      },
      { name: 'sep1', icon: '<span class="rte-sep">|</span>', attributes: { class: 'rte-sep-btn', style: 'cursor:default' }, result: () => {} },
      {
        name: 'bold',
        icon: '<strong class="rte-icon">B</strong>',
        attributes: { title: 'Bold' },
        result: rte => rte.exec('bold'),
        state: (rte, doc) => doc.queryCommandState('bold') ? 'active' : '',
      },
      {
        name: 'italic',
        icon: '<em class="rte-icon">I</em>',
        attributes: { title: 'Italic' },
        result: rte => rte.exec('italic'),
        state: (rte, doc) => doc.queryCommandState('italic') ? 'active' : '',
      },
      {
        name: 'underline',
        icon: '<span class="rte-icon" style="text-decoration:underline">U</span>',
        attributes: { title: 'Underline' },
        result: rte => rte.exec('underline'),
        state: (rte, doc) => doc.queryCommandState('underline') ? 'active' : '',
      },
      {
        name: 'strikethrough',
        icon: '<span class="rte-icon" style="text-decoration:line-through">S</span>',
        attributes: { title: 'Strikethrough' },
        result: rte => rte.exec('strikeThrough'),
        state: (rte, doc) => doc.queryCommandState('strikeThrough') ? 'active' : '',
      },
      { name: 'sep2', icon: '<span class="rte-sep">|</span>', attributes: { class: 'rte-sep-btn', style: 'cursor:default' }, result: () => {} },
      {
        name: 'alignLeft',
        icon: '<span class="rte-icon">⇤</span>',
        attributes: { title: 'Align Left' },
        result: rte => rte.exec('justifyLeft'),
        state: (rte, doc) => doc.queryCommandState('justifyLeft') ? 'active' : '',
      },
      {
        name: 'alignCenter',
        icon: '<span class="rte-icon">⇔</span>',
        attributes: { title: 'Align Center' },
        result: rte => rte.exec('justifyCenter'),
        state: (rte, doc) => doc.queryCommandState('justifyCenter') ? 'active' : '',
      },
      {
        name: 'alignRight',
        icon: '<span class="rte-icon">⇥</span>',
        attributes: { title: 'Align Right' },
        result: rte => rte.exec('justifyRight'),
        state: (rte, doc) => doc.queryCommandState('justifyRight') ? 'active' : '',
      },
      {
        name: 'alignJustify',
        icon: '<span class="rte-icon">☰</span>',
        attributes: { title: 'Justify' },
        result: rte => rte.exec('justifyFull'),
        state: (rte, doc) => doc.queryCommandState('justifyFull') ? 'active' : '',
      },
      { name: 'sep3', icon: '<span class="rte-sep">|</span>', attributes: { class: 'rte-sep-btn', style: 'cursor:default' }, result: () => {} },
      {
        name: 'olist',
        icon: '<span class="rte-icon" style="font-size:10px">1.</span>',
        attributes: { title: 'Ordered List' },
        result: rte => rte.exec('insertOrderedList'),
        state: (rte, doc) => doc.queryCommandState('insertOrderedList') ? 'active' : '',
      },
      {
        name: 'ulist',
        icon: '<span class="rte-icon" style="font-size:15px">•</span>',
        attributes: { title: 'Unordered List' },
        result: rte => rte.exec('insertUnorderedList'),
        state: (rte, doc) => doc.queryCommandState('insertUnorderedList') ? 'active' : '',
      },
      { name: 'sep4', icon: '<span class="rte-sep">|</span>', attributes: { class: 'rte-sep-btn', style: 'cursor:default' }, result: () => {} },
      {
        name: 'link',
        icon: '<span class="rte-icon" style="font-size:11px">🔗</span>',
        attributes: { title: 'Insert Link' },
        result: rte => { const url = prompt('Enter URL:'); if (url) rte.exec('createLink', url) },
      },
      {
        name: 'unlink',
        icon: '<span class="rte-icon" style="font-size:10px">⊘</span>',
        attributes: { title: 'Remove Link' },
        result: rte => rte.exec('unlink'),
      },
    ],
  },

  panels: { defaults: [] },

  blockManager: {
    appendTo: '#blocks-panel',
    blocks: buildBlocks(),
  },

  layerManager:  { appendTo: '#layers-panel'  },
  traitManager:  { appendTo: '#traits-panel'  },
})

/* ── SVG icon helper ──────────────────────────────────────────────────────── */
function svg(path, extra = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
    stroke-linecap="round" stroke-linejoin="round" width="30" height="30" ${extra}>${path}</svg>`
}

/* ── All blocks ───────────────────────────────────────────────────────────── */
function buildBlocks() {
  return [

    // ═══════════════════════════════════════════════════════════════════════
    // BASIC
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'text',
      label: 'Text',
      category: 'Basic',
      media: svg(`<path d="M4 6h16M4 10h10M4 14h12M4 18h8"/>`),
      content: '<p style="font-size:14px;margin:0 0 8px 0;color:#222;">Type your text here</p>',
    },
    {
      id: 'heading',
      label: 'Heading',
      category: 'Basic',
      media: svg(`<path d="M4 5v14M20 5v14M4 12h16" stroke-width="2"/>`),
      content: '<h2 style="font-size:22px;font-weight:bold;margin:0 0 12px 0;color:#1a1a2e;">Heading</h2>',
    },
    {
      id: 'paragraph',
      label: 'Paragraph',
      category: 'Basic',
      media: svg(`<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>`),
      content: `<p style="font-size:13px;line-height:1.7;margin:0 0 10px 0;color:#444;">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua.</p>`,
    },
    {
      id: 'subheading',
      label: 'Subheading',
      category: 'Basic',
      media: svg(`<path d="M4 7h16M4 12h12M4 17h8" stroke-width="1.8"/>`),
      content: '<h4 style="font-size:15px;font-weight:600;color:#555;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.05em;">Section Title</h4>',
    },
    {
      id: 'label-value',
      label: 'Label + Value',
      category: 'Basic',
      media: svg(`<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M3 5h6" stroke-dasharray="2 1"/>`),
      content: `<div style="display:flex;gap:8px;align-items:baseline;margin:4px 0;">
        <span style="font-size:12px;color:#888;font-weight:600;min-width:100px;">Label:</span>
        <span style="font-size:13px;color:#222;">{{value}}</span>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LAYOUT
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'divider',
      label: 'Divider',
      category: 'Layout',
      media: svg(`<line x1="3" y1="12" x2="21" y2="12" stroke-width="2"/>
        <line x1="3" y1="8" x2="21" y2="8" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="3" y1="16" x2="21" y2="16" stroke-width="1" stroke-dasharray="2 2"/>`),
      content: '<hr style="border:none;border-top:1px solid #ddd;margin:12px 0;"/>',
    },
    {
      id: 'spacer',
      label: 'Spacer',
      category: 'Layout',
      media: svg(`<line x1="12" y1="5" x2="12" y2="19" stroke-dasharray="2 2"/>
        <path d="M8 8l4-3 4 3M8 16l4 3 4-3"/>`),
      content: '<div style="height:24px;"></div>',
    },
    {
      id: 'two-columns',
      label: '2 Columns',
      category: 'Layout',
      media: svg(`<rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/>`),
      content: `<div style="display:flex;gap:16px;">
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 1</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 2</div>
      </div>`,
    },
    {
      id: 'three-columns',
      label: '3 Columns',
      category: 'Layout',
      media: svg(`<rect x="2" y="4" width="6" height="16" rx="1"/>
        <rect x="9" y="4" width="6" height="16" rx="1"/>
        <rect x="16" y="4" width="6" height="16" rx="1"/>`),
      content: `<div style="display:flex;gap:12px;">
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 1</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 2</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 3</div>
      </div>`,
    },
    {
      id: 'four-columns',
      label: '4 Columns',
      category: 'Layout',
      media: svg(`<rect x="1" y="4" width="4.5" height="16" rx="1"/>
        <rect x="6.5" y="4" width="4.5" height="16" rx="1"/>
        <rect x="13" y="4" width="4.5" height="16" rx="1"/>
        <rect x="18.5" y="4" width="4.5" height="16" rx="1"/>`),
      content: `<div style="display:flex;gap:10px;">
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;font-size:11px;">Col 1</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;font-size:11px;">Col 2</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;font-size:11px;">Col 3</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;font-size:11px;">Col 4</div>
      </div>`,
    },
    {
      id: 'sidebar-layout',
      label: 'Sidebar (30/70)',
      category: 'Layout',
      media: svg(`<rect x="2" y="4" width="6" height="16" rx="1"/>
        <rect x="10" y="4" width="12" height="16" rx="1"/>`),
      content: `<div style="display:flex;gap:16px;">
        <div style="width:30%;padding:10px;background:#f8f9fa;border-radius:4px;min-height:80px;font-size:12px;">Sidebar</div>
        <div style="flex:1;padding:10px;border:1px dashed #ccc;min-height:80px;">Main content</div>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MEDIA
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'image',
      label: 'Image',
      category: 'Media',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`),
      content: {
        type: 'image',
        style: { width: '100%', display: 'block', margin: '8px 0' },
        attributes: { src: 'https://placehold.co/400x200?text=Image' },
      },
    },
    {
      id: 'logo',
      label: 'Logo',
      category: 'Media',
      media: svg(`<rect x="3" y="6" width="18" height="12" rx="2"/>
        <path d="M3 10h18M7 6v12" stroke-dasharray="2 1"/>`),
      content: {
        type: 'image',
        style: { width: '140px', display: 'block', margin: '0' },
        attributes: { src: 'https://placehold.co/140x50/6366f1/fff?text=LOGO', alt: 'Company Logo' },
      },
    },
    {
      id: 'img-text',
      label: 'Image + Text',
      category: 'Media',
      media: svg(`<rect x="2" y="5" width="8" height="14" rx="1"/>
        <path d="M13 8h8M13 12h6M13 16h7"/>`),
      content: `<div style="display:flex;gap:16px;align-items:flex-start;">
        <img src="https://placehold.co/160x120?text=Image" style="width:160px;height:120px;object-fit:cover;border-radius:6px;"/>
        <div style="flex:1;">
          <h3 style="margin:0 0 6px;font-size:16px;font-weight:bold;color:#1a1a2e;">{{title}}</h3>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">{{description}}</p>
        </div>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SHAPES
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'shape-rect',
      label: 'Rectangle',
      category: 'Shapes',
      media: svg(`<rect x="3" y="7" width="18" height="10" rx="1" fill="currentColor" opacity=".2"/><rect x="3" y="7" width="18" height="10" rx="1"/>`),
      content: '<div style="width:200px;height:80px;background:#6366f1;border-radius:4px;"></div>',
    },
    {
      id: 'shape-circle',
      label: 'Circle',
      category: 'Shapes',
      media: svg(`<circle cx="12" cy="12" r="9" fill="currentColor" opacity=".2"/><circle cx="12" cy="12" r="9"/>`),
      content: '<div style="width:80px;height:80px;background:#8b5cf6;border-radius:50%;"></div>',
    },
    {
      id: 'shape-line',
      label: 'Line',
      category: 'Shapes',
      media: svg(`<line x1="3" y1="12" x2="21" y2="12" stroke-width="2.5"/>`),
      content: '<div style="height:2px;background:#333;margin:12px 0;"></div>',
    },
    {
      id: 'shape-border-box',
      label: 'Border Box',
      category: 'Shapes',
      media: svg(`<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="3 1.5"/>`),
      content: '<div style="border:2px solid #6366f1;border-radius:8px;padding:16px;min-height:60px;"></div>',
    },
    {
      id: 'shape-callout',
      label: 'Highlight Box',
      category: 'Shapes',
      media: svg(`<rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" opacity=".15"/><rect x="3" y="6" width="3" height="12" rx="1" fill="currentColor"/>`),
      content: `<div style="border-left:4px solid #6366f1;background:#f5f3ff;padding:12px 16px;border-radius:0 6px 6px 0;margin:8px 0;">
        <p style="margin:0;font-size:13px;color:#4338ca;line-height:1.6;">{{highlightText}}</p>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TABLE
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'table-simple',
      label: 'Simple Table',
      category: 'Table',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>`),
      content: `<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;">
        <thead>
          <tr>
            <th style="border:1px solid #e0e0e0;padding:8px 12px;background:#f8f9fa;text-align:left;font-weight:600;color:#333;">Column 1</th>
            <th style="border:1px solid #e0e0e0;padding:8px 12px;background:#f8f9fa;text-align:left;font-weight:600;color:#333;">Column 2</th>
            <th style="border:1px solid #e0e0e0;padding:8px 12px;background:#f8f9fa;text-align:left;font-weight:600;color:#333;">Column 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #e0e0e0;padding:8px 12px;color:#444;">Cell 1</td>
            <td style="border:1px solid #e0e0e0;padding:8px 12px;color:#444;">Cell 2</td>
            <td style="border:1px solid #e0e0e0;padding:8px 12px;color:#444;">Cell 3</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="border:1px solid #e0e0e0;padding:8px 12px;color:#444;">Cell 4</td>
            <td style="border:1px solid #e0e0e0;padding:8px 12px;color:#444;">Cell 5</td>
            <td style="border:1px solid #e0e0e0;padding:8px 12px;color:#444;">Cell 6</td>
          </tr>
        </tbody>
      </table>`,
    },
    {
      id: 'table-invoice',
      label: 'Invoice Table',
      category: 'Table',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 8h18" stroke-width="2"/>
        <line x1="3" y1="13" x2="21" y2="13"/>
        <line x1="8" y1="8" x2="8" y2="21"/>
        <line x1="16" y1="8" x2="16" y2="21"/>`),
      content: `<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;">
        <thead>
          <tr style="background:#4f46e5;color:#fff;">
            <th style="padding:10px 12px;text-align:left;font-weight:600;">#</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;">Description</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;">Rate</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:9px 12px;color:#333;">1</td>
            <td style="padding:9px 12px;color:#333;">{{item_name}}</td>
            <td style="padding:9px 12px;color:#333;text-align:right;">{{qty}}</td>
            <td style="padding:9px 12px;color:#333;text-align:right;">{{rate}}</td>
            <td style="padding:9px 12px;color:#333;text-align:right;">{{amount}}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background:#f9fafb;border-top:2px solid #e0e0e0;">
            <td colspan="4" style="padding:10px 12px;text-align:right;font-weight:700;color:#333;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#4f46e5;">{{total_amount}}</td>
          </tr>
        </tfoot>
      </table>`,
    },
    {
      id: 'table-loop',
      label: 'Loop Table',
      category: 'Table',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 8h18" stroke-width="2"/>
        <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14" stroke-width="1.2"/>`),
      content: `<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;">
        <thead>
          <tr style="background:#1e293b;color:#fff;">
            <th style="padding:9px 12px;text-align:left;font-weight:600;">Name</th>
            <th style="padding:9px 12px;text-align:left;font-weight:600;">Description</th>
            <th style="padding:9px 12px;text-align:right;font-weight:600;">Value</th>
          </tr>
        </thead>
        <tbody>
          <!-- {{#each items}} -->
          <tr style="border-bottom:1px solid #f0f0f0;">
            <td style="padding:8px 12px;color:#333;">{{this.name}}</td>
            <td style="padding:8px 12px;color:#555;">{{this.description}}</td>
            <td style="padding:8px 12px;color:#333;text-align:right;font-weight:600;">{{this.value}}</td>
          </tr>
          <!-- {{/each}} -->
        </tbody>
      </table>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DYNAMIC
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'dynamic-field',
      label: 'Dynamic Field',
      category: 'Dynamic',
      media: svg(`<path d="M8 3H7a4 4 0 000 8 4 4 0 000 8h1"/>
        <path d="M16 3h1a4 4 0 010 8 4 4 0 010 8h-1"/>`),
      content: `<span style="background:#ede9fe;border:1px dashed #8b5cf6;border-radius:4px;
        padding:2px 8px;font-size:13px;color:#6d28d9;">{{fieldName}}</span>`,
    },
    {
      id: 'qr-code',
      label: 'QR Code',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 16h.01M16 14h.01M16 18h.01M18 16h.01"/>`),
      content: `<div style="text-align:center;display:inline-block;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data={{qrData}}"
          width="120" height="120" alt="QR Code"
          style="display:block;border:4px solid #f5f3ff;border-radius:6px;"/>
        <p style="margin:6px 0 0;font-size:11px;color:#888;">{{qrLabel}}</p>
      </div>`,
    },
    {
      id: 'barcode',
      label: 'Barcode',
      category: 'Dynamic',
      media: svg(`<path d="M4 4h2v16H4zM7 4h1v16H7zM9 4h2v16H9zM13 4h1v16h-1zM15 4h2v16h-2zM18 4h1v16h-1zM20 4h0v16h0z" stroke-width="1.2"/>`),
      content: `<div style="text-align:center;display:inline-block;padding:8px;background:#fff;border:1px solid #e0e0e0;border-radius:4px;">
        <img src="https://barcode.tec-it.com/barcode.ashx?data={{barcodeValue}}&code=Code128&dpi=96"
          alt="Barcode" style="height:60px;display:block;"/>
        <p style="margin:4px 0 0;font-size:11px;color:#555;letter-spacing:0.1em;font-family:monospace;">{{barcodeValue}}</p>
      </div>`,
    },
    {
      id: 'signature-placeholder',
      label: 'Signature',
      category: 'Dynamic',
      media: svg(`<path d="M3 17c3-4 6-6 9-2s6-2 9-4" stroke-width="2"/>
        <line x1="3" y1="21" x2="21" y2="21"/>`),
      content: `<div style="margin:16px 0;">
        <div style="border-bottom:2px solid #333;min-height:60px;padding-bottom:6px;width:220px;">
          <p style="margin:0;font-size:11px;color:#aaa;font-style:italic;">Sign here</p>
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#555;font-weight:600;">{{signatory_name}}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#888;">{{signatory_title}}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#888;">Date: {{signatory_date}}</p>
      </div>`,
    },
    {
      id: 'page-number',
      label: 'Page Number',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 12h6M12 9v6"/>`),
      content: `<div style="text-align:center;font-size:11px;color:#888;padding:4px 0;">
        Page <span style="background:#ede9fe;border:1px dashed #8b5cf6;border-radius:3px;padding:1px 6px;color:#6d28d9;font-size:11px;">{{page_number}}</span>
        of <span style="background:#ede9fe;border:1px dashed #8b5cf6;border-radius:3px;padding:1px 6px;color:#6d28d9;font-size:11px;">{{total_pages}}</span>
      </div>`,
    },
    {
      id: 'date-stamp',
      label: 'Date / Time',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>`),
      content: `<span style="background:#eff6ff;border:1px dashed #93c5fd;border-radius:4px;
        padding:2px 10px;font-size:13px;color:#1d4ed8;font-family:sans-serif;">
        {{current_date}}
      </span>`,
    },
    {
      id: 'watermark',
      label: 'Watermark',
      category: 'Dynamic',
      media: svg(`<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-dasharray="2 1"/>`),
      content: `<div style="position:relative;pointer-events:none;overflow:hidden;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);
          font-size:60px;font-weight:900;color:rgba(99,102,241,0.12);white-space:nowrap;
          letter-spacing:0.1em;text-transform:uppercase;user-select:none;">
          CONFIDENTIAL
        </div>
      </div>`,
    },
    {
      id: 'if-block',
      label: 'If Block',
      category: 'Dynamic',
      media: svg(`<path d="M9 9l3-3 3 3M12 6v9"/>
        <path d="M5 19h3.5l3.5-7 3.5 7H19" stroke-width="1.4"/>`),
      content: `<!-- {{#if showContent}} -->
<div style="padding:12px 16px;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 6px 6px 0;margin:8px 0;">
  <p style="margin:0;font-size:13px;color:#1e40af;">This content shows when <strong>showContent</strong> is truthy.</p>
</div>
<!-- {{/if}} -->`,
    },
    {
      id: 'if-else-block',
      label: 'If / Else',
      category: 'Dynamic',
      media: svg(`<path d="M3 12h18M3 6h7m7 0h4M3 18h4m10 0h7"/>`),
      content: `<!-- {{#if conditionVar}} -->
<div style="padding:12px;background:#eff6ff;border-left:4px solid #3b82f6;margin:8px 0;border-radius:0 4px 4px 0;">
  <p style="margin:0;font-size:13px;color:#1e40af;">✓ True branch</p>
</div>
<!-- {{else}} -->
<div style="padding:12px;background:#f9fafb;border-left:4px solid #9ca3af;margin:8px 0;border-radius:0 4px 4px 0;">
  <p style="margin:0;font-size:13px;color:#6b7280;">✗ False branch</p>
</div>
<!-- {{/if}} -->`,
    },
    {
      id: 'each-block',
      label: 'Repeat Block',
      category: 'Dynamic',
      media: svg(`<path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>`),
      content: `<!-- {{#each items}} -->
<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
  <span style="font-size:13px;color:#333;font-weight:600;">{{this.name}}</span>
  <span style="font-size:13px;color:#6366f1;font-weight:700;">{{this.value}}</span>
</div>
<!-- {{/each}} -->`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BUSINESS
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'invoice-header',
      label: 'Invoice Header',
      category: 'Business',
      media: svg(`<rect x="3" y="3" width="18" height="7" rx="1"/>
        <path d="M6 6h4M16 6h2M6 8h2"/>`),
      content: `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:24px 0 20px;border-bottom:3px solid #4f46e5;margin-bottom:20px;">
        <div>
          <img src="https://placehold.co/140x44/6366f1/fff?text=LOGO" alt="Logo" style="height:44px;margin-bottom:10px;display:block;"/>
          <p style="margin:0;font-size:12px;color:#666;">{{company_name}}</p>
          <p style="margin:2px 0 0;font-size:11px;color:#999;">{{company_address}}</p>
          <p style="margin:2px 0 0;font-size:11px;color:#999;">{{company_email}} | {{company_phone}}</p>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0 0 8px;font-size:32px;font-weight:900;color:#4f46e5;letter-spacing:-0.02em;">INVOICE</h1>
          <p style="margin:0;font-size:13px;color:#555;"><strong>Invoice #:</strong> {{invoice_number}}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#555;"><strong>Date:</strong> {{invoice_date}}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#555;"><strong>Due:</strong> {{due_date}}</p>
        </div>
      </div>`,
    },
    {
      id: 'bill-to',
      label: 'Bill To / Ship To',
      category: 'Business',
      media: svg(`<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`),
      content: `<div style="display:flex;gap:40px;margin:16px 0;">
        <div style="flex:1;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Bill To</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">{{client_name}}</p>
          <p style="margin:3px 0 0;font-size:13px;color:#555;">{{client_company}}</p>
          <p style="margin:3px 0 0;font-size:13px;color:#555;">{{client_address}}</p>
          <p style="margin:3px 0 0;font-size:13px;color:#555;">{{client_city}}, {{client_country}}</p>
        </div>
        <div style="flex:1;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Ship To</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">{{ship_name}}</p>
          <p style="margin:3px 0 0;font-size:13px;color:#555;">{{ship_address}}</p>
          <p style="margin:3px 0 0;font-size:13px;color:#555;">{{ship_city}}, {{ship_country}}</p>
        </div>
      </div>`,
    },
    {
      id: 'invoice-totals',
      label: 'Invoice Totals',
      category: 'Business',
      media: svg(`<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>`),
      content: `<div style="display:flex;justify-content:flex-end;margin:16px 0;">
        <table style="width:280px;font-size:13px;">
          <tr>
            <td style="padding:6px 12px;color:#555;">Subtotal</td>
            <td style="padding:6px 12px;text-align:right;color:#333;font-weight:600;">{{subtotal}}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;color:#555;">Tax ({{tax_rate}}%)</td>
            <td style="padding:6px 12px;text-align:right;color:#333;font-weight:600;">{{tax_amount}}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;color:#555;">Discount</td>
            <td style="padding:6px 12px;text-align:right;color:#e53e3e;font-weight:600;">-{{discount}}</td>
          </tr>
          <tr style="border-top:2px solid #4f46e5;">
            <td style="padding:10px 12px;font-weight:800;font-size:15px;color:#1a1a2e;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:800;font-size:18px;color:#4f46e5;">{{total_amount}}</td>
          </tr>
        </table>
      </div>`,
    },
    {
      id: 'company-letterhead',
      label: 'Letterhead',
      category: 'Business',
      media: svg(`<rect x="3" y="3" width="18" height="5" rx="1" fill="currentColor" opacity=".3"/>
        <rect x="3" y="3" width="18" height="5" rx="1"/>
        <path d="M3 10h18M3 13h12M3 16h10"/>`),
      content: `<div style="border-bottom:4px solid #4f46e5;margin-bottom:24px;padding-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#1a1a2e;letter-spacing:-0.02em;">{{company_name}}</h1>
            <p style="margin:3px 0 0;font-size:12px;color:#888;">{{company_tagline}}</p>
          </div>
          <div style="text-align:right;font-size:11px;color:#888;line-height:1.8;">
            <p style="margin:0;">{{company_address}}</p>
            <p style="margin:0;">{{company_email}}</p>
            <p style="margin:0;">{{company_phone}}</p>
          </div>
        </div>
      </div>`,
    },
    {
      id: 'receipt-block',
      label: 'Receipt Block',
      category: 'Business',
      media: svg(`<path d="M4 2h16a1 1 0 011 1v18l-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2V3a1 1 0 011-1z"/>
        <path d="M8 10h8M8 14h5"/>`),
      content: `<div style="border:1px solid #e0e0e0;border-radius:8px;padding:20px;max-width:360px;font-size:13px;">
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;text-align:center;color:#1a1a2e;">Payment Receipt</h3>
        <div style="border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="color:#666;">Receipt #</span><span style="font-weight:600;">{{receipt_number}}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#666;">Date</span><span style="font-weight:600;">{{payment_date}}</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#4f46e5;">
          <span>Total Paid</span><span>{{total_paid}}</span>
        </div>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'parties-block',
      label: 'Parties Block',
      category: 'Legal',
      media: svg(`<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`),
      content: `<div style="margin:16px 0;font-size:13px;line-height:1.8;color:#333;">
        <p>This agreement is entered into as of <strong>{{agreement_date}}</strong>, between:</p>
        <div style="margin:12px 0;padding:12px 16px;background:#f8f9fa;border-radius:6px;">
          <p style="margin:0;"><strong>Party A:</strong> {{party_a_name}}, a company incorporated under the laws of {{party_a_jurisdiction}}, with its principal place of business at {{party_a_address}} (hereinafter referred to as "<strong>Company</strong>")</p>
        </div>
        <p style="margin:8px 0;">and</p>
        <div style="margin:12px 0;padding:12px 16px;background:#f8f9fa;border-radius:6px;">
          <p style="margin:0;"><strong>Party B:</strong> {{party_b_name}}, residing at {{party_b_address}} (hereinafter referred to as "<strong>Client</strong>")</p>
        </div>
      </div>`,
    },
    {
      id: 'signature-row',
      label: 'Dual Signature',
      category: 'Legal',
      media: svg(`<path d="M3 17c3-4 6-6 9-2s6-2 9-4" stroke-width="2"/>
        <line x1="3" y1="21" x2="21" y2="21"/>`),
      content: `<div style="display:flex;gap:40px;margin-top:32px;">
        <div style="flex:1;">
          <div style="border-bottom:2px solid #333;min-height:56px;margin-bottom:8px;"></div>
          <p style="margin:0;font-size:13px;font-weight:700;color:#1a1a2e;">{{signer_1_name}}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#555;">{{signer_1_title}}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#888;">Date: _______________</p>
        </div>
        <div style="flex:1;">
          <div style="border-bottom:2px solid #333;min-height:56px;margin-bottom:8px;"></div>
          <p style="margin:0;font-size:13px;font-weight:700;color:#1a1a2e;">{{signer_2_name}}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#555;">{{signer_2_title}}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#888;">Date: _______________</p>
        </div>
      </div>`,
    },
    {
      id: 'terms-clause',
      label: 'Terms Clause',
      category: 'Legal',
      media: svg(`<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>
        <path d="M9 12h6M9 16h4"/>`),
      content: `<div style="margin:12px 0;">
        <h4 style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1a1a2e;">{{clause_number}}. {{clause_title}}</h4>
        <p style="margin:0;font-size:12px;color:#444;line-height:1.8;text-align:justify;">{{clause_content}}</p>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CERTIFICATE
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'cert-frame',
      label: 'Certificate Frame',
      category: 'Certificate',
      media: svg(`<rect x="2" y="2" width="20" height="20" rx="1" stroke-dasharray="2 1"/>
        <rect x="4" y="4" width="16" height="16" rx="1"/>`),
      content: `<div style="border:8px double #b7791f;border-radius:4px;padding:32px;text-align:center;background:#fffbeb;min-height:300px;">
        <div style="border:2px solid #d97706;border-radius:2px;padding:24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#92400e;">Certificate of</p>
          <h1 style="margin:0 0 16px;font-size:36px;font-weight:900;color:#78350f;font-style:italic;">Achievement</h1>
          <p style="margin:0 0 8px;font-size:13px;color:#555;">This is to certify that</p>
          <h2 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a2e;border-bottom:2px solid #d97706;display:inline-block;padding-bottom:4px;">{{recipient_name}}</h2>
          <p style="margin:8px 0;font-size:13px;color:#555;line-height:1.7;">{{certificate_body}}</p>
          <p style="margin:16px 0 0;font-size:12px;color:#888;">{{certificate_date}}</p>
        </div>
      </div>`,
    },
    {
      id: 'cert-title',
      label: 'Certificate Title',
      category: 'Certificate',
      media: svg(`<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>`),
      content: `<div style="text-align:center;padding:24px 0;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);margin-bottom:16px;">
          <span style="font-size:32px;">🏆</span>
        </div>
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.25em;color:#888;">Certificate of Completion</p>
        <h1 style="margin:0;font-size:38px;font-weight:900;color:#1a1a2e;font-family:Georgia,serif;">{{course_name}}</h1>
      </div>`,
    },
    {
      id: 'cert-body',
      label: 'Certificate Body',
      category: 'Certificate',
      media: svg(`<path d="M4 6h16M4 10h16M4 14h10"/>`),
      content: `<div style="text-align:center;padding:16px 32px;">
        <p style="margin:0 0 12px;font-size:14px;color:#555;">This is to proudly certify that</p>
        <h2 style="margin:0 0 12px;font-size:32px;font-weight:700;color:#1a1a2e;border-bottom:3px solid #f59e0b;display:inline-block;padding-bottom:6px;">{{recipient_name}}</h2>
        <p style="margin:12px 0;font-size:13px;color:#555;line-height:1.8;max-width:480px;margin-left:auto;margin-right:auto;">
          has successfully completed <strong>{{course_name}}</strong> with a total of
          <strong>{{total_hours}} hours</strong> of training on <strong>{{completion_date}}</strong>.
        </p>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CHARTS (SVG Placeholders)
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'chart-bar',
      label: 'Bar Chart',
      category: 'Charts',
      media: svg(`<path d="M18 20V10M12 20V4M6 20v-6"/>`),
      content: `<div style="padding:16px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.05em;">{{chart_title}}</p>
        <svg width="100%" height="160" viewBox="0 0 400 160" style="display:block;">
          <line x1="40" y1="10" x2="40" y2="140" stroke="#e0e0e0" stroke-width="1"/>
          <line x1="40" y1="140" x2="390" y2="140" stroke="#e0e0e0" stroke-width="1"/>
          <rect x="60"  y="60"  width="40" height="80" fill="#6366f1" rx="2"/>
          <rect x="120" y="30"  width="40" height="110" fill="#8b5cf6" rx="2"/>
          <rect x="180" y="80"  width="40" height="60"  fill="#6366f1" rx="2"/>
          <rect x="240" y="50"  width="40" height="90"  fill="#8b5cf6" rx="2"/>
          <rect x="300" y="20"  width="40" height="120" fill="#6366f1" rx="2"/>
          <text x="80"  y="155" text-anchor="middle" font-size="10" fill="#888">{{label_1}}</text>
          <text x="140" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_2}}</text>
          <text x="200" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_3}}</text>
          <text x="260" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_4}}</text>
          <text x="320" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_5}}</text>
        </svg>
      </div>`,
    },
    {
      id: 'chart-line',
      label: 'Line Chart',
      category: 'Charts',
      media: svg(`<polyline points="3 17 9 11 13 15 21 7" stroke-width="2"/>`),
      content: `<div style="padding:16px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.05em;">{{chart_title}}</p>
        <svg width="100%" height="160" viewBox="0 0 400 160" style="display:block;">
          <line x1="40" y1="10" x2="40" y2="140" stroke="#e0e0e0" stroke-width="1"/>
          <line x1="40" y1="140" x2="390" y2="140" stroke="#e0e0e0" stroke-width="1"/>
          <line x1="40" y1="80" x2="390" y2="80" stroke="#f0f0f0" stroke-width="1" stroke-dasharray="4 4"/>
          <line x1="40" y1="40" x2="390" y2="40" stroke="#f0f0f0" stroke-width="1" stroke-dasharray="4 4"/>
          <polyline points="70,110 140,70 210,90 280,45 350,30" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round"/>
          <polyline points="70,110 140,70 210,90 280,45 350,30" fill="none" stroke="url(#lg)" stroke-width="0"/>
          <circle cx="70"  cy="110" r="4" fill="#6366f1"/>
          <circle cx="140" cy="70"  r="4" fill="#6366f1"/>
          <circle cx="210" cy="90"  r="4" fill="#6366f1"/>
          <circle cx="280" cy="45"  r="4" fill="#6366f1"/>
          <circle cx="350" cy="30"  r="4" fill="#6366f1"/>
          <text x="70"  y="155" text-anchor="middle" font-size="10" fill="#888">{{label_1}}</text>
          <text x="140" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_2}}</text>
          <text x="210" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_3}}</text>
          <text x="280" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_4}}</text>
          <text x="350" y="155" text-anchor="middle" font-size="10" fill="#888">{{label_5}}</text>
        </svg>
      </div>`,
    },
    {
      id: 'chart-pie',
      label: 'Pie Chart',
      category: 'Charts',
      media: svg(`<path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z"/>`),
      content: `<div style="padding:16px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;display:flex;align-items:center;gap:24px;">
        <div style="flex-shrink:0;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.05em;">{{chart_title}}</p>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="#6366f1" stroke-width="42" stroke-dasharray="113 263" stroke-dashoffset="0"/>
            <circle cx="70" cy="70" r="60" fill="none" stroke="#8b5cf6" stroke-width="42" stroke-dasharray="75 301"  stroke-dashoffset="-113"/>
            <circle cx="70" cy="70" r="60" fill="none" stroke="#c4b5fd" stroke-width="42" stroke-dasharray="50 326"  stroke-dashoffset="-188"/>
            <circle cx="70" cy="70" r="60" fill="none" stroke="#e0e7ff" stroke-width="42" stroke-dasharray="25 351"  stroke-dashoffset="-238"/>
            <circle cx="70" cy="70" r="28" fill="white"/>
          </svg>
        </div>
        <div style="flex:1;font-size:12px;color:#555;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:12px;height:12px;border-radius:2px;background:#6366f1;flex-shrink:0;"></div>
            <span>{{segment_1}} — <strong>43%</strong></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:12px;height:12px;border-radius:2px;background:#8b5cf6;flex-shrink:0;"></div>
            <span>{{segment_2}} — <strong>29%</strong></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:12px;height:12px;border-radius:2px;background:#c4b5fd;flex-shrink:0;"></div>
            <span>{{segment_3}} — <strong>19%</strong></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:12px;height:12px;border-radius:2px;background:#e0e7ff;flex-shrink:0;"></div>
            <span>{{segment_4}} — <strong>9%</strong></span>
          </div>
        </div>
      </div>`,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 'page-header',
      label: 'Page Header',
      category: 'Page',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 8h18" stroke-width="2"/>
        <line x1="6" y1="5.5" x2="10" y2="5.5"/>
        <line x1="14" y1="5.5" x2="18" y2="5.5"/>`),
      content: `<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:2px solid #6366f1;margin-bottom:20px;">
        <div>
          <h1 style="font-size:24px;font-weight:bold;margin:0;color:#1a1a2e;">{{company_name}}</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#888;">{{company_address}}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:13px;margin:0;color:#555;">Date: <strong>{{date}}</strong></p>
          <p style="font-size:13px;margin:4px 0 0;color:#555;">Ref: <strong>{{reference_no}}</strong></p>
        </div>
      </div>`,
    },
    {
      id: 'page-footer',
      label: 'Page Footer',
      category: 'Page',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 16h18" stroke-width="2"/>
        <line x1="7" y1="19" x2="11" y2="19"/>
        <line x1="13" y1="19" x2="17" y2="19"/>`),
      content: `<div style="border-top:1px solid #e0e0e0;margin-top:20px;padding-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#aaa;">
        <span>{{company_name}} | {{company_address}}</span>
        <span>Page {{page_number}} of {{total_pages}}</span>
      </div>`,
    },
    {
      id: 'address-block',
      label: 'Address Block',
      category: 'Page',
      media: svg(`<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>`),
      content: `<div style="font-size:13px;line-height:1.8;color:#333;">
        <strong>{{recipient_name}}</strong><br/>
        {{recipient_address}}<br/>
        {{recipient_city}}, {{recipient_country}}
      </div>`,
    },
  ]
}
