import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Brand logo ────────────────────────────────────────────────────────── */
function BraiLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="url(#brai-lg)" />
      <path d="M13 20c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="2.5" fill="white" />
      <path d="M20 13v-3M20 30v-3M13 20h-3M30 20h-3"
            stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.1 15.1l-2.1-2.1M24.9 24.9l2.1 2.1M24.9 15.1l2.1-2.1M15.1 24.9l-2.1 2.1"
            stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <defs>
        <linearGradient id="brai-lg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─── Nav dropdown data ─────────────────────────────────────────────────── */
const DROPDOWNS = {
  Features: {
    brand: { title: 'Braify Platform', sub: 'PDF, email & e-signature automation — all in one.' },
    links: [
      { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z', label: 'PDF Builder',     desc: 'Drag-and-drop PDF template designer with starter gallery.' },
      { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email Templates', desc: 'Build and send branded emails with one click.' },
      { icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', label: 'E-Sign',          desc: 'Collect legally binding signatures from any device.' },
      { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',                                                               label: 'API Access',      desc: 'Integrate Braify into any workflow via REST.' },
    ],
  },
  Solutions: {
    brand: { title: 'By Team', sub: 'Workflows tailored to how your team works.' },
    links: [
      { icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', label: 'Marketing Teams', desc: 'Campaign briefs, proposals and branded reports.' },
      { icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Finance Teams',   desc: 'Invoices, statements and client contracts.' },
      { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'HR & Ops',        desc: 'Offer letters, handbooks and onboarding docs.' },
    ],
  },
  Resources: {
    brand: { title: 'Learn Braify', sub: 'Guides, docs and community.' },
    links: [
      { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Documentation',   desc: 'Full API and platform reference.' },
      { icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',                                                                                   label: 'Blog',            desc: 'Tips, releases and best practices.' },
      { icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',                                                          label: 'Community',       desc: 'Join the Braify developer forum.' },
    ],
  },
}

/* ─── Nav dropdown panel ────────────────────────────────────────────────── */
function NavDropdown({ item, open }) {
  const d = DROPDOWNS[item]
  if (!d) return null
  return (
    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[520px]
                     bg-white rounded-2xl shadow-2xl border border-gray-100
                     transition-all duration-200 z-50 overflow-hidden
                     ${open ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
      <div className="flex">
        <div className="w-44 bg-gray-50 p-5 flex flex-col gap-3 shrink-0">
          <BraiLogo size={36} />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-snug">{d.brand.title}</p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{d.brand.sub}</p>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-0.5">
          {d.links.map(l => (
            <button key={l.label}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group flex items-start gap-3">
              {l.icon && (
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-100 transition-colors">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={l.icon}/>
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{l.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

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
        <span className="ml-auto text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
          PENDING SIGNATURE
        </span>
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
        { label: 'Document sent',      done: true },
        { label: 'Link opened by client', done: true },
        { label: 'Awaiting signature', done: false },
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

function CardAudit() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-52 text-xs select-none">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-violet-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <span className="font-bold text-gray-800">Audit Log</span>
      </div>
      {[
        { action: 'FEATURES UPDATED', type: 'Organization', color: 'bg-purple-100 text-purple-700' },
        { action: 'SENT',             type: 'E-Sign',       color: 'bg-teal-100 text-teal-700' },
        { action: 'CREATED',          type: 'PDF Template', color: 'bg-emerald-100 text-emerald-700' },
      ].map(e => (
        <div key={e.action} className="flex items-center gap-2 mb-2 last:mb-0">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${e.color}`}>
            {e.action}
          </span>
          <span className="text-gray-400 text-[10px] truncate">{e.type}</span>
        </div>
      ))}
      <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-2">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-gray-400 text-[10px]">Role-scoped visibility</span>
      </div>
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
    label: 'Feature Access',
    heading: 'Assign the right features to each organisation',
    desc: 'Platform Admins can assign one or more feature modules (PDF Templates, Email Templates, E-Sign) to each organisation during onboarding or at any time afterwards. Users only see what their org is licensed for — sidebar and routes are gated automatically.',
    points: [
      'Per-org feature flags: PDF · Email · E-Sign',
      'Instant toggle — no re-login required for admins',
      'Sidebar & routes auto-hide for unlicensed features',
      'All feature changes logged in the audit trail',
    ],
    color: '#f59e0b',
  },
  {
    label: 'Audit Log',
    heading: 'Complete, role-scoped audit trail for everything',
    desc: 'Every action across templates, emails, e-sign, users and organisation features is logged with before/after details. Visibility is automatically scoped to your role — Platform Admins can filter by any organisation.',
    points: [
      'Covers PDF, Email, E-Sign, Users & Org features',
      'Expandable diff: which features were added/removed',
      'PLATFORM_ADMIN org filter · resource type filter',
      'ADMIN sees ADMIN+USER · USER sees own actions only',
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
    color: '#0891b2',
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

/* ─── Features grid data ─────────────────────────────────────────────────── */
const FEATURE_GRID = [
  {
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z',
    title: 'PDF Templates',
    desc:  'Design once, generate hundreds. Drag-and-drop builder with starter gallery across 7 document categories.',
    color: '#6366f1',
  },
  {
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: 'Email Templates',
    desc:  'Rich HTML editor, Resend integration and placeholder substitution — send polished emails in one click.',
    color: '#8b5cf6',
  },
  {
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    title: 'E-Sign',
    desc:  'Upload or generate PDFs, place signature fields, send a secure link and collect legally binding signatures.',
    color: '#0d9488',
  },
  {
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Feature Access Control',
    desc:  'Assign PDF, Email and E-Sign modules per organisation. Sidebar and routes auto-gate to what each org is licensed for.',
    color: '#f59e0b',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Multi-Org & Roles',
    desc:  'Isolated workspaces per organisation. Four-tier hierarchy: Platform Admin › Org Admin › Admin › User.',
    color: '#0891b2',
  },
  {
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    title: 'Version History',
    desc:  'Every save snapshots the template. Restore any version in one click — for both PDF and email templates.',
    color: '#10b981',
  },
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    title: 'Audit Log',
    desc:  'Role-scoped audit trail covering PDF, Email, E-Sign, Users & Org features — with expandable before/after diffs.',
    color: '#ef4444',
  },
  {
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    title: 'REST API',
    desc:  'JWT-secured endpoints for generating PDFs and sending emails programmatically from any system.',
    color: '#06b6d4',
  },
]

/* ═══ MAIN PAGE ════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled,   setScrolled]   = useState(false)
  const [openMenu,   setOpenMenu]   = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTab,  setActiveTab]  = useState(0)
  const navRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = e => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const toggleMenu = label => setOpenMenu(p => (p === label ? null : label))

  return (
    <div className="min-h-screen bg-[#f5f4f0] font-sans overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <header
        ref={navRef}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 bg-white
                    ${scrolled ? 'shadow-sm' : 'shadow-none'}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <BraiLogo size={28} />
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">Braify</span>
          </button>

          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {Object.keys(DROPDOWNS).map(item => (
              <div key={item} className="relative">
                <button
                  onClick={() => toggleMenu(item)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                              ${openMenu === item ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  {item}
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === item ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <NavDropdown item={item} open={openMenu === item} />
              </div>
            ))}
            {['Enterprise', 'Pricing'].map(item => (
              <button key={item}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Contact Sales
            </button>
            <button onClick={() => navigate('/login')}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/get-started')}
              className="px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </div>

          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden ml-auto p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1">
            {[...Object.keys(DROPDOWNS), 'Enterprise', 'Pricing'].map(item => (
              <button key={item}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {item}
              </button>
            ))}
            <div className="pt-3 flex gap-2">
              <button onClick={() => navigate('/login')}
                className="flex-1 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/get-started')}
                className="flex-1 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="pt-14 bg-[#f5f4f0]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full
                          px-4 py-1.5 text-xs font-semibold text-gray-600 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
            New: E-Sign &amp; per-org feature access now live
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
            Design PDF templates, build branded emails, collect e-signatures and track every
            action in one platform — with feature access tailored per organisation.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <button onClick={() => navigate('/get-started')}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl
                         hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
              Get Started Free
            </button>
            <button
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl
                         border border-gray-300 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
              See how it works
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            No credit card required &nbsp;·&nbsp; Free plan available
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
            <CardAudit />
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

          {/* Tab strip */}
          <div className="flex justify-center border-b border-gray-200 mb-12 overflow-x-auto gap-0">
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all
                            ${activeTab === i
                              ? 'border-gray-900 text-gray-900'
                              : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {TABS.map((tab, i) => (
            <div key={tab.label}
              className={`transition-opacity duration-300 ${activeTab === i ? 'block' : 'hidden'}`}>
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

                {/* Visual mockup */}
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
              {
                title: 'PDF, Email & E-Sign — one platform',
                desc:  'Stop switching between tools. Create your document, send it for signature, fire the confirmation email — all in one place.',
              },
              {
                title: 'Feature access per organisation',
                desc:  'Assign exactly the modules each client needs. Users only ever see what their organisation is licensed for, keeping the UI clean.',
              },
              {
                title: 'Full audit trail, role-scoped',
                desc:  'Every create, update, send and sign is logged with before/after details. Visibility scales automatically to each user\'s role.',
              },
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
            Eight capabilities, one platform — from first draft to signed delivery.
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
              {
                role: 'Org Admin',
                badge: 'bg-violet-100 text-violet-700',
                ring: 'border-violet-200',
                icon: '🏢',
                perms: [
                  'Manage users in their org',
                  'Access all org templates',
                  'View full org audit log',
                  'All licensed feature access',
                ],
              },
              {
                role: 'Admin',
                badge: 'bg-sky-100 text-sky-700',
                ring: 'border-sky-200',
                icon: '⚙️',
                perms: [
                  'Manage Admin & User members',
                  'Create / edit / delete templates',
                  'View Admin + User audit log',
                  'All licensed feature access',
                ],
              },
              {
                role: 'User',
                badge: 'bg-gray-100 text-gray-600',
                ring: 'border-gray-200',
                icon: '👤',
                perms: [
                  'Create & edit own templates',
                  'Cannot delete templates',
                  'View own audit activity only',
                  'Licensed features only',
                ],
              },
            ].map(r => (
              <div key={r.role}
                className={`rounded-2xl p-5 border-2 ${r.ring} bg-white hover:shadow-md transition-all`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{r.icon}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.badge}`}>
                    {r.role}
                  </span>
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

      {/* ══ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <BraiLogo size={48} />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            The all-in-one platform for PDF, email &amp; e-sign automation
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Start with our free plan — no credit card required.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/get-started')}
              className="px-7 py-3 bg-indigo-600 text-white font-semibold rounded-xl
                         hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
              Get started free
            </button>
            <button
              className="px-7 py-3 bg-white/10 text-white font-semibold rounded-xl
                         border border-white/20 hover:bg-white/20 transition-all">
              View demo
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
                Document automation for modern teams — create, send, sign.
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
              { heading: 'Product',   links: ['PDF Builder', 'Email Templates', 'E-Sign', 'Version History', 'Audit Log', 'Feature Access', 'API Access'] },
              { heading: 'Solutions', links: ['Marketing', 'Finance', 'HR & Ops', 'Enterprise', 'Agencies'] },
              { heading: 'Resources', links: ['Documentation', 'Blog', 'Community', 'Changelog', 'Status'] },
              { heading: 'Company',   links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Use', 'Contact'] },
            ].map(col => (
              <div key={col.heading}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  {col.heading}
                </p>
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
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Braify. All rights reserved.
            </p>
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
