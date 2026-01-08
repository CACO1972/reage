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
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Logo - doubled size */}
      <div className="animate-fade-up mb-6">
        <img 
          src={logoSimetria} 
          alt="Simetría" 
          className="h-56 w-auto md:h-72 lg:h-88"
        />
      </div>

      {/* Slogan */}
      <p className="animate-fade-up font-display text-3xl font-extralight tracking-[0.3em] uppercase text-white md:text-4xl lg:text-5xl" style={{ animationDelay: '0.1s' }}>
        Vuelve a fluir
      </p>

      {/* Description */}
      <p className="animate-fade-up mt-8 max-w-lg text-lg font-light leading-relaxed tracking-wide text-white/80 md:text-xl" style={{ animationDelay: '0.2s' }}>
        Análisis dental y facial con <span className="text-primary font-medium">inteligencia artificial</span>. 
        <br className="hidden md:block" />
        Descubre la armonía de tu rostro.
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
          {user ? 'Iniciar Análisis' : 'Comenzar'}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="flex flex-col items-center gap-2 text-white/30">
          <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
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
