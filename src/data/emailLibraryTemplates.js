/**
 * Pre-built email template library.
 * Each template has standalone HTML (600 px table-based, email-safe).
 * Merge tags use {{double_braces}} convention.
 */

const BASE_FONT = `font-family:Arial,Helvetica,sans-serif;`
const WRAPPER   = (bgColor, innerBg) =>
  `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bgColor};${BASE_FONT}">
  <tr><td align="center" style="padding:24px 0;">
  <table width="600" cellpadding="0" cellspacing="0" border="0"
    style="background:${innerBg};border-radius:8px;overflow:hidden;max-width:600px;">`

const CLOSE_WRAPPER = `</table></td></tr></table>`

// ─── Shared header & footer snippets ────────────────────────────────────────
const HEADER = (bg = '#6366f1', text = '#fff') => `
  <tr>
    <td style="background:${bg};padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td>
          <p style="margin:0;font-size:22px;font-weight:700;color:${text};">{{company_name}}</p>
          <p style="margin:4px 0 0;font-size:12px;color:${text};opacity:0.8;">{{company_tagline}}</p>
        </td>
        <td align="right">
          <img src="https://placehold.co/80x32/${bg.replace('#','')}/${text.replace('#','fff')}?text=LOGO"
               width="80" alt="Logo" style="display:block;border-radius:4px;opacity:0.9;"/>
        </td>
      </tr></table>
    </td>
  </tr>`

const FOOTER = `
  <tr>
    <td style="background:#f9f9f9;border-top:1px solid #e8e8e8;padding:20px 32px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#888;">
        {{company_name}} · {{company_address}}
      </p>
      <p style="margin:0;font-size:11px;color:#aaa;">
        <a href="{{unsubscribe_url}}" style="color:#6366f1;text-decoration:none;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="{{privacy_url}}" style="color:#6366f1;text-decoration:none;">Privacy Policy</a>
      </p>
    </td>
  </tr>`

// ─── Template definitions ────────────────────────────────────────────────────
export const EMAIL_LIBRARY = [
  // ══ TRANSACTIONAL ══════════════════════════════════════════════════════════
  {
    id: 'lib-welcome',
    name: 'Welcome Email',
    category: 'transactional',
    description: 'Warm welcome message sent when a new user signs up.',
    tags: ['welcome', 'onboarding', 'signup'],
    accent: '#6366f1',
    htmlContent: `
${WRAPPER('#f0f0f5', '#ffffff')}
${HEADER('#6366f1')}
<tr><td style="padding:36px 32px;">
  <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Welcome aboard, {{first_name}}! 🎉
  </p>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    We're thrilled to have you join <strong>{{company_name}}</strong>. Your account is ready
    and you can start exploring right away.
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;">
        <a href="{{cta_url}}" style="display:block;padding:14px 32px;color:#fff;font-size:15px;
                                     font-weight:700;text-decoration:none;">Get Started →</a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
    If you have any questions, reply to this email or visit our
    <a href="{{help_url}}" style="color:#6366f1;">Help Center</a>.
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-otp',
    name: 'OTP Verification',
    category: 'transactional',
    description: 'Delivers a one-time verification code securely.',
    tags: ['otp', 'verification', 'security', '2fa'],
    accent: '#0891b2',
    htmlContent: `
${WRAPPER('#f0f9ff', '#ffffff')}
<tr><td style="background:#0891b2;padding:24px 32px;text-align:center;">
  <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Email Verification</p>
</td></tr>
<tr><td style="padding:40px 32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:14px;color:#555;">
    Hi {{first_name}}, use the code below to verify your email address.
  </p>
  <div style="display:inline-block;background:#f0f9ff;border:2px solid #bae6fd;
              border-radius:12px;padding:20px 48px;margin:20px auto;">
    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:0.35em;
               color:#0891b2;font-family:monospace;">{{otp_code}}</p>
  </div>
  <p style="margin:16px 0 0;font-size:13px;color:#888;">
    This code expires in <strong>{{expiry_minutes}} minutes</strong>.
    Never share it with anyone.
  </p>
  <p style="margin:24px 0 0;font-size:12px;color:#aaa;">
    If you didn't request this, you can safely ignore this email.
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-password-reset',
    name: 'Password Reset',
    category: 'transactional',
    description: 'Secure password reset link with expiry warning.',
    tags: ['password', 'reset', 'security', 'account'],
    accent: '#dc2626',
    htmlContent: `
${WRAPPER('#fef2f2', '#ffffff')}
<tr><td style="background:#dc2626;padding:24px 32px;">
  <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Reset Your Password</p>
  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">{{company_name}}</p>
</td></tr>
<tr><td style="padding:36px 32px;">
  <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.7;">
    Hi {{first_name}}, we received a request to reset your password.
    Click the button below to create a new one.
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background:#dc2626;border-radius:8px;">
        <a href="{{reset_url}}" style="display:block;padding:14px 32px;color:#fff;
                                      font-size:15px;font-weight:700;text-decoration:none;">
          Reset Password
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 8px;font-size:13px;color:#888;">
    ⏰ This link expires in <strong>{{expiry_hours}} hours</strong>.
  </p>
  <p style="margin:0;font-size:12px;color:#aaa;">
    If you didn't request a password reset, you can ignore this email — your password will remain unchanged.
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-order-confirm',
    name: 'Order Confirmation',
    category: 'transactional',
    description: 'Clean order summary with items, totals, and shipping info.',
    tags: ['order', 'ecommerce', 'receipt', 'purchase'],
    accent: '#059669',
    htmlContent: `
${WRAPPER('#f0fdf4', '#ffffff')}
<tr><td style="background:#059669;padding:24px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td>
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Order Confirmed! ✓</p>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Order #{{order_id}}</p>
    </td>
    <td align="right">
      <p style="margin:0;font-size:18px;font-weight:800;color:#fff;">{{order_total}}</p>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#444;">
    Hi {{first_name}}, thank you for your purchase! Here's your order summary:
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border-collapse:collapse;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <tr style="background:#f9f9f9;">
      <th style="padding:10px 14px;text-align:left;font-size:11px;color:#888;font-weight:600;">Item</th>
      <th style="padding:10px 14px;text-align:center;font-size:11px;color:#888;font-weight:600;">Qty</th>
      <th style="padding:10px 14px;text-align:right;font-size:11px;color:#888;font-weight:600;">Price</th>
    </tr>
    <tr style="border-top:1px solid #eee;">
      <td style="padding:10px 14px;font-size:13px;color:#333;">{{item_name}}</td>
      <td style="padding:10px 14px;font-size:13px;color:#333;text-align:center;">{{item_qty}}</td>
      <td style="padding:10px 14px;font-size:13px;color:#333;text-align:right;">{{item_price}}</td>
    </tr>
    <tr style="background:#f9f9f9;border-top:2px solid #eee;">
      <td colspan="2" style="padding:10px 14px;font-size:13px;font-weight:700;color:#333;text-align:right;">Total</td>
      <td style="padding:10px 14px;font-size:14px;font-weight:800;color:#059669;text-align:right;">{{order_total}}</td>
    </tr>
  </table>
  <p style="margin:20px 0 0;font-size:13px;color:#555;">
    📦 Shipping to: <strong>{{shipping_address}}</strong><br/>
    Estimated delivery: <strong>{{delivery_date}}</strong>
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-invoice',
    name: 'Invoice',
    category: 'transactional',
    description: 'Professional invoice with line items, due date, and payment link.',
    tags: ['invoice', 'billing', 'payment', 'finance'],
    accent: '#7c3aed',
    htmlContent: `
${WRAPPER('#f5f3ff', '#ffffff')}
<tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:24px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td>
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">INVOICE</p>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">{{company_name}}</p>
    </td>
    <td align="right">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8);">Invoice #{{invoice_number}}</p>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">Due: {{due_date}}</p>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="margin-bottom:24px;">
    <tr>
      <td style="font-size:13px;color:#888;">Bill To:</td>
      <td style="font-size:13px;color:#888;text-align:right;">Invoice Date:</td>
    </tr>
    <tr>
      <td style="font-size:14px;font-weight:600;color:#333;">{{client_name}}</td>
      <td style="font-size:14px;font-weight:600;color:#333;text-align:right;">{{invoice_date}}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#666;">{{client_email}}</td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border-collapse:collapse;border:1px solid #ede9fe;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr style="background:#f5f3ff;">
      <th style="padding:10px 14px;text-align:left;font-size:11px;color:#7c3aed;font-weight:700;text-transform:uppercase;">Description</th>
      <th style="padding:10px 14px;text-align:right;font-size:11px;color:#7c3aed;font-weight:700;text-transform:uppercase;">Amount</th>
    </tr>
    <tr style="border-top:1px solid #ede9fe;">
      <td style="padding:10px 14px;font-size:13px;color:#333;">{{service_description}}</td>
      <td style="padding:10px 14px;font-size:13px;color:#333;text-align:right;">{{service_amount}}</td>
    </tr>
    <tr style="background:#f5f3ff;border-top:2px solid #ede9fe;">
      <td style="padding:12px 14px;font-size:14px;font-weight:700;color:#333;text-align:right;">Total Due</td>
      <td style="padding:12px 14px;font-size:16px;font-weight:800;color:#7c3aed;text-align:right;">{{total_amount}}</td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:8px;">
        <a href="{{payment_url}}" style="display:block;padding:12px 28px;color:#fff;
                                        font-size:14px;font-weight:700;text-decoration:none;">
          Pay Now →
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  // ══ MARKETING ══════════════════════════════════════════════════════════════
  {
    id: 'lib-newsletter',
    name: 'Newsletter',
    category: 'marketing',
    description: 'Monthly digest layout with hero, article cards, and social links.',
    tags: ['newsletter', 'digest', 'content', 'monthly'],
    accent: '#0ea5e9',
    htmlContent: `
${WRAPPER('#f0f9ff', '#ffffff')}
${HEADER('#0ea5e9')}
<tr><td style="padding:32px 32px 16px;">
  <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#0ea5e9;font-weight:700;">
    {{month}} {{year}} · Issue #{{issue_number}}
  </p>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.3;">
    {{newsletter_title}}
  </h1>
  <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">{{intro_text}}</p>
</td></tr>
<tr><td style="padding:0 32px 16px;">
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;"/>
  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#0ea5e9;font-weight:700;">
    Featured Story
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="160" valign="top" style="padding-right:16px;">
        <img src="https://placehold.co/150x110/f0f9ff/0ea5e9?text=Story"
             width="150" style="display:block;border-radius:8px;" alt=""/>
      </td>
      <td valign="top">
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a;">{{story_title}}</h3>
        <p style="margin:0 0 10px;font-size:13px;color:#666;line-height:1.6;">{{story_excerpt}}</p>
        <a href="{{story_url}}" style="font-size:13px;font-weight:600;color:#0ea5e9;text-decoration:none;">
          Read more →
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-promo-sale',
    name: 'Promotional Sale',
    category: 'marketing',
    description: 'High-impact sale announcement with countdown and discount badge.',
    tags: ['sale', 'discount', 'promo', 'ecommerce'],
    accent: '#ea580c',
    htmlContent: `
${WRAPPER('#fff7ed', '#ffffff')}
<tr><td style="background:linear-gradient(135deg,#ea580c,#dc2626);padding:40px 32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">
    Limited Time Offer
  </p>
  <div style="display:inline-block;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);
              border-radius:16px;padding:12px 32px;margin-bottom:16px;">
    <p style="margin:0;font-size:52px;font-weight:900;color:#fff;line-height:1;">
      {{discount}}% OFF
    </p>
  </div>
  <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);">{{sale_description}}</p>
</td></tr>
<tr><td style="padding:32px;text-align:center;">
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    {{sale_body_text}}
  </p>
  <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:#ea580c;">
    ⏰ Offer ends: {{sale_end_date}}
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#ea580c,#dc2626);border-radius:8px;">
        <a href="{{shop_url}}" style="display:block;padding:14px 40px;color:#fff;
                                     font-size:16px;font-weight:800;text-decoration:none;">
          Shop Now — {{discount}}% Off
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#aaa;">
    Use code: <strong style="color:#ea580c;">{{promo_code}}</strong> at checkout
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-product-launch',
    name: 'Product Launch',
    category: 'marketing',
    description: 'Announce a new product with hero image, features, and CTA.',
    tags: ['launch', 'product', 'announcement', 'new'],
    accent: '#8b5cf6',
    htmlContent: `
${WRAPPER('#f5f3ff', '#ffffff')}
${HEADER('linear-gradient(135deg,#7c3aed,#6d28d9)')}
<tr><td>
  <img src="https://placehold.co/600x220/f5f3ff/8b5cf6?text={{product_name}}"
       width="600" style="display:block;width:100%;" alt="{{product_name}}"/>
</td></tr>
<tr><td style="padding:36px 32px;text-align:center;">
  <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#8b5cf6;font-weight:700;">
    Introducing
  </p>
  <h1 style="margin:0 0 16px;font-size:30px;font-weight:800;color:#1a1a2e;">{{product_name}}</h1>
  <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;max-width:480px;margin-left:auto;margin-right:auto;">
    {{product_description}}
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
    <tr>
      <td width="33%" style="padding:12px;text-align:center;border:1px solid #ede9fe;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:20px;">✨</p>
        <p style="margin:0;font-size:12px;font-weight:700;color:#333;">{{feature_1}}</p>
      </td>
      <td width="4px"></td>
      <td width="33%" style="padding:12px;text-align:center;border:1px solid #ede9fe;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:20px;">⚡</p>
        <p style="margin:0;font-size:12px;font-weight:700;color:#333;">{{feature_2}}</p>
      </td>
      <td width="4px"></td>
      <td width="33%" style="padding:12px;text-align:center;border:1px solid #ede9fe;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:20px;">🔒</p>
        <p style="margin:0;font-size:12px;font-weight:700;color:#333;">{{feature_3}}</p>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:8px;">
        <a href="{{product_url}}" style="display:block;padding:14px 40px;color:#fff;
                                        font-size:16px;font-weight:800;text-decoration:none;">
          {{cta_text}}
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-event-invite',
    name: 'Event Invitation',
    category: 'marketing',
    description: 'Elegant event invite with date, location, and RSVP button.',
    tags: ['event', 'invite', 'webinar', 'conference'],
    accent: '#0f766e',
    htmlContent: `
${WRAPPER('#f0fdfa', '#ffffff')}
<tr><td style="background:linear-gradient(135deg,#0f766e,#0891b2);padding:48px 32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">
    You're Invited
  </p>
  <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#fff;">{{event_name}}</h1>
  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);">{{event_tagline}}</p>
</td></tr>
<tr><td style="padding:32px;text-align:center;">
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
    <tr>
      <td style="padding:16px 24px;border:1px solid #ccfbf1;border-radius:12px;text-align:center;background:#f0fdfa;">
        <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;color:#0f766e;font-weight:700;">📅 Date</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{event_date}}</p>
      </td>
      <td width="16"></td>
      <td style="padding:16px 24px;border:1px solid #ccfbf1;border-radius:12px;text-align:center;background:#f0fdfa;">
        <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;color:#0f766e;font-weight:700;">⏰ Time</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{event_time}}</p>
      </td>
      <td width="16"></td>
      <td style="padding:16px 24px;border:1px solid #ccfbf1;border-radius:12px;text-align:center;background:#f0fdfa;">
        <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;color:#0f766e;font-weight:700;">📍 Location</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{event_location}}</p>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">{{event_description}}</p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#0f766e,#0891b2);border-radius:8px;">
        <a href="{{rsvp_url}}" style="display:block;padding:14px 40px;color:#fff;
                                     font-size:15px;font-weight:700;text-decoration:none;">
          RSVP Now
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  // ══ ONBOARDING ═════════════════════════════════════════════════════════════
  {
    id: 'lib-onboarding-welcome',
    name: 'Onboarding — Day 1',
    category: 'onboarding',
    description: 'First message in an onboarding sequence — personal welcome from the founder.',
    tags: ['onboarding', 'welcome', 'day1', 'series'],
    accent: '#4f46e5',
    htmlContent: `
${WRAPPER('#eef2ff', '#ffffff')}
${HEADER('#4f46e5')}
<tr><td style="padding:36px 32px;">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a2e;">
    Hi {{first_name}}, I'm {{founder_name}} 👋
  </p>
  <p style="margin:0 0 14px;font-size:15px;color:#444;line-height:1.7;">
    I wanted to personally reach out and say welcome to <strong>{{company_name}}</strong>.
    We built this product because {{founding_story}}.
  </p>
  <p style="margin:0 0 14px;font-size:15px;color:#444;line-height:1.7;">
    Over the next few days you'll receive a short series of emails to help you
    get the most out of {{company_name}}.
  </p>
  <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
    <strong>Today's task:</strong> {{day1_task}}
  </p>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:8px;">
        <a href="{{cta_url}}" style="display:block;padding:12px 28px;color:#fff;
                                    font-size:14px;font-weight:700;text-decoration:none;">
          {{cta_text}}
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:24px 0 0;font-size:14px;color:#555;">
    Reply to this email anytime — I personally read every response.
  </p>
  <p style="margin:12px 0 0;font-size:14px;color:#333;">
    {{founder_name}}<br/>
    <span style="color:#888;font-size:12px;">{{founder_title}}, {{company_name}}</span>
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-feature-highlight',
    name: 'Feature Highlight',
    category: 'onboarding',
    description: 'Showcase a key product feature mid-onboarding with a GIF/image and steps.',
    tags: ['onboarding', 'feature', 'tips', 'product'],
    accent: '#d97706',
    htmlContent: `
${WRAPPER('#fffbeb', '#ffffff')}
${HEADER('#d97706')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#d97706;font-weight:700;">
    Pro Tip
  </p>
  <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;">{{feature_name}}</h2>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">{{feature_description}}</p>
  <img src="https://placehold.co/536x200/fffbeb/d97706?text={{feature_name}}"
       width="100%" style="display:block;border-radius:8px;max-width:536px;margin-bottom:20px;" alt=""/>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #fde68a;">
        <p style="margin:0;font-size:13px;color:#555;padding-left:20px;position:relative;">
          <span style="position:absolute;left:0;color:#d97706;font-weight:700;">1.</span>
          {{step_1}}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #fde68a;">
        <p style="margin:0;font-size:13px;color:#555;padding-left:20px;position:relative;">
          <span style="position:absolute;left:0;color:#d97706;font-weight:700;">2.</span>
          {{step_2}}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;">
        <p style="margin:0;font-size:13px;color:#555;padding-left:20px;position:relative;">
          <span style="position:absolute;left:0;color:#d97706;font-weight:700;">3.</span>
          {{step_3}}
        </p>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:#d97706;border-radius:8px;">
        <a href="{{feature_url}}" style="display:block;padding:12px 28px;color:#fff;
                                        font-size:14px;font-weight:700;text-decoration:none;">
          Try {{feature_name}} Now
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-checklist',
    name: 'Setup Checklist',
    category: 'onboarding',
    description: 'Visual setup checklist showing completed vs. remaining steps.',
    tags: ['onboarding', 'checklist', 'setup', 'progress'],
    accent: '#2563eb',
    htmlContent: `
${WRAPPER('#eff6ff', '#ffffff')}
${HEADER('#2563eb')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e;">
    You're {{completion_percentage}}% there, {{first_name}}!
  </p>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    Complete these steps to unlock the full power of {{company_name}}:
  </p>
  <!-- Progress bar -->
  <div style="background:#dbeafe;border-radius:8px;height:8px;margin-bottom:24px;overflow:hidden;">
    <div style="background:#2563eb;height:8px;width:{{completion_percentage}}%;border-radius:8px;"></div>
  </div>
  <!-- Checklist items -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #dbeafe;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:18px;height:18px;background:#2563eb;border-radius:50%;text-align:center;line-height:18px;">
                <span style="color:#fff;font-size:11px;font-weight:700;">✓</span>
              </div>
            </td>
            <td style="font-size:14px;color:#888;text-decoration:line-through;">
              Create your account
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #dbeafe;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:18px;height:18px;border:2px solid #dbeafe;border-radius:50%;"></div>
            </td>
            <td>
              <a href="{{step2_url}}" style="font-size:14px;color:#2563eb;font-weight:600;text-decoration:none;">
                {{step2_label}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 0;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:18px;height:18px;border:2px solid #dbeafe;border-radius:50%;"></div>
            </td>
            <td>
              <a href="{{step3_url}}" style="font-size:14px;color:#2563eb;font-weight:600;text-decoration:none;">
                {{step3_label}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  // ══ NOTIFICATION ═══════════════════════════════════════════════════════════
  {
    id: 'lib-action-required',
    name: 'Action Required',
    category: 'notification',
    description: 'Urgent notice requiring the user to take a specific action.',
    tags: ['alert', 'action', 'urgent', 'notification'],
    accent: '#b45309',
    htmlContent: `
${WRAPPER('#fffbeb', '#ffffff')}
<tr><td style="background:#b45309;padding:20px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td>
      <p style="margin:0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);
                 text-transform:uppercase;letter-spacing:0.1em;">⚠ Action Required</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#fff;">{{action_title}}</p>
    </td>
    <td align="right">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);">{{company_name}}</p>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
    Hi {{first_name}},
  </p>
  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
    {{action_description}}
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#fef3c7;border:1px solid #fde68a;border-left:4px solid #f59e0b;
                border-radius:8px;margin-bottom:24px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
          ⏰ Deadline: {{deadline}}
        </p>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:#b45309;border-radius:8px;">
        <a href="{{action_url}}" style="display:block;padding:12px 28px;color:#fff;
                                       font-size:14px;font-weight:700;text-decoration:none;">
          {{action_button_text}}
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-appointment-reminder',
    name: 'Appointment Reminder',
    category: 'notification',
    description: 'Friendly reminder 24 hours before a scheduled appointment or meeting.',
    tags: ['reminder', 'appointment', 'meeting', 'calendar'],
    accent: '#0284c7',
    htmlContent: `
${WRAPPER('#f0f9ff', '#ffffff')}
${HEADER('#0284c7')}
<tr><td style="padding:32px;text-align:center;">
  <p style="margin:0 0 4px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:0.08em;">
    Reminder
  </p>
  <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0f172a;">
    {{appointment_name}}
  </h2>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
    <tr>
      <td style="padding:16px 28px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;text-align:center;min-width:140px;">
        <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;color:#0284c7;font-weight:700;">📅 Date</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{appointment_date}}</p>
      </td>
      <td width="12"></td>
      <td style="padding:16px 28px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;text-align:center;min-width:140px;">
        <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;color:#0284c7;font-weight:700;">⏰ Time</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{appointment_time}}</p>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 6px;font-size:14px;color:#555;">📍 {{appointment_location}}</p>
  <p style="margin:0 0 24px;font-size:14px;color:#555;">With: <strong>{{appointment_host}}</strong></p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
    <tr>
      <td style="background:#0284c7;border-radius:8px;margin-right:8px;">
        <a href="{{confirm_url}}" style="display:block;padding:12px 24px;color:#fff;
                                        font-size:14px;font-weight:700;text-decoration:none;">
          Confirm Attendance
        </a>
      </td>
    </tr>
  </table>
  <a href="{{reschedule_url}}" style="font-size:13px;color:#0284c7;text-decoration:none;">
    Need to reschedule?
  </a>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-status-update',
    name: 'Status Update',
    category: 'notification',
    description: 'Progress update for a support request, order, or process.',
    tags: ['status', 'update', 'progress', 'support'],
    accent: '#7c3aed',
    htmlContent: `
${WRAPPER('#faf5ff', '#ffffff')}
${HEADER('#7c3aed')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 4px;font-size:15px;color:#555;">Hi {{first_name}},</p>
  <p style="margin:8px 0 20px;font-size:15px;color:#444;line-height:1.7;">
    We have an update on your {{request_type}} <strong>#{{request_id}}</strong>:
  </p>
  <!-- Status indicator -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border:1px solid #ede9fe;border-radius:12px;overflow:hidden;margin-bottom:24px;">
    <tr style="background:#f5f3ff;">
      <td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td>
            <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700;">
              Status
            </p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#7c3aed;">{{status}}</p>
          </td>
          <td align="right">
            <span style="display:inline-block;background:#ede9fe;color:#7c3aed;font-size:11px;
                         font-weight:700;padding:4px 10px;border-radius:20px;">
              Updated {{update_time}}
            </span>
          </td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 20px;border-top:1px solid #ede9fe;">
        <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">{{status_message}}</p>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:8px;">
        <a href="{{request_url}}" style="display:block;padding:12px 28px;color:#fff;
                                        font-size:14px;font-weight:700;text-decoration:none;">
          View Full Details
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-survey',
    name: 'Feedback Survey',
    category: 'notification',
    description: 'Short NPS / feedback request with star rating and survey link.',
    tags: ['survey', 'feedback', 'nps', 'rating'],
    accent: '#0891b2',
    htmlContent: `
${WRAPPER('#f0f9ff', '#ffffff')}
${HEADER('#0891b2')}
<tr><td style="padding:36px 32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
    How are we doing, {{first_name}}?
  </p>
  <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
    {{survey_intro}}. Your feedback helps us improve!
  </p>
  <!-- Star ratings -->
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
    <tr>
      ${[1,2,3,4,5].map(n => `
      <td style="padding:0 4px;">
        <a href="{{survey_url}}?rating=${n}" style="display:inline-block;width:44px;height:44px;
           background:#f0f9ff;border:1px solid #bae6fd;border-radius:50%;text-align:center;
           line-height:44px;font-size:20px;text-decoration:none;">⭐</a>
      </td>`).join('')}
    </tr>
    <tr>
      <td style="padding-top:6px;text-align:center;font-size:10px;color:#888;">Not good</td>
      <td colspan="3"></td>
      <td style="padding-top:6px;text-align:center;font-size:10px;color:#888;">Excellent</td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="background:#0891b2;border-radius:8px;">
        <a href="{{survey_url}}" style="display:block;padding:12px 28px;color:#fff;
                                       font-size:14px;font-weight:700;text-decoration:none;">
          Take Full Survey (2 min)
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#aaa;">
    Takes less than 2 minutes · Your response is anonymous
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },
]

export const LIBRARY_CATEGORIES = [
  { key: 'all',            label: 'All Templates',  count: EMAIL_LIBRARY.length },
  { key: 'transactional',  label: 'Transactional',  count: EMAIL_LIBRARY.filter(t => t.category === 'transactional').length },
  { key: 'marketing',      label: 'Marketing',       count: EMAIL_LIBRARY.filter(t => t.category === 'marketing').length },
  { key: 'onboarding',     label: 'Onboarding',      count: EMAIL_LIBRARY.filter(t => t.category === 'onboarding').length },
  { key: 'notification',   label: 'Notification',    count: EMAIL_LIBRARY.filter(t => t.category === 'notification').length },
]
