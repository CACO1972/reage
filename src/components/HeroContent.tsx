import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, Sparkles, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logoSimetria from '@/assets/logo-simetria.png';

const flowSteps = [
  { icon: Camera, label: 'Captura' },
  { icon: Sparkles, label: 'Análisis IA' },
  { icon: FileCheck, label: 'Resultados' },
];

export default function HeroContent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/scan');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="animate-fade-up mb-8">
        <img 
          src={logoSimetria} 
          alt="Simetría" 
          className="h-48 w-auto md:h-64"
        />
      </div>

      {/* Headline - Apple style: short & impactful */}
      <h1 className="animate-fade-up font-display text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl" style={{ animationDelay: '0.1s' }}>
        Analiza tu rostro y sonrisa con IA
      </h1>

      {/* Subheadline - minimal */}
      <p className="animate-fade-up mt-4 max-w-sm text-base text-white/70 md:text-lg" style={{ animationDelay: '0.2s' }}>
        Informe estético personalizado en minutos.
      </p>

      {/* CTA Button - positioned clearly below text */}
      <div className="animate-fade-up mt-10" style={{ animationDelay: '0.3s' }}>
        <Button 
          variant="hero" 
          size="lg" 
          className="group"
          onClick={handleCTA}
        >
          Comenzar análisis
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Flow Steps - simple, below CTA */}
      <div className="animate-fade-up mt-16 flex items-center gap-8" style={{ animationDelay: '0.4s' }}>
        {flowSteps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <step.icon className="h-5 w-5 text-white/60" />
            </div>
            <span className="text-xs text-white/50">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Microcopy */}
      <p className="animate-fade-up mt-8 text-xs text-white/40" style={{ animationDelay: '0.5s' }}>
        Informe gratis disponible · Premium desde $5.990
      </p>
    </div>
  );
}
