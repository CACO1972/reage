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
      <div className="animate-fade-up mb-6">
        <img 
          src={logoSimetria} 
          alt="Simetría" 
          className="h-40 w-auto md:h-56"
        />
      </div>

      {/* Tagline - premium feel */}
      <div className="animate-fade-up mb-4" style={{ animationDelay: '0.05s' }}>
        <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[11px] font-medium text-primary tracking-wide">
          ANÁLISIS FACIAL CON INTELIGENCIA ARTIFICIAL
        </span>
      </div>

      {/* Headline - impactful & emotional */}
      <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl leading-[1.1]" style={{ animationDelay: '0.1s' }}>
        Descubre el potencial
        <br />
        <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
          de tu sonrisa
        </span>
      </h1>

      {/* Subheadline - value proposition */}
      <p className="animate-fade-up mt-5 max-w-md text-base text-white/60 md:text-lg leading-relaxed" style={{ animationDelay: '0.2s' }}>
        Obtén un análisis estético profesional de tu rostro y sonrisa.
        <span className="text-white/80 font-medium"> Resultados en minutos.</span>
      </p>

      {/* CTA Button */}
      <div className="animate-fade-up mt-10" style={{ animationDelay: '0.3s' }}>
        <Button 
          variant="hero" 
          size="lg" 
          className="group text-base px-8 py-6"
          onClick={handleCTA}
        >
          Comenzar gratis
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Flow Steps */}
      <div className="animate-fade-up mt-14 flex items-center gap-8 md:gap-12" style={{ animationDelay: '0.4s' }}>
        {flowSteps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-sm">
              <step.icon className="h-7 w-7 text-white/70" />
            </div>
            <span className="text-sm font-medium text-white/70">{step.label}</span>
            {index < flowSteps.length - 1 && (
              <div className="absolute" style={{ marginLeft: '5rem' }}>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Microcopy - trust signals - clarify the funnel */}
      <div className="animate-fade-up mt-10 flex flex-col items-center gap-3" style={{ animationDelay: '0.5s' }}>
        <p className="text-base font-medium text-white/80">
          ✨ <span className="text-emerald-400">Paso 1: Análisis digital gratis</span>
        </p>
        <p className="text-sm text-white/60">
          Luego: Informe Premium $5.990 → Evaluación Clínica con 20% dcto.
        </p>
        <p className="text-sm text-white/70 mt-1">
          Sin suscripción · Pago único · Resultados inmediatos
        </p>
      </div>
    </div>
  );
}
