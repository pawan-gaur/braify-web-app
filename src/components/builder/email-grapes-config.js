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
        body { background: #c8c8c8; padding: 24px; font-family: Arial, sans-serif; }
        .gjs-frame-wrapper { background: #c8c8c8; }
      `,
    ],
  },

  // Email preview widths
  deviceManager: {
    devices: [
      { name: 'Desktop Email', width: '600px'  },
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
  ]
}
