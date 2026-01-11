import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, Sparkles, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logoSimetria from '@/assets/logo-simetria.png';

const flowSteps = [
  { icon: Camera, label: 'Captura', description: 'Toma 2 fotos simples' },
  { icon: Sparkles, label: 'Análisis IA', description: 'Procesamos con IA' },
  { icon: FileCheck, label: 'Resultados', description: 'Métricas al instante' },
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
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-24 text-center">
      {/* Logo - doubled size */}
      <div className="animate-fade-up mb-6">
        <img 
          src={logoSimetria} 
          alt="Simetría" 
          className="h-56 w-auto md:h-72 lg:h-88"
        />
      </div>

      {/* Headline */}
      <h1 className="animate-fade-up font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl" style={{ animationDelay: '0.1s' }}>
        Analiza tu rostro y sonrisa con IA
      </h1>

      {/* Subheadline */}
      <h2 className="animate-fade-up mt-6 max-w-lg text-lg font-light leading-relaxed text-white/90 md:text-xl" style={{ animationDelay: '0.2s' }}>
        Obtén un informe estético personalizado, con simulación y recomendaciones, en minutos.
      </h2>

      {/* Microcopy */}
      <p className="animate-fade-up mt-4 text-sm text-white/60 tracking-wide" style={{ animationDelay: '0.25s' }}>
        Pago único · Sin suscripción · Informe descargable en PDF
      </p>

      {/* App Flow Animation */}
      <div className="animate-fade-up mt-12 w-full max-w-md" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between">
          {flowSteps.map((step, index) => (
            <div key={step.label} className="flex flex-col items-center">
              <div 
                className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-500 hover:bg-primary/20 hover:border-primary/50 hover:scale-110"
                style={{ 
                  animation: `pulse-glow 3s ease-in-out infinite`,
                  animationDelay: `${index * 0.5}s`
                }}
              >
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-sm font-medium text-white">{step.label}</span>
              <span className="text-xs text-white/60 mt-1">{step.description}</span>
              
              {/* Connector line */}
              {index < flowSteps.length - 1 && (
                <div className="absolute" style={{ left: `${(index + 1) * 33}%`, top: '2rem' }}>
                  <div 
                    className="h-px w-12 bg-gradient-to-r from-primary/60 to-white/30"
                    style={{
                      animation: 'flow-line 2s ease-in-out infinite',
                      animationDelay: `${index * 0.3}s`
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Flow lines between steps */}
        <div className="relative -mt-[4.5rem] mx-auto w-[70%] flex justify-between px-2 pointer-events-none">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>

      {/* CTA Button */}
      <div className="animate-fade-up mt-10" style={{ animationDelay: '0.4s' }}>
        <Button 
          variant="hero" 
          size="lg" 
          className="group"
          onClick={handleCTA}
        >
          Analizar mi rostro y sonrisa ahora
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary), 0); }
          50% { box-shadow: 0 0 20px 4px rgba(201, 158, 80, 0.3); }
        }
        @keyframes flow-line {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.1); }
        }
      `}</style>
    </div>
  );
}
