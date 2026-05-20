import { useParams, useNavigate } from 'react-router-dom'
import PublicNavbar, { BraiLogo } from '../components/layout/PublicNavbar'

/* ─── Feature content map ───────────────────────────────────────────────── */
const FEATURES = {
  'pdf-builder': {
    label: 'PDF Builder',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z',
    tagline: 'Design stunning PDFs without writing a single line of code',
    desc: 'Our visual drag-and-drop PDF template editor gives any team the power to build professional documents — from invoices and legal contracts to certificates and sales proposals. Choose from our starter gallery or design from scratch.',
    badge: 'PDF Templates',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    steps: [
      { step: '01', title: 'Create or pick a template', body: 'Browse the 7-category starter gallery (Invoice, Receipt, Legal, Certificate, Business Letter, Quotation, Report) or start from a blank canvas.' },
      { step: '02', title: 'Design with drag-and-drop', body: 'Add text blocks, images, tables, dividers and signature areas. Use Handlebars-style placeholders ({{customer_name}}, {{invoice_total}}) for dynamic data.' },
      { step: '03', title: 'Preview & generate', body: 'Live-preview any template with real data before generating. Then generate PDFs on-demand from the UI or via the REST API with a JSON payload.' },
      { step: '04', title: 'Version & audit', body: 'Every save creates an automatic version snapshot. Restore any past version in one click. All changes are logged in the role-scoped audit trail.' },
    ],
    capabilities: [
      'Drag-and-drop block editor with inline search',
      '7 pre-built starter categories',
      'Handlebars placeholder variables (dynamic fill)',
      'Live preview with sample data before generating',
      'Zoom controls & full-screen editor mode',
      'Export template as HTML',
      'Automatic version history — restore any snapshot',
      'REST API endpoint: POST /api/pdf/generate with JSON payload',
      'Org-scoped templates — each organisation sees only its own',
      'Role-gated: User creates, Admin manages, Org Admin has full control',
    ],
    orgSetup: [
      { title: 'Enable feature', body: 'A Platform Admin assigns the PDF_TEMPLATES feature to the organisation from the Org detail page. The sidebar link and routes appear immediately — no re-login required.' },
      { title: 'Invite your team', body: 'Org Admins invite users by email. New users receive a magic-link invite and land directly in the template editor once they accept.' },
      { title: 'Create your first template', body: 'Click "PDF Templates" in the sidebar → "New Template". Design, fill in a placeholder preview, and save. Your first version snapshot is created automatically.' },
      { title: 'Generate via UI or API', body: 'Use "Generate PDF" in the sidebar to fill placeholders and download, or call POST /api/pdf/generate from your backend with an API key and JSON data.' },
    ],
    apiSnippet: `POST /api/pdf/generate
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "templateId": "abc123",
  "data": {
    "customer_name": "Acme Corp",
    "invoice_total": "$4,200.00",
    "due_date": "2026-06-01"
  }
}`,
  },

  'email-templates': {
    label: 'Email Templates',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    tagline: 'Build, brand and send emails — all from one visual editor',
    desc: 'Design rich HTML email templates with GrapesJS, fill in placeholder data, and send instantly via the Resend integration. Every delivery is logged in the audit trail. Version history means you never lose a working design.',
    badge: 'Email Templates',
    badgeColor: 'bg-purple-100 text-purple-700',
    steps: [
      { step: '01', title: 'Build your template', body: 'Open the GrapesJS visual email editor. Add columns, text, images, buttons and dividers. Use {{placeholder}} syntax for dynamic fields like recipient name or custom values.' },
      { step: '02', title: 'Fill & preview', body: 'Before sending, open the Preview Data modal to substitute placeholder values with real data and see exactly how the email will look.' },
      { step: '03', title: 'Send via Resend', body: 'Click "Send Email", enter the recipient address, and Braify dispatches the email through the Resend API. The sent record is appended to the template\'s audit trail immediately.' },
      { step: '04', title: 'Restore any version', body: 'Every save creates a snapshot. Open Version History, browse snapshots by date, and restore with one click. The restore is itself logged in the audit trail.' },
    ],
    capabilities: [
      'GrapesJS drag-and-drop rich HTML editor',
      'Column layout, text, images, buttons, dividers',
      'Handlebars placeholder syntax for personalisation',
      'Live preview data substitution before sending',
      'One-click send via Resend email API',
      'Automatic version snapshots on every save',
      'One-click restore to any previous snapshot',
      'Full sent-email audit trail per template',
      'Org-scoped — each organisation manages its own templates',
      'Email Library modal: browse & import past templates',
    ],
    orgSetup: [
      { title: 'Enable feature', body: 'A Platform Admin assigns EMAIL_TEMPLATES to the organisation. Email Templates and New Email appear in the sidebar instantly.' },
      { title: 'Configure Resend', body: 'The Platform Admin adds the org\'s Resend API key in Organisation Settings. All outbound emails for that org route through their own Resend account.' },
      { title: 'Design your first template', body: 'Click "Email Templates" → "New Email". Use the GrapesJS canvas — drag in a header block, add your brand colours, and drop in {{recipient_name}} where you want personalisation.' },
      { title: 'Send & track', body: 'Click "Send Email", enter the recipient, and watch the audit trail entry appear in real time. Every send — including placeholder data used — is stored for compliance.' },
    ],
    apiSnippet: `POST /api/email/send
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "templateId": "xyz789",
  "to": "client@acmecorp.com",
  "data": {
    "recipient_name": "Jane Smith",
    "meeting_date": "2026-06-10"
  }
}`,
  },

  'esign': {
    label: 'E-Sign',
    color: '#0d9488',
    gradient: 'linear-gradient(135deg,#0d9488,#065f46)',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    tagline: 'Collect legally binding signatures from any device',
    desc: 'Create e-sign documents from any PDF — upload a file or generate from a Braify template. Drag signature and text fields into position, send a secure time-limited signing link to your client, and download the completed signed PDF once it\'s done.',
    badge: 'E-Sign',
    badgeColor: 'bg-teal-100 text-teal-700',
    steps: [
      { step: '01', title: 'Create a document', body: 'Upload any existing PDF or choose a Braify PDF template. Give the document a name and select the signer.' },
      { step: '02', title: 'Place signature fields', body: 'Use the visual field editor to drag signature boxes, date fields and text input areas onto the exact position on each page.' },
      { step: '03', title: 'Send a secure link', body: 'Click "Send for Signature". Braify generates a JWT-secured signing URL with a configurable expiry. The signer receives the link by email and can sign from any device.' },
      { step: '04', title: 'Track & download', body: 'The document moves through states: DRAFT → PENDING → COMPLETED (or EXPIRED / CANCELLED). Each transition is timestamped in the audit trail. Download the signed PDF when complete.' },
    ],
    capabilities: [
      'Upload any PDF or generate from a PDF template',
      'Visual drag-and-drop signature & text field placement',
      'Secure JWT-signed signing URL with configurable expiry',
      'Signer can sign from desktop or mobile — no account required',
      'Document status lifecycle: DRAFT → PENDING → COMPLETED',
      'Full audit trail: Sent, Link Opened, Signed, Completed',
      'Download the completed signed PDF at any time',
      'E-Sign funnel analytics: Sent → Viewed → Signed rates',
      'Org-scoped — each organisation manages its own documents',
      'Feature-gated: Platform Admin enables per organisation',
    ],
    orgSetup: [
      { title: 'Enable E-Sign', body: 'Platform Admin assigns the E_SIGN feature to the organisation. "Documents" and "New Document" appear in the sidebar E-Sign section immediately.' },
      { title: 'Create your first document', body: 'Click "New Document". Choose "Upload PDF" or "From Template". Name it and save the draft.' },
      { title: 'Place fields & send', body: 'The document opens in the field editor. Drag signature and text boxes onto the pages. When ready, click "Send for Signature" — the signer receives their secure link by email.' },
      { title: 'Monitor & complete', body: 'Return to "Documents" to see real-time status. Once signed, the document moves to COMPLETED and the signed PDF is available for download.' },
    ],
    apiSnippet: `GET /api/esign/documents
Authorization: Bearer <api-key>

# Response includes:
# id, name, status, signerEmail,
# createdAt, sentAt, signedAt, expiresAt

GET /api/esign/documents/{id}/download
Authorization: Bearer <api-key>
# Returns: signed PDF binary`,
  },

  'analytics': {
    label: 'Analytics',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg,#f59e0b,#b45309)',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    tagline: 'Full visibility into how your organisation uses Braify',
    desc: 'The Analytics dashboard gives every role a tailored view of their document activity. Custom date ranges, E-Sign conversion funnels, template usage rankings, per-user activity breakdowns, scheduled email reports and exportable charts — all role-scoped automatically.',
    badge: 'Analytics & Reporting',
    badgeColor: 'bg-amber-100 text-amber-700',
    steps: [
      { step: '01', title: 'Open the dashboard', body: 'Navigate to the Dashboard and click the "Analytics" tab. The date range defaults to last 30 days — adjust with the 7d / 30d / 90d quick-select or pick a custom date range.' },
      { step: '02', title: 'Explore the E-Sign funnel', body: 'The E-Sign tab shows Sent → Viewed → Signed conversion rates as a visual funnel, so you can spot where signers are dropping off.' },
      { step: '03', title: 'Review template usage', body: 'The Analytics tab ranks your templates by usage — most used, least used, and zero-usage templates. Quickly identify stale templates and popular ones.' },
      { step: '04', title: 'Schedule & export', body: 'Set up weekly or monthly PDF summary reports by email in the Scheduled Reports panel. Export any chart as a PNG file or print to PDF with one click.' },
    ],
    capabilities: [
      'Overview: PDFs generated, emails sent, e-sign docs, active users',
      'Custom date range: 7d / 30d / 90d / custom picker',
      'E-Sign funnel: Sent → Viewed → Signed with drop-off %',
      'Template usage analytics: most used, least used, zero-use',
      'Per-user activity breakdown (Org Admin: by user; Platform Admin: by org)',
      'Scheduled email reports: weekly or monthly PDF summary',
      'Export charts as PNG or print dashboard to PDF',
      'Real-time activity feed with 30-second polling',
      'Role-scoped data: Org Admin sees own org, Platform Admin sees all',
      'Team tab: view activity breakdown per team member',
    ],
    orgSetup: [
      { title: 'Access the Dashboard', body: 'Every authenticated user lands on the Dashboard at /dashboard. The Analytics tab is always available — no extra feature flag required.' },
      { title: 'Set your date range', body: 'Click "Analytics" → use the Quick-select (7d / 30d / 90d) or open the Custom Date Range picker. All charts and counts update instantly.' },
      { title: 'Configure scheduled reports', body: 'In the Scheduled Reports panel, choose weekly or monthly cadence and enter the recipient email(s). Reports are saved to your browser and will run on the schedule.' },
      { title: 'Export charts', body: 'Hover over any chart and click the "Export PNG" button to save the chart image, or use your browser\'s Print (Ctrl+P) to produce a PDF of the full dashboard.' },
    ],
    apiSnippet: `GET /api/dashboard/stats?from=2026-05-01&to=2026-05-31
Authorization: Bearer <api-key>

# Response:
{
  "pdfGenerated": 142,
  "emailsSent": 87,
  "esignSent": 34,
  "esignCompleted": 21,
  "activeUsers": 12,
  "topTemplates": [...]
}`,
  },

  'file-storage': {
    label: 'File Storage',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg,#0891b2,#0e4570)',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    tagline: 'Secure, org-scoped cloud file management built into Braify',
    desc: 'Upload, organise and manage files directly inside Braify — scoped to each organisation. Store supporting documents, brand assets, raw PDFs and images alongside your templates. All file access is logged in the audit trail.',
    badge: 'File Storage',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    steps: [
      { step: '01', title: 'Enable for your org', body: 'A Platform Admin assigns the FILE_STORAGE feature to the organisation. "My Files" appears in the sidebar File Storage section immediately.' },
      { step: '02', title: 'Upload your files', body: 'Click "My Files" and drag-and-drop or browse to select files. Files are stored securely and scoped to your organisation — no other org can access them.' },
      { step: '03', title: 'Organise & manage', body: 'View all uploaded files in a sortable list. Rename, delete or download files at any time. Each operation creates an audit log entry.' },
      { step: '04', title: 'Link to templates & documents', body: 'Reference stored files in PDF templates (as images or attachments) or attach supporting documents to E-Sign workflows.' },
    ],
    capabilities: [
      'Org-scoped file isolation — strict multi-tenant boundaries',
      'Drag-and-drop upload with progress indicator',
      'Download and delete files from the UI',
      'Sort by name, size or upload date',
      'All file operations logged in the role-scoped audit trail',
      'Role-based access: User uploads their own, Admin manages all',
      'Link files to PDF templates as embedded images or assets',
      'Attach files to E-Sign documents as supporting evidence',
      'REST API endpoint for programmatic file uploads',
      'Feature-gated: Platform Admin enables per organisation',
    ],
    orgSetup: [
      { title: 'Enable File Storage', body: 'Platform Admin opens the Org detail page → Feature Access → toggle FILE_STORAGE on. The sidebar "File Storage" section and /files route appear for all org members.' },
      { title: 'Upload your first file', body: 'Click "My Files" in the sidebar. Drag a file onto the drop zone or click "Upload File". The file is immediately available to all org members based on their role.' },
      { title: 'Manage access', body: 'Admins and Org Admins see all files in the organisation. Users see files relevant to their own work. All deletions are audited.' },
      { title: 'Use via REST API', body: 'Use the file upload endpoint from your backend to store programmatically generated PDFs or supporting documents alongside Braify templates.' },
    ],
    apiSnippet: `POST /api/files/upload
Authorization: Bearer <api-key>
Content-Type: multipart/form-data

form-data:
  file: <binary>
  fileName: "contract-v2.pdf"

# Response:
{
  "fileId": "f_abc123",
  "fileName": "contract-v2.pdf",
  "size": 248192,
  "uploadedAt": "2026-05-20T10:32:00Z"
}`,
  },

  'rest-api': {
    label: 'REST API',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg,#06b6d4,#0e7490)',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    tagline: 'Integrate Braify into any workflow via JWT-secured REST endpoints',
    desc: 'Every Braify capability is available via a clean REST API — generate PDFs, send emails, create E-Sign documents, upload files and retrieve analytics. Authenticate with an org-scoped API key and integrate in minutes.',
    badge: 'REST API',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    steps: [
      { step: '01', title: 'Generate an API key', body: 'Org Admins and Admins can create API keys from Settings → API Keys. Each key is org-scoped — it can only access data within that organisation.' },
      { step: '02', title: 'Authenticate requests', body: 'Pass your API key in the Authorization header as a Bearer token: Authorization: Bearer <key>. All endpoints validate JWT/API key before processing.' },
      { step: '03', title: 'Call any endpoint', body: 'Generate a PDF, send an email, create an E-Sign document, upload a file or query analytics — all via standard JSON REST calls. Swagger docs are available at /api-docs.' },
      { step: '04', title: 'Monitor usage', body: 'Every API call is logged with timestamp, endpoint, user/key, and response status. View usage in Settings → API Keys → Usage log. Platform Admins see usage across all orgs.' },
    ],
    capabilities: [
      'POST /api/pdf/generate — fill template + download PDF',
      'POST /api/email/send — send a template email via Resend',
      'POST /api/esign/documents — create an E-Sign document',
      'GET /api/esign/documents/{id}/download — get signed PDF',
      'POST /api/files/upload — upload file to org storage',
      'GET /api/dashboard/stats — pull analytics data',
      'GET /api/templates — list all PDF templates for the org',
      'GET /api/email-templates — list all email templates',
      'JWT-secured — org-scoped API keys with prefix display',
      'Full Swagger / OpenAPI documentation at /api-docs',
    ],
    orgSetup: [
      { title: 'Create your first API key', body: 'Go to Settings → API Keys → "New API Key". Give it a name (e.g. "Production Backend"). Copy the full key immediately — it is shown only once.' },
      { title: 'Store the key securely', body: 'Store the API key as an environment variable on your server — never commit it to source control. Braify only stores the hashed value; the plaintext key cannot be retrieved after creation.' },
      { title: 'Read the API docs', body: 'Open /api-docs in the Braify sidebar for the full Swagger UI. Every endpoint shows the request schema, required fields and example responses. Try requests directly from the browser.' },
      { title: 'Monitor & revoke', body: 'View per-key usage logs in Settings → API Keys. If a key is compromised, click "Revoke" — it is invalidated instantly. Create a new key without downtime.' },
    ],
    apiSnippet: `# Generate a PDF from a template
curl -X POST https://your-braify.com/api/pdf/generate \\
  -H "Authorization: Bearer brf_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "abc123",
    "data": { "client": "Acme", "amount": "$9,500" }
  }' \\
  --output invoice.pdf`,
  },
}

/* ─── Icon helper ───────────────────────────────────────────────────────── */
function Icon({ d, className = 'w-5 h-5', style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

/* ─── Other feature nav pills ────────────────────────────────────────────── */
const FEATURE_NAV = [
  { slug: 'pdf-builder',     label: 'PDF Builder' },
  { slug: 'email-templates', label: 'Email Templates' },
  { slug: 'esign',           label: 'E-Sign' },
  { slug: 'analytics',       label: 'Analytics' },
  { slug: 'file-storage',    label: 'File Storage' },
  { slug: 'rest-api',        label: 'REST API' },
]

/* ═══ MAIN PAGE ════════════════════════════════════════════════════════════ */
export default function FeatureDetailPage() {
  const { slug } = useParams()
  const navigate  = useNavigate()

  const f = FEATURES[slug]

  if (!f) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-extrabold text-gray-200 mb-4">404</p>
          <p className="text-gray-600 mb-6">Feature not found.</p>
          <button onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors">
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] font-sans overflow-x-hidden">

      {/* ── Navbar (same as landing page) ───────────────────────────────── */}
      <PublicNavbar />

      <div className="pt-14">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="py-20 px-6" style={{ background: f.gradient }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full
                            px-4 py-1.5 text-xs font-bold text-white mb-6 backdrop-blur-sm">
              <Icon d={f.icon} className="w-4 h-4 text-white" />
              {f.badge}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              {f.tagline}
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              {f.desc}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => navigate('/get-started')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl
                           hover:bg-gray-50 transition-all shadow-lg active:scale-95 text-sm">
                Get Started Free
              </button>
              <button onClick={() => navigate('/login')}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl
                           border border-white/20 hover:bg-white/20 transition-all text-sm">
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: f.color }}>HOW IT WORKS</p>
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
              From setup to live in four steps
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {f.steps.map(s => (
                <div key={s.step}
                  className="flex gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="text-3xl font-extrabold shrink-0 leading-none"
                    style={{ color: f.color + '40' }}>
                    {s.step}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1.5 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Capabilities ──────────────────────────────────────────────── */}
        <section className="py-20 bg-[#f5f4f0]">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: f.color }}>CAPABILITIES</p>
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
              Everything {f.label} includes
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {f.capabilities.map(c => (
                <div key={c} className="flex items-start gap-3 bg-white rounded-xl px-5 py-4
                                        border border-gray-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: f.color }}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 font-medium leading-snug">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Organisation setup guide ───────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: f.color }}>ORGANISATION IMPLEMENTATION</p>
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
              Getting your organisation set up
            </h2>
            <p className="text-gray-500 text-center max-w-xl mx-auto mb-12 text-sm">
              A step-by-step implementation guide for Platform Admins, Org Admins and their teams.
            </p>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-gray-100 hidden md:block" />
              <div className="space-y-6">
                {f.orgSetup.map((item, idx) => (
                  <div key={item.title} className="flex gap-5 relative">
                    <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center
                                    text-sm font-extrabold shrink-0 bg-white z-10"
                      style={{ borderColor: f.color, color: f.color }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <p className="font-bold text-gray-900 mb-1.5 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── API / code snippet ─────────────────────────────────────────── */}
        <section className="py-20" style={{ background: 'linear-gradient(135deg,#1e1b4b,#0f172a)' }}>
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: f.color }}>REST API</p>
            <h2 className="text-3xl font-extrabold text-white text-center mb-3">
              Integrate in minutes
            </h2>
            <p className="text-gray-400 text-center max-w-xl mx-auto mb-10 text-sm">
              Every {f.label} action is available via the Braify REST API. Authenticate once, call anywhere.
            </p>
            <div className="bg-gray-900/80 rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-gray-500 font-mono">API example</span>
              </div>
              <pre className="px-6 py-5 text-[13px] text-green-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
{f.apiSnippet}
              </pre>
            </div>
            <p className="text-center mt-6 text-sm text-gray-500">
              Full Swagger documentation available at{' '}
              <span className="text-indigo-400 font-mono">/api-docs</span>
              {' '}after sign-in.
            </p>
          </div>
        </section>

        {/* ── Other features ─────────────────────────────────────────────── */}
        <section className="py-16 bg-[#f5f4f0]">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-extrabold text-gray-900 text-center mb-8">
              Explore other Braify features
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FEATURE_NAV.filter(n => n.slug !== slug).map(n => {
                const feat = FEATURES[n.slug]
                return (
                  <button key={n.slug} onClick={() => navigate(`/features/${n.slug}`)}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm
                               hover:shadow-md hover:-translate-y-0.5 transition-all text-left group">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: feat.color + '20' }}>
                      <Icon d={feat.icon} className="w-4 h-4" style={{ color: feat.color }} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {n.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="flex justify-center mb-6">
              <BraiLogo size={44} />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Ready to use {f.label}?
            </h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              Start on the free plan — no credit card required. Pro is free during our beta.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => navigate('/get-started')}
                className="px-6 py-3 text-white font-semibold rounded-xl
                           hover:opacity-90 transition-all shadow-lg active:scale-95 text-sm"
                style={{ background: f.gradient }}>
                Get started free
              </button>
              <button onClick={() => navigate('/')}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl
                           border border-white/20 hover:bg-white/20 transition-all text-sm">
                Back to home
              </button>
            </div>
          </div>
        </section>

        {/* ── Minimal footer ────────────────────────────────────────────── */}
        <footer className="bg-gray-900 border-t border-white/5 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BraiLogo size={20} />
              <span className="text-sm font-bold text-white">Braify</span>
            </div>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Braify. All rights reserved.</p>
            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Contact'].map(l => (
                <button key={l} onClick={() => navigate('/')}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{l}</button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
