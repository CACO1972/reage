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
    <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="animate-fade-up mb-8">
        <img 
          src={logoSimetria} 
          alt="Simetría" 
          className="h-32 w-auto md:h-44"
        />
      </div>

      {/* Badge */}
      <div className="animate-fade-up mb-6" style={{ animationDelay: '0.05s' }}>
        <span className="inline-block rounded-full bg-white/5 border border-white/10 px-5 py-2 text-xs font-medium text-white/70 tracking-widest uppercase">
          Patent Pending · HUMANA.AI
        </span>
      </div>

      {/* Headline - Playfair Display for elegance */}
      <h1 
        className="animate-fade-up text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight"
        style={{ 
          animationDelay: '0.1s',
          fontFamily: '"Playfair Display", serif',
          fontWeight: 500,
        }}
      >
        <span className="text-white">Tu armonía.</span>
        <br />
        <span 
          className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent italic"
        >
          No la de los libros.
        </span>
      </h1>

      {/* Subheadline */}
      <p className="animate-fade-up mt-6 max-w-lg text-lg md:text-xl text-white/60 leading-relaxed" style={{ animationDelay: '0.2s' }}>
        Análisis dentofacial con IA que se adapta a ti, no tú a él.
        <br />
        <span className="text-white/80 font-medium">Descubre tu potencial facial.</span>
      </p>

      {/* CTA Button */}
      <div className="animate-fade-up mt-10" style={{ animationDelay: '0.3s' }}>
        <Button 
          variant="hero" 
          size="lg" 
          className="group text-base px-10 py-7"
          onClick={handleCTA}
        >
          Comenzar mi Análisis
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Microcopy */}
      <p className="animate-fade-up mt-6 text-sm text-white/50 tracking-wide" style={{ animationDelay: '0.4s' }}>
        Gratis · 4 minutos · Sin filtros
      </p>

      {/* Scroll indicator */}
      <div className="animate-fade-up absolute bottom-10 left-1/2 -translate-x-1/2" style={{ animationDelay: '0.6s' }}>
        <div className="flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs uppercase tracking-widest">Descubre más</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}
