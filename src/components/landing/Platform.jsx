import { Link } from 'react-router-dom'
import BrandLogo from '../ui/BrandLogo'
import {
  CHANNELS, LINE, useCycle, Packet, ScaledStage, ChannelTile, Reveal, SectionHead, Check, Arrow, Icon,
  PrimaryButton, Spotlight, Aurora,
} from './primitives'
import { WHY, FEATURE_GRID, FEATURE_SLUGS } from './content'

/* ═══ Why companies choose Braify — bento ════════════════════════════════
 * Three pillars, each with a tiny live demo of the claim it makes. */
const HUB_TILES = [
  { id: 'pdf',   x: 70,  y: 60 },
  { id: 'email', x: 330, y: 60 },
  { id: 'sign',  x: 70,  y: 200 },
  { id: 'stats', x: 330, y: 200 },
]

function OnePlatformArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[400px]">
      <ScaledStage width={400} height={260}>
        <svg className="absolute inset-0" width="400" height="260" fill="none">
          {HUB_TILES.map(t => (
            <path key={t.id} d={`M${t.x} ${t.y} C ${t.x} 130, 200 ${t.y}, 200 130`} stroke={CHANNELS[t.id].fg}
              strokeOpacity="0.65" strokeWidth="1.5" className="lp-dash" />
          ))}
        </svg>
        <div className="absolute left-[200px] top-[130px] -translate-x-1/2 -translate-y-1/2">
          <span className="lp-ring absolute -inset-6 rounded-[30px] border border-[#C9BDF7]" />
          <div className="relative w-[84px] h-[84px] rounded-[24px] bg-white border border-white flex items-center justify-center
                          shadow-[0_16px_40px_rgba(109,82,232,0.35)]">
            <BrandLogo size={40} />
          </div>
        </div>
        {HUB_TILES.map((t, i) => (
          <div key={t.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${i % 2 ? 'lp-float' : 'lp-float-slow'}`}
            style={{ left: t.x, top: t.y }}>
            <div className="flex items-center gap-2 rounded-xl bg-white/85 border border-white backdrop-blur pl-1.5 pr-3 py-1.5 shadow-[0_8px_20px_rgba(76,60,160,0.12)]">
              <ChannelTile id={t.id} size="sm" />
              <span className="text-[12px] font-semibold text-[#16143A] whitespace-nowrap">{CHANNELS[t.id].label}</span>
            </div>
          </div>
        ))}
      </ScaledStage>
    </div>
  )
}

const TOGGLES = ['PDF Templates', 'Email Templates', 'E-Sign', 'File Storage']

function FeatureAccessArt() {
  const [step, , ref] = useCycle(4, 1600)
  // E-Sign and File Storage flip as the org's licence changes
  const on = [true, true, step % 2 === 0, step >= 2]
  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-black/[0.06] bg-[#FAF9FF] p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="lp-mono text-[10px] tracking-[0.14em] text-[#8B88A6]">ACME CORP · FEATURES</span>
        <span className="lp-mono text-[10px] text-[#6D52E8]">{on.filter(Boolean).length}/4</span>
      </div>
      <div className="space-y-1.5">
        {TOGGLES.map((t, i) => (
          <div key={t} className="flex items-center justify-between rounded-lg bg-white border border-black/[0.05] px-2.5 py-1.5">
            <span className={`text-[12px] transition-colors ${on[i] ? 'text-[#16143A]' : 'text-[#A3A0BC]'}`}>{t}</span>
            <span className={`relative w-8 h-[18px] rounded-full transition-colors duration-500 ${on[i] ? 'bg-[#6D52E8]' : 'bg-black/15'}`}>
              <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white shadow transition-all duration-500 ${on[i] ? 'left-[17px]' : 'left-[3px]'}`} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const AUDIT = [
  ['CREATED',  '#2F5BF0', 'Invoice template'],
  ['SENT',     '#0ea5e9', 'Email → billing@acme.com'],
  ['SIGNED',   '#14b8a6', 'INV-2041 by Acme Corp'],
  ['UPDATED',  '#d97706', 'Role → Admin'],
  ['RESTORED', '#6D52E8', 'Offer letter · v12'],
  ['UPLOADED', '#0891b2', 'contract-final.pdf'],
]

function AuditArt() {
  const rows = [...AUDIT, ...AUDIT]
  return (
    <div aria-hidden="true" className="relative h-[150px] overflow-clip rounded-2xl border border-black/[0.06] bg-[#FAF9FF]
                                       [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
      <ul className="lp-ticker px-3">
        {rows.map(([verb, color, what], i) => (
          <li key={i} className="flex items-center gap-2.5 py-1.5">
            <span className="lp-mono w-[70px] text-center text-[9px] font-semibold rounded px-1 py-0.5" style={{ color, background: `${color}14` }}>{verb}</span>
            <span className="text-[12px] text-[#3A3858] truncate">{what}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WhyBraify({ onStart }) {
  const [a, b, c] = WHY
  return (
    <section aria-labelledby="why-title" className="py-24 md:py-28">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <SectionHead id="why-title" eyebrow="Why Braify" title="Why companies" accent="choose Braify.">
          One document platform between your data and every place a document needs to go —
          PDF, email, e-signature and analytics.
        </SectionHead>

        <div className="grid md:grid-cols-3 md:grid-rows-2 gap-4">
          <Reveal className="md:col-span-2 md:row-span-2">
            <Spotlight as="article" glow="#8B6DF7"
              className="h-full overflow-clip rounded-[24px] bg-gradient-to-br from-[#EEE9FF] via-[#EAF1FF] to-[#E4F7F1] border border-white p-7 md:p-9 flex flex-col
                         shadow-[0_24px_60px_rgba(76,60,160,0.10)]">
              <Aurora className="opacity-60" />
              <span className="relative lp-mono text-[10.5px] tracking-[0.18em] uppercase text-[#6D52E8]">One platform</span>
              <div className="relative my-6 md:my-4 flex-1 flex items-center"><OnePlatformArt /></div>
              <div className="relative">
                <h3 className="text-[26px] md:text-[30px] leading-tight font-bold tracking-tight text-[#16143A] max-w-lg">{a.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#55527A] max-w-xl">{a.desc}</p>
              </div>
            </Spotlight>
          </Reveal>

          {[[b, '#6D52E8', 'Per-org access', <FeatureAccessArt key="f" />], [c, '#d97706', 'Full custody', <AuditArt key="a" />]].map(([w, color, eyebrow, art], i) => (
            <Reveal key={w.title} delay={(i + 1) * 90}>
              <Spotlight as="article" glow={color}
                className="h-full rounded-[24px] bg-white border border-black/[0.07] p-6 flex flex-col gap-5
                           hover:shadow-[0_24px_60px_rgba(20,20,40,0.08)] transition-shadow">
                <span className="lp-mono text-[10.5px] tracking-[0.18em] uppercase" style={{ color }}>{eyebrow}</span>
                {art}
                <div>
                  <h3 className="text-[18px] leading-snug font-bold tracking-tight text-[#16143A]">{w.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#625F80]">{w.desc}</p>
                </div>
              </Spotlight>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <PrimaryButton onClick={onStart}>Start for free</PrimaryButton>
        </div>
      </div>
    </section>
  )
}

/* ═══ 01 — Without vs with Braify ════════════════════════════════════════ */
const TOOLS = ['Doc editor', 'PDF converter', 'Email tool', 'E-sign service']
const WITH_OUT = ['pdf', 'email', 'sign', 'stats']

function WithoutPanel() {
  return (
    <div className="rounded-[20px] bg-[#FAF9FF] border border-black/[0.07] p-5 h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="lp-mono text-[11px] font-normal tracking-[0.16em] text-[#625F80]">WITHOUT BRAIFY</h3>
        <span className="lp-mono text-[10.5px] tracking-[0.1em] text-[#625F80] border border-black/10 rounded-full px-2.5 py-0.5">4 TOOLS</span>
      </div>
      <div aria-hidden="true">
        <ScaledStage width={470} height={220}>
          <svg className="absolute inset-0" width="470" height="220" fill="none">
            {[62, 178, 292, 408].map(x => (
              <path key={x} d={`M235 62 C 235 110, ${x} 100, ${x} 142`} stroke="#D2CCEB" strokeWidth="1.4" />
            ))}
          </svg>
          <div className="absolute left-1/2 -translate-x-1/2 top-4 flex items-center gap-2 bg-white rounded-xl border border-black/[0.08] px-3 py-2 shadow-sm">
            <span className="lp-mono w-7 h-7 rounded-lg bg-[#F1EEFB] text-[8.5px] font-semibold text-[#625F80] flex items-center justify-center">TEAM</span>
            <div className="leading-tight">
              <p className="text-[12.5px] font-semibold text-[#16143A]">Your team</p>
              <p className="lp-mono text-[9.5px] text-[#8B88A6]">copy · paste · chase</p>
            </div>
          </div>
          {TOOLS.map((t, i) => (
            <div key={t} className="absolute top-[142px] w-[104px] -translate-x-1/2 bg-white rounded-xl border border-black/[0.08] px-2.5 py-2 shadow-sm"
              style={{ left: 62 + i * 115.3 }}>
              <p className="text-[11.5px] font-semibold text-[#3A3858]">{t}</p>
              <p className="lp-mono text-[9px] text-[#A3A0BC]">export · re-upload</p>
            </div>
          ))}
        </ScaledStage>
      </div>
      <p className="sr-only">Without Braify, teams juggle a document editor, a PDF converter, an email tool and a separate e-signature service.</p>
    </div>
  )
}

function WithPanel() {
  const [step, , ref] = useCycle(WITH_OUT.length, 1800)
  const xs = [70, 180, 290, 400]
  const out = x => `M235 124 C 235 150, ${x} 150, ${x} 172`
  return (
    <div ref={ref} className="relative overflow-clip rounded-[20px] bg-gradient-to-b from-white to-[#F1ECFF] border border-[#D6CCFB] p-5 h-full
                              shadow-[0_24px_60px_rgba(109,82,232,0.14)]">
      <Aurora className="opacity-50" />
      <div className="relative flex items-center justify-between mb-2">
        <h3 className="lp-mono text-[11px] font-normal tracking-[0.16em] text-[#6D52E8]">WITH BRAIFY</h3>
        <span className="lp-mono text-[10.5px] tracking-[0.1em] text-[#6D52E8] bg-[#F3F0FF] border border-[#D6CCFB] rounded-full px-2.5 py-0.5">1 PLATFORM</span>
      </div>
      <div aria-hidden="true" className="relative">
        <ScaledStage width={470} height={220}>
          <svg className="absolute inset-0" width="470" height="220" fill="none">
            <path d="M235 44 L235 78" stroke="#9DB6F7" strokeWidth="1.4" className="lp-dash" />
            {xs.map((x, i) => (
              <path key={x} d={out(x)} strokeWidth="1.4" className="lp-dash transition-[stroke] duration-500"
                stroke={step === i ? CHANNELS[WITH_OUT[i]].fg : LINE} />
            ))}
            <Packet path={out(xs[step])} trigger={step} dur={0.8} color={CHANNELS[WITH_OUT[step]].fg} r={3.5} />
          </svg>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center gap-2 bg-white rounded-xl border border-black/[0.08] px-3 py-1.5 shadow-sm">
            <span className="lp-mono w-6 h-6 rounded-md bg-[#F3F0FF] text-[8px] font-semibold text-[#6D52E8] flex items-center justify-center">TEAM</span>
            <p className="text-[12px] font-semibold text-[#16143A]">Your team</p>
          </div>
          <span className="lp-mono absolute left-[243px] top-[52px] text-[9.5px] text-[#6D52E8]">one template</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-[78px] w-[250px] flex items-center gap-2.5 rounded-xl px-3 py-2.5
                          shadow-[0_14px_40px_rgba(109,82,232,0.55)]" style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0,#6D52E8)' }}>
            <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><BrandLogo size={20} /></span>
            <div className="flex-1 leading-tight">
              <p className="text-[12.5px] font-semibold text-white">Braify</p>
              <p className="lp-mono text-[9px] text-white/70 whitespace-nowrap">design · send · sign · track</p>
            </div>
            <span className="lp-mono text-[9.5px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5">200</span>
          </div>
          {xs.map((x, i) => (
            <div key={x} className="absolute top-[172px] -translate-x-1/2" style={{ left: x }}>
              <ChannelTile id={WITH_OUT[i]} active={step === i} className={step === i ? 'scale-110 shadow-md' : ''} />
            </div>
          ))}
        </ScaledStage>
      </div>
      <p className="relative mt-1 inline-flex items-center gap-2 rounded-full bg-white border border-[#D6CCFB] text-[#16143A] px-3.5 py-1.5 shadow-sm">
        <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />
        <span className="lp-mono text-[11px]">Design once. Deliver as PDF, email or e-signature.</span>
      </p>
    </div>
  )
}

export function Comparison() {
  return (
    <section aria-labelledby="layer-title" className="pb-24 md:pb-28">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <SectionHead id="layer-title" n="01" eyebrow="The missing document layer" title="Your tools multiply." accent="Your workflow doesn't.">
          Documents are easy until they need a signature, a branded email, an audit trail and a report.
          Braify gives every step one home.
        </SectionHead>
        <div className="grid lg:grid-cols-2 gap-4">
          <Reveal><WithoutPanel /></Reveal>
          <Reveal delay={100}><WithPanel /></Reveal>
        </div>
      </div>
    </section>
  )
}

/* ═══ 02 — Everything you need (API diagram + 12 capabilities) ═══════════ */
const ENDPOINTS = [
  { m: 'POST', path: '/pdf/generate',    label: 'Render PDF',   out: 0 },
  { m: 'POST', path: '/email/send',      label: 'Send email',   out: 1 },
  { m: 'GET',  path: '/esign/documents', label: 'Track e-sign', out: 2 },
  { m: 'GET',  path: '/pdf/templates',   label: 'List PDFs',    out: 0 },
  { m: 'GET',  path: '/email/templates', label: 'List emails',  out: 1 },
]
const API_OUT = ['pdf', 'email', 'sign', 'stats']
const METHOD_STYLE = { POST: 'text-teal-700 bg-teal-50', GET: 'text-brand-700 bg-brand-50' }

function ApiDiagram({ step }) {
  const ep = ENDPOINTS[step]
  const outYs = [44, 104, 164, 224]
  const outPath = y => `M792 134 C 818 134, 818 ${y}, 846 ${y}`
  return (
    <ScaledStage width={1000} height={268}>
      <svg className="absolute inset-0" width="1000" height="268" fill="none">
        <path d="M178 134 L222 134" stroke="#8FAAF5" strokeWidth="1.5" className="lp-dash" />
        {outYs.map((y, i) => (
          <path key={y} d={outPath(y)} strokeWidth="1.5" className="lp-dash transition-[stroke] duration-500"
            stroke={ep.out === i ? CHANNELS[API_OUT[i]].fg : LINE} />
        ))}
        <Packet path="M178 134 L222 134" trigger={step} dur={0.5} />
        <Packet path={outPath(outYs[ep.out])} trigger={step} delay={0.55} dur={0.7} color={CHANNELS[API_OUT[ep.out]].fg} />
      </svg>

      <div className="absolute left-0 top-[60px] w-[178px] rounded-2xl bg-white border border-black/[0.08] p-3.5 shadow-[0_10px_28px_rgba(20,20,40,0.07)]">
        <span className="lp-mono inline-flex w-7 h-7 rounded-lg bg-[#F1EEFB] text-[9px] font-semibold text-[#625F80] items-center justify-center">APP</span>
        <p className="mt-2.5 text-[13px] font-semibold text-[#16143A]">Your application</p>
        <p className="lp-mono text-[9.5px] text-[#8B88A6] mt-0.5">X-API-Key: brf_••••</p>
        <span key={step} className="lp-rise lp-mono mt-2.5 inline-block text-[9.5px] text-brand bg-brand-50 rounded px-1.5 py-0.5">
          {ep.m} {ep.path}
        </span>
      </div>

      <div className="absolute left-[222px] top-[18px] w-[570px] rounded-2xl border border-brand-100 bg-gradient-to-b from-[#F5F8FF] to-white p-3.5
                      shadow-[0_0_0_4px_rgba(47,91,240,0.04)]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="flex items-center gap-2">
            <BrandLogo size={16} />
            <span className="lp-mono text-[10.5px] tracking-[0.16em] text-brand">BRAIFY REST API</span>
          </span>
          <span className="lp-mono text-[10px] tracking-[0.1em] text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2.5 py-0.5">ORG-SCOPED KEY</span>
        </div>
        <div className="space-y-1.5">
          {ENDPOINTS.map((e, i) => {
            const on = i === step
            return (
              <div key={e.path}
                className="flex items-center gap-3 rounded-lg border px-2.5 py-[5px] transition-all duration-500"
                style={{
                  borderColor: on ? '#BFD3FB' : 'rgba(0,0,0,0.06)',
                  background: on ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: on ? '0 6px 18px rgba(47,91,240,0.12)' : 'none',
                }}>
                <span className={`lp-mono w-[46px] text-center text-[9.5px] font-semibold rounded px-1 py-0.5 ${METHOD_STYLE[e.m]}`}>{e.m}</span>
                <span className="lp-mono text-[12px] text-[#16143A] flex-1">/api/external{e.path}</span>
                <span className={`text-[12px] transition-colors ${on ? 'text-[#16143A] font-semibold' : 'text-[#8B88A6]'}`}>{e.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {outYs.map((y, i) => {
        const c = CHANNELS[API_OUT[i]]
        const on = ep.out === i
        return (
          <div key={y}
            className="absolute left-[846px] w-[154px] -translate-y-1/2 flex items-center gap-2.5 rounded-xl bg-white border px-2.5 py-2 transition-all duration-500"
            style={{ top: y, borderColor: on ? c.ring : 'rgba(0,0,0,0.07)', boxShadow: on ? `0 0 0 3px ${c.bg}` : 'none' }}>
            <ChannelTile id={API_OUT[i]} size="sm" active={on} />
            <span className="text-[12.5px] font-semibold text-[#16143A]">{c.label}</span>
          </div>
        )
      })}
    </ScaledStage>
  )
}

export function Capabilities({ onStart }) {
  const [step, , ref] = useCycle(ENDPOINTS.length, 2200)

  return (
    <section id="features" aria-labelledby="features-title"
      className="relative py-24 md:py-28 bg-[#F1F5FF] border-y border-[#E3E9FB] overflow-clip">
      <div aria-hidden="true" className="lp-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-32 w-[560px] h-[460px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(47,91,240,0.12), transparent)' }} />

      <div className="relative max-w-[1180px] mx-auto px-4 sm:px-6">
        <SectionHead id="features-title" n="02" eyebrow="Across every team and workflow"
          title="Everything you need" accent="to automate documents.">
          Twelve capabilities, one platform — from first draft to analytics dashboard. Build it in
          the UI or call it from any system with the REST API.
        </SectionHead>

        <Reveal>
          <div ref={ref} aria-hidden="true"
            className="rounded-[22px] bg-white border border-black/[0.07] p-5 md:p-7 shadow-[0_30px_80px_rgba(20,20,40,0.08)]">
            <ApiDiagram step={step} />
          </div>
        </Reveal>

        <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_GRID.map((f, i) => {
            const slug = FEATURE_SLUGS[f.title]
            return (
              <Reveal as="li" key={f.title} delay={(i % 4) * 70}>
               <Spotlight glow={f.color}
                className="h-full rounded-[18px] bg-white border border-black/[0.07] p-5
                           hover:shadow-[0_18px_44px_rgba(20,20,40,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                <span aria-hidden="true" className="absolute top-0 left-5 right-5 h-[2px] rounded-full scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"
                  style={{ background: f.color }} />
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: f.color + '18' }}>
                    <Icon d={f.icon} color={f.color} />
                  </span>
                  <span aria-hidden="true" className="lp-mono text-[10px] text-[#B3B0CA]">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-bold text-[15px] text-[#16143A] mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-[#625F80] leading-relaxed">{f.desc}</p>
                {slug ? (
                  <Link to={`/features/${slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ color: `color-mix(in srgb, ${f.color} 70%, #16143A)` }}>
                    Learn more <span className="sr-only">about {f.title}</span><Arrow className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button onClick={onStart}
                    className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    style={{ color: `color-mix(in srgb, ${f.color} 70%, #16143A)` }}>
                    Get started <Arrow className="w-3.5 h-3.5" />
                  </button>
                )}
               </Spotlight>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
