import { Hero } from '@/components/landing/Hero'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { FeatureBento } from '@/components/landing/FeatureBento'
import { FeatureBlocks } from '@/components/landing/FeatureBlocks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeatureBento />
      <FeatureBlocks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  )
}
