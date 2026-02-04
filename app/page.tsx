"use client"

import { Suspense, lazy, useState } from 'react'
import HeroContent from '@/components/HeroContent'
import HowItWorksSection from '@/components/HowItWorksSection'
import DifferentiatorSection from '@/components/DifferentiatorSection'
import ProcessStepsSection from '@/components/ProcessStepsSection'
import BenefitsSection from '@/components/BenefitsSection'
import FinalCTASection from '@/components/FinalCTASection'
import FAQSection from '@/components/FAQSection'
import TrustSection from '@/components/TrustSection'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SplashScreen from '@/components/SplashScreen'

const ParticleScene = lazy(() => import('@/components/ParticleScene'))

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <Header />
      
      <main className="relative min-h-screen overflow-hidden bg-background">
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <ParticleScene />
        </Suspense>

        <div className="pointer-events-none absolute inset-0 z-[1]">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,hsl(var(--background))_80%)] opacity-60" />
        </div>

        <div className="pt-16">
          <HeroContent />
        </div>
        
        <HowItWorksSection />
        <DifferentiatorSection />
        <ProcessStepsSection />
        
        <div id="beneficios">
          <BenefitsSection />
        </div>
        
        <FinalCTASection />
        <FAQSection />
        
        <div id="confianza">
          <TrustSection />
        </div>
      </main>

      <Footer />
    </>
  )
}
