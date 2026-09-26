import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useCycle, useInView, usePrefersReducedMotion, Reveal, SectionHead, Eyebrow, Check, Arrow, Icon, StatusDot, Aurora, GradientText,
} from './primitives'
import { TABS, ROLES, FEATURE_SLUGS } from './content'

/* ═══ 03 — See how teams use Braify (feature tabs) ═══════════════════════ */
const TAB_CODES = ['PDF', 'EM', 'SG', 'AN', 'FS', 'FA', 'ORG', 'LOG', 'VER']

function TabVisual({ tab, code }) {
  const c = tab.color
  return (
    <div className="relative h-full min-h-[340px] flex flex-col border-y lg:border-y-0 lg:border-x border-[#D6F1F4]"
      style={{ backgroundImage: `linear-gradient(160deg, ${c}14 0%, #F5FCFD 45%, #ffffff 100%)` }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#D6F1F4] bg-white/60 backdrop-blur">
        <span className="flex items-center gap-2">
          {['#ff5f57', '#febc2e', '#28c840'].map(col => <span key={col} className="w-2 h-2 rounded-full" style={{ background: col }} />)}
          <span className="lp-mono text-[11px] text-[#4F6A73] ml-1.5">braify / {tab.label.toLowerCase()}</span>
        </span>
        <span className="lp-mono text-[10px] text-[#9DB1B7]">{code}</span>
      </div>

      <div key={tab.label} className="flex-1 p-5 space-y-3">
        <div className="lp-rise flex items-center gap-3 rounded-xl bg-white border border-[#D6F1F4] p-3 shadow-[0_6px_18px_rgba(14,116,144,0.06)]">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center lp-mono text-[10px] font-semibold"
            style={{ background: c + '1a', color: `color-mix(in srgb, ${c} 72%, #0C2530)` }}>{code}</span>
          <div className="flex-1">
            <div className="h-2.5 rounded bg-[#0C2530]/15 w-2/3 mb-1.5" />
            <div className="h-2 rounded bg-[#0C2530]/[0.07] w-1/3" />
          </div>
          <span className="lp-mono text-[10px] rounded-full px-2 py-0.5"
            style={{ color: `color-mix(in srgb, ${c} 72%, #0C2530)`, background: c + '1a' }}>live</span>
        </div>

        <div className="lp-rise rounded-xl bg-white border border-[#D6F1F4] p-3.5 shadow-[0_6px_18px_rgba(14,116,144,0.06)]" style={{ animationDelay: '80ms' }}>
          <div className="h-2 rounded bg-[#0C2530]/[0.07] w-full mb-2" />
          <div className="h-2 rounded bg-[#0C2530]/[0.07] w-5/6 mb-3" />
          <div className="h-7 rounded-lg overflow-clip" style={{ background: c + '1a' }}>
            <div className="h-full rounded-lg lp-fill" style={{ background: `linear-gradient(90deg, ${c}99, ${c})` }} />
          </div>
        </div>

        {tab.points.slice(0, 4).map((p, i) => (
          <div key={p} className="lp-rise flex items-center gap-2.5" style={{ animationDelay: `${160 + i * 110}ms` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: c }}>
              <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
            </span>
            <span className="lp-mono text-[11px] text-[#4F6A73] truncate">{p}</span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <StatusDot color="#10b981" pulse={false} />
          <span className="lp-mono text-[11px] text-emerald-700">Every action audited</span>
        </span>
      </div>
    </div>
  )
}

export function FeatureTabs({ onStart }) {
  const [active, setActive, ref] = useCycle(TABS.length, 5200)
  const tab = TABS[active]
  const slug = FEATURE_SLUGS[tab.label]

  return (
    <section id="see-how" aria-labelledby="see-how-title" className="py-24 md:py-28 scroll-mt-20">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <SectionHead id="see-how-title" n="03" eyebrow="Everything your team needs" title="See how teams" accent="use Braify.">
          From a drag-and-drop PDF builder to e-signatures, analytics and a complete audit log —
          pick a module to see what it does.
        </SectionHead>

        <Reveal>
          <div ref={ref}
            className="grid grid-cols-1 lg:grid-cols-[0.72fr_1fr_1.05fr] rounded-[22px] overflow-clip border bg-white transition-[box-shadow,border-color] duration-700"
            style={{ borderColor: `${tab.color}40`, boxShadow: `0 30px 80px ${tab.color}22, 0 0 0 4px ${tab.color}0d` }}>
            {/* selector */}
            <div role="tablist" aria-label="Braify modules" aria-orientation="vertical"
              className="p-2.5 bg-[#F5FCFD] border-b lg:border-b-0 lg:border-r border-black/[0.06]
                         flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {TABS.map((t, i) => {
                const on = i === active
                return (
                  <button key={t.label} role="tab" aria-selected={on} aria-controls="see-how-panel" id={`tab-${i}`}
                    onClick={() => setActive(i)}
                    className={`shrink-0 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all border
                                ${on ? 'bg-white border-black/[0.08] shadow-sm' : 'border-transparent hover:bg-white/70'}`}>
                    <span className="lp-mono w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-semibold border transition-opacity"
                      style={{ color: `color-mix(in srgb, ${t.color} 72%, #0C2530)`, background: t.color + '14', borderColor: t.color + '40', opacity: on ? 1 : 0.75 }}>
                      {TAB_CODES[i]}
                    </span>
                    <span className={`text-[13.5px] whitespace-nowrap ${on ? 'font-semibold text-[#0C2530]' : 'text-[#4F6A73]'}`}>{t.label}</span>
                    {on && (
                      <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* visual */}
            <div aria-hidden="true" className="order-last lg:order-none">
              <TabVisual tab={tab} code={TAB_CODES[active]} />
            </div>

            {/* copy */}
            <div id="see-how-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="p-6 md:p-7 flex flex-col">
              <div key={tab.label} className="lp-rise">
                <span className="lp-mono text-[10.5px] tracking-[0.16em] uppercase" style={{ color: tab.color }}>
                  {String(active + 1).padStart(2, '0')} / {String(TABS.length).padStart(2, '0')} · {tab.label}
                </span>
                <h3 className="mt-3 text-[24px] leading-snug font-bold tracking-tight text-[#0C2530]">{tab.heading}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#4F6A73]">{tab.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {tab.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5">
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white"
                        style={{ background: tab.color }}>
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                      <span className="text-[13.5px] text-[#33505A]">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto pt-6 flex flex-wrap items-center gap-4">
                <button onClick={onStart}
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0C2530] border-b-2 pb-0.5 group"
                  style={{ borderColor: tab.color }}>
                  Get started free <Arrow className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                {slug && (
                  <Link to={`/features/${slug}`} className="text-[13px] text-[#587079] hover:text-[#0C2530] transition-colors">
                    Explore {tab.label} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Crawlable summary of every module (the panel above shows one at a time). */}
        <div className="sr-only">
          {TABS.map(t => (
            <div key={t.label}>
              <h3>{t.heading}</h3>
              <p>{t.desc}</p>
              <ul>{t.points.map(p => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══ 04 — The right access for every seat (roles accordion) ═════════════ */
function RoleArt({ color }) {
  return (
    <svg aria-hidden="true" className="w-[140px] h-[140px]" viewBox="0 0 140 140" fill="none">
      {[0, 1, 2].map(r => [0, 1, 2].map(c => (
        <rect key={`${r}${c}`} x={6 + c * 46} y={6 + r * 46} width="36" height="36" rx="9"
          stroke={color} strokeOpacity={r === 1 && c === 1 ? 0.9 : 0.35} strokeWidth="1.5"
          fill={r === 1 && c === 1 ? `${color}14` : 'none'} />
      )))}
      <path d="M24 70 H116 M70 24 V116" stroke={color} strokeOpacity="0.55" strokeWidth="1.3" className="lp-dash" />
    </svg>
  )
}

export function Roles() {
  const [active, setActive, ref] = useCycle(ROLES.length, 5000)

  return (
    <section aria-labelledby="roles-title" className="py-24 md:py-28 bg-[#EEFAFB] border-y border-[#D6F1F4]">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <SectionHead id="roles-title" n="04" eyebrow="Role-based access control" title="The right access" accent="for every seat.">
          Three tiers of access — from organisation administrators to individual contributors.
          Everyone sees exactly what their role and licence allow.
        </SectionHead>

        <Reveal>
          <ul ref={ref} className="flex flex-col md:flex-row gap-2.5 md:h-[340px]">
            {ROLES.map((r, i) => {
              const on = i === active
              return (
                <li key={r.role}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={`relative overflow-clip rounded-[20px] border cursor-pointer transition-all duration-700 ease-spring
                              ${on ? 'md:flex-[5] bg-white shadow-[0_24px_60px_rgba(20,20,40,0.10)]' : 'md:flex-[1] bg-[#F5FCFD] hover:bg-white'}`}
                  style={{
                    borderColor: on ? `${r.color}66` : 'rgba(0,0,0,0.07)',
                    backgroundImage: on ? `linear-gradient(160deg, #fff 40%, ${r.bg})` : undefined,
                  }}>
                  <div className="p-5 h-full flex flex-col">
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl border flex items-center justify-center"
                          style={{ color: r.color, background: r.bg, borderColor: `${r.color}40` }}>
                          <Icon d={r.path} className="w-5 h-5" />
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: r.color, background: r.bg }}>
                          {r.role}
                        </span>
                      </span>
                      {on && <span className="hidden md:block lp-mono text-[11px] text-[#9DB1B7]">0{i + 1}</span>}
                    </div>

                    <div className={on ? 'lp-rise mt-5 md:mt-auto flex items-end justify-between gap-6' : 'mt-4 md:mt-auto'}>
                      <div className="max-w-lg">
                        <h3 className={`font-bold tracking-tight text-[#0C2530] ${on ? 'text-[28px]' : 'text-[16px]'}`}>{r.role}</h3>
                        <p className={`mt-1.5 text-[14px] leading-relaxed text-[#4F6A73] ${on ? '' : 'md:hidden'}`}>{r.summary}</p>
                        <ul className={`mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 ${on ? '' : 'hidden'}`}>
                          {r.perms.map(p => (
                            <li key={p} className="flex items-start gap-2 text-[13px] text-[#33505A]">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {on && <div className="hidden lg:block shrink-0"><RoleArt color={r.color} /></div>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

/* ═══ 05 — Quickstart terminal ═══════════════════════════════════════════ */
const TERMINAL = [
  { kind: 'cmd',  text: 'export BRAIFY_KEY=brf_••••••••••••' },
  { kind: 'cmd',  text: 'curl -X POST $BRAIFY_URL/api/external/pdf/generate \\' },
  { kind: 'cont', text: '  -H "X-API-Key: $BRAIFY_KEY" \\' },
  { kind: 'cont', text: `  -d '{"templateId":"invoice","data":{"customer":"Acme"}}' \\` },
  { kind: 'cont', text: '  -o invoice.pdf' },
  { kind: 'ok',   text: '200 OK · invoice.pdf saved (48 KB)' },
  { kind: 'cmd',  text: 'curl -X POST $BRAIFY_URL/api/external/email/send ...' },
  { kind: 'ok',   text: 'Email sent to billing@acme.com' },
  { kind: 'dim',  text: '  template: invoice-email · status: SENT' },
]

function Terminal() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, threshold: 0.4 })
  const reduced = usePrefersReducedMotion()
  const [line, setLine] = useState(0)
  const [chars, setChars] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setLine(TERMINAL.length); return }
    if (line >= TERMINAL.length) return
    const cur = TERMINAL[line]
    const typed = cur.kind === 'cmd' || cur.kind === 'cont'
    if (typed && chars < cur.text.length) {
      const t = setTimeout(() => setChars(n => n + 2), 18)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => { setLine(l => l + 1); setChars(0) }, typed ? 180 : 420)
    return () => clearTimeout(t)
  }, [inView, reduced, line, chars])

  const render = (l, i) => {
    const text = i === line ? l.text.slice(0, chars) : l.text
    if (l.kind === 'cmd') return <><span className="text-[#5eead4]">$ </span><span className="text-white/90">{text}</span></>
    if (l.kind === 'cont') return <span className="text-white/75">{text}</span>
    if (l.kind === 'ok') return <><span className="text-emerald-400">✓ </span><span className="text-white/90">{text}</span></>
    return <span className="text-white/40">{text}</span>
  }

  return (
    <div ref={ref} aria-hidden="true"
      className="rounded-[18px] bg-[#0C2530] border border-[#2A2656] shadow-[0_40px_90px_rgba(14,116,144,0.30)] overflow-clip">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="lp-mono text-[11px] text-white/70 ml-2">Terminal</span>
        </span>
        <span className="lp-mono text-[10.5px] text-white/35">zsh</span>
      </div>
      <pre className="lp-mono px-5 py-5 min-h-[300px] text-[12px] sm:text-[12.5px] leading-[1.9] overflow-x-auto">
        {TERMINAL.slice(0, Math.min(line + 1, TERMINAL.length)).map((l, i) => (
          <div key={i}>{render(l, i)}{i === line && <span className="lp-caret text-[#5eead4]">▍</span>}</div>
        ))}
        {line >= TERMINAL.length && <div><span className="text-[#5eead4]">$ </span><span className="lp-caret text-[#5eead4]">▍</span></div>}
      </pre>
    </div>
  )
}

export function Quickstart() {
  return (
    <section aria-labelledby="quickstart-title" className="relative py-24 md:py-32 bg-[#EEFAF6] overflow-clip">
      <Aurora />
      <div className="relative max-w-[1180px] mx-auto px-4 sm:px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
        <Reveal>
          <Eyebrow n="05" className="mb-6">Ship your first document</Eyebrow>
          <h2 id="quickstart-title" className="text-balance text-[38px] leading-[1.03] md:text-[56px] font-bold tracking-tightest text-[#0C2530]">
            From template to sent in <GradientText>one request.</GradientText>
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-[#4A6670] max-w-md">
            Design a template, create an org-scoped API key and generate PDFs or send emails from any
            system. Every call is logged against the key.
          </p>
          <Link to="/features/rest-api"
            className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0C2530] border-b-2 border-[#0B8E9E] pb-0.5 group">
            Explore the REST API
            <Arrow className="w-3.5 h-3.5 text-[#0B8E9E] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Reveal>
        <Reveal delay={120}><Terminal /></Reveal>
      </div>
    </section>
  )
}
