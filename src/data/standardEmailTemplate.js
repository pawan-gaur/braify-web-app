/**
 * Builds the platform-standard branded email starter — the same visual system as the
 * e-sign system emails (brand bar with logo + org name, accent top bar, card, footer).
 *
 * The org's branding is resolved into the starter at creation so the builder is WYSIWYG:
 *  - logo uses the org's LIVE public URL (updates automatically when re-uploaded),
 *  - accent color + footer contact/address come from Org Branding (editable per template).
 *
 * Returns a `libraryTemplate`-shaped object the EmailTemplateBuilder can load directly.
 *
 * @param {object} branding  OrgBranding response ({ logoUrl, primaryColor, emailReplyTo, footerText })
 * @param {string} orgName   Organization display name
 */
export function buildStandardEmail(branding = {}, orgName = '') {
  const accent  = (branding.primaryColor && branding.primaryColor.trim()) || '#4F46E5'
  const logoUrl = branding.logoUrl || null
  const name    = (orgName || '').trim()
  const initial = (name || 'B').charAt(0).toUpperCase()

  // Inline-block so the whole brand bar (logo + name) can be aligned left/center/right
  // just by changing the header cell's text-align.
  const brandMark = logoUrl
    ? `<img src="${logoUrl}" alt="" width="34" height="34" style="display:inline-block;vertical-align:middle;width:34px;height:34px;border-radius:8px;object-fit:contain;margin-right:10px;">`
    : `<div style="display:inline-block;vertical-align:middle;width:34px;height:34px;line-height:34px;border-radius:8px;background:${accent};color:#fff;text-align:center;font-weight:700;font-size:16px;margin-right:10px;">${initial}</div>`

  const support = (branding.emailReplyTo && branding.emailReplyTo.trim()) || ''
  const address = (branding.footerText && branding.footerText.trim()) || ''
  const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  const footerContact = (support || address)
    ? `<div style="font-family:${FONT_STACK};font-size:11.5px;line-height:1.7;color:#94A3B8;">${
        support ? `<span>Need help? <a href="mailto:${support}" style="color:${accent};font-weight:600;text-decoration:none;">${support}</a></span>` : ''
      }${support && address ? `<span style="color:#CBD5E1;"> · </span>` : ''}${
        address ? `<span>${address}</span>` : ''
      }</div>`
    : ''

  const orgLabel = name || 'Your organization'
  const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

  const htmlContent = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F6;padding:32px 12px;font-family:${FONT};"><tr><td align="center">
  <div style="width:600px;max-width:100%;text-align:left;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;font-family:${FONT};">
    <div style="height:4px;background:${accent};"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #EEF2F6;"><tr>
      <td style="padding:22px 32px;text-align:left;">${brandMark}<span style="display:inline-block;vertical-align:middle;font-family:${FONT};font-size:15px;font-weight:700;color:#0F172A;">${orgLabel}</span></td>
    </tr></table>
    <div style="padding:36px 32px 8px;">
      <h1 style="margin:0 0 14px;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:700;color:#0F172A;letter-spacing:-0.02em;">Your headline goes here</h1>
      <p style="margin:0 0 22px;font-family:${FONT};font-size:15px;line-height:1.6;color:#475569;">Hi {{firstName}}, write your message here. Use the blocks on the left to add text, images, buttons, and more — this header and footer keep every email on-brand.</p>
      <div style="text-align:center;margin:28px 0 8px;"><a href="#" style="display:inline-block;font-family:${FONT};background:${accent};color:#fff;font-size:15px;font-weight:700;padding:15px 40px;border-radius:10px;text-decoration:none;">Call to action</a></div>
    </div>
    <div style="padding:22px 32px 28px;background:#F8FAFC;border-top:1px solid #EEF2F6;margin-top:8px;">
      <p style="margin:0 0 12px;font-family:${FONT};font-size:12px;line-height:1.6;color:#94A3B8;">This email was sent by ${orgLabel}. If you weren't expecting it, you can safely ignore this message.</p>
      ${footerContact}
    </div>
  </div>
</td></tr></table>`.trim()

  return {
    name: 'Untitled Email',
    description: '',
    subject: '',
    previewText: '',
    fromName: name,
    category: '',
    tags: [],
    htmlContent,
  }
}
