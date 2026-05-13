/**
 * Starter template samples organised by category.
 * Each entry ships with pre-built HTML + CSS that the builder loads directly.
 * Categories: Invoice, Receipt, Legal, Certificate, Business Letter, Quotation, Report
 */

export const STARTER_CATEGORIES = [
  {
    id: 'invoice',
    label: 'Invoice',
    icon: '🧾',
    color: '#4f46e5',
    bg: '#eef2ff',
    description: 'Professional invoice with line items, totals, and payment details.',
    pageSize: 'A4',
    orientation: 'portrait',
    templates: [
      {
        id: 'invoice-standard',
        name: 'Standard Invoice',
        description: 'Clean invoice with logo, client details, itemised table and totals.',
        tags: ['finance', 'billing'],
        html: `<div style="font-family:Arial,sans-serif;max-width:794px;margin:0 auto;padding:40px;color:#1a1a2e;background:#fff;">

  <!-- Header -->
  <table width="100%" style="margin-bottom:32px;border-collapse:collapse;">
    <tr>
      <td>
        <div style="font-size:28px;font-weight:900;color:#4f46e5;letter-spacing:-0.5px;">{{company_name}}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">{{company_address}}</div>
        <div style="font-size:12px;color:#6b7280;">{{company_email}} · {{company_phone}}</div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="font-size:32px;font-weight:900;color:#e5e7eb;letter-spacing:2px;text-transform:uppercase;">INVOICE</div>
        <div style="margin-top:8px;font-size:13px;color:#374151;"><strong>Invoice #</strong> {{invoice_number}}</div>
        <div style="font-size:12px;color:#6b7280;">Date: {{invoice_date}}</div>
        <div style="font-size:12px;color:#6b7280;">Due: {{due_date}}</div>
      </td>
    </tr>
  </table>

  <!-- Bill To / Ship To -->
  <table width="100%" style="margin-bottom:28px;border-collapse:collapse;">
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:6px;">Bill To</div>
        <div style="font-size:14px;font-weight:700;color:#111827;">{{client_name}}</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.6;">{{client_address}}</div>
        <div style="font-size:12px;color:#6b7280;">{{client_email}}</div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:24px;">
        <div style="background:#f9fafb;border-radius:8px;padding:16px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:8px;">Payment Status</div>
          <!-- {{#if is_paid}} -->
          <div style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">✓ PAID</div>
          <!-- {{else}} -->
          <div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">⏳ PENDING</div>
          <!-- {{/if}} -->
        </div>
      </td>
    </tr>
  </table>

  <!-- Line Items Table -->
  <table width="100%" style="border-collapse:collapse;margin-bottom:24px;font-size:13px;">
    <thead>
      <tr style="background:#4f46e5;color:#fff;">
        <th style="padding:10px 12px;text-align:left;border-radius:6px 0 0 6px;">Description</th>
        <th style="padding:10px 12px;text-align:center;width:80px;">Qty</th>
        <th style="padding:10px 12px;text-align:right;width:100px;">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;width:100px;border-radius:0 6px 6px 0;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <!-- {{#each line_items}} -->
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px;color:#374151;">{{this.description}}</td>
        <td style="padding:10px 12px;text-align:center;color:#6b7280;">{{this.quantity}}</td>
        <td style="padding:10px 12px;text-align:right;color:#6b7280;">{{formatCurrency this.unit_price "USD"}}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:#111827;">{{formatCurrency this.total "USD"}}</td>
      </tr>
      <!-- {{/each}} -->
    </tbody>
  </table>

  <!-- Totals -->
  <table style="width:280px;margin-left:auto;border-collapse:collapse;font-size:13px;margin-bottom:32px;">
    <tr>
      <td style="padding:6px 0;color:#6b7280;">Subtotal</td>
      <td style="padding:6px 0;text-align:right;color:#374151;">{{formatCurrency subtotal "USD"}}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#6b7280;">Tax ({{tax_rate}}%)</td>
      <td style="padding:6px 0;text-align:right;color:#374151;">{{formatCurrency tax_amount "USD"}}</td>
    </tr>
    <tr style="border-top:2px solid #4f46e5;">
      <td style="padding:10px 0;font-weight:700;font-size:15px;color:#111827;">Total Due</td>
      <td style="padding:10px 0;text-align:right;font-weight:700;font-size:15px;color:#4f46e5;">{{formatCurrency total_amount "USD"}}</td>
    </tr>
  </table>

  <!-- Payment Instructions -->
  <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:8px;">Payment Instructions</div>
    <div style="font-size:12px;color:#374151;line-height:1.7;">{{payment_instructions}}</div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:11px;color:#d1d5db;border-top:1px solid #f3f4f6;padding-top:16px;">
    Thank you for your business · {{company_name}} · {{company_website}}
  </div>
</div>`,
        css: '',
        placeholders: ['company_name','company_address','company_email','company_phone','invoice_number','invoice_date','due_date','client_name','client_address','client_email','is_paid','line_items','subtotal','tax_rate','tax_amount','total_amount','payment_instructions','company_website'],
      },
    ],
  },

  {
    id: 'receipt',
    label: 'Receipt',
    icon: '🏷️',
    color: '#059669',
    bg: '#ecfdf5',
    description: 'Payment confirmation receipt for products or services.',
    pageSize: 'A4',
    orientation: 'portrait',
    templates: [
      {
        id: 'receipt-payment',
        name: 'Payment Receipt',
        description: 'Clean payment confirmation with transaction details and itemised summary.',
        tags: ['finance', 'payment'],
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px;color:#1a1a2e;background:#fff;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:22px;font-weight:900;color:#059669;">{{company_name}}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:2px;">{{company_address}}</div>
    <div style="margin-top:16px;font-size:28px;font-weight:900;color:#111827;text-transform:uppercase;letter-spacing:2px;">Receipt</div>
    <div style="width:60px;height:3px;background:#059669;margin:8px auto 0;border-radius:2px;"></div>
  </div>

  <!-- Transaction Info -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
    <table width="100%" style="border-collapse:collapse;font-size:12px;">
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Receipt No.</td>
        <td style="text-align:right;font-weight:700;color:#111827;">{{receipt_number}}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Date</td>
        <td style="text-align:right;color:#374151;">{{formatDate receipt_date "MMMM D, YYYY"}}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Transaction ID</td>
        <td style="text-align:right;font-family:monospace;font-size:11px;color:#374151;">{{transaction_id}}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Payment Method</td>
        <td style="text-align:right;color:#374151;">{{payment_method}}</td>
      </tr>
    </table>
  </div>

  <!-- Received From -->
  <div style="margin-bottom:24px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:6px;">Received From</div>
    <div style="font-size:14px;font-weight:700;color:#111827;">{{client_name}}</div>
    <div style="font-size:12px;color:#6b7280;">{{client_email}}</div>
  </div>

  <!-- Items -->
  <table width="100%" style="border-collapse:collapse;font-size:13px;margin-bottom:20px;">
    <thead>
      <tr style="border-bottom:2px solid #059669;">
        <th style="padding:8px 0;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Item</th>
        <th style="padding:8px 0;text-align:right;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <!-- {{#each items}} -->
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 0;color:#374151;">{{this.name}}</td>
        <td style="padding:8px 0;text-align:right;color:#374151;">{{formatCurrency this.amount "USD"}}</td>
      </tr>
      <!-- {{/each}} -->
    </tbody>
    <tfoot>
      <tr style="border-top:2px solid #111827;">
        <td style="padding:10px 0;font-weight:700;font-size:15px;color:#111827;">Total Paid</td>
        <td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#059669;">{{formatCurrency total_amount "USD"}}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Confirmation Banner -->
  <div style="background:#059669;border-radius:8px;padding:14px;text-align:center;margin-bottom:24px;">
    <div style="font-size:16px;font-weight:700;color:#fff;">✓ Payment Confirmed</div>
    <div style="font-size:11px;color:#a7f3d0;margin-top:4px;">{{payment_note}}</div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:11px;color:#d1d5db;">
    {{company_name}} · {{company_website}}<br/>
    This is an official receipt. Please retain for your records.
  </div>
</div>`,
        css: '',
        placeholders: ['company_name','company_address','receipt_number','receipt_date','transaction_id','payment_method','client_name','client_email','items','total_amount','payment_note','company_website'],
      },
    ],
  },

  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖️',
    color: '#1e40af',
    bg: '#eff6ff',
    description: 'Contracts, agreements, and legal document templates.',
    pageSize: 'A4',
    orientation: 'portrait',
    templates: [
      {
        id: 'legal-agreement',
        name: 'Service Agreement',
        description: 'Professional service contract with parties, terms, and dual signatures.',
        tags: ['contract', 'legal', 'agreement'],
        html: `<div style="font-family:'Times New Roman',Times,serif;max-width:794px;margin:0 auto;padding:48px;color:#111827;background:#fff;line-height:1.7;">

  <!-- Title Block -->
  <div style="text-align:center;margin-bottom:36px;border-bottom:3px double #1e40af;padding-bottom:24px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#6b7280;margin-bottom:8px;">{{document_type}}</div>
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;">Service Agreement</h1>
    <div style="font-size:12px;color:#6b7280;margin-top:8px;">Agreement No. {{agreement_number}} &nbsp;|&nbsp; {{formatDate agreement_date "MMMM D, YYYY"}}</div>
  </div>

  <!-- Parties -->
  <div style="margin-bottom:28px;">
    <p style="margin:0 0 12px;font-size:13px;">This Service Agreement ("Agreement") is entered into as of <strong>{{formatDate agreement_date "MMMM D, YYYY"}}</strong>, by and between:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0;">
      <div style="background:#eff6ff;border-left:3px solid #1e40af;border-radius:0 6px 6px 0;padding:14px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1e40af;margin-bottom:6px;">Service Provider</div>
        <div style="font-size:13px;font-weight:700;color:#111827;">{{provider_name}}</div>
        <div style="font-size:12px;color:#374151;">{{provider_address}}</div>
        <div style="font-size:12px;color:#374151;">{{provider_email}}</div>
      </div>
      <div style="background:#f9fafb;border-left:3px solid #6b7280;border-radius:0 6px 6px 0;padding:14px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:6px;">Client</div>
        <div style="font-size:13px;font-weight:700;color:#111827;">{{client_name}}</div>
        <div style="font-size:12px;color:#374151;">{{client_address}}</div>
        <div style="font-size:12px;color:#374151;">{{client_email}}</div>
      </div>
    </div>
  </div>

  <!-- Clauses -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1e40af;border-bottom:1px solid #dbeafe;padding-bottom:6px;margin-bottom:14px;">1. Scope of Services</h2>
    <p style="font-size:13px;color:#374151;margin:0 0 12px;">{{scope_of_services}}</p>
  </div>

  <div style="margin-bottom:24px;">
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1e40af;border-bottom:1px solid #dbeafe;padding-bottom:6px;margin-bottom:14px;">2. Term &amp; Duration</h2>
    <p style="font-size:13px;color:#374151;margin:0;">This Agreement commences on <strong>{{start_date}}</strong> and shall continue until <strong>{{end_date}}</strong>, unless terminated earlier pursuant to the terms herein.</p>
  </div>

  <div style="margin-bottom:24px;">
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1e40af;border-bottom:1px solid #dbeafe;padding-bottom:6px;margin-bottom:14px;">3. Compensation</h2>
    <p style="font-size:13px;color:#374151;margin:0 0 8px;">The Client agrees to pay the Service Provider <strong>{{formatCurrency fee_amount "USD"}}</strong> per {{fee_basis}}. Payment is due within {{payment_terms}} days of invoice.</p>
  </div>

  <div style="margin-bottom:24px;">
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1e40af;border-bottom:1px solid #dbeafe;padding-bottom:6px;margin-bottom:14px;">4. Confidentiality</h2>
    <p style="font-size:13px;color:#374151;margin:0;">Each party agrees to keep confidential any proprietary or confidential information disclosed by the other party and shall not disclose such information to any third party without prior written consent.</p>
  </div>

  <div style="margin-bottom:32px;">
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1e40af;border-bottom:1px solid #dbeafe;padding-bottom:6px;margin-bottom:14px;">5. Governing Law</h2>
    <p style="font-size:13px;color:#374151;margin:0;">This Agreement shall be governed by the laws of <strong>{{governing_jurisdiction}}</strong>. Any disputes shall be resolved through binding arbitration.</p>
  </div>

  <!-- Signatures -->
  <div style="border-top:2px solid #111827;padding-top:28px;">
    <p style="font-size:12px;color:#374151;margin:0 0 20px;text-align:center;font-style:italic;">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>
    <table width="100%" style="border-collapse:collapse;">
      <tr>
        <td style="width:45%;vertical-align:bottom;">
          <div style="border-bottom:1px solid #111827;height:40px;margin-bottom:6px;"></div>
          <div style="font-size:12px;color:#374151;font-weight:700;">{{provider_name}}</div>
          <div style="font-size:11px;color:#6b7280;">Service Provider · Date: {{agreement_date}}</div>
        </td>
        <td style="width:10%;"></td>
        <td style="width:45%;vertical-align:bottom;">
          <div style="border-bottom:1px solid #111827;height:40px;margin-bottom:6px;"></div>
          <div style="font-size:12px;color:#374151;font-weight:700;">{{client_name}}</div>
          <div style="font-size:11px;color:#6b7280;">Client · Date: {{agreement_date}}</div>
        </td>
      </tr>
    </table>
  </div>
</div>`,
        css: '',
        placeholders: ['document_type','agreement_number','agreement_date','provider_name','provider_address','provider_email','client_name','client_address','client_email','scope_of_services','start_date','end_date','fee_amount','fee_basis','payment_terms','governing_jurisdiction'],
      },
    ],
  },

  {
    id: 'certificate',
    label: 'Certificate',
    icon: '🏆',
    color: '#b45309',
    bg: '#fffbeb',
    description: 'Certificates of achievement, completion, and appreciation.',
    pageSize: 'A4',
    orientation: 'landscape',
    templates: [
      {
        id: 'cert-achievement',
        name: 'Certificate of Achievement',
        description: 'Elegant gold-bordered certificate with award details and signatures.',
        tags: ['award', 'achievement', 'completion'],
        html: `<div style="font-family:Georgia,serif;max-width:1000px;margin:0 auto;padding:20px;background:#fff;">
  <div style="border:10px double #b45309;border-radius:4px;padding:40px;text-align:center;background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fffbeb 100%);min-height:540px;display:flex;flex-direction:column;justify-content:center;align-items:center;">

    <div style="border:2px solid #d97706;border-radius:2px;padding:30px 48px;width:100%;max-width:840px;">

      <!-- Top badge -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.3em;color:#92400e;margin-bottom:4px;">{{issuing_organization}}</div>
      <div style="width:80px;height:2px;background:#d97706;margin:12px auto;"></div>

      <!-- Certificate label -->
      <div style="font-size:13px;font-weight:400;text-transform:uppercase;letter-spacing:0.2em;color:#78350f;margin-bottom:6px;">Certificate of</div>
      <h1 style="margin:0 0 20px;font-size:48px;font-weight:700;color:#78350f;font-style:italic;line-height:1;">{{certificate_type}}</h1>

      <!-- Body -->
      <p style="margin:0 0 6px;font-size:14px;color:#555;font-style:italic;">This is to certify that</p>
      <h2 style="margin:0 0 6px;font-size:36px;font-weight:700;color:#1a1a2e;border-bottom:3px solid #d97706;display:inline-block;padding-bottom:6px;">{{recipient_name}}</h2>
      <p style="margin:16px 0 20px;font-size:13px;color:#555;line-height:1.8;max-width:560px;">{{certificate_body}}</p>

      <!-- Date & Issue -->
      <div style="font-size:12px;color:#92400e;margin-bottom:28px;font-style:italic;">Awarded on {{formatDate award_date "MMMM D, YYYY"}}</div>

      <!-- Signatures -->
      <div style="display:flex;justify-content:center;gap:80px;">
        <div style="text-align:center;">
          <div style="width:140px;border-bottom:1px solid #78350f;margin-bottom:4px;height:36px;"></div>
          <div style="font-size:11px;font-weight:700;color:#78350f;">{{signatory_one_name}}</div>
          <div style="font-size:10px;color:#92400e;">{{signatory_one_title}}</div>
        </div>
        <!-- {{#if signatory_two_name}} -->
        <div style="text-align:center;">
          <div style="width:140px;border-bottom:1px solid #78350f;margin-bottom:4px;height:36px;"></div>
          <div style="font-size:11px;font-weight:700;color:#78350f;">{{signatory_two_name}}</div>
          <div style="font-size:10px;color:#92400e;">{{signatory_two_title}}</div>
        </div>
        <!-- {{/if}} -->
      </div>

      <!-- Certificate ID -->
      <div style="margin-top:20px;font-size:10px;color:#d97706;font-family:monospace;letter-spacing:0.1em;">CERT ID: {{certificate_id}}</div>
    </div>
  </div>
</div>`,
        css: '',
        placeholders: ['issuing_organization','certificate_type','recipient_name','certificate_body','award_date','signatory_one_name','signatory_one_title','signatory_two_name','signatory_two_title','certificate_id'],
      },
    ],
  },

  {
    id: 'letter',
    label: 'Business Letter',
    icon: '✉️',
    color: '#374151',
    bg: '#f9fafb',
    description: 'Professional business correspondence on company letterhead.',
    pageSize: 'A4',
    orientation: 'portrait',
    templates: [
      {
        id: 'letter-standard',
        name: 'Business Letter',
        description: 'Formal business letter with company letterhead, recipient address and signature block.',
        tags: ['correspondence', 'letter', 'business'],
        html: `<div style="font-family:Arial,sans-serif;max-width:794px;margin:0 auto;padding:0;color:#111827;background:#fff;">

  <!-- Letterhead -->
  <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:28px 40px;margin-bottom:32px;">
    <table width="100%" style="border-collapse:collapse;">
      <tr>
        <td>
          <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">{{company_name}}</div>
          <div style="font-size:11px;color:#bfdbfe;margin-top:3px;">{{company_tagline}}</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:11px;color:#bfdbfe;line-height:1.7;">
            {{company_address}}<br/>
            {{company_email}}<br/>
            {{company_phone}}
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div style="padding:0 40px 40px;">
    <!-- Date -->
    <div style="font-size:12px;color:#6b7280;margin-bottom:20px;">{{formatDate letter_date "MMMM D, YYYY"}}</div>

    <!-- Recipient -->
    <div style="margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#111827;">{{recipient_name}}</div>
      <div style="font-size:12px;color:#374151;">{{recipient_title}}</div>
      <div style="font-size:12px;color:#6b7280;line-height:1.6;">{{recipient_company}}<br/>{{recipient_address}}</div>
    </div>

    <!-- Salutation -->
    <p style="font-size:13px;color:#374151;margin:0 0 16px;">Dear {{recipient_salutation}},</p>

    <!-- Subject -->
    <p style="font-size:13px;font-weight:700;color:#1e40af;margin:0 0 16px;">Re: {{letter_subject}}</p>

    <!-- Body -->
    <p style="font-size:13px;color:#374151;line-height:1.8;margin:0 0 14px;">{{letter_body_paragraph_1}}</p>
    <p style="font-size:13px;color:#374151;line-height:1.8;margin:0 0 14px;">{{letter_body_paragraph_2}}</p>
    <p style="font-size:13px;color:#374151;line-height:1.8;margin:0 0 28px;">{{letter_closing_paragraph}}</p>

    <!-- Signature -->
    <p style="font-size:13px;color:#374151;margin:0 0 40px;">Yours sincerely,</p>
    <div style="border-bottom:1px solid #9ca3af;width:180px;margin-bottom:4px;"></div>
    <div style="font-size:13px;font-weight:700;color:#111827;">{{sender_name}}</div>
    <div style="font-size:12px;color:#6b7280;">{{sender_title}}</div>
    <div style="font-size:12px;color:#6b7280;">{{company_name}}</div>
  </div>
</div>`,
        css: '',
        placeholders: ['company_name','company_tagline','company_address','company_email','company_phone','letter_date','recipient_name','recipient_title','recipient_company','recipient_address','recipient_salutation','letter_subject','letter_body_paragraph_1','letter_body_paragraph_2','letter_closing_paragraph','sender_name','sender_title'],
      },
    ],
  },

  {
    id: 'quotation',
    label: 'Quotation',
    icon: '💰',
    color: '#0891b2',
    bg: '#ecfeff',
    description: 'Price quotation and estimate templates for proposals.',
    pageSize: 'A4',
    orientation: 'portrait',
    templates: [
      {
        id: 'quote-standard',
        name: 'Price Quotation',
        description: 'Professional quote with itemised pricing, validity period and terms.',
        tags: ['quote', 'estimate', 'proposal'],
        html: `<div style="font-family:Arial,sans-serif;max-width:794px;margin:0 auto;padding:40px;color:#1a1a2e;background:#fff;">

  <!-- Header -->
  <table width="100%" style="margin-bottom:28px;border-collapse:collapse;">
    <tr>
      <td>
        <div style="font-size:26px;font-weight:900;color:#0891b2;">{{company_name}}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:3px;">{{company_address}}</div>
        <div style="font-size:11px;color:#6b7280;">{{company_email}} · {{company_phone}}</div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="background:#0891b2;color:#fff;display:inline-block;padding:6px 16px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Quotation</div>
        <div style="font-size:12px;color:#374151;"><strong>Quote #</strong> {{quote_number}}</div>
        <div style="font-size:11px;color:#6b7280;">Date: {{quote_date}}</div>
        <div style="font-size:11px;color:#e11d48;font-weight:600;">Valid Until: {{valid_until}}</div>
      </td>
    </tr>
  </table>

  <!-- Prepared For -->
  <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:8px;padding:16px;margin-bottom:24px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#0e7490;margin-bottom:6px;">Prepared For</div>
    <div style="font-size:14px;font-weight:700;color:#111827;">{{client_name}}</div>
    <div style="font-size:12px;color:#374151;">{{client_company}}</div>
    <div style="font-size:12px;color:#6b7280;">{{client_email}} · {{client_phone}}</div>
  </div>

  <!-- Items Table -->
  <table width="100%" style="border-collapse:collapse;margin-bottom:20px;font-size:13px;">
    <thead>
      <tr style="background:#0891b2;color:#fff;">
        <th style="padding:10px 12px;text-align:left;border-radius:6px 0 0 0;">#</th>
        <th style="padding:10px 12px;text-align:left;">Description</th>
        <th style="padding:10px 12px;text-align:center;width:70px;">Qty</th>
        <th style="padding:10px 12px;text-align:right;width:100px;">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;width:110px;border-radius:0 6px 0 0;">Total</th>
      </tr>
    </thead>
    <tbody>
      <!-- {{#each quote_items}} -->
      <tr style="border-bottom:1px solid #f0f9ff;">
        <td style="padding:10px 12px;color:#9ca3af;">{{@index}}</td>
        <td style="padding:10px 12px;">
          <div style="font-weight:600;color:#111827;">{{this.name}}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">{{this.description}}</div>
        </td>
        <td style="padding:10px 12px;text-align:center;color:#6b7280;">{{this.quantity}}</td>
        <td style="padding:10px 12px;text-align:right;color:#6b7280;">{{formatCurrency this.unit_price "USD"}}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:#0891b2;">{{formatCurrency this.total "USD"}}</td>
      </tr>
      <!-- {{/each}} -->
    </tbody>
  </table>

  <!-- Totals & Notes Side by Side -->
  <table width="100%" style="border-collapse:collapse;margin-bottom:24px;">
    <tr>
      <td style="vertical-align:top;width:55%;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:8px;">Notes &amp; Terms</div>
        <div style="font-size:12px;color:#374151;line-height:1.7;">{{quote_notes}}</div>
      </td>
      <td style="width:5%;"></td>
      <td style="vertical-align:top;width:40%;">
        <table width="100%" style="border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:5px 0;color:#6b7280;">Subtotal</td>
            <td style="padding:5px 0;text-align:right;">{{formatCurrency subtotal "USD"}}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#6b7280;">Discount</td>
            <td style="padding:5px 0;text-align:right;color:#059669;">−{{formatCurrency discount_amount "USD"}}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#6b7280;">Tax</td>
            <td style="padding:5px 0;text-align:right;">{{formatCurrency tax_amount "USD"}}</td>
          </tr>
          <tr style="border-top:2px solid #0891b2;">
            <td style="padding:10px 0;font-weight:700;font-size:15px;">Grand Total</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;font-size:15px;color:#0891b2;">{{formatCurrency total_amount "USD"}}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- CTA -->
  <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:8px;padding:16px;text-align:center;">
    <div style="font-size:13px;color:#0e7490;font-weight:600;margin-bottom:4px;">To accept this quotation, please contact us before {{valid_until}}</div>
    <div style="font-size:12px;color:#6b7280;">{{company_email}} · {{company_phone}}</div>
  </div>
</div>`,
        css: '',
        placeholders: ['company_name','company_address','company_email','company_phone','quote_number','quote_date','valid_until','client_name','client_company','client_email','client_phone','quote_items','subtotal','discount_amount','tax_amount','total_amount','quote_notes'],
      },
    ],
  },

  {
    id: 'report',
    label: 'Report',
    icon: '📊',
    color: '#7c3aed',
    bg: '#f5f3ff',
    description: 'Business reports, summaries, and executive briefings.',
    pageSize: 'A4',
    orientation: 'portrait',
    templates: [
      {
        id: 'report-business',
        name: 'Business Report',
        description: 'Executive summary report with key metrics, findings and recommendations.',
        tags: ['report', 'analysis', 'summary'],
        html: `<div style="font-family:Arial,sans-serif;max-width:794px;margin:0 auto;padding:0;color:#111827;background:#fff;">

  <!-- Cover Header -->
  <div style="background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#8b5cf6 100%);padding:40px;margin-bottom:36px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#c4b5fd;margin-bottom:10px;">{{report_type}}</div>
    <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;color:#fff;line-height:1.2;">{{report_title}}</h1>
    <div style="font-size:12px;color:#c4b5fd;">{{company_name}} &nbsp;·&nbsp; {{formatDate report_date "MMMM D, YYYY"}} &nbsp;·&nbsp; Prepared by {{author_name}}</div>
  </div>

  <div style="padding:0 40px 40px;">

    <!-- Executive Summary -->
    <div style="margin-bottom:28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:4px;height:20px;background:#7c3aed;border-radius:2px;flex-shrink:0;"></div>
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:0.05em;">Executive Summary</h2>
      </div>
      <p style="font-size:13px;color:#374151;line-height:1.8;margin:0;">{{executive_summary}}</p>
    </div>

    <!-- Key Metrics -->
    <div style="margin-bottom:28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:4px;height:20px;background:#7c3aed;border-radius:2px;flex-shrink:0;"></div>
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:0.05em;">Key Metrics</h2>
      </div>
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="width:25%;padding:0 8px 0 0;">
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:#7c3aed;">{{metric_1_value}}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px;">{{metric_1_label}}</div>
            </div>
          </td>
          <td style="width:25%;padding:0 8px;">
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:#7c3aed;">{{metric_2_value}}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px;">{{metric_2_label}}</div>
            </div>
          </td>
          <td style="width:25%;padding:0 8px;">
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:#7c3aed;">{{metric_3_value}}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px;">{{metric_3_label}}</div>
            </div>
          </td>
          <td style="width:25%;padding:0 0 0 8px;">
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:#7c3aed;">{{metric_4_value}}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px;">{{metric_4_label}}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Findings -->
    <div style="margin-bottom:28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:4px;height:20px;background:#7c3aed;border-radius:2px;flex-shrink:0;"></div>
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:0.05em;">Key Findings</h2>
      </div>
      <!-- {{#each findings}} -->
      <div style="display:flex;gap:12px;margin-bottom:10px;padding:12px;background:#fafafa;border-radius:6px;">
        <div style="width:24px;height:24px;background:#7c3aed;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{@index}}</div>
        <div style="font-size:13px;color:#374151;line-height:1.6;padding-top:2px;">{{this.finding}}</div>
      </div>
      <!-- {{/each}} -->
    </div>

    <!-- Recommendations -->
    <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:20px;margin-bottom:28px;">
      <div style="font-size:13px;font-weight:700;color:#4c1d95;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Recommendations</div>
      <p style="font-size:13px;color:#374151;line-height:1.8;margin:0;">{{recommendations}}</p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:11px;color:#9ca3af;">{{company_name}} · {{report_type}} · {{formatDate report_date "MMMM YYYY"}}</div>
      <div style="font-size:11px;color:#9ca3af;">Page {{page_number}} of {{total_pages}}</div>
    </div>
  </div>
</div>`,
        css: '',
        placeholders: ['report_type','report_title','company_name','report_date','author_name','executive_summary','metric_1_value','metric_1_label','metric_2_value','metric_2_label','metric_3_value','metric_3_label','metric_4_value','metric_4_label','findings','recommendations','page_number','total_pages'],
      },
    ],
  },
]
