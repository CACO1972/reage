import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logoSimetria from '@/assets/logo-simetria.png';

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
      {/* Logo */}
      <div className="animate-fade-up mb-6">
        <img 
          src={logoSimetria} 
          alt="Simetría" 
          className="h-28 w-auto md:h-36 lg:h-44"
        />
      </div>

      {/* Slogan */}
      <p className="animate-fade-up-delayed font-display text-3xl font-extralight tracking-[0.3em] uppercase text-primary/90 md:text-4xl lg:text-5xl">
        Vuelve a fluir
      </p>

      {/* Description */}
      <p className="animate-fade-up-delayed-2 mt-10 max-w-lg text-lg font-light leading-relaxed tracking-wide text-foreground/70 md:text-xl">
        Análisis dental y facial con <span className="text-primary font-normal">inteligencia artificial</span>. 
        <br className="hidden md:block" />
        Descubre la armonía de tu rostro.
      </p>

      {/* CTA Button */}
      <div className="animate-fade-up-delayed-2 mt-10">
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
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
