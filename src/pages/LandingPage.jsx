import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PublicNavbar, { BraiLogo } from '../components/layout/PublicNavbar'

/* ─── Hero floating mock cards ──────────────────────────────────────────── */
function CardPDF() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-52 text-xs select-none">
      <p className="font-bold text-gray-800 mb-1">PDF Template Gallery</p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-[10px]">7 starter categories</span>
        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-bold">New</span>
      </div>
      {[['Invoice', '#6366f1', 92], ['Certificate', '#b45309', 68], ['Legal Contract', '#1e40af', 55]].map(([label, color, pct]) => (
        <div key={label} className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
            <span>{label}</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CardESign() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-72 text-xs select-none">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </div>
        <span className="font-bold text-gray-800">E-Sign Workflow</span>
        <span className="ml-auto text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">PENDING SIGNATURE</span>
      </div>
      <div className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
        <div className="h-2 bg-gray-200 rounded w-3/4 mb-1.5" />
        <div className="h-2 bg-gray-200 rounded w-full mb-1.5" />
        <div className="h-2 bg-gray-200 rounded w-5/6 mb-3" />
        <div className="border-t border-dashed border-gray-300 pt-2 flex items-end justify-between">
          <div>
            <p className="text-[9px] text-gray-400">Client Signature</p>
            <div className="mt-1 h-5 w-24 border-b border-gray-400" />
          </div>
          <div className="text-[9px] text-gray-400">{new Date().toLocaleDateString()}</div>
        </div>
      </div>
      {[
        { label: 'Document sent',         done: true  },
        { label: 'Link opened by client', done: true  },
        { label: 'Awaiting signature',    done: false },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-2 mb-1.5">
          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0
            ${item.done ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
            {item.done && (
              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
              </svg>
            )}
          </div>
          <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function CardAnalytics() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-52 text-xs select-none">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <span className="font-bold text-gray-800">E-Sign Funnel</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
      </div>
      {[['Sent', '#6366f1', 100], ['Viewed', '#0ea5e9', 82], ['Signed', '#10b981', 64]].map(([label, color, w]) => (
        <div key={label} className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
            <span>{label}</span><span>{w}%</span>
          </div>
          <div className="h-5 bg-gray-100 rounded-lg overflow-hidden">
            <div className="h-full rounded-lg flex items-center px-2" style={{ width: `${w}%`, background: color }}>
              <span className="text-white text-[9px] font-bold">{w}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Feature tabs ──────────────────────────────────────────────────────── */
const TABS = [
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
    color: '#6366f1',
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
    color: '#8b5cf6',
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
    color: '#6366f1',
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
const FEATURE_GRID = [
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z', title: 'PDF Templates',        desc: 'Drag-and-drop builder, 7 starter categories, live preview and Handlebars placeholders.', color: '#6366f1' },
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Email Templates',      desc: 'Rich HTML editor, Resend integration, placeholder fill and automatic version snapshots.', color: '#8b5cf6' },
  { icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', title: 'E-Sign',                desc: 'Upload or generate PDFs, place signature fields, send a secure link and track completion.', color: '#0d9488' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Analytics & Reporting', desc: 'Custom date range, E-Sign funnel, template usage rankings, scheduled email reports and chart exports.', color: '#f59e0b' },
  { icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', title: 'File Storage',          desc: 'Org-scoped cloud file management. Upload, organise and link files to templates and documents.', color: '#0891b2' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', title: 'Feature Access Control', desc: 'Assign PDF, Email, E-Sign and File Storage per org. Sidebar and routes auto-gate to licensed modules.', color: '#f43f5e' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Multi-Org & Roles',      desc: 'Isolated workspaces per organisation. Four-tier hierarchy: Platform Admin › Org Admin › Admin › User.', color: '#7c3aed' },
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Audit Log',            desc: 'Role-scoped trail covering PDF, Email, E-Sign, Files, Users & Org features — expandable before/after diffs.', color: '#ef4444' },
  { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: 'Version History',       desc: 'Every save snapshots the template. Restore any version in one click for both PDF and email templates.', color: '#10b981' },
  { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', title: 'REST API',              desc: 'JWT-secured endpoints for generating PDFs and sending emails programmatically from any system.', color: '#06b6d4' },
  { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', title: 'API Keys',              desc: 'Generate and manage org-scoped API keys with usage logs, key prefix display and one-click revoke.', color: '#f97316' },
  { icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', title: 'Template Sharing',     desc: 'Share templates across organisations for collaboration. Controlled visibility with org-level permissions.', color: '#6366f1' },
]

/* ─── Pricing plans ─────────────────────────────────────────────────────── */
const PLANS = [
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
    badgeColor: 'bg-indigo-100 text-indigo-700',
    price: '$29',
    period: '/month',
    highlight: true,
    desc: 'Full analytics, unlimited E-Sign and advanced reporting for growing teams.',
    cta: 'Start for free',
    ctaStyle: 'bg-indigo-600 text-white hover:bg-indigo-700',
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
    badgeColor: 'bg-violet-100 text-violet-700',
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

/* ═══ MAIN PAGE ════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const pricingRef     = useRef(null)

  const [activeTab, setActiveTab] = useState(0)
  const [annual,    setAnnual]    = useState(false)

  const scrollTo = ref => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Scroll to pricing when redirected from feature pages via /?pricing=1
  useEffect(() => {
    if (searchParams.get('pricing') === '1') {
      const t = setTimeout(() => scrollTo(pricingRef), 100)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#f5f4f0] font-sans overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <PublicNavbar onPricingClick={() => scrollTo(pricingRef)} />

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="pt-14 bg-[#f5f4f0]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full
                          px-4 py-1.5 text-xs font-semibold text-gray-600 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
            New: Analytics dashboard, scheduled reports &amp; file storage now live
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight max-w-4xl mx-auto">
            Create, send &amp; sign —
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#0d9488)' }}>
              document automation
            </span>
            {' '}done right
          </h1>

          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Design PDF templates, build branded emails, collect e-signatures, analyse your
            workflow and track every action in one platform — with feature access tailored per organisation.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <button onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl
                         hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
              Get Started Free
            </button>
            <button onClick={() => scrollTo(pricingRef)}
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl
                         border border-gray-300 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
              View pricing
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            No credit card required &nbsp;·&nbsp; Free plan available &nbsp;·&nbsp; Pro free during beta
          </p>
        </div>

        {/* Floating product cards */}
        <div className="relative mt-14 flex justify-center items-end gap-4 px-6">
          <div className="transform translate-y-4 hidden sm:block">
            <CardPDF />
          </div>
          <div className="transform -translate-y-2 z-10 drop-shadow-2xl">
            <CardESign />
          </div>
          <div className="transform translate-y-4 hidden sm:block">
            <CardAnalytics />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-20
                          bg-gradient-to-t from-[#f5f4f0] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ══ SOCIAL PROOF ════════════════════════════════════════════════════ */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-72 shrink-0">
            <p className="text-xl font-bold text-gray-900 leading-snug">
              Trusted by teams who need
              <br />documents done fast
            </p>
            <a href="#" className="mt-3 text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
              See how customers use Braify
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {['ACME CORP', 'GLOBEX INC', 'INITECH', 'UMBRELLA', 'MASSIVE DYN'].map(name => (
              <div key={name}
                className="h-8 px-5 bg-gray-100 rounded-lg flex items-center
                           text-gray-400 text-[10px] font-black tracking-widest uppercase">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE TABS ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
            EVERYTHING YOUR TEAM NEEDS
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">
            See how teams use Braify
          </h2>

          <div className="flex justify-center border-b border-gray-200 mb-12 overflow-x-auto gap-0">
            {TABS.map((tab, i) => (
              <button key={tab.label} onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all
                            ${activeTab === i
                              ? 'border-gray-900 text-gray-900'
                              : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {TABS.map((tab, i) => (
            <div key={tab.label} className={`transition-opacity duration-300 ${activeTab === i ? 'block' : 'hidden'}`}>
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{tab.heading}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">{tab.desc}</p>
                  <ul className="space-y-3">
                    {tab.points.map(p => (
                      <li key={p} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: tab.color }}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/get-started')}
                    className="mt-8 flex items-center gap-1.5 text-sm font-semibold text-gray-900 group hover:gap-2.5 transition-all">
                    Get started free
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                <div className="md:w-1/2 flex justify-center">
                  <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm border border-gray-100 shadow-lg">
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="w-3 h-3 rounded-full bg-green-400" />
                      <div className="flex-1 h-5 bg-gray-200 rounded-md ml-2" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="h-8 rounded-xl mt-4 overflow-hidden" style={{ background: tab.color + '22' }}>
                        <div className="h-full rounded-xl" style={{ width: '70%', background: tab.color + '55' }} />
                      </div>
                      {[1, 0.75, 0.9].map((w, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg shrink-0" style={{ background: tab.color + '33' }} />
                          <div className="h-3 bg-gray-100 rounded" style={{ width: `${w * 100}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ WHY BRAIFY ═══════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg,#1a6b45 0%,#0e4530 100%)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">
            Why companies choose Braify
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { title: 'PDF, Email, E-Sign & Analytics — one platform', desc: 'Stop switching between tools. Create your document, send it for signature, fire the confirmation email, then track conversion rates — all in one place.' },
              { title: 'Feature access per organisation', desc: 'Assign exactly the modules each client needs. Users only ever see what their organisation is licensed for, keeping the UI clean and focused.' },
              { title: 'Full audit trail, role-scoped', desc: 'Every create, update, send and sign is logged with before/after details. Visibility scales automatically to each user\'s role.' },
            ].map(item => (
              <div key={item.title}
                className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-green-400/20 border border-green-400/30
                                flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-1.5">{item.title}</p>
                  <p className="text-green-100/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg active:scale-95">
              Start for free →
            </button>
          </div>
        </div>
      </section>

      {/* ══ FEATURES GRID ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4f0]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
            ACROSS EVERY TEAM AND WORKFLOW
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
            Everything you need to automate documents
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto mb-14">
            Twelve capabilities, one platform — from first draft to analytics dashboard.
          </p>
          <div className="grid md:grid-cols-4 gap-5">
            {FEATURE_GRID.map(f => (
              <div key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
                           hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-default">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: f.color + '18' }}>
                  <svg className="w-5 h-5" style={{ color: f.color }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon}/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                <button onClick={() => navigate('/get-started')}
                  className="mt-4 text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: f.color }}>
                  Get started
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROLE HIERARCHY ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
            ROLE-BASED ACCESS CONTROL
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
            The right access for every seat
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
            Three tiers of access — from organisation administrators to individual contributors.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { role: 'Org Admin', badge: 'bg-violet-100 text-violet-700', ring: 'border-violet-200',
                path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                perms: ['Manage users in their org', 'Access all org templates', 'View full org audit log', 'All licensed feature access'] },
              { role: 'Admin', badge: 'bg-sky-100 text-sky-700', ring: 'border-sky-200',
                path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
                perms: ['Manage Admin & User members', 'Create / edit / delete templates', 'View Admin + User audit log', 'All licensed feature access'] },
              { role: 'User', badge: 'bg-gray-100 text-gray-600', ring: 'border-gray-200',
                path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                perms: ['Create & edit own templates', 'Cannot delete templates', 'View own audit activity only', 'Licensed features only'] },
            ].map(r => (
              <div key={r.role} className={`rounded-2xl p-5 border-2 ${r.ring} bg-white hover:shadow-md transition-all`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 text-gray-500 shrink-0">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={r.path}/>
                    </svg>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.badge}`}>{r.role}</span>
                </div>
                <ul className="space-y-2">
                  {r.perms.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════════════════════ */}
      <section ref={pricingRef} className="py-24 bg-[#f5f4f0]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
            SIMPLE, TRANSPARENT PRICING
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
            Start free. Scale when you need to.
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-4">
            All plans include core document automation. Pro is free during our beta period.
          </p>

          {/* Annual / monthly toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-semibold ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button onClick={() => setAnnual(a => !a)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${annual ? 'bg-indigo-600' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${annual ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col border-2 transition-all
                  ${plan.highlight
                    ? 'border-indigo-500 bg-white shadow-2xl shadow-indigo-500/10'
                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md'}`}>

                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-extrabold text-gray-900">{plan.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  </div>

                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price === 'Custom' ? 'Custom' :
                        plan.price === '$0' ? '$0' :
                        annual ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}` :
                        plan.price}
                    </span>
                    {plan.price !== 'Custom' && plan.price !== '$0' && (
                      <span className="text-gray-400 text-sm mb-1">{annual ? '/mo, billed annually' : plan.period}</span>
                    )}
                    {plan.price === '$0' && (
                      <span className="text-gray-400 text-sm mb-1">forever</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{plan.desc}</p>
                </div>

                {/* CTA */}
                <button onClick={() => navigate(plan.name === 'Enterprise' ? '#' : '/get-started')}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-6 ${plan.ctaStyle}`}>
                  {plan.cta}
                </button>

                {/* Features list */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${f.included
                          ? plan.highlight ? 'bg-indigo-600' : 'bg-gray-900'
                          : 'bg-gray-100'}`}>
                        {f.included ? (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                        ) : (
                          <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${f.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Billing note */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-gray-500">
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'No credit card required for Starter' },
              { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', text: 'Cancel or change plan anytime' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'Secure billing via Stripe' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon}/>
                </svg>
                {item.text}
              </div>
            ))}
          </div>

          {/* FAQ-style billing info */}
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { q: 'What counts as a document?', a: 'Any E-Sign document you create and send counts toward your monthly limit. Drafts that are never sent do not count.' },
              { q: 'Can I upgrade or downgrade?', a: 'Yes — upgrades take effect immediately; downgrades take effect at the start of your next billing cycle. Your data is never deleted.' },
              { q: 'Is there a free trial for Pro?', a: 'Pro is completely free during our beta. After the beta period ends you will be given 30 days notice before any charges begin.' },
            ].map(item => (
              <div key={item.q} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-sm font-bold text-gray-900 mb-2">{item.q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <BraiLogo size={48} />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            The all-in-one platform for PDF, email,<br/>e-sign &amp; analytics
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Start with our free plan — no credit card required. Pro is free during beta.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/get-started')}
              className="px-7 py-3 bg-indigo-600 text-white font-semibold rounded-xl
                         hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
              Get started free
            </button>
            <button onClick={() => scrollTo(pricingRef)}
              className="px-7 py-3 bg-white/10 text-white font-semibold rounded-xl
                         border border-white/20 hover:bg-white/20 transition-all">
              View pricing
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 border-t border-white/5 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <BraiLogo size={26} />
                <span className="font-extrabold text-white text-base">Braify</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                Document automation for modern teams — create, send, sign and analyse.
              </p>
              <div className="flex gap-2">
                {[
                  'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
                  'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z',
                ].map((d, i) => (
                  <button key={i}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d}/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {[
              { heading: 'Product',   links: ['PDF Builder', 'Email Templates', 'E-Sign', 'Analytics', 'File Storage', 'API Keys', 'Version History', 'Audit Log', 'REST API'] },
              { heading: 'Solutions', links: ['Marketing', 'Finance', 'HR & Ops', 'Enterprise', 'Agencies'] },
              { heading: 'Resources', links: ['Documentation', 'Blog', 'Community', 'Changelog', 'Status'] },
              { heading: 'Company',   links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Use', 'Contact'] },
            ].map(col => (
              <div key={col.heading}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{col.heading}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Braify. All rights reserved.</p>
            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Cookies'].map(l => (
                <a key={l} href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
