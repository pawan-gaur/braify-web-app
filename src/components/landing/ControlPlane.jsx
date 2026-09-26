import { useRef } from 'react'
import BrandLogo from '../ui/BrandLogo'
import { useCycle, useInView, Check, Arrow, StatusDot, Reveal } from './primitives'
import { CLIENTS, LOGOS } from './content'

/* The three product cards from the original hero, now wired into one
 * left-to-right flow: pick a template → send it for signature → watch the funnel. */
const GALLERY = [['Invoice', '#2F5BF0', 92], ['Certificate', '#b45309', 68], ['Legal Contract', '#1e40af', 55]]
const SIGN_STEPS = ['Document sent', 'Link opened by client', 'Awaiting signature']
const FUNNEL = [['Sent', '#2F5BF0', 100], ['Viewed', '#0ea5e9', 82], ['Signed', '#10b981', 64]]
const STATUS = [
  { text: 'Template selected · Invoice', time: '0.2 s' },
  { text: 'Document sent to client',     time: '0.6 s' },
  { text: 'Link opened by client',       time: '1.4 s' },
  { text: 'Signed & archived',           time: '2.4 s' },
]

function ColumnLabel({ n, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="lp-mono text-[10px] text-[#587079] border border-black/10 rounded px-1.5 py-0.5">{n}</span>
      <span className="lp-mono text-[10.5px] tracking-[0.16em] uppercase text-[#587079]">{children}</span>
    </div>
  )
}

function FlowArrow() {
  return (
    <span aria-hidden="true"
      className="hidden md:flex absolute -right-[15px] top-1/2 -translate-y-1/2 z-10 w-[30px] h-[30px] rounded-full
                 bg-[#0C2530] text-[#7fa2ff] items-center justify-center shadow-md">
      <Arrow className="w-3.5 h-3.5" />
    </span>
  )
}

function Bar({ pct, color, show, tall = false, label }) {
  return (
    <div className={`${tall ? 'h-6 rounded-lg' : 'h-1.5 rounded-full'} bg-[#E8F7F9] overflow-clip`}>
      <div className={`h-full ${tall ? 'rounded-lg' : 'rounded-full'} flex items-center px-2 transition-[width] duration-[1400ms] ease-spring`}
        style={{ width: show ? `${pct}%` : '0%', background: color }}>
        {tall && <span className="text-white text-[10px] font-bold">{label}</span>}
      </div>
    </div>
  )
}

export default function ControlPlane() {
  const [step, , ref] = useCycle(STATUS.length, 2200)
  const barsRef = useRef(null)
  const barsIn = useInView(barsRef, { once: true, threshold: 0.3 })
  const signed = step === 3

  return (
    <section aria-label="How a document moves through Braify" className="relative z-10 -mt-24 md:-mt-28">
      <Reveal className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <div ref={ref}
          className="relative rounded-[22px] bg-white border border-black/[0.07] shadow-[0_40px_100px_rgba(14,116,144,0.20)] overflow-clip">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px]"
            style={{ backgroundImage: 'linear-gradient(90deg,#22BCCB,#2F5BF0,#14b8a6,#10b981)' }} />

          {/* Title bar */}
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-black/[0.06] bg-[#F5FCFD]">
            <div className="flex items-center gap-2.5">
              <BrandLogo size={18} />
              <span className="lp-mono text-[11px] tracking-[0.16em] text-[#0C2530]">DOCUMENT WORKSPACE</span>
            </div>
            <span className="hidden sm:block lp-mono text-[11px] tracking-[0.14em] text-brand">
              TEMPLATE <span className="text-brand-300">→</span> SEND <span className="text-brand-300">→</span> SIGN
            </span>
            <span className="flex items-center gap-2 lp-mono text-[10.5px] tracking-[0.12em] text-[#587079]">
              <StatusDot /> <span className="hidden sm:inline">ALL SYSTEMS OPERATIONAL</span><span className="sm:hidden">LIVE</span>
            </span>
          </div>

          <div ref={barsRef} className="grid md:grid-cols-3">
            {/* 01 — PDF Template Gallery */}
            <div className="relative p-5 border-b md:border-b-0 md:border-r border-black/[0.06]">
              <ColumnLabel n="01">Design the template</ColumnLabel>
              <div className="rounded-2xl border border-black/[0.07] p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-[#0C2530]">PDF Template Gallery</h3>
                  <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-[10px] font-bold">New</span>
                </div>
                <p className="text-[11.5px] text-[#7F979F] mb-4">7 starter categories</p>
                <div className="space-y-3.5">
                  {GALLERY.map(([label, color, pct], i) => {
                    const on = i === 0 // the invoice template drives the rest of the flow
                    return (
                      <div key={label} className={`rounded-lg transition-all duration-500 ${on ? 'bg-brand-50/70 -mx-2 px-2 py-1.5' : ''}`}>
                        <div className="flex justify-between text-[11.5px] mb-1">
                          <span className={on ? 'text-[#0C2530] font-semibold' : 'text-[#587079]'}>{label}</span>
                          <span className="text-[#7F979F]">{pct}%</span>
                        </div>
                        <Bar pct={pct} color={color} show={barsIn} />
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-black/[0.07] bg-[#F5FCFD] px-3 py-2">
                <span className="lp-mono text-[11px] text-[#33505A]">invoice.hbs</span>
                <span className="lp-mono text-[10.5px] text-brand">{'{{customer.name}}'}</span>
              </div>
              <FlowArrow />
            </div>

            {/* 02 — E-Sign Workflow */}
            <div className="relative p-5 border-b md:border-b-0 md:border-r border-black/[0.06]">
              <ColumnLabel n="02">Send for signature</ColumnLabel>
              <div className="rounded-2xl border border-black/[0.07] p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-md bg-teal-500 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </span>
                  <h3 className="text-[14px] font-bold text-[#0C2530]">E-Sign Workflow</h3>
                  <span key={signed ? 's' : 'p'}
                    className={`lp-rise ml-auto text-[9.5px] font-bold px-2 py-0.5 rounded-full
                                ${signed ? 'bg-teal-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {signed ? 'SIGNED' : 'PENDING SIGNATURE'}
                  </span>
                </div>
                <div className="border border-black/[0.06] rounded-xl p-3 mb-3 bg-[#F5FCFD]">
                  <div className="h-2 bg-[#D3EFF2] rounded w-3/4 mb-1.5" />
                  <div className="h-2 bg-[#D3EFF2] rounded w-full mb-1.5" />
                  <div className="h-2 bg-[#D3EFF2] rounded w-5/6 mb-3" />
                  <div className="border-t border-dashed border-black/15 pt-2 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-[#7F979F]">Client Signature</p>
                      <div className="relative mt-1 h-6 w-28 border-b border-black/30">
                        <svg viewBox="0 0 112 24" className="absolute inset-0 w-full h-full" fill="none" aria-hidden="true">
                          <path d="M4 18 C 14 2, 20 22, 30 12 S 46 4, 52 14 S 70 20, 78 8 S 96 10, 108 12"
                            stroke="#0d9488" strokeWidth="1.6" strokeLinecap="round"
                            style={{ strokeDasharray: 160, strokeDashoffset: signed ? 0 : 160, transition: 'stroke-dashoffset 1.2s ease' }} />
                        </svg>
                      </div>
                    </div>
                    <span className="lp-mono text-[10px] text-[#7F979F]">SIGN · 7d</span>
                  </div>
                </div>
                {SIGN_STEPS.map((label, i) => {
                  const done = i === 2 ? signed : step > i
                  return (
                    <div key={label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500
                                        ${done ? 'border-teal-500 bg-teal-500 text-white' : 'border-black/20'}`}>
                        {done && <Check className="w-2.5 h-2.5" strokeWidth={3.5} />}
                      </span>
                      <span className={`text-[12px] transition-colors ${done ? 'text-[#7F979F] line-through' : 'text-[#0C2530] font-medium'}`}>
                        {i === 2 && signed ? 'Signed by client' : label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <FlowArrow />
            </div>

            {/* 03 — E-Sign Funnel */}
            <div className="p-5">
              <ColumnLabel n="03">Track every step</ColumnLabel>
              <div className="rounded-2xl border border-black/[0.07] p-4 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-md bg-brand flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  <h3 className="text-[14px] font-bold text-[#0C2530]">E-Sign Funnel</h3>
                  <span className="ml-auto"><StatusDot color="#34d399" /></span>
                </div>
                <div className="space-y-3">
                  {FUNNEL.map(([label, color, w], i) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11.5px] text-[#7F979F] mb-1">
                        <span>{label}</span><span>{w}%</span>
                      </div>
                      <div style={{ transitionDelay: `${i * 180}ms` }}>
                        <Bar pct={w} color={color} show={barsIn} tall label={w} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-black/[0.07] bg-[#F5FCFD] px-3 py-2">
                <span className="lp-mono text-[11px] text-[#33505A]">Audit log</span>
                <span key={step} className="lp-rise lp-mono text-[10.5px] text-teal-700">+1 event</span>
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.06] bg-[#F5FCFD]">
            <span className="flex items-center gap-2.5 min-w-0">
              <StatusDot color={signed ? '#10b981' : '#2F5BF0'} />
              <span key={step} className="lp-rise lp-mono text-[11.5px] text-[#33505A] truncate">{STATUS[step].text}</span>
              <span className="hidden sm:inline lp-mono text-[10.5px] text-[#587079] border border-black/10 rounded px-1.5 py-0.5">doc_8Kx92m</span>
            </span>
            <span className="lp-mono text-[11px] text-[#7F979F] flex items-center gap-2 shrink-0">
              {STATUS[step].time} <Arrow className="w-3.5 h-3.5 text-brand" />
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Social proof strip (marquee) ────────────────────────────────────── */
export function TrustStrip() {
  const PLACEHOLDER_TINTS = ['linear-gradient(135deg,#2F5BF0,#0B8E9E)', 'linear-gradient(135deg,#0d9488,#10b981)',
    'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#0B8E9E,#ec4899)', 'linear-gradient(135deg,#0891b2,#2F5BF0)']
  const items = [...CLIENTS, ...LOGOS.map((name, i) => ({ name, tint: PLACEHOLDER_TINTS[i % PLACEHOLDER_TINTS.length] }))]
  // the list is rendered twice so the marquee can loop seamlessly; the copy is hidden from assistive tech
  const row = [...items, ...items]
  const chip = 'flex items-center gap-2.5 h-14 px-6 rounded-2xl border border-black/[0.06] bg-white text-[#587079] ' +
               'hover:text-[#0C2530] hover:border-[#B3EAF0] transition-colors shadow-[0_2px_10px_rgba(20,20,40,0.04)]'
  return (
    <section aria-label="Customers" className="pt-16 pb-4">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center gap-7">
        <div className="shrink-0 lg:w-[270px]">
          <p className="text-[18px] font-bold leading-snug text-[#0C2530]">
            Trusted by teams who need<br />documents done fast
          </p>
          <a href="#see-how" className="mt-2 inline-flex items-center gap-1 text-[13px] text-[#587079] hover:text-brand transition-colors">
            See how customers use Braify <Arrow className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="relative flex-1 min-w-0 overflow-clip [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <ul className="lp-marquee flex w-max gap-3">
            {row.map((c, i) => {
              const copy = i >= items.length
              return (
                <li key={i} aria-hidden={copy || undefined}>
                  {c.logo ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" tabIndex={copy ? -1 : undefined}
                      className={chip} title={`${c.name} — visit website`}>
                      <img src={c.logo} alt={`${c.name} logo`} width={28} height={28} loading="lazy"
                        className="w-7 h-7 rounded-lg object-contain" />
                      <span className="text-[14px] font-semibold text-[#0C2530] whitespace-nowrap">{c.name}</span>
                    </a>
                  ) : (
                    <div className={chip}>
                      <span className="w-6 h-6 rounded-lg" style={{ backgroundImage: c.tint, opacity: 0.85 }} />
                      <span className="text-[13px] font-bold tracking-[0.14em] whitespace-nowrap">{c.name}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
