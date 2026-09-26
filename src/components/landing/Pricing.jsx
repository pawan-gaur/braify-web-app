import { forwardRef, useState } from 'react'
import { Reveal, SectionHead, Check, Cross, Icon } from './primitives'
import { PLANS, BILLING_NOTES, FAQ } from './content'

function priceFor(plan, annual) {
  if (plan.price === 'Custom' || plan.price === '$0') return plan.price
  return annual ? `$${Math.round(parseInt(plan.price.replace('$', ''), 10) * 0.8)}` : plan.price
}

const Pricing = forwardRef(function Pricing({ onNavigate }, ref) {
  const [annual, setAnnual] = useState(false)

  return (
    <section ref={ref} id="pricing" aria-labelledby="pricing-title" className="py-24 md:py-28 scroll-mt-16 bg-gradient-to-b from-[#FBFEFE] to-[#E9FBFC] border-y border-[#D6F1F4]">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <SectionHead id="pricing-title" n="06" eyebrow="Simple, transparent pricing" title="Start free." accent="Scale when you need to.">
          All plans include core document automation. Pro is free during our beta period.
        </SectionHead>

        {/* Annual / monthly toggle */}
        <div className="flex items-center gap-3 mb-8">
          <span className={`text-sm font-semibold ${!annual ? 'text-[#0C2530]' : 'text-[#7F979F]'}`}>Monthly</span>
          <button onClick={() => setAnnual(a => !a)} role="switch" aria-checked={annual} aria-label="Bill annually"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? 'bg-brand' : 'bg-black/15'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-semibold ${annual ? 'text-[#0C2530]' : 'text-[#7F979F]'}`}>
            Annual
            <span className="ml-1.5 lp-mono text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Save 20%</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          {PLANS.map((plan, i) => {
            const price = priceFor(plan, annual)
            return (
              <Reveal as="article" key={plan.name} delay={i * 90}
                className={`relative isolate rounded-[22px] p-7 flex flex-col border bg-white transition-all
                  ${plan.highlight
                    ? 'border-transparent md:-my-3 md:py-10'
                    : 'border-black/[0.07] hover:shadow-[0_20px_50px_rgba(20,20,40,0.07)] hover:-translate-y-1'}`}>
                {plan.highlight && (
                  <>
                    {/* rotating gradient border + soft glow behind the card */}
                    <span aria-hidden="true" className="lp-conic absolute -inset-[2px] -z-10 rounded-[24px]" />
                    <span aria-hidden="true" className="lp-conic absolute -inset-2 -z-20 rounded-[30px] blur-2xl opacity-40" />
                    <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-[22px] bg-white" />
                    <span className="absolute -top-3 left-7 lp-mono text-white text-[10.5px] font-bold tracking-[0.08em] px-3 py-1 rounded-full
                                     shadow-[0_8px_20px_rgba(20,170,190,0.4)]"
                      style={{ backgroundImage: 'linear-gradient(120deg,#2F5BF0,#0B8E9E)' }}>
                      MOST POPULAR
                    </span>
                  </>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-[18px] font-bold text-[#0C2530]">{plan.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>{plan.badge}</span>
                </div>

                <p className="flex items-end gap-1.5 mb-2">
                  <span className="text-[44px] leading-none font-bold tracking-tighter text-[#0C2530]">{price}</span>
                  {plan.price !== 'Custom' && plan.price !== '$0' && (
                    <span className="text-[#7F979F] text-sm mb-1">{annual ? '/mo, billed annually' : plan.period}</span>
                  )}
                  {plan.price === '$0' && <span className="text-[#7F979F] text-sm mb-1">forever</span>}
                </p>
                <p className="text-[14px] text-[#587079] leading-relaxed mb-6">{plan.desc}</p>

                <button onClick={() => onNavigate(plan.name === 'Enterprise' ? '#' : '/get-started')}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all mb-6 ${plan.ctaStyle}`}>
                  {plan.cta}
                </button>

                <ul className="space-y-2.5 flex-1 border-t border-black/[0.06] pt-5">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${f.included ? (plan.highlight ? 'bg-brand text-white' : 'bg-[#0C2530] text-white') : 'bg-black/[0.05] text-[#AFC1C6]'}`}>
                        {f.included ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : <Cross className="w-2.5 h-2.5" />}
                      </span>
                      <span className={`text-[13px] ${f.included ? 'text-[#33505A]' : 'text-[#9DB1B7] line-through'}`}>
                        {f.text}
                        {!f.included && <span className="sr-only"> (not included)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </div>

        {/* Billing notes */}
        <ul className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 text-[12.5px] text-[#587079]">
          {BILLING_NOTES.map(item => (
            <li key={item.text} className="flex items-center gap-1.5">
              <Icon d={item.icon} className="w-4 h-4 shrink-0" color="#2F5BF0" strokeWidth={2} />
              {item.text}
            </li>
          ))}
        </ul>

        {/* FAQ */}
        <div className="mt-14">
          <h3 className="lp-mono text-[11px] font-normal tracking-[0.18em] uppercase text-[#587079] mb-4">Billing questions</h3>
          <dl className="grid md:grid-cols-3 gap-4">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={i * 80} className="rounded-[18px] bg-white border border-black/[0.07] p-6">
                <dt className="text-[15px] font-bold text-[#0C2530] mb-2">{item.q}</dt>
                <dd className="text-[13.5px] text-[#587079] leading-relaxed">{item.a}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
})

export default Pricing
