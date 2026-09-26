/* ─── Landing page content ────────────────────────────────────────────────
 * Every item from the previous landing page lives here, unchanged, so the
 * redesign keeps the same product coverage. Sections only handle layout. */
/* ─── Feature tabs ──────────────────────────────────────────────────────── */
export const TABS = [
  {
    label: 'PDF Builder',
    heading: 'Design stunning PDF documents visually',
    desc: 'Our drag-and-drop builder lets any team create professional PDF templates without writing a single line of code. Choose from 7 starter categories — Invoice, Receipt, Legal, Certificate, Business Letter, Quotation, Report — or start from scratch.',
    points: [
      'Drag-and-drop template editor with block search',
      'Starter gallery with 7 pre-built categories',
      'Zoom controls, export HTML, live preview',
      'Reusable Handlebars-style placeholder variables',
    ],
    color: '#2F5BF0',
  },
  {
    label: 'Email Templates',
    heading: 'Build and send branded emails in minutes',
    desc: 'Create rich email templates with an intuitive visual editor. Send instantly via Resend with placeholder substitution, and track every delivery in the built-in audit log. Every save creates an automatic version snapshot.',
    points: [
      'Rich HTML email designer (GrapesJS)',
      'One-click send via Resend with live placeholder fill',
      'Automatic version history — restore any snapshot',
      'Full SENT audit trail per template',
    ],
    color: '#6D52E8',
  },
  {
    label: 'E-Sign',
    heading: 'Collect legally binding signatures digitally',
    desc: 'Create signature documents from any PDF template or file upload. Add signature & text fields, send a secure signing link to your client, and download the completed PDF — all without leaving Braify.',
    points: [
      'Upload PDFs or generate from templates',
      'Drag-and-drop signature & text field placement',
      'Secure signed link with configurable expiry',
      'Full audit trail: opened, signed, completed',
    ],
    color: '#0d9488',
  },
  {
    label: 'Analytics',
    heading: 'Full reporting & analytics dashboard',
    desc: 'Get deep visibility into how your team uses Braify. Custom date ranges, E-Sign conversion funnels, template usage rankings, per-user activity breakdowns, scheduled email reports and exportable PNG/PDF charts — all in one Analytics tab.',
    points: [
      'Custom date range (7d / 30d / 90d / custom)',
      'E-Sign funnel: Sent → Viewed → Signed drop-off',
      'Template usage analytics (most & least used)',
      'Per-user / per-org activity breakdown',
      'Scheduled weekly/monthly PDF reports by email',
      'Export charts as PNG or print to PDF',
      'Real-time activity feed with 30-second live polling',
    ],
    color: '#f59e0b',
  },
  {
    label: 'File Storage',
    heading: 'Secure cloud file management per organisation',
    desc: 'Upload, organise and manage files scoped to your organisation. Store supporting documents, images, assets and raw PDFs alongside your templates — all accessible via the platform and REST API.',
    points: [
      'Org-scoped file storage with role-based access',
      'Upload & manage files directly from the UI',
      'Link files to templates and E-Sign documents',
      'Full file access logged in the audit trail',
    ],
    color: '#0891b2',
  },
  {
    label: 'Feature Access',
    heading: 'Assign the right features to each organisation',
    desc: 'Platform Admins can assign one or more feature modules (PDF Templates, Email Templates, E-Sign, File Storage) to each organisation during onboarding or at any time afterwards. Users only see what their org is licensed for.',
    points: [
      'Per-org feature flags: PDF · Email · E-Sign · Files',
      'Instant toggle — no re-login required for admins',
      'Sidebar & routes auto-hide for unlicensed features',
      'All feature changes logged in the audit trail',
    ],
    color: '#ef4444',
  },
  {
    label: 'Multi-Org',
    heading: 'Manage multiple organisations from one platform',
    desc: 'Platform admins can spin up isolated organisations, each with their own users, templates, e-sign documents and assigned feature set — perfect for agencies and SaaS platforms serving multiple clients.',
    points: [
      'Isolated organisation workspaces',
      'Granular four-tier role hierarchy',
      'Per-org feature entitlements',
      'Platform-level admin console',
    ],
    color: '#06b6d4',
  },
  {
    label: 'Audit Log',
    heading: 'Complete, role-scoped audit trail for everything',
    desc: 'Every action across templates, emails, e-sign, users and organisation features is logged with before/after details. Visibility is automatically scoped to your role.',
    points: [
      'Covers PDF, Email, E-Sign, Files, Users & Org features',
      'Expandable diff: which features were added/removed',
      'PLATFORM_ADMIN org filter · resource type filter',
      'ADMIN sees ADMIN+USER · USER sees own actions only',
    ],
    color: '#2F5BF0',
  },
  {
    label: 'Version History',
    heading: 'Never lose a template change again',
    desc: 'Every save on a PDF or email template creates an automatic version snapshot. Restore any past version in one click — a RESTORED audit entry is written so there is always a complete chain of custody.',
    points: [
      'Automatic snapshots on every save',
      'One-click restore to any past version',
      'Restore action is itself audited',
      'Works for both PDF and email templates',
    ],
    color: '#10b981',
  },
]

/* ─── Features grid ──────────────────────────────────────────────────────── */
export const FEATURE_GRID = [
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z', title: 'PDF Templates',        desc: 'Drag-and-drop builder, 7 starter categories, live preview and Handlebars placeholders.', color: '#2F5BF0' },
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Email Templates',      desc: 'Rich HTML editor, Resend integration, placeholder fill and automatic version snapshots.', color: '#6D52E8' },
  { icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', title: 'E-Sign',                desc: 'Upload or generate PDFs, place signature fields, send a secure link and track completion.', color: '#0d9488' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Analytics & Reporting', desc: 'Custom date range, E-Sign funnel, template usage rankings, scheduled email reports and chart exports.', color: '#f59e0b' },
  { icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', title: 'File Storage',          desc: 'Org-scoped cloud file management. Upload, organise and link files to templates and documents.', color: '#0891b2' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', title: 'Feature Access Control', desc: 'Assign PDF, Email, E-Sign and File Storage per org. Sidebar and routes auto-gate to licensed modules.', color: '#f43f5e' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Multi-Org & Roles',      desc: 'Isolated workspaces per organisation. Four-tier hierarchy: Platform Admin › Org Admin › Admin › User.', color: '#6D52E8' },
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Audit Log',            desc: 'Role-scoped trail covering PDF, Email, E-Sign, Files, Users & Org features — expandable before/after diffs.', color: '#ef4444' },
  { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: 'Version History',       desc: 'Every save snapshots the template. Restore any version in one click for both PDF and email templates.', color: '#10b981' },
  { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', title: 'REST API',              desc: 'JWT-secured endpoints for generating PDFs and sending emails programmatically from any system.', color: '#06b6d4' },
  { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', title: 'API Keys',              desc: 'Generate and manage org-scoped API keys with usage logs, key prefix display and one-click revoke.', color: '#f97316' },
  { icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', title: 'Template Sharing',     desc: 'Share templates across organisations for collaboration. Controlled visibility with org-level permissions.', color: '#2F5BF0' },
]

/* ─── Pricing plans ─────────────────────────────────────────────────────── */
export const PLANS = [
  {
    name: 'Starter',
    badge: 'Free',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    price: '$0',
    period: 'forever',
    highlight: false,
    desc: 'Everything you need to get started with document automation.',
    cta: 'Get started free',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    features: [
      { text: 'PDF template builder', included: true },
      { text: 'Email template builder', included: true },
      { text: 'E-Sign — up to 10 docs/month', included: true },
      { text: 'File storage (1 GB)', included: true },
      { text: 'Version history (last 10 snapshots)', included: true },
      { text: 'Audit log (30-day retention)', included: true },
      { text: 'REST API access', included: true },
      { text: '3 team members', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Advanced analytics & funnels', included: false },
      { text: 'Scheduled email reports', included: false },
      { text: 'Custom date range analytics', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    badge: 'Free during beta',
    badgeColor: 'bg-brand-100 text-brand-700',
    price: '$29',
    period: '/month',
    highlight: true,
    desc: 'Full analytics, unlimited E-Sign and advanced reporting for growing teams.',
    cta: 'Start for free',
    ctaStyle: 'bg-brand text-white hover:bg-brand-hover',
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'Unlimited E-Sign documents', included: true },
      { text: 'File storage (25 GB)', included: true },
      { text: 'Unlimited version history', included: true },
      { text: 'Audit log (1-year retention)', included: true },
      { text: 'Advanced analytics & funnels', included: true },
      { text: 'Scheduled email reports (weekly/monthly)', included: true },
      { text: 'Custom date range analytics', included: true },
      { text: 'Exportable charts (PNG/PDF)', included: true },
      { text: 'Up to 25 team members', included: true },
      { text: 'API key management & usage logs', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    badge: 'Custom',
    badgeColor: 'bg-accent-100 text-accent-700',
    price: 'Custom',
    period: 'pricing',
    highlight: false,
    desc: 'Multi-org management, dedicated support and custom SLAs for large organisations.',
    cta: 'Contact sales',
    ctaStyle: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Multi-org platform admin console', included: true },
      { text: 'Per-org feature access control', included: true },
      { text: 'Unlimited file storage', included: true },
      { text: 'Audit log (unlimited retention)', included: true },
      { text: 'Template sharing across orgs', included: true },
      { text: 'Real-time activity feed / WebSocket', included: true },
      { text: 'Custom onboarding & migration', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SLA-backed uptime guarantee', included: true },
      { text: 'SSO / SAML integration', included: true },
    ],
  },
]

/* Feature-page slug (crawlable internal link) + diagram channel per tab/card. */
export const FEATURE_SLUGS = {
  'PDF Builder': 'pdf-builder',
  'PDF Templates': 'pdf-builder',
  'Email Templates': 'email-templates',
  'E-Sign': 'esign',
  'Analytics': 'analytics',
  'Analytics & Reporting': 'analytics',
  'File Storage': 'file-storage',
  'REST API': 'rest-api',
  'API Keys': 'rest-api',
}

/* ─── Hero announcement + microcopy ─────────────────────────────────────── */
export const ANNOUNCEMENT = 'New: Analytics dashboard, scheduled reports & file storage now live'
export const HERO_NOTES = ['No credit card required', 'Free plan available', 'Pro free during beta']

/* ─── Social proof ──────────────────────────────────────────────────────── */
export const LOGOS = ['ACME CORP', 'GLOBEX INC', 'INITECH', 'UMBRELLA', 'MASSIVE DYN']

/* ─── Why Braify ────────────────────────────────────────────────────────── */
export const WHY = [
  { title: 'PDF, Email, E-Sign & Analytics — one platform', desc: 'Stop switching between tools. Create your document, send it for signature, fire the confirmation email, then track conversion rates — all in one place.' },
  { title: 'Feature access per organisation', desc: 'Assign exactly the modules each client needs. Users only ever see what their organisation is licensed for, keeping the UI clean and focused.' },
  { title: 'Full audit trail, role-scoped', desc: 'Every create, update, send and sign is logged with before/after details. Visibility scales automatically to each user\'s role.' },
]

/* ─── Roles ─────────────────────────────────────────────────────────────── */
export const ROLES = [
  { role: 'Org Admin', tag: 'ORG', color: '#6D52E8', bg: '#F3F0FF',
    path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    summary: 'Runs the organisation — people, templates and the complete audit history.',
    perms: ['Manage users in their org', 'Access all org templates', 'View full org audit log', 'All licensed feature access'] },
  { role: 'Admin', tag: 'ADM', color: '#0284c7', bg: '#E6F4FB',
    path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    summary: 'Manages the team day to day and owns the template library.',
    perms: ['Manage Admin & User members', 'Create / edit / delete templates', 'View Admin + User audit log', 'All licensed feature access'] },
  { role: 'User', tag: 'USR', color: '#55595f', bg: '#F1F0EC',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    summary: 'Creates and sends documents — scoped to their own work.',
    perms: ['Create & edit own templates', 'Cannot delete templates', 'View own audit activity only', 'Licensed features only'] },
]

/* ─── Pricing notes + FAQ ───────────────────────────────────────────────── */
export const BILLING_NOTES = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'No credit card required for Starter' },
  { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', text: 'Cancel or change plan anytime' },
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'Secure billing via Stripe' },
]

export const FAQ = [
  { q: 'What counts as a document?', a: 'Any E-Sign document you create and send counts toward your monthly limit. Drafts that are never sent do not count.' },
  { q: 'Can I upgrade or downgrade?', a: 'Yes — upgrades take effect immediately; downgrades take effect at the start of your next billing cycle. Your data is never deleted.' },
  { q: 'Is there a free trial for Pro?', a: 'Pro is completely free during our beta. After the beta period ends you will be given 30 days notice before any charges begin.' },
]

/* ─── Footer ────────────────────────────────────────────────────────────── */
export const FOOTER_COLS = [
  { heading: 'Product',   links: ['PDF Builder', 'Email Templates', 'E-Sign', 'Analytics', 'File Storage', 'API Keys', 'Version History', 'Audit Log', 'REST API'] },
  { heading: 'Solutions', links: ['Marketing', 'Finance', 'HR & Ops', 'Enterprise', 'Agencies'] },
  { heading: 'Resources', links: ['Documentation', 'Blog', 'Community', 'Changelog', 'Status'] },
  { heading: 'Company',   links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Use', 'Contact'] },
]

export const SOCIALS = [
  { label: 'Twitter',  d: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
  { label: 'LinkedIn', d: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' },
]

/* Legal pages this app actually has. Link targets left out render as "#". */
export const LEGAL_LINKS = { 'Privacy Policy': '/privacy', 'Terms of Use': '/terms' }
export const LEGAL_BAR = [['Privacy', '/privacy'], ['Terms', '/terms'], ['Security', '/trust'], ['Cookies', null]]
