/**
 * GrapesJS configuration for the Email template builder.
 * Uses a 600-px-wide canvas (email standard) with email-safe HTML blocks.
 */

// Re-use the same RTE action list as the PDF builder
import { EDITOR_CONFIG as PDF_CONFIG } from './grapes-config'

export const EMAIL_EDITOR_CONFIG = (containerId) => ({
  container: `#${containerId}`,
  fromElement: false,
  height: '100%',
  width: 'auto',
  storageManager: false,
  undoManager: { trackChanges: true },

  canvas: {
    styles: [
      `data:text/css,
        body { background: #c8c8c8; margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .gjs-frame-wrapper { background: #c8c8c8; }
      `,
    ],
  },

  // Email preview widths
  // Desktop Email uses '' (full canvas width) so the 600-px email table
  // centres naturally — prevents the 600px frame + body-padding squish.
  deviceManager: {
    devices: [
      { name: 'Desktop Email', width: ''       },
      { name: 'Tablet',        width: '480px'  },
      { name: 'Mobile',        width: '375px'  },
    ],
  },

  styleManager: {
    appendTo: '#email-style-manager',
    sectors: [
      {
        name: 'Typography',
        properties: [
          'font-family', 'font-size', 'font-weight',
          'color', 'line-height', 'text-align', 'letter-spacing',
        ],
      },
      {
        name: 'Spacing',
        properties: [
          'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
          'margin',  'margin-top',  'margin-right',  'margin-bottom',  'margin-left',
        ],
      },
      {
        name: 'Dimension',
        properties: ['width', 'max-width', 'height'],
      },
      {
        name: 'Decorations',
        properties: ['background-color', 'border', 'border-radius'],
      },
    ],
  },

  // Inherit the same RTE config from PDF builder
  rte: PDF_CONFIG('__unused__').rte,

  panels: { defaults: [] },

  blockManager: {
    appendTo: '#email-blocks-panel',
    blocks: buildEmailBlocks(),
  },

  layerManager: { appendTo: '#email-layers-panel' },
  traitManager: { appendTo: '#email-traits-panel' },

  // ── Asset manager — URL-only; no file upload so images are never
  //    base64-encoded. Users paste / type the hosted image URL instead.
  assetManager: {
    upload:       false,   // hide the "Upload" button entirely
    multiUpload:  false,
    showAddButton: true,   // keep the "Add image URL" input
    assets:       [],
    // Override the default FileReader upload so a file-drop / file-choose
    // never encodes the binary to a data: URI.
    uploadFile:   () => {},
  },
})

// ── SVG icon helper ──────────────────────────────────────────────────────────
function svg(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
    stroke-linecap="round" stroke-linejoin="round" width="30" height="30">${path}</svg>`
}

// ── Email blocks ─────────────────────────────────────────────────────────────
function buildEmailBlocks() {
  return [

    // ── Structure ─────────────────────────────────────────────────────────────
    {
      id: 'email-wrapper',
      label: 'Email Wrapper',
      category: 'Structure',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="2"/>
        <rect x="6" y="6" width="12" height="12" rx="1" stroke-dasharray="2 1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#f4f4f4;padding:20px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0"
              style="background:#ffffff;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:24px;">
                <p style="margin:0;font-size:14px;color:#444;">Your email content here…</p>
              </td></tr>
            </table>
          </td></tr>
        </table>`,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    {
      id: 'email-header',
      label: 'Email Header',
      category: 'Structure',
      media: svg(`<rect x="3" y="3" width="18" height="7" rx="1"/>
        <line x1="6" y1="6.5" x2="10" y2="6.5" stroke-width="2"/>
        <rect x="3" y="12" width="18" height="9" rx="1" stroke-dasharray="2 1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;">
                      {{companyName}}
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">
                      {{companyTagline}}
                    </p>
                  </td>
                  <td align="right">
                    <img src="https://placehold.co/80x40/ffffff/6366f1?text=LOGO"
                         width="80" alt="Logo"
                         style="display:block;border-radius:4px;"/>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── Hero ──────────────────────────────────────────────────────────────────
    {
      id: 'email-hero',
      label: 'Hero Banner',
      category: 'Structure',
      media: svg(`<rect x="3" y="3" width="18" height="12" rx="1"/>
        <circle cx="8" cy="7" r="1.5"/><path d="M3 13l4-4 4 4 3-3 4 4"/>
        <rect x="8" y="17" width="8" height="3" rx="1.5"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0;">
              <img src="https://placehold.co/600x200/eef2ff/6366f1?text=Hero+Image"
                   width="600" style="display:block;width:100%;max-width:600px;" alt="Hero"/>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;background:#ffffff;">
              <h1 style="margin:0 0 12px;font-size:28px;font-weight:bold;color:#1a1a2e;">
                {{heroTitle}}
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                {{heroSubtitle}}
              </p>
              <a href="{{ctaUrl}}"
                 style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                        color:#fff;font-weight:bold;font-size:15px;text-decoration:none;border-radius:8px;">
                {{ctaText}}
              </a>
            </td>
          </tr>
        </table>`,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    {
      id: 'email-text',
      label: 'Text Block',
      category: 'Content',
      media: svg(`<path d="M4 6h16M4 10h14M4 14h16M4 18h10"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:15px;color:#444;line-height:1.7;">
                Dear {{recipientName}},
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#444;line-height:1.7;">
                Your email body text goes here. Keep it concise and action-focused.
              </p>
            </td>
          </tr>
        </table>`,
    },
    {
      id: 'email-button',
      label: 'CTA Button',
      category: 'Content',
      media: svg(`<rect x="4" y="8" width="16" height="8" rx="4"/>
        <path d="M9 12h6M13 10l2 2-2 2"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:16px 32px;">
              <a href="{{buttonUrl}}"
                 style="display:inline-block;padding:14px 36px;
                        background:linear-gradient(135deg,#6366f1,#8b5cf6);
                        color:#ffffff;font-size:15px;font-weight:bold;
                        text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
                {{buttonText}}
              </a>
            </td>
          </tr>
        </table>`,
    },
    {
      id: 'email-image',
      label: 'Image',
      category: 'Content',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:16px 32px;">
              <img src="https://placehold.co/536x200?text=Image"
                   width="100%" style="display:block;max-width:536px;border-radius:6px;" alt=""/>
            </td>
          </tr>
        </table>`,
    },

    // ── Layout ────────────────────────────────────────────────────────────────
    {
      id: 'email-two-col',
      label: '2 Columns',
      category: 'Layout',
      media: svg(`<rect x="2" y="4" width="9" height="16" rx="1"/>
        <rect x="13" y="4" width="9" height="16" rx="1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top"
                      style="padding-right:12px;border:1px dashed #ddd;padding:12px;">
                    <p style="margin:0;font-size:14px;color:#444;">Left column content</p>
                  </td>
                  <td width="50%" valign="top"
                      style="padding-left:12px;border:1px dashed #ddd;padding:12px;">
                    <p style="margin:0;font-size:14px;color:#444;">Right column content</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },
    {
      id: 'email-img-text',
      label: 'Image + Text',
      category: 'Layout',
      media: svg(`<rect x="2" y="5" width="9" height="14" rx="1"/>
        <path d="M14 8h7M14 12h5M14 16h6"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="45%" valign="top" style="padding-right:16px;">
                    <img src="https://placehold.co/240x180?text=Image"
                         width="100%" style="display:block;border-radius:6px;" alt=""/>
                  </td>
                  <td width="55%" valign="top">
                    <h3 style="margin:0 0 8px;font-size:18px;color:#1a1a2e;">{{title}}</h3>
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
                      {{description}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },
    {
      id: 'email-divider',
      label: 'Divider',
      category: 'Layout',
      media: svg(`<line x1="3" y1="12" x2="21" y2="12" stroke-width="2"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 32px;">
              <hr style="border:none;border-top:1px solid #e8e8e8;margin:0;"/>
            </td>
          </tr>
        </table>`,
    },
    {
      id: 'email-spacer',
      label: 'Spacer',
      category: 'Layout',
      media: svg(`<line x1="12" y1="5" x2="12" y2="19" stroke-dasharray="2 2"/>
        <path d="M8 8l4-3 4 3M8 16l4 3 4-3"/>`),
      content: `<table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td height="32" style="font-size:0;line-height:0;">&nbsp;</td></tr>
                </table>`,
    },

    // ── Dynamic ───────────────────────────────────────────────────────────────
    {
      id: 'email-dynamic',
      label: 'Dynamic Field',
      category: 'Dynamic',
      media: svg(`<path d="M8 3H7a4 4 0 000 8 4 4 0 000 8h1"/>
        <path d="M16 3h1a4 4 0 010 8 4 4 0 010 8h-1"/>`),
      content: `<span style="background:#ede9fe;border:1px dashed #8b5cf6;border-radius:4px;
                             padding:2px 8px;font-size:13px;color:#6d28d9;">{{fieldName}}</span>`,
    },
    {
      id: 'email-greeting',
      label: 'Greeting',
      category: 'Dynamic',
      media: svg(`<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:15px;color:#444;">
                Dear <strong>{{recipientName}}</strong>,
              </p>
            </td>
          </tr>
        </table>`,
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    {
      id: 'email-footer',
      label: 'Email Footer',
      category: 'Footer',
      media: svg(`<rect x="3" y="14" width="18" height="7" rx="1"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <rect x="3" y="3" width="18" height="9" rx="1" stroke-dasharray="2 1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#f9f9f9;border-top:1px solid #e8e8e8;">
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;">
                {{companyName}} · {{companyAddress}}
              </p>
              <p style="margin:0;font-size:12px;color:#aaa;">
                You received this email because you signed up for {{productName}}.
                &nbsp;|&nbsp;
                <a href="{{unsubscribeUrl}}" style="color:#6366f1;text-decoration:none;">
                  Unsubscribe
                </a>
              </p>
            </td>
          </tr>
        </table>`,
    },
    {
      id: 'email-social',
      label: 'Social Links',
      category: 'Footer',
      media: svg(`<circle cx="12" cy="12" r="9"/>
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:16px 32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${['Twitter','LinkedIn','Facebook','Instagram'].map(name => `
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:36px;height:36px;
                                       background:#6366f1;border-radius:50%;text-align:center;
                                       line-height:36px;text-decoration:none;">
                      <span style="color:#fff;font-size:12px;font-weight:bold;">
                        ${name.charAt(0)}
                      </span>
                    </a>
                  </td>`).join('')}
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── 3 Columns ─────────────────────────────────────────────────────────────
    {
      id: 'email-three-col',
      label: '3 Columns',
      category: 'Layout',
      media: svg(`<rect x="2" y="4" width="5.5" height="16" rx="1"/>
        <rect x="9.25" y="4" width="5.5" height="16" rx="1"/>
        <rect x="16.5" y="4" width="5.5" height="16" rx="1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" valign="top" style="padding:8px;border:1px dashed #e0e0e0;">
                    <p style="margin:0;font-size:13px;color:#444;text-align:center;">Column 1</p>
                  </td>
                  <td width="33%" valign="top" style="padding:8px;border:1px dashed #e0e0e0;">
                    <p style="margin:0;font-size:13px;color:#444;text-align:center;">Column 2</p>
                  </td>
                  <td width="34%" valign="top" style="padding:8px;border:1px dashed #e0e0e0;">
                    <p style="margin:0;font-size:13px;color:#444;text-align:center;">Column 3</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── Video Thumbnail ───────────────────────────────────────────────────────
    {
      id: 'email-video',
      label: 'Video Thumb',
      category: 'Content',
      media: svg(`<rect x="3" y="5" width="18" height="14" rx="2"/>
        <polygon points="10,9 10,15 16,12" fill="currentColor" stroke="none"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:16px 32px;">
              <a href="{{videoUrl}}" style="display:block;position:relative;text-decoration:none;">
                <img src="https://placehold.co/536x300/1a1a2e/6366f1?text=▶ Watch+Video"
                     width="100%" style="display:block;max-width:536px;border-radius:8px;" alt="Watch video"/>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:-56px;">
                  <tr>
                    <td align="center">
                      <span style="display:inline-block;width:52px;height:52px;background:rgba(99,102,241,0.9);
                                   border-radius:50%;line-height:52px;text-align:center;font-size:20px;color:#fff;">
                        ▶
                      </span>
                    </td>
                  </tr>
                </table>
              </a>
              <p style="margin:12px 0 0;font-size:13px;color:#888;text-align:center;">
                {{videoCaption}}
              </p>
            </td>
          </tr>
        </table>`,
    },

    // ── Raw HTML Block ────────────────────────────────────────────────────────
    {
      id: 'email-html',
      label: 'HTML Block',
      category: 'Content',
      media: svg(`<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 32px;">
              <!-- Custom HTML goes here -->
              <p style="margin:0;font-size:13px;color:#888;font-style:italic;
                         border:1px dashed #ccc;border-radius:4px;padding:12px;text-align:center;">
                Custom HTML block — click to edit
              </p>
            </td>
          </tr>
        </table>`,
    },

    // ── OTP / Verification Code ───────────────────────────────────────────────
    {
      id: 'email-otp',
      label: 'OTP Code',
      category: 'Transactional',
      media: svg(`<rect x="3" y="8" width="18" height="8" rx="2"/>
        <path d="M7 12h.01M12 12h.01M17 12h.01" stroke-width="2.5"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">
                Your verification code
              </p>
              <div style="display:inline-block;background:#f5f3ff;border:2px solid #ddd6fe;
                          border-radius:12px;padding:16px 40px;margin:8px 0;">
                <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:0.3em;
                           color:#4f46e5;font-family:monospace;">
                  {{otpCode}}
                </p>
              </div>
              <p style="margin:12px 0 0;font-size:12px;color:#aaa;">
                This code expires in <strong>{{expiryMinutes}} minutes</strong>.
                Do not share it with anyone.
              </p>
            </td>
          </tr>
        </table>`,
    },

    // ── Invoice Row ───────────────────────────────────────────────────────────
    {
      id: 'email-invoice',
      label: 'Invoice Row',
      category: 'Transactional',
      media: svg(`<rect x="3" y="4" width="18" height="16" rx="1"/>
        <path d="M7 8h10M7 12h6M7 16h8M17 14l2 2 2-2"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f9f9f9;border-bottom:2px solid #eee;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">Item</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">Qty</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Unit Price</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:10px 12px;font-size:13px;color:#333;">{{itemName}}</td>
                    <td style="padding:10px 12px;font-size:13px;color:#333;text-align:center;">{{itemQty}}</td>
                    <td style="padding:10px 12px;font-size:13px;color:#333;text-align:right;">{{itemPrice}}</td>
                    <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#333;text-align:right;">{{itemTotal}}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="border-top:2px solid #eee;">
                    <td colspan="3" style="padding:10px 12px;font-size:13px;font-weight:700;color:#333;text-align:right;">Total</td>
                    <td style="padding:10px 12px;font-size:15px;font-weight:700;color:#4f46e5;text-align:right;">{{grandTotal}}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── Alert / Notification ──────────────────────────────────────────────────
    {
      id: 'email-alert',
      label: 'Alert Block',
      category: 'Notification',
      media: svg(`<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2.5"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fef3c7;border:1px solid #fde68a;border-left:4px solid #f59e0b;
                            border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#92400e;">
                      ⚠ {{alertTitle}}
                    </p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
                      {{alertMessage}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── Success Notification ───────────────────────────────────────────────────
    {
      id: 'email-success',
      label: 'Success Alert',
      category: 'Notification',
      media: svg(`<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#d1fae5;border:1px solid #a7f3d0;border-left:4px solid #10b981;
                            border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#065f46;">
                      ✓ {{successTitle}}
                    </p>
                    <p style="margin:0;font-size:13px;color:#047857;line-height:1.6;">
                      {{successMessage}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── Product Card ──────────────────────────────────────────────────────────
    {
      id: 'email-product',
      label: 'Product Card',
      category: 'Marketing',
      media: svg(`<rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
                <tr>
                  <td>
                    <img src="https://placehold.co/536x200/f5f3ff/6366f1?text=Product+Image"
                         width="100%" style="display:block;" alt="{{productName}}"/>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8b5cf6;">
                      {{productCategory}}
                    </p>
                    <h3 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">
                      {{productName}}
                    </h3>
                    <p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">
                      {{productDescription}}
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <p style="margin:0;font-size:24px;font-weight:800;color:#4f46e5;">
                            {{productPrice}}
                          </p>
                        </td>
                        <td>
                          <a href="{{productUrl}}"
                             style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                    color:#fff;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;">
                            Shop Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── Newsletter Article ─────────────────────────────────────────────────────
    {
      id: 'email-article',
      label: 'Article Card',
      category: 'Marketing',
      media: svg(`<path d="M4 6h16M4 10h14M4 14h16M4 18h10"/>
        <rect x="14" y="12" width="7" height="7" rx="1"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="160" valign="top" style="padding-right:20px;">
                    <img src="https://placehold.co/150x110/eef2ff/6366f1?text=Article"
                         width="150" style="display:block;border-radius:8px;" alt=""/>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8b5cf6;">
                      {{articleCategory}}
                    </p>
                    <h4 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a2e;line-height:1.4;">
                      {{articleTitle}}
                    </h4>
                    <p style="margin:0 0 12px;font-size:13px;color:#666;line-height:1.6;">
                      {{articleExcerpt}}
                    </p>
                    <a href="{{articleUrl}}"
                       style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none;">
                      Read more →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`,
    },

    // ── QR Code ───────────────────────────────────────────────────────────────
    {
      id: 'email-qr',
      label: 'QR Code',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 16h.01M16 14h.01M16 18h.01M18 16h.01"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:24px 32px;">
              <p style="margin:0 0 12px;font-size:14px;color:#444;">{{qrLabel}}</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={{qrUrl}}"
                   width="150" height="150" alt="QR Code"
                   style="display:block;margin:0 auto;border-radius:8px;border:4px solid #f5f3ff;"/>
              <p style="margin:12px 0 0;font-size:12px;color:#aaa;">
                Scan to visit: <a href="{{qrUrl}}" style="color:#6366f1;">{{qrUrl}}</a>
              </p>
            </td>
          </tr>
        </table>`,
    },

    // ── Conditional — If Block ────────────────────────────────────────────────
    {
      id: 'email-if-block',
      label: 'If Block',
      category: 'Dynamic',
      media: svg(`<path d="M9 9l3-3 3 3M12 6v9"/>
        <path d="M5 19h3.5l3.5-7 3.5 7H19" stroke-width="1.4"/>`),
      content: `<!-- {{#if showContent}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;border-radius:6px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e40af;">Conditional Block</p>
            <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.6;">
              This content is shown when <strong>showContent</strong> is truthy.
              Replace the variable name in the HTML comment above.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- {{/if}} -->`,
    },

    // ── Conditional — If / Else ───────────────────────────────────────────────
    {
      id: 'email-if-else-block',
      label: 'If / Else',
      category: 'Dynamic',
      media: svg(`<path d="M3 12h18M3 6h7m7 0h4M3 18h4m10 0h7"/>`),
      content: `<!-- {{#if conditionVar}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;border-radius:6px;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0;font-size:13px;color:#1e40af;">
              ✓ <strong>True branch</strong> — shown when <em>conditionVar</em> is truthy
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- {{else}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #9ca3af;border-radius:6px;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0;font-size:13px;color:#6b7280;">
              ✗ <strong>False branch</strong> — shown when <em>conditionVar</em> is falsy
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- {{/if}} -->`,
    },

    // ── Repeat / Loop (each) ──────────────────────────────────────────────────
    {
      id: 'email-each-block',
      label: 'Repeat Block',
      category: 'Dynamic',
      media: svg(`<path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>`),
      content: `<!-- {{#each items}} -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:6px 32px;border-bottom:1px solid #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="65%" valign="top">
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">{{this.name}}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">{{this.description}}</p>
          </td>
          <td width="35%" valign="top" align="right">
            <p style="margin:0;font-size:14px;font-weight:700;color:#6366f1;">{{this.value}}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- {{/each}} -->`,
    },

    // ── Date Field ────────────────────────────────────────────────────────────
    {
      id: 'email-date-field',
      label: 'Date Field',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>`),
      content: `<span style="display:inline-block;background:#eff6ff;border:1px dashed #93c5fd;
                             border-radius:6px;padding:3px 12px;font-size:13px;color:#1d4ed8;">
  {{formatDate date_field "MMMM D, YYYY"}}
</span>`,
    },

    // ── Currency Field ────────────────────────────────────────────────────────
    {
      id: 'email-currency-field',
      label: 'Currency',
      category: 'Dynamic',
      media: svg(`<line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>`),
      content: `<span style="display:inline-block;background:#f0fdf4;border:1px dashed #86efac;
                             border-radius:6px;padding:3px 12px;font-size:13px;font-weight:700;color:#166534;">
  {{formatCurrency amount "USD"}}
</span>`,
    },

    // ── Data Table ────────────────────────────────────────────────────────────
    {
      id: 'email-data-table',
      label: 'Data Table',
      category: 'Dynamic',
      media: svg(`<rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 9h18M3 15h18M9 3v18"/>`),
      content: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-collapse:collapse;">
                <thead>
                  <tr style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                    <th style="padding:10px 14px;text-align:left;font-size:12px;color:#fff;font-weight:600;">Name</th>
                    <th style="padding:10px 14px;text-align:left;font-size:12px;color:#fff;font-weight:600;">Value</th>
                    <th style="padding:10px 14px;text-align:right;font-size:12px;color:#fff;font-weight:600;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:#fff;">
                    <td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">{{row1Name}}</td>
                    <td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">{{row1Value}}</td>
                    <td style="padding:10px 14px;font-size:13px;color:#10b981;font-weight:600;border-bottom:1px solid #f0f0f0;text-align:right;">Active</td>
                  </tr>
                  <tr style="background:#fafafa;">
                    <td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">{{row2Name}}</td>
                    <td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">{{row2Value}}</td>
                    <td style="padding:10px 14px;font-size:13px;color:#f59e0b;font-weight:600;border-bottom:1px solid #f0f0f0;text-align:right;">Pending</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </table>`,
    },
  ]
}
