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

  // ══ TRANSACTIONAL (continued) ══════════════════════════════════════════════
  {
    id: 'lib-shipping',
    name: 'Shipping Notification',
    category: 'transactional',
    description: 'Order dispatched notification with tracking number and estimated delivery.',
    tags: ['shipping', 'tracking', 'order', 'ecommerce'],
    accent: '#0369a1',
    htmlContent: `
${WRAPPER('#f0f9ff', '#ffffff')}
<tr><td style="background:#0369a1;padding:24px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td>
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Your order is on its way! 🚚</p>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">Order #{{order_id}}</p>
    </td>
    <td align="right">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8);">{{company_name}}</p>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
    Hi {{first_name}}, great news! Your order has been dispatched and is on its way to you.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:24px;">
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="padding-bottom:12px;">
              <p style="margin:0 0 2px;font-size:11px;color:#0369a1;text-transform:uppercase;font-weight:700;">Carrier</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">{{carrier_name}}</p>
            </td>
            <td width="50%" style="padding-bottom:12px;">
              <p style="margin:0 0 2px;font-size:11px;color:#0369a1;text-transform:uppercase;font-weight:700;">Est. Delivery</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">{{delivery_date}}</p>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <p style="margin:0 0 2px;font-size:11px;color:#0369a1;text-transform:uppercase;font-weight:700;">Tracking Number</p>
              <p style="margin:0;font-size:16px;font-weight:800;color:#0369a1;letter-spacing:0.05em;">{{tracking_number}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr>
      <td style="background:#0369a1;border-radius:8px;">
        <a href="{{tracking_url}}" style="display:block;padding:12px 28px;color:#fff;
                                         font-size:14px;font-weight:700;text-decoration:none;">
          Track My Order →
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:13px;color:#888;">
    Shipping to: <strong>{{shipping_address}}</strong>
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-subscription-renewal',
    name: 'Subscription Renewal',
    category: 'transactional',
    description: 'Upcoming subscription renewal reminder with plan details and management link.',
    tags: ['subscription', 'renewal', 'billing', 'saas'],
    accent: '#6d28d9',
    htmlContent: `
${WRAPPER('#f5f3ff', '#ffffff')}
${HEADER('#6d28d9')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Your subscription renews soon
  </p>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    Hi {{first_name}}, just a heads-up that your <strong>{{plan_name}}</strong> plan will
    automatically renew on <strong>{{renewal_date}}</strong>.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;margin-bottom:24px;">
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Plan</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a2e;">{{plan_name}}</p>
            </td>
            <td align="right">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Amount</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#6d28d9;">{{renewal_amount}}</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:12px;border-top:1px solid #ede9fe;">
              <p style="margin:4px 0 0;font-size:12px;color:#888;">
                Billed to card ending in <strong>{{card_last4}}</strong> on {{renewal_date}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="background:linear-gradient(135deg,#6d28d9,#7c3aed);border-radius:8px;">
        <a href="{{manage_url}}" style="display:block;padding:12px 28px;color:#fff;
                                       font-size:14px;font-weight:700;text-decoration:none;">
          Manage Subscription
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:12px;color:#aaa;">
    To cancel, visit your billing settings before {{renewal_date}}.
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-payment-failed',
    name: 'Payment Failed',
    category: 'transactional',
    description: 'Payment failure alert with retry link and account impact warning.',
    tags: ['payment', 'billing', 'failed', 'retry'],
    accent: '#dc2626',
    htmlContent: `
${WRAPPER('#fef2f2', '#ffffff')}
<tr><td style="background:#dc2626;padding:20px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td>
      <p style="margin:0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);
                 text-transform:uppercase;letter-spacing:0.1em;">⚠ Payment Failed</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#fff;">Action needed on your account</p>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
    Hi {{first_name}}, we were unable to process your payment of <strong>{{amount}}</strong>
    for your <strong>{{plan_name}}</strong> plan.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;
                border-radius:8px;margin-bottom:24px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0 0 4px;font-size:13px;color:#991b1b;font-weight:700;">
          Card ending in {{card_last4}} — {{failure_reason}}
        </p>
        <p style="margin:0;font-size:12px;color:#b91c1c;">
          If not resolved by {{deadline}}, your account may be suspended.
        </p>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
    <tr>
      <td style="background:#dc2626;border-radius:8px;">
        <a href="{{update_payment_url}}" style="display:block;padding:12px 28px;color:#fff;
                                               font-size:14px;font-weight:700;text-decoration:none;">
          Update Payment Method
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:12px;color:#aaa;">
    Need help? Contact us at <a href="mailto:{{support_email}}" style="color:#dc2626;">{{support_email}}</a>
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  // ══ MARKETING (continued) ══════════════════════════════════════════════════
  {
    id: 'lib-reengagement',
    name: 'Re-engagement / Win-Back',
    category: 'marketing',
    description: 'Win back inactive users with a personalised message and exclusive offer.',
    tags: ['reengagement', 'winback', 'inactive', 'retention'],
    accent: '#db2777',
    htmlContent: `
${WRAPPER('#fdf2f8', '#ffffff')}
<tr><td style="background:linear-gradient(135deg,#db2777,#9333ea);padding:48px 32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:36px;">💔</p>
  <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff;">We miss you, {{first_name}}!</p>
  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">
    It's been {{days_inactive}} days since your last visit
  </p>
</td></tr>
<tr><td style="padding:36px 32px;text-align:center;">
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    {{reengagement_message}}
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:linear-gradient(135deg,#fdf2f8,#fae8ff);border:1px solid #f0abfc;
                border-radius:16px;margin-bottom:28px;">
    <tr>
      <td style="padding:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:#9333ea;font-weight:700;text-transform:uppercase;">
          Your exclusive offer
        </p>
        <p style="margin:0 0 8px;font-size:40px;font-weight:900;color:#db2777;">
          {{discount}}% OFF
        </p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1a1a2e;letter-spacing:0.08em;">
          Code: <span style="color:#db2777;">{{promo_code}}</span>
        </p>
        <p style="margin:0;font-size:12px;color:#888;">Expires {{offer_expiry}}</p>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#db2777,#9333ea);border-radius:8px;">
        <a href="{{cta_url}}" style="display:block;padding:14px 40px;color:#fff;
                                    font-size:16px;font-weight:800;text-decoration:none;">
          Come Back →
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-referral',
    name: 'Referral Program',
    category: 'marketing',
    description: 'Invite friends email with personal referral link and reward description.',
    tags: ['referral', 'invite', 'rewards', 'growth'],
    accent: '#16a34a',
    htmlContent: `
${WRAPPER('#f0fdf4', '#ffffff')}
${HEADER('#16a34a')}
<tr><td style="padding:36px 32px;text-align:center;">
  <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#16a34a;font-weight:700;">
    Share &amp; Earn
  </p>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#0f172a;">
    Give {{referral_reward}}, Get {{your_reward}}
  </h1>
  <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
    {{referral_description}}
  </p>
  <!-- Referral link box -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f0fdf4;border:2px dashed #86efac;border-radius:12px;margin-bottom:28px;">
    <tr>
      <td style="padding:20px 24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#16a34a;text-transform:uppercase;font-weight:700;">
          Your unique referral link
        </p>
        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0f172a;word-break:break-all;">
          {{referral_url}}
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="background:#16a34a;border-radius:6px;">
              <a href="{{referral_url}}" style="display:block;padding:10px 24px;color:#fff;
                                               font-size:13px;font-weight:700;text-decoration:none;">
                Copy Link
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!-- How it works -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="33%" style="padding:12px 8px;text-align:center;border-right:1px solid #dcfce7;">
        <p style="margin:0 0 6px;font-size:24px;">🔗</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#333;">Share your link</p>
      </td>
      <td width="33%" style="padding:12px 8px;text-align:center;border-right:1px solid #dcfce7;">
        <p style="margin:0 0 6px;font-size:24px;">✅</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#333;">Friend signs up</p>
      </td>
      <td width="33%" style="padding:12px 8px;text-align:center;">
        <p style="margin:0 0 6px;font-size:24px;">🎁</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#333;">Both get rewarded</p>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-webinar-followup',
    name: 'Webinar Follow-up',
    category: 'marketing',
    description: 'Post-webinar email with recording link, slides, and next-step CTA.',
    tags: ['webinar', 'followup', 'recording', 'content'],
    accent: '#0f766e',
    htmlContent: `
${WRAPPER('#f0fdfa', '#ffffff')}
${HEADER('#0f766e')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
    Thanks for joining, {{first_name}}! 🎉
  </p>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    We hope you enjoyed <strong>{{webinar_name}}</strong>. As promised, here are all the resources:
  </p>
  <!-- Resources -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr>
      <td style="padding:12px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;margin-bottom:8px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="36" style="font-size:24px;">🎬</td>
          <td>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#0f172a;">Full Recording</p>
            <a href="{{recording_url}}" style="font-size:12px;color:#0f766e;text-decoration:none;">Watch now →</a>
          </td>
        </tr></table>
      </td>
    </tr>
    <tr><td style="height:8px;"></td></tr>
    <tr>
      <td style="padding:12px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="36" style="font-size:24px;">📊</td>
          <td>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#0f172a;">Slide Deck</p>
            <a href="{{slides_url}}" style="font-size:12px;color:#0f766e;text-decoration:none;">Download PDF →</a>
          </td>
        </tr></table>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
    {{followup_message}}
  </p>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:linear-gradient(135deg,#0f766e,#0891b2);border-radius:8px;">
        <a href="{{cta_url}}" style="display:block;padding:12px 28px;color:#fff;
                                    font-size:14px;font-weight:700;text-decoration:none;">
          {{cta_text}}
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  // ══ ONBOARDING (continued) ══════════════════════════════════════════════════
  {
    id: 'lib-trial-expiring',
    name: 'Trial Expiring Soon',
    category: 'onboarding',
    description: 'Nudge free-trial users to upgrade before their trial ends.',
    tags: ['trial', 'upgrade', 'conversion', 'saas'],
    accent: '#ea580c',
    htmlContent: `
${WRAPPER('#fff7ed', '#ffffff')}
${HEADER('#ea580c')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Your trial ends in {{days_left}} days, {{first_name}}
  </p>
  <!-- Countdown bar -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 20px;">
    <tr>
      <td style="background:#fed7aa;border-radius:8px;height:10px;padding:0;overflow:hidden;">
        <td style="background:#ea580c;height:10px;width:{{trial_progress_pct}}%;border-radius:8px;padding:0;"></td>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    You've been using <strong>{{company_name}}</strong> for {{days_used}} days. Don't lose access
    to these features when your trial ends on <strong>{{trial_end_date}}</strong>:
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    ${['feature_1','feature_2','feature_3'].map(f => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
        <p style="margin:0;font-size:14px;color:#444;">
          ✅ &nbsp;{{${f}}}
        </p>
      </td>
    </tr>`).join('')}
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="background:linear-gradient(135deg,#ea580c,#dc2626);border-radius:8px;">
        <a href="{{upgrade_url}}" style="display:block;padding:14px 32px;color:#fff;
                                        font-size:15px;font-weight:800;text-decoration:none;">
          Upgrade Now — Keep Everything
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:12px;color:#aaa;">
    Starting at {{price_from}}/month · Cancel anytime
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-upgrade-prompt',
    name: 'Upgrade Prompt',
    category: 'onboarding',
    description: 'Highlight the gap between a user\'s current plan and the next tier.',
    tags: ['upgrade', 'upsell', 'pricing', 'saas'],
    accent: '#7c3aed',
    htmlContent: `
${WRAPPER('#f5f3ff', '#ffffff')}
${HEADER('linear-gradient(135deg,#7c3aed,#4f46e5)')}
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    You're almost at your limit, {{first_name}}
  </p>
  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
    You've used <strong>{{used_amount}}</strong> of your <strong>{{plan_limit}}</strong> {{resource_name}}
    on the {{plan_name}} plan. Upgrade to keep the momentum going.
  </p>
  <!-- Plan comparison -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border-collapse:collapse;border-radius:12px;overflow:hidden;margin-bottom:24px;border:1px solid #ede9fe;">
    <tr style="background:#f5f3ff;">
      <th style="padding:10px 16px;text-align:left;font-size:11px;color:#7c3aed;font-weight:700;text-transform:uppercase;">Feature</th>
      <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;">{{plan_name}}</th>
      <th style="padding:10px 16px;text-align:center;font-size:11px;color:#7c3aed;font-weight:700;text-transform:uppercase;">{{next_plan_name}}</th>
    </tr>
    <tr style="border-top:1px solid #ede9fe;">
      <td style="padding:10px 16px;font-size:13px;color:#333;">{{resource_name}}</td>
      <td style="padding:10px 16px;font-size:13px;color:#888;text-align:center;">{{plan_limit}}</td>
      <td style="padding:10px 16px;font-size:13px;color:#7c3aed;font-weight:700;text-align:center;">{{next_plan_limit}}</td>
    </tr>
    <tr style="border-top:1px solid #ede9fe;background:#fafafa;">
      <td style="padding:10px 16px;font-size:13px;color:#333;">{{feature_2_name}}</td>
      <td style="padding:10px 16px;font-size:13px;color:#888;text-align:center;">—</td>
      <td style="padding:10px 16px;font-size:13px;color:#7c3aed;font-weight:700;text-align:center;">✓</td>
    </tr>
    <tr style="border-top:1px solid #ede9fe;">
      <td style="padding:10px 16px;font-size:13px;color:#333;">Priority support</td>
      <td style="padding:10px 16px;font-size:13px;color:#888;text-align:center;">—</td>
      <td style="padding:10px 16px;font-size:13px;color:#7c3aed;font-weight:700;text-align:center;">✓</td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;">
        <a href="{{upgrade_url}}" style="display:block;padding:13px 32px;color:#fff;
                                        font-size:14px;font-weight:700;text-decoration:none;">
          Upgrade to {{next_plan_name}} →
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:12px;color:#aaa;">
    Only {{next_plan_price}}/month · Upgrade takes effect immediately
  </p>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  // ══ NOTIFICATION (continued) ══════════════════════════════════════════════
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

  {
    id: 'lib-weekly-report',
    name: 'Weekly Report',
    category: 'notification',
    description: 'Auto-generated weekly digest with key metrics and activity summary.',
    tags: ['report', 'weekly', 'digest', 'metrics'],
    accent: '#0284c7',
    htmlContent: `
${WRAPPER('#f0f9ff', '#ffffff')}
${HEADER('#0284c7')}
<tr><td style="padding:24px 32px 0;">
  <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#0284c7;font-weight:700;">
    Week of {{week_start}} – {{week_end}}
  </p>
  <h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;">
    Your Weekly Summary
  </h2>
  <!-- KPI row -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr>
      <td width="32%" style="padding:14px;text-align:center;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
        <p style="margin:0 0 2px;font-size:22px;font-weight:800;color:#0284c7;">{{metric_1_value}}</p>
        <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">{{metric_1_label}}</p>
      </td>
      <td width="4px;"></td>
      <td width="32%" style="padding:14px;text-align:center;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
        <p style="margin:0 0 2px;font-size:22px;font-weight:800;color:#0284c7;">{{metric_2_value}}</p>
        <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">{{metric_2_label}}</p>
      </td>
      <td width="4px;"></td>
      <td width="32%" style="padding:14px;text-align:center;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
        <p style="margin:0 0 2px;font-size:22px;font-weight:800;color:#0284c7;">{{metric_3_value}}</p>
        <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">{{metric_3_label}}</p>
      </td>
    </tr>
  </table>
  <!-- Top activity -->
  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">This week's highlights</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border-collapse:collapse;margin-bottom:24px;border:1px solid #bae6fd;border-radius:8px;overflow:hidden;">
    <tr style="background:#e0f2fe;">
      <th style="padding:8px 12px;text-align:left;font-size:11px;color:#0284c7;font-weight:700;">Activity</th>
      <th style="padding:8px 12px;text-align:right;font-size:11px;color:#0284c7;font-weight:700;">Count</th>
      <th style="padding:8px 12px;text-align:right;font-size:11px;color:#0284c7;font-weight:700;">vs Last Week</th>
    </tr>
    <tr style="border-top:1px solid #bae6fd;">
      <td style="padding:9px 12px;font-size:13px;color:#333;">{{activity_1_name}}</td>
      <td style="padding:9px 12px;font-size:13px;color:#333;text-align:right;">{{activity_1_count}}</td>
      <td style="padding:9px 12px;font-size:13px;color:#16a34a;font-weight:600;text-align:right;">{{activity_1_change}}</td>
    </tr>
    <tr style="border-top:1px solid #bae6fd;background:#f0f9ff;">
      <td style="padding:9px 12px;font-size:13px;color:#333;">{{activity_2_name}}</td>
      <td style="padding:9px 12px;font-size:13px;color:#333;text-align:right;">{{activity_2_count}}</td>
      <td style="padding:9px 12px;font-size:13px;color:#dc2626;font-weight:600;text-align:right;">{{activity_2_change}}</td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
    <tr>
      <td style="background:#0284c7;border-radius:8px;">
        <a href="{{dashboard_url}}" style="display:block;padding:12px 24px;color:#fff;
                                          font-size:13px;font-weight:700;text-decoration:none;">
          View Full Report →
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-new-login',
    name: 'New Login Alert',
    category: 'notification',
    description: 'Security alert when a new device or unusual location logs into the account.',
    tags: ['security', 'login', 'alert', '2fa'],
    accent: '#b45309',
    htmlContent: `
${WRAPPER('#fffbeb', '#ffffff')}
<tr><td style="background:#b45309;padding:20px 32px;">
  <p style="margin:0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);
             text-transform:uppercase;letter-spacing:0.1em;">🔐 Security Alert</p>
  <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#fff;">
    New sign-in to your account
  </p>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
    Hi {{first_name}}, we noticed a new sign-in to your {{company_name}} account.
    If this was you, no action is needed.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="padding-bottom:12px;">
              <p style="margin:0 0 2px;font-size:11px;color:#b45309;text-transform:uppercase;font-weight:700;">Device</p>
              <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a;">{{device_name}}</p>
            </td>
            <td width="50%" style="padding-bottom:12px;">
              <p style="margin:0 0 2px;font-size:11px;color:#b45309;text-transform:uppercase;font-weight:700;">Location</p>
              <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a;">{{login_location}}</p>
            </td>
          </tr>
          <tr>
            <td width="50%">
              <p style="margin:0 0 2px;font-size:11px;color:#b45309;text-transform:uppercase;font-weight:700;">IP Address</p>
              <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a;">{{ip_address}}</p>
            </td>
            <td width="50%">
              <p style="margin:0 0 2px;font-size:11px;color:#b45309;text-transform:uppercase;font-weight:700;">Time</p>
              <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a;">{{login_time}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#991b1b;">
    Not you? Secure your account immediately:
  </p>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:#dc2626;border-radius:8px;">
        <a href="{{secure_account_url}}" style="display:block;padding:12px 28px;color:#fff;
                                               font-size:14px;font-weight:700;text-decoration:none;">
          Secure My Account
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },

  {
    id: 'lib-account-reactivation',
    name: 'Account Reactivation',
    category: 'notification',
    description: 'Confirm account reactivation after a suspension or voluntary pause.',
    tags: ['reactivation', 'account', 'suspension', 'billing'],
    accent: '#16a34a',
    htmlContent: `
${WRAPPER('#f0fdf4', '#ffffff')}
<tr><td style="background:linear-gradient(135deg,#16a34a,#0d9488);padding:32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:40px;">🎉</p>
  <p style="margin:0;font-size:24px;font-weight:800;color:#fff;">Your account is active again!</p>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
    Hi {{first_name}}, your <strong>{{company_name}}</strong> account has been successfully reactivated.
    You now have full access to all your features and data.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
    <tr>
      <td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <p style="margin:0 0 2px;font-size:11px;color:#16a34a;text-transform:uppercase;font-weight:700;">Plan</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{plan_name}}</p>
            </td>
            <td align="right">
              <span style="display:inline-block;background:#dcfce7;color:#16a34a;font-size:12px;
                           font-weight:700;padding:4px 12px;border-radius:20px;">Active</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:10px;border-top:1px solid #bbf7d0;">
              <p style="margin:4px 0 0;font-size:12px;color:#888;">
                Next billing: <strong>{{next_billing_date}}</strong> · {{billing_amount}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
    {{reactivation_message}}
  </p>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:linear-gradient(135deg,#16a34a,#0d9488);border-radius:8px;">
        <a href="{{dashboard_url}}" style="display:block;padding:13px 28px;color:#fff;
                                          font-size:14px;font-weight:700;text-decoration:none;">
          Go to Dashboard →
        </a>
      </td>
    </tr>
  </table>
</td></tr>
${FOOTER}
${CLOSE_WRAPPER}`,
  },
  // ══ OPERATIONAL ════════════════════════════════════════════════════════════
  {
    id: 'lib-service-provider-notice',
    name: 'Service Provider Notice',
    category: 'operational',
    description: 'All-in-one notification to a service provider covering info, payment details, attachments, and step-by-step instructions.',
    tags: ['service-provider', 'b2b', 'payment', 'instructions', 'attachments', 'operational'],
    accent: '#0f4c81',
    htmlContent: `
${WRAPPER('#f1f5f9', '#ffffff')}
<!-- ── Header ── -->
<tr>
  <td style="background:linear-gradient(135deg,#0f4c81,#1e3a5f);padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td>
        <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.6);
                   text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">
          {{company_name}}
        </p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">
          Service Provider Notice
        </p>
      </td>
      <td align="right" style="vertical-align:top;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);">Ref: {{reference_number}}</p>
        <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Date: {{notice_date}}</p>
      </td>
    </tr></table>
  </td>
</tr>

<!-- ── Addressed To ── -->
<tr>
  <td style="padding:24px 32px 0;">
    <p style="margin:0 0 4px;font-size:13px;color:#888;">To:</p>
    <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0f172a;">{{provider_name}}</p>
    <p style="margin:0 0 2px;font-size:13px;color:#555;">{{provider_contact_name}} · {{provider_contact_title}}</p>
    <p style="margin:0;font-size:13px;color:#555;">{{provider_email}}</p>
  </td>
</tr>

<!-- ── Notification / Subject ── -->
<tr>
  <td style="padding:20px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#eff6ff;border-left:4px solid #0f4c81;border-radius:0 8px 8px 0;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0 0 3px;font-size:11px;color:#0f4c81;text-transform:uppercase;
                     font-weight:700;letter-spacing:0.08em;">Subject</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{{notice_subject}}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ── Message Body ── -->
<tr>
  <td style="padding:20px 32px 0;">
    <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.75;">
      Dear {{provider_contact_name}},
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.75;">
      {{notice_body}}
    </p>
    <p style="margin:0;font-size:15px;color:#444;line-height:1.75;">
      {{notice_additional_info}}
    </p>
  </td>
</tr>

<!-- ── Payment Details ── -->
<tr>
  <td style="padding:20px 32px 0;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">
      💳 Payment Details
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#64748b;
                   text-transform:uppercase;border-bottom:1px solid #e2e8f0;width:40%;">Field</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#64748b;
                   text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Details</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">
          Invoice / PO Number
        </td>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#0f172a;
                   border-bottom:1px solid #f1f5f9;">{{invoice_number}}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">
          Amount Due
        </td>
        <td style="padding:10px 14px;font-size:15px;font-weight:800;color:#0f4c81;
                   border-bottom:1px solid #f1f5f9;">{{payment_amount}}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">
          Payment Due Date
        </td>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#0f172a;
                   border-bottom:1px solid #f1f5f9;">{{payment_due_date}}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">
          Payment Method
        </td>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#0f172a;
                   border-bottom:1px solid #f1f5f9;">{{payment_method}}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#64748b;">Bank / Account Ref</td>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#0f172a;">
          {{bank_account_reference}}
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
      <tr>
        <td style="background:linear-gradient(135deg,#0f4c81,#1e3a5f);border-radius:8px;">
          <a href="{{payment_url}}" style="display:block;padding:11px 24px;color:#fff;
                                          font-size:13px;font-weight:700;text-decoration:none;">
            Complete Payment →
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ── Attachments ── -->
<tr>
  <td style="padding:20px 32px 0;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">
      📎 Attachments
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;
                   border-radius:8px;margin-bottom:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="32" style="font-size:20px;vertical-align:middle;">📄</td>
            <td style="vertical-align:middle;">
              <p style="margin:0 0 1px;font-size:13px;font-weight:700;color:#0f172a;">
                {{attachment_1_name}}
              </p>
              <a href="{{attachment_1_url}}" style="font-size:12px;color:#0f4c81;text-decoration:none;font-weight:600;">
                Download →
              </a>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="32" style="font-size:20px;vertical-align:middle;">📋</td>
            <td style="vertical-align:middle;">
              <p style="margin:0 0 1px;font-size:13px;font-weight:700;color:#0f172a;">
                {{attachment_2_name}}
              </p>
              <a href="{{attachment_2_url}}" style="font-size:12px;color:#0f4c81;text-decoration:none;font-weight:600;">
                Download →
              </a>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="32" style="font-size:20px;vertical-align:middle;">🖼️</td>
            <td style="vertical-align:middle;">
              <p style="margin:0 0 1px;font-size:13px;font-weight:700;color:#0f172a;">
                {{attachment_3_name}}
              </p>
              <a href="{{attachment_3_url}}" style="font-size:12px;color:#0f4c81;text-decoration:none;font-weight:600;">
                Download →
              </a>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ── Instructions ── -->
<tr>
  <td style="padding:20px 32px 0;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">
      📋 Instructions
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:20px;height:20px;background:#0f4c81;
                           border-radius:50%;text-align:center;line-height:20px;
                           font-size:11px;font-weight:800;color:#fff;">1</span>
            </td>
            <td style="padding-left:8px;">
              <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#0f172a;">
                {{step_1_title}}
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                {{step_1_details}}
              </p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#fff;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:20px;height:20px;background:#0f4c81;
                           border-radius:50%;text-align:center;line-height:20px;
                           font-size:11px;font-weight:800;color:#fff;">2</span>
            </td>
            <td style="padding-left:8px;">
              <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#0f172a;">
                {{step_2_title}}
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                {{step_2_details}}
              </p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:20px;height:20px;background:#0f4c81;
                           border-radius:50%;text-align:center;line-height:20px;
                           font-size:11px;font-weight:800;color:#fff;">3</span>
            </td>
            <td style="padding-left:8px;">
              <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#0f172a;">
                {{step_3_title}}
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                {{step_3_details}}
              </p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px;background:#fff;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:20px;height:20px;background:#0f4c81;
                           border-radius:50%;text-align:center;line-height:20px;
                           font-size:11px;font-weight:800;color:#fff;">4</span>
            </td>
            <td style="padding-left:8px;">
              <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#0f172a;">
                {{step_4_title}}
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                {{step_4_details}}
              </p>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ── Important Notice / Deadline ── -->
<tr>
  <td style="padding:20px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #ea580c;
                  border-radius:0 8px 8px 0;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0 0 3px;font-size:12px;color:#ea580c;font-weight:700;
                     text-transform:uppercase;">⚠ Important Deadline</p>
          <p style="margin:0;font-size:13px;color:#7c2d12;line-height:1.6;">
            {{deadline_message}}
            <strong style="display:block;margin-top:4px;">Due by: {{action_deadline}}</strong>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ── Confirmation CTA ── -->
<tr>
  <td style="padding:24px 32px;">
    <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.7;">
      Please confirm receipt of this notice and let us know if you have any questions.
      You can reach us at
      <a href="mailto:{{contact_email}}" style="color:#0f4c81;font-weight:600;">{{contact_email}}</a>
      or call <strong>{{contact_phone}}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:linear-gradient(135deg,#0f4c81,#1e3a5f);border-radius:8px;margin-right:8px;">
          <a href="{{confirm_url}}" style="display:block;padding:12px 28px;color:#fff;
                                          font-size:14px;font-weight:700;text-decoration:none;">
            Confirm Receipt
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
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
  { key: 'operational',    label: 'Operational',     count: EMAIL_LIBRARY.filter(t => t.category === 'operational').length },
]
