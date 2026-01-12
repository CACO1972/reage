import { Suspense, lazy, useState } from 'react';
import HeroContent from '@/components/HeroContent';
import BenefitsSection from '@/components/BenefitsSection';
import FAQSection from '@/components/FAQSection';
import TrustSection from '@/components/TrustSection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SplashScreen from '@/components/SplashScreen';

// Lazy load the heavy 3D scene
const ParticleScene = lazy(() => import('@/components/ParticleScene'));

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {/* Fixed Header */}
      <Header />
      
      <main className="relative min-h-screen overflow-hidden bg-background">
        {/* 3D Particle Background */}
        <Suspense fallback={
          <div className="absolute inset-0 bg-background" />
        }>
          <ParticleScene />
        </Suspense>

        {/* Gradient Overlays for depth */}
        <div className="pointer-events-none absolute inset-0 z-[1]">
          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-background via-background/50 to-transparent" />
          {/* Radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,hsl(var(--background))_80%)] opacity-60" />
        </div>

        {/* Hero Content - add padding for fixed header */}
        <div className="pt-16">
          <HeroContent />
        </div>
        
        {/* Benefits & Pricing */}
        <div id="beneficios">
          <BenefitsSection />
        </div>
        
        {/* FAQ Section */}
        <FAQSection />
        
        {/* Trust & Credibility */}
        <div id="confianza">
          <TrustSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Index;
