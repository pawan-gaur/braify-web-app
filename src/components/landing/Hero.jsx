import BrandLogo from '../ui/BrandLogo'
import {
  useCycle, ScaledStage, GradientText, Check, GlowButton, GlassButton, StatusDot, Aurora, Icon,
} from './primitives'
import { ANNOUNCEMENT, HERO_NOTES } from './content'

/* ─── The document pipeline ───────────────────────────────────────────────
 * One invoice travels through six stages. The live document and the pipeline
 * rail share the same `phase`, so what happens on the paper is what lights up
 * on the rail. The last phase is held for an extra beat before looping. */
export const STAGES = [
  { key: 'design',  label: 'Design',  sub: 'Drag-and-drop template', color: '#22BCCB',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 5h16M10 10v10' },
  { key: 'merge',   label: 'Merge',   sub: 'Live placeholders',      color: '#0B8E9E',
    icon: 'M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16' },
  { key: 'render',  label: 'Render',  sub: 'Pixel-perfect PDF',      color: '#2F5BF0',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z' },
  { key: 'deliver', label: 'Deliver', sub: 'Branded email',          color: '#0ea5e9',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'sign',    label: 'Sign',    sub: 'Legally binding e-sign', color: '#14b8a6',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { key: 'track',   label: 'Track',   sub: 'Analytics & audit log',  color: '#10b981',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]
const LAST = STAGES.length - 1

const ITEMS = [
  ['Template design retainer', '$2,400'],
  ['E-sign workflow setup', '$600'],
  ['Team seats × 6', '$180'],
]

/** Sample invoice is always due two weeks from today, so the demo never shows a past date. */
function dueDate() {
  return new Date(Date.now() + 14 * 86_400_000)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** A merge field: shows `{{token}}` until merged, then the value with a flash. */
function Field({ merged, token, value, className = '' }) {
  return merged ? (
    <span className={`lp-flash rounded px-0.5 -mx-0.5 ${className}`}>{value}</span>
  ) : (
    <span className={`lp-mono text-[0.82em] font-medium text-[#0B8E9E] bg-[#E2F8FA] border border-[#B3EAF0] rounded px-1 ${className}`}>
      {`{{${token}}}`}
    </span>
  )
}

function Toast({ show, color, icon, title, sub, className }) {
  if (!show) return null
  return (
    <div className={`lp-pop absolute z-20 flex items-center gap-2.5 rounded-2xl border border-white bg-white/85 backdrop-blur-xl
                     pl-2 pr-3.5 py-2 shadow-[0_18px_44px_rgba(14,116,144,0.18)] ${className}`}>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}1a`, color }}>
        <Icon d={icon} className="w-4 h-4" strokeWidth={2} />
      </span>
      <div className="leading-tight">
        <p className="text-[12.5px] font-semibold text-[#0C2530] whitespace-nowrap">{title}</p>
        <p className="lp-mono text-[10px] text-[#7F979F] whitespace-nowrap">{sub}</p>
      </div>
    </div>
  )
}

/* ─── Live document ───────────────────────────────────────────────────── */
function LiveDocument({ phase }) {
  const merged = phase >= 1
  const rendered = phase >= 2
  const signed = phase >= 4
  const done = phase >= LAST

  return (
    <ScaledStage width={560} height={560}>
      {/* glow under the paper */}
      <div className="absolute left-[90px] top-[70px] w-[380px] h-[440px] rounded-[40px] blur-3xl opacity-40"
        style={{ backgroundImage: 'linear-gradient(140deg,#3B4BF0,#0EA5C6 55%,#0d9488)' }} />

      {/* paper */}
      <div className="absolute left-[90px] top-[40px] w-[380px] [perspective:1400px]">
        <div className="relative rounded-[22px] bg-white shadow-[0_40px_80px_rgba(14,116,144,0.25)] ring-1 ring-[#D3EFF2] overflow-clip
                        transition-transform duration-700 ease-spring [transform:rotateY(-9deg)_rotateX(5deg)]
                        hover:[transform:rotateY(0deg)_rotateX(0deg)]">
          {/* render scan */}
          {phase === 2 && (
            <span className="lp-scan absolute inset-x-0 h-16 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(47,91,240,0.18), transparent)' }} />
          )}

          <div className="p-7">
            {/* header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BrandLogo size={26} />
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-[#0C2530]">Northwind Studio</p>
                  <p className="text-[10px] text-[#7F979F]">studio@northwind.co</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-bold tracking-tight text-[#0C2530]">Invoice</p>
                <p className="text-[11px] text-[#587079]">No. <Field merged={merged} token="invoice.no" value="INV-2041" /></p>
              </div>
            </div>

            {/* billed to */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <p className="text-[#9DB1B7] uppercase tracking-wider text-[9px] mb-1">Billed to</p>
                <p className="font-semibold text-[#0C2530] text-[13px]"><Field merged={merged} token="customer.name" value="Acme Corp" /></p>
                <p className="text-[#7F979F] mt-0.5"><Field merged={merged} token="customer.email" value="billing@acme.com" /></p>
              </div>
              <div className="text-right">
                <p className="text-[#9DB1B7] uppercase tracking-wider text-[9px] mb-1">Due</p>
                <p className="font-semibold text-[#0C2530] text-[13px]"><Field merged={merged} token="due_date" value={dueDate()} /></p>
              </div>
            </div>

            {/* items */}
            <div className="mt-6 border-t border-black/[0.06]">
              {ITEMS.map(([label, amt], i) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-black/[0.05] text-[12px] h-[37px]">
                  {merged ? (
                    <>
                      <span className="lp-rise text-[#33505A]" style={{ animationDelay: `${i * 120}ms` }}>{label}</span>
                      <span className="lp-rise font-medium text-[#0C2530]" style={{ animationDelay: `${i * 120}ms` }}>{amt}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 rounded bg-[#E6F4F6]" style={{ width: `${55 - i * 10}%` }} />
                      <span className="h-2 w-12 rounded bg-[#E6F4F6]" />
                    </>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span className="text-[12px] text-[#587079]">Total</span>
                <span className="text-[22px] font-bold tracking-tight text-[#0C2530]">
                  <Field merged={merged} token="total" value="$3,180.00" />
                </span>
              </div>
            </div>

            {/* signature */}
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="relative h-10 w-44 border-b border-dashed border-black/25">
                  <svg viewBox="0 0 176 40" className="absolute inset-0 w-full h-full" fill="none">
                    <path d="M6 30 C 18 6, 26 36, 40 20 S 60 6, 70 22 S 92 34, 102 14 S 128 12, 138 22 S 160 24, 170 16"
                      stroke="#2F5BF0" strokeWidth="2" strokeLinecap="round"
                      style={{ strokeDasharray: 260, strokeDashoffset: signed ? 0 : 260, transition: signed ? 'stroke-dashoffset 1.3s ease' : 'none' }} />
                  </svg>
                </div>
                <p className="text-[9.5px] text-[#9DB1B7] mt-1 uppercase tracking-wider">Client signature</p>
              </div>
              {rendered && (
                <span className="lp-pop lp-mono text-[9.5px] font-semibold text-[#2F5BF0] bg-[#EAF1FE] rounded-md px-2 py-1">PDF · 48 KB</span>
              )}
            </div>
          </div>

          {/* SIGNED stamp */}
          {done && (
            <div className="lp-stamp absolute right-8 bottom-24 z-10 rounded-xl border-[3px] border-teal-500 px-3 py-1.5 text-teal-600
                            text-[18px] font-black tracking-[0.2em] bg-white/70">
              SIGNED
            </div>
          )}
        </div>
      </div>

      {/* toasts around the paper */}
      <Toast show={phase <= 1} color="#0B8E9E" icon={STAGES[phase <= 1 ? phase : 0].icon}
        title={phase === 0 ? 'Invoice template' : 'Data merged'} sub={phase === 0 ? '7 starter categories' : '4 placeholders filled'}
        className="left-0 top-[92px]" />
      <Toast show={phase >= 2 && phase < 4} color="#2F5BF0" icon={STAGES[2].icon}
        title="PDF rendered" sub="184 ms · 48 KB" className="left-0 top-[92px]" />
      <Toast show={phase >= 3} color="#0284c7" icon={STAGES[3].icon}
        title="Email delivered" sub="billing@acme.com" className="right-0 top-[240px]" />
      <Toast show={phase >= 4} color="#0d9488" icon={STAGES[4].icon}
        title={done ? 'Signed by Acme Corp' : 'Awaiting signature'} sub={done ? 'Audit log · +1 event' : 'Link opened · 1 min ago'}
        className="left-[14px] bottom-[34px]" />
    </ScaledStage>
  )
}

/* ─── Pipeline rail ───────────────────────────────────────────────────── */
function Pipeline({ phase }) {
  const pct = (phase / LAST) * 100
  return (
    <div className="relative rounded-[22px] border border-white bg-white/65 backdrop-blur-xl p-4 md:p-5 shadow-[0_24px_60px_rgba(14,116,144,0.12)]">
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="flex items-center gap-2 lp-mono text-[10.5px] tracking-[0.18em] text-[#587079]">
          <StatusDot color="#14b8a6" /> DOCUMENT PIPELINE
        </span>
        <span className="lp-mono text-[10.5px] text-[#7F979F]">inv-2041 · {STAGES[phase].label.toLowerCase()}</span>
      </div>

      <div className="relative">
        {/* rail (desktop) — spans from the first to the last stage centre */}
        <div className="hidden md:block absolute left-[8.33%] right-[8.33%] top-[22px] h-[2px] rounded-full bg-[#D3EFF2]">
          <div className="h-full rounded-full transition-[width] duration-700 ease-spring"
            style={{ width: `${pct}%`, backgroundImage: 'linear-gradient(90deg,#22BCCB,#2F5BF0,#14b8a6,#10b981)' }} />
          <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#0B8E9E] transition-[left] duration-700 ease-spring
                           shadow-[0_0_0_5px_rgba(20,170,190,0.15),0_0_16px_2px_rgba(20,170,190,0.45)]"
            style={{ left: `${pct}%` }} />
        </div>

        <ol className="relative grid grid-cols-3 md:grid-cols-6 gap-y-5">
          {STAGES.map((s, i) => {
            const state = i < phase ? 'done' : i === phase ? 'active' : 'todo'
            return (
              <li key={s.key} className="flex flex-col items-center text-center">
                <span className={`relative w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-500
                                  ${state === 'todo' ? 'bg-white border-[#D3EFF2] text-[#9DB1B7]' : 'border-transparent'}`}
                  style={state === 'todo' ? undefined : {
                    color: state === 'active' ? '#fff' : s.color,
                    background: state === 'active' ? s.color : `color-mix(in srgb, ${s.color} 16%, white)`,
                    boxShadow: state === 'active' ? `0 0 0 5px ${s.color}33, 0 10px 30px ${s.color}88` : 'none',
                  }}>
                  {state === 'done' ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon d={s.icon} className="w-[18px] h-[18px]" strokeWidth={2} />}
                </span>
                <span className={`mt-2.5 text-[13px] font-semibold transition-colors ${state === 'todo' ? 'text-[#9DB1B7]' : 'text-[#0C2530]'}`}>{s.label}</span>
                <span className="hidden sm:block text-[11px] text-[#7F979F]">{s.sub}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

/* ═══ HERO ════════════════════════════════════════════════════════════════ */
export default function Hero({ onStart, onPricing }) {
  // 6 stages + one extra tick holding the finished (signed) state
  const [step, , ref] = useCycle(STAGES.length + 1, 1700)
  const phase = Math.min(step, LAST)

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative bg-[#E9FBFC] text-[#0C2530] overflow-clip pt-28 md:pt-32 pb-40">
      <Aurora />

      <div className="relative max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.02fr_1fr] gap-10 lg:gap-6 items-center">
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full bg-white/75 border border-white pl-1.5 pr-3.5 py-1 backdrop-blur shadow-sm">
              <span className="lp-mono text-[10px] font-bold text-white rounded-full px-2 py-0.5"
                style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0,#0B8E9E)' }}>NEW</span>
              <span className="text-[12.5px] text-[#435E68]">{ANNOUNCEMENT.replace(/^New:\s*/, '')}</span>
            </p>

            <h1 id="hero-title"
              className="mt-7 text-[42px] leading-[0.98] sm:text-[58px] lg:text-[48px] xl:text-[60px] font-bold tracking-tightest">
              Create, send
              <br />
              &amp; sign —
              <br />
              <GradientText className="sm:whitespace-nowrap">document automation</GradientText>
              <br />
              done right.
            </h1>

            <p className="mt-7 text-[17px] sm:text-[18px] leading-relaxed text-[#4A6670] max-w-[34rem]">
              Design PDF templates, build branded emails, collect e-signatures, analyse your workflow
              and track every action in one platform — with feature access tailored per organisation.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GlowButton onClick={onStart}>Get Started Free</GlowButton>
              <GlassButton onClick={onPricing}>View pricing</GlassButton>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {HERO_NOTES.map(t => (
                <li key={t} className="flex items-center gap-1.5 text-[13px] text-[#587079]">
                  <span className="w-4 h-4 rounded-full bg-teal-50 text-teal-600 ring-1 ring-teal-100 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true"><LiveDocument phase={phase} /></div>
        </div>

        <div aria-hidden="true" className="mt-12 md:mt-6"><Pipeline phase={phase} /></div>
      </div>
    </section>
  )
}
