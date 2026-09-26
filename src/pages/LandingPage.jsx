import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PublicNavbar from '../components/layout/PublicNavbar'
import Hero from '../components/landing/Hero'
import ControlPlane, { TrustStrip } from '../components/landing/ControlPlane'
import { WhyBraify, Comparison, Capabilities } from '../components/landing/Platform'
import { FeatureTabs, Roles, Quickstart } from '../components/landing/Workflows'
import Pricing from '../components/landing/Pricing'
import { FinalCta, Footer } from '../components/landing/Closing'

/* ═══ MAIN PAGE ════════════════════════════════════════════════════════════
 * Flow: hero diagram → document workspace → trust strip → why Braify →
 * 01 missing layer → 02 capabilities → 03 feature tabs → 04 roles →
 * 05 quickstart → 06 pricing → closing CTA → footer. */
export default function LandingPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const pricingRef     = useRef(null)

  const scrollTo = ref => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const start = () => navigate('/get-started')
  const toPricing = () => scrollTo(pricingRef)

  // Scroll to pricing when redirected from feature pages via /?pricing=1
  useEffect(() => {
    if (searchParams.get('pricing') === '1') {
      const t = setTimeout(() => scrollTo(pricingRef), 100)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#F4FDFE] font-sans text-[#0C2530] overflow-x-hidden">
      <PublicNavbar onPricingClick={toPricing} />

      <main>
        <Hero onStart={start} onPricing={toPricing} />
        <ControlPlane />
        <TrustStrip />
        <WhyBraify onStart={start} />
        <Comparison />
        <Capabilities onStart={start} />
        <FeatureTabs onStart={start} />
        <Roles />
        <Quickstart />
        <Pricing ref={pricingRef} onNavigate={navigate} />
        <FinalCta onStart={start} onPricing={toPricing} />
      </main>

      <Footer />
    </div>
  )
}
