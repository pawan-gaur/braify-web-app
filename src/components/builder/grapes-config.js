/**
 * GrapesJS configuration for the PDF template builder.
 * Defines: canvas style (A4 page), block categories, custom blocks.
 */

export const EDITOR_CONFIG = (containerId) => ({
  container: `#${containerId}`,
  fromElement: false,
  height: '100%',
  width: 'auto',
  storageManager: false, // we handle save manually
  undoManager: { trackChanges: true },

  canvas: {
    styles: [
      // A4 page look inside the canvas
      `data:text/css,
        body { background: #888; padding: 20px; }
        .gjs-frame-wrapper { background: #888; }
      `,
    ],
  },

  deviceManager: {
    devices: [
      { name: 'A4 Portrait',  width: '794px',  height: '1123px' },
      { name: 'A4 Landscape', width: '1123px', height: '794px'  },
      { name: 'Letter',       width: '816px',  height: '1056px' },
    ],
  },

  styleManager: {
    appendTo: '#style-manager-container',
    sectors: [
      {
        name: 'Typography',
        properties: [
          'font-family', 'font-size', 'font-weight',
          'letter-spacing', 'color', 'line-height', 'text-align',
        ],
      },
      {
        name: 'Spacing',
        properties: ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                     'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
      },
      {
        name: 'Dimension',
        properties: ['width', 'height', 'max-width', 'min-height'],
      },
      {
        name: 'Decorations',
        properties: ['background-color', 'border', 'border-radius', 'opacity'],
      },
    ],
  },

  rte: {
    actions: [
      // ── Block format ────────────────────────────────────────
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
      // ── Separator ───────────────────────────────────────────
      {
        name: 'sep1',
        icon: '<span class="rte-sep">|</span>',
        attributes: { class: 'rte-sep-btn', title: '', style: 'cursor:default' },
        result: () => {},
      },
      // ── Inline style ────────────────────────────────────────
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
      // ── Separator ───────────────────────────────────────────
      {
        name: 'sep2',
        icon: '<span class="rte-sep">|</span>',
        attributes: { class: 'rte-sep-btn', title: '', style: 'cursor:default' },
        result: () => {},
      },
      // ── Alignment ────────────────────────────────────────────
      {
        name: 'alignLeft',
        icon: '<span class="rte-icon" title="Align Left">⇤</span>',
        attributes: { title: 'Align Left' },
        result: rte => rte.exec('justifyLeft'),
        state: (rte, doc) => doc.queryCommandState('justifyLeft') ? 'active' : '',
      },
      {
        name: 'alignCenter',
        icon: '<span class="rte-icon" title="Center">⇔</span>',
        attributes: { title: 'Align Center' },
        result: rte => rte.exec('justifyCenter'),
        state: (rte, doc) => doc.queryCommandState('justifyCenter') ? 'active' : '',
      },
      {
        name: 'alignRight',
        icon: '<span class="rte-icon" title="Align Right">⇥</span>',
        attributes: { title: 'Align Right' },
        result: rte => rte.exec('justifyRight'),
        state: (rte, doc) => doc.queryCommandState('justifyRight') ? 'active' : '',
      },
      {
        name: 'alignJustify',
        icon: '<span class="rte-icon" title="Justify">☰</span>',
        attributes: { title: 'Justify' },
        result: rte => rte.exec('justifyFull'),
        state: (rte, doc) => doc.queryCommandState('justifyFull') ? 'active' : '',
      },
      // ── Separator ───────────────────────────────────────────
      {
        name: 'sep3',
        icon: '<span class="rte-sep">|</span>',
        attributes: { class: 'rte-sep-btn', title: '', style: 'cursor:default' },
        result: () => {},
      },
      // ── Lists ─────────────────────────────────────────────
      {
        name: 'olist',
        icon: '<span class="rte-icon" style="font-size:10px;letter-spacing:-0.5px">1.</span>',
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
      // ── Link ─────────────────────────────────────────────
      {
        name: 'sep4',
        icon: '<span class="rte-sep">|</span>',
        attributes: { class: 'rte-sep-btn', title: '', style: 'cursor:default' },
        result: () => {},
      },
      {
        name: 'link',
        icon: '<span class="rte-icon" style="font-size:11px">🔗</span>',
        attributes: { title: 'Insert Link' },
        result: rte => {
          const url = prompt('Enter URL:')
          if (url) rte.exec('createLink', url)
        },
      },
      {
        name: 'unlink',
        icon: '<span class="rte-icon" style="font-size:10px">⊘</span>',
        attributes: { title: 'Remove Link' },
        result: rte => rte.exec('unlink'),
      },
    ],
  },

  panels: { defaults: [] }, // we build panels in the component

  blockManager: {
    appendTo: '#blocks-panel',
    blocks: buildBlocks(),
  },

  layerManager: { appendTo: '#layers-panel' },

  traitManager: { appendTo: '#traits-panel' },
})

function svg(path, extra = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
    stroke-linecap="round" stroke-linejoin="round" width="30" height="30" ${extra}>${path}</svg>`
}

function buildBlocks() {
  return [
    // ── Basic ─────────────────────────────────────────
    {
      id: 'text',
      label: 'Text',
      category: 'Basic',
      media: svg(`<path d="M4 6h16M4 10h10M4 14h12M4 18h8"/>`),
      content: '<p style="font-size:14px;margin:0 0 8px 0;">Type your text here</p>',
    },
    {
      id: 'heading',
      label: 'Heading',
      category: 'Basic',
      media: svg(`<path d="M4 5v14M20 5v14M4 12h16" stroke-width="2"/>`),
      content: '<h2 style="font-size:22px;font-weight:bold;margin:0 0 12px 0;">Heading</h2>',
    },
    {
      id: 'paragraph',
      label: 'Paragraph',
      category: 'Basic',
      media: svg(`<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>`),
      content: `<p style="font-size:13px;line-height:1.6;margin:0 0 10px 0;">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>`,
    },

    // ── Layout ────────────────────────────────────────
    {
      id: 'divider',
      label: 'Divider',
      category: 'Layout',
      media: svg(`<line x1="3" y1="12" x2="21" y2="12" stroke-width="2"/><line x1="3" y1="8" x2="21" y2="8" stroke-width="1" stroke-dasharray="2 2"/><line x1="3" y1="16" x2="21" y2="16" stroke-width="1" stroke-dasharray="2 2"/>`),
      content: '<hr style="border:none;border-top:1px solid #ddd;margin:12px 0;"/>',
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
      media: svg(`<rect x="2" y="4" width="6" height="16" rx="1"/><rect x="9" y="4" width="6" height="16" rx="1"/><rect x="16" y="4" width="6" height="16" rx="1"/>`),
      content: `<div style="display:flex;gap:12px;">
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 1</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 2</div>
        <div style="flex:1;padding:8px;border:1px dashed #ccc;min-height:60px;">Column 3</div>
      </div>`,
    },

    // ── Media ─────────────────────────────────────────
    {
      id: 'image',
      label: 'Image',
      category: 'Media',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`),
      content: {
        type: 'image',
        style: { width: '100%', display: 'block', margin: '8px 0' },
        attributes: { src: 'https://placehold.co/400x200?text=Image' },
      },
    },

    // ── Table ─────────────────────────────────────────
    {
      id: 'table-simple',
      label: 'Simple Table',
      category: 'Table',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>`),
      content: `
        <table style="width:100%;border-collapse:collapse;margin:8px 0;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd;padding:8px;background:#f2f2f2;text-align:left;">Column 1</th>
              <th style="border:1px solid #ddd;padding:8px;background:#f2f2f2;text-align:left;">Column 2</th>
              <th style="border:1px solid #ddd;padding:8px;background:#f2f2f2;text-align:left;">Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;">Cell 1</td>
              <td style="border:1px solid #ddd;padding:8px;">Cell 2</td>
              <td style="border:1px solid #ddd;padding:8px;">Cell 3</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;">Cell 4</td>
              <td style="border:1px solid #ddd;padding:8px;">Cell 5</td>
              <td style="border:1px solid #ddd;padding:8px;">Cell 6</td>
            </tr>
          </tbody>
        </table>`,
    },
    {
      id: 'table-invoice',
      label: 'Invoice Table',
      category: 'Table',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 8h18" stroke-width="2"/><line x1="3" y1="13" x2="21" y2="13"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
        <line x1="8" y1="8" x2="8" y2="21"/><line x1="16" y1="8" x2="16" y2="21"/>`),
      content: `
        <table style="width:100%;border-collapse:collapse;margin:8px 0;">
          <thead>
            <tr style="background:#4f46e5;color:#fff;">
              <th style="border:1px solid #ddd;padding:10px;text-align:left;">#</th>
              <th style="border:1px solid #ddd;padding:10px;text-align:left;">Item</th>
              <th style="border:1px solid #ddd;padding:10px;text-align:right;">Qty</th>
              <th style="border:1px solid #ddd;padding:10px;text-align:right;">Price</th>
              <th style="border:1px solid #ddd;padding:10px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;">1</td>
              <td style="border:1px solid #ddd;padding:8px;">{{items[0].name}}</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:right;">{{items[0].qty}}</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:right;">{{items[0].price}}</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:right;">{{items[0].total}}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="border:1px solid #ddd;padding:8px;text-align:right;font-weight:bold;">Total</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:right;font-weight:bold;">{{totalAmount}}</td>
            </tr>
          </tfoot>
        </table>`,
    },

    // ── Dynamic Fields ────────────────────────────────
    {
      id: 'dynamic-field',
      label: 'Dynamic Field',
      category: 'Dynamic',
      media: svg(`<path d="M8 3H7a4 4 0 000 8 4 4 0 000 8h1"/><path d="M16 3h1a4 4 0 010 8 4 4 0 010 8h-1"/>`),
      content: `<span class="dynamic-field"
        style="background:#ede9fe;border:1px dashed #8b5cf6;border-radius:4px;padding:2px 8px;font-size:13px;color:#6d28d9;">
        {{fieldName}}
      </span>`,
    },
    {
      id: 'dynamic-block',
      label: 'Labeled Field',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="8" width="18" height="8" rx="1"/>
        <path d="M3 5h6M3 19h6" stroke-dasharray="2 1"/>`),
      content: `<div style="margin:6px 0;">
        <span style="font-weight:600;font-size:13px;color:#555;">Label: </span>
        <span class="dynamic-field"
          style="background:#ede9fe;border:1px dashed #8b5cf6;border-radius:4px;padding:2px 8px;font-size:13px;color:#6d28d9;">
          {{fieldName}}
        </span>
      </div>`,
    },
    {
      id: 'address-block',
      label: 'Address Block',
      category: 'Dynamic',
      media: svg(`<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>`),
      content: `<div style="font-size:13px;line-height:1.8;">
        <strong>{{recipient.name}}</strong><br/>
        {{recipient.address}}<br/>
        {{recipient.city}}, {{recipient.country}}
      </div>`,
    },

    // ── Page ──────────────────────────────────────────
    {
      id: 'page-header',
      label: 'Page Header',
      category: 'Page',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 8h18" stroke-width="2"/>
        <line x1="6" y1="5.5" x2="10" y2="5.5"/><line x1="14" y1="5.5" x2="18" y2="5.5"/>`),
      content: `<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:2px solid #6366f1;margin-bottom:20px;">
        <div>
          <h1 style="font-size:24px;font-weight:bold;margin:0;color:#1a1a2e;">{{companyName}}</h1>
          <p style="margin:4px 0 0 0;font-size:12px;color:#666;">{{companyAddress}}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:13px;margin:0;color:#555;">Date: <strong>{{date}}</strong></p>
          <p style="font-size:13px;margin:4px 0 0 0;color:#555;">Ref: <strong>{{referenceNo}}</strong></p>
        </div>
      </div>`,
    },
    {
      id: 'page-footer',
      label: 'Page Footer',
      category: 'Page',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 16h18" stroke-width="2"/>
        <line x1="7" y1="19" x2="11" y2="19"/><line x1="13" y1="19" x2="17" y2="19"/>`),
      content: `<div style="border-top:1px solid #ddd;margin-top:20px;padding-top:10px;text-align:center;font-size:11px;color:#888;">
        {{footerText}} | Page 1 of 1
      </div>`,
    },
  ]
}
