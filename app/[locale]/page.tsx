import { Hero } from '@/components/landing/Hero'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { FeatureBlocks } from '@/components/landing/FeatureBlocks'
import { Testimonials } from '@/components/landing/Testimonials'
import { FAQ } from '@/components/landing/FAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeatureBlocks />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  )
}
