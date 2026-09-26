import { Link } from 'react-router-dom'
import BrandLogo from '../ui/BrandLogo'
import { CHANNELS, ChannelTile, GradientText, Reveal, GlowButton, GlassButton, Icon, StatusDot, Aurora } from './primitives'
import { FOOTER_COLS, FEATURE_SLUGS, SOCIALS, LEGAL_LINKS, LEGAL_BAR } from './content'

/* ═══ Closing CTA ════════════════════════════════════════════════════════ */
const FLOATERS = [
  { id: 'pdf',   pos: 'left-[9%] top-[22%]',    cls: 'lp-float' },
  { id: 'email', pos: 'right-[8%] top-[18%]',   cls: 'lp-float-slow' },
  { id: 'sign',  pos: 'left-[14%] bottom-[18%]', cls: 'lp-float-slow' },
  { id: 'stats', pos: 'right-[13%] bottom-[22%]', cls: 'lp-float' },
]

export function FinalCta({ onStart, onPricing }) {
  return (
    <section aria-labelledby="cta-title" className="py-20 md:py-24">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal className="relative overflow-clip rounded-[32px] border border-white bg-gradient-to-br from-[#EFEAFF] via-[#EAF2FF] to-[#E4F7F1]
                           shadow-[0_40px_100px_rgba(76,60,160,0.16)]">
          <Aurora />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[780px] h-[780px] rounded-full border border-dashed border-[#C9BDF7] lp-spin-slow" />
          </div>
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-white" />
          {FLOATERS.map(f => (
            <div key={f.id} aria-hidden="true" className={`hidden sm:block absolute ${f.pos} ${f.cls}`}>
              <div className="flex items-center gap-2 rounded-2xl bg-white/85 border border-white backdrop-blur pl-1.5 pr-3 py-1.5
                              shadow-[0_14px_30px_rgba(76,60,160,0.14)]">
                <ChannelTile id={f.id} size="sm" />
                <span className="text-[12px] font-semibold text-[#16143A]">{CHANNELS[f.id].label}</span>
              </div>
            </div>
          ))}

          <div className="relative px-6 py-20 md:py-28 text-center">
            <div className="flex justify-center mb-6">
              <span className="relative">
                <span aria-hidden="true" className="lp-ring absolute -inset-4 rounded-full border border-[#C9BDF7]" />
                <BrandLogo size={52} />
              </span>
            </div>
            <p className="lp-mono text-[11px] tracking-[0.2em] uppercase text-teal-700 mb-5">Your documents, automated</p>
            <h2 id="cta-title" className="text-balance text-[34px] leading-[1.05] sm:text-[48px] md:text-[60px] font-bold tracking-tightest text-[#16143A]">
              The all-in-one platform for<br />
              <GradientText>PDF, email, e-sign &amp; analytics.</GradientText>
            </h2>
            <p className="mt-6 text-[17px] text-[#55527A] max-w-xl mx-auto">
              Start with our free plan — no credit card required. Pro is free during beta.
            </p>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <GlowButton onClick={onStart}>Get started free</GlowButton>
              <GlassButton onClick={onPricing}>View pricing</GlassButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ═══ Footer ═════════════════════════════════════════════════════════════ */
const POPULAR = [
  { label: 'Online e-signature',        to: '/features/esign' },
  { label: 'PDF template builder',      to: '/features/pdf-builder' },
  { label: 'Email template designer',   to: '/features/email-templates' },
  { label: 'Document builder',          to: '/features/pdf-builder' },
  { label: 'Document generation API',   to: '/features/rest-api' },
  { label: 'E-sign analytics',          to: '/features/analytics' },
  { label: 'Secure document storage',   to: '/features/file-storage' },
]

export function Footer() {
  return (
    <footer className="relative overflow-clip border-t border-black/[0.06]">
      <div aria-hidden="true" className="lp-drift pointer-events-none absolute -bottom-40 -left-32 w-[620px] h-[520px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,0.16), transparent)' }} />
      <div aria-hidden="true" className="lp-drift pointer-events-none absolute -top-40 right-0 w-[560px] h-[460px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(109,82,232,0.12), transparent)', animationDelay: '-9s' }} />

      <div className="relative max-w-[1180px] mx-auto px-4 sm:px-6 pt-16">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_repeat(4,1fr)] gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2" aria-label="Braify home">
              <BrandLogo size={28} />
              <span className="font-bold text-[20px] tracking-tight text-[#16143A]">Braify<span className="text-teal-500">.</span></span>
            </Link>
            <p className="mt-4 text-[14px] text-[#625F80] leading-relaxed max-w-[16rem]">
              Document automation for modern teams — create, send, sign and analyse.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map(s => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white border border-black/[0.07] hover:border-black/20 flex items-center justify-center transition-colors">
                  <Icon d={s.d} className="w-4 h-4" color="#5A5775" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map(col => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-[13px] font-semibold text-[#16143A] mb-4">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.links.map(l => {
                  const slug = col.heading === 'Product' && FEATURE_SLUGS[l]
                  const to = slug ? `/features/${slug}` : LEGAL_LINKS[l]
                  return (
                    <li key={l}>
                      {to ? (
                        <Link to={to} className="text-[14px] text-[#625F80] hover:text-[#16143A] transition-colors">{l}</Link>
                      ) : (
                        <a href="#" className="text-[14px] text-[#625F80] hover:text-[#16143A] transition-colors">{l}</a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
          ))}
        </div>

        {/* Popular searches — descriptive internal links for crawlers and people */}
        <nav aria-label="Popular" className="mt-12 flex flex-wrap items-center gap-2">
          <span className="lp-mono text-[10.5px] tracking-[0.16em] uppercase text-[#8B88A6] mr-1">Popular</span>
          {POPULAR.map(p => (
            <Link key={p.label} to={p.to}
              className="text-[12.5px] text-[#5A5775] bg-white/70 border border-black/[0.07] rounded-full px-3 py-1 hover:text-[#16143A] hover:border-black/20 transition-colors">
              {p.label}
            </Link>
          ))}
        </nav>

        {/* Wordmark watermark */}
        <p aria-hidden="true"
          className="mt-10 -mb-6 md:-mb-12 select-none text-right font-bold tracking-tightest leading-none text-[#16143A]/[0.05]
                     text-[120px] sm:text-[180px] md:text-[240px]">
          braify<span className="text-teal-500/80">.</span>
        </p>

        <div className="relative border-t border-black/[0.07] py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="lp-mono text-[11px] tracking-[0.12em] uppercase text-[#8B88A6]">
            © {new Date().getFullYear()} Braify. All rights reserved.
          </p>
          <div className="flex gap-5">
            {LEGAL_BAR.map(([l, to]) => (
              to
                ? <Link key={l} to={to} className="text-[13px] text-[#5A5775] hover:text-[#16143A] transition-colors">{l}</Link>
                : <a key={l} href="#" className="text-[13px] text-[#5A5775] hover:text-[#16143A] transition-colors">{l}</a>
            ))}
          </div>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#16143A]">
            <StatusDot color="#14b8a6" pulse={false} /> Every document tracked. Every signature verified.
          </p>
        </div>
      </div>
    </footer>
  )
}
