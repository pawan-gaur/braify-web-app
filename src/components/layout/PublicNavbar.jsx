import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../ui/BrandLogo'

/* ─── Brand logo ──────────────────────────────────────────────────────────
 * Thin alias kept for existing imports; the mark lives in the single-source
 * BrandLogo component so every logo across the app stays identical. */
export function BraiLogo({ size = 28 }) {
  return <BrandLogo size={size} />
}

/* ─── Nav dropdown data ─────────────────────────────────────────────────── */
export const DROPDOWNS = {
  Features: {
    brand: { title: 'Braify Platform', sub: 'PDF, email, e-sign & analytics — all in one.' },
    links: [
      { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z', label: 'PDF Builder',     desc: 'Drag-and-drop PDF template designer with starter gallery.',       slug: 'pdf-builder' },
      { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email Templates', desc: 'Build and send branded emails with one click.',                  slug: 'email-templates' },
      { icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', label: 'E-Sign',          desc: 'Collect legally binding signatures from any device.',            slug: 'esign' },
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics',       desc: 'Dashboards, funnels, scheduled reports and export.',            slug: 'analytics' },
      { icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', label: 'File Storage',    desc: 'Secure cloud file management per organisation.',                 slug: 'file-storage' },
      { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', label: 'REST API',        desc: 'Integrate Braify into any workflow via JWT-secured endpoints.',  slug: 'rest-api' },
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
      { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Documentation', desc: 'Full API and platform reference.' },
      { icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', label: 'Blog',          desc: 'Tips, releases and best practices.' },
      { icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Community',    desc: 'Join the Braify developer forum.' },
    ],
  },
}

/* ─── Dropdown panel ────────────────────────────────────────────────────── */
function NavDropdown({ item, open, onFeatureClick }) {
  const d = DROPDOWNS[item]
  if (!d) return null
  return (
    <div className={`absolute top-full left-0 mt-2 w-[560px] max-w-[calc(100vw-2rem)]
                     bg-white rounded-2xl border border-[#D6F1F4] shadow-[0_24px_60px_rgba(14,116,144,0.16)]
                     transition-all duration-200 z-50 overflow-hidden
                     ${open ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
      <div className="flex">
        <div className="w-44 bg-gradient-to-b from-[#E9FBFC] to-[#F5FDFE] border-r border-[#E2F6F8] p-5 flex flex-col gap-3 shrink-0">
          <BraiLogo size={36} />
          <div>
            <p className="font-bold text-[#0C2530] text-sm leading-snug">{d.brand.title}</p>
            <p className="mt-1 text-xs text-[#587079] leading-relaxed">{d.brand.sub}</p>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-0.5">
          {d.links.map(l => (
            <button key={l.label}
              onClick={() => l.slug && onFeatureClick(l.slug)}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#F0FBFC] transition-colors group flex items-start gap-3">
              {l.icon && (
                <div className="w-7 h-7 rounded-lg bg-[#E2F8FA] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#CDF3F7] transition-colors">
                  <svg className="w-3.5 h-3.5 text-[#0B8E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={l.icon}/>
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#0C2530] group-hover:text-[#0B8E9E] transition-colors">{l.label}</p>
                  {l.slug && (
                    <svg className="w-3 h-3 text-[#AFC1C6] group-hover:text-[#22BCCB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  )}
                </div>
                <p className="text-xs text-[#7F979F] mt-0.5">{l.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══ PUBLIC NAVBAR ════════════════════════════════════════════════════════
   Props:
     tone            — 'dark' renders the bar as dark glass (used over the landing page's dark hero)
     onPricingClick  — called when user clicks "Pricing". If omitted, navigates to /#pricing via query param.
     activeFeature   — slug of the current feature page (highlights nothing on landing page)
*/
export default function PublicNavbar({ onPricingClick, activeFeature, tone = 'light' }) {
  const navigate    = useNavigate()
  const [scrolled,    setScrolled]   = useState(false)
  const [openMenu,    setOpenMenu]   = useState(null)
  const [mobileOpen,  setMobileOpen] = useState(false)
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

  const handlePricing = () => {
    setMobileOpen(false)
    setOpenMenu(null)
    if (onPricingClick) {
      onPricingClick()
    } else {
      navigate('/?pricing=1')
    }
  }

  const handleFeatureClick = slug => {
    setOpenMenu(null)
    navigate(`/features/${slug}`)
  }

  return (
    <header ref={navRef}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-[#F5FDFE]/80 backdrop-blur-xl border-b
                  ${scrolled ? 'shadow-[0_8px_30px_rgba(14,116,144,0.08)] border-[#D6F1F4]' : 'shadow-none border-transparent'}
                  ${tone === 'dark' ? 'lp-nav-dark' : ''}`}>
      {/* thin brand hairline once the page scrolls */}
      <span aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-px transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: 'linear-gradient(90deg,transparent,#2F5BF0 30%,#22C4D2 70%,transparent)' }} />
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <BraiLogo size={28} />
          <span className="font-extrabold text-[#0C2530] text-lg tracking-tight">Braify</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {Object.keys(DROPDOWNS).map(item => (
            <div key={item} className="relative">
              <button onClick={() => toggleMenu(item)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                            ${openMenu === item ? 'text-[#0B6E7A] bg-[#E2F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C4D2]/60' : 'text-[#4A6670] hover:text-[#0C2530] hover:bg-[#E2F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C4D2]/60'}`}>
                {item}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === item ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <NavDropdown item={item} open={openMenu === item} onFeatureClick={handleFeatureClick} />
            </div>
          ))}
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4A6670] hover:text-[#0C2530] hover:bg-[#E2F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C4D2]/60 transition-colors">
            Enterprise
          </button>
          <button onClick={handlePricing}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4A6670] hover:text-[#0C2530] hover:bg-[#E2F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C4D2]/60 transition-colors">
            Pricing
          </button>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
          <div className="w-px h-4 bg-[#CBE8EC] mx-1" />
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4A6670] hover:text-[#0C2530] hover:bg-[#E2F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C4D2]/60 transition-colors">
            Contact Sales
          </button>
          <button onClick={() => navigate('/login')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4A6670] hover:text-[#0C2530] hover:bg-[#E2F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C4D2]/60 transition-colors">
            Sign In
          </button>
          <button onClick={() => navigate('/get-started')}
            className="ml-1 px-4 py-1.5 text-white text-sm font-semibold rounded-lg shadow-[0_8px_20px_rgba(21,151,208,0.35)]
                       hover:shadow-[0_10px_26px_rgba(21,151,208,0.45)] hover:-translate-y-px transition-all"
            style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0 0%,#1597D0 55%,#22C4D2 100%)' }}>
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(v => !v)}
          className="md:hidden ml-auto p-2 rounded-lg text-[#4A6670] hover:bg-[#E2F8FA] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-[#D6F1F4] px-6 py-4 space-y-1">
          {[...Object.keys(DROPDOWNS), 'Enterprise', 'Pricing'].map(item => (
            <button key={item}
              onClick={() => {
                if (item === 'Pricing') handlePricing()
                else setOpenMenu(p => p === item ? null : item)
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#33505A] hover:bg-[#F0FBFC] transition-colors">
              {item}
            </button>
          ))}
          {/* Mobile feature links (shown when Features is tapped) */}
          {openMenu === 'Features' && (
            <div className="pl-4 space-y-1 border-l-2 border-[#B3EAF0] ml-3">
              {DROPDOWNS.Features.links.map(l => (
                <button key={l.label}
                  onClick={() => { setMobileOpen(false); setOpenMenu(null); navigate(`/features/${l.slug}`) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#4A6670] hover:text-[#0B8E9E] hover:bg-[#F0FBFC] transition-colors">
                  {l.label}
                </button>
              ))}
            </div>
          )}
          <div className="pt-3 flex gap-2">
            <button onClick={() => navigate('/login')}
              className="flex-1 py-2 text-sm font-semibold text-[#33505A] border border-[#B3EAF0] rounded-lg hover:bg-[#F0FBFC] transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/get-started')}
              className="flex-1 py-2 text-sm font-semibold text-white rounded-lg shadow-[0_8px_20px_rgba(21,151,208,0.30)]"
              style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0 0%,#1597D0 55%,#22C4D2 100%)' }}>
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
