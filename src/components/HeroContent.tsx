import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import logoSimetria from '@/assets/logo-simetria.png';

export default function HeroContent() {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usersOnline, setUsersOnline] = useState(47);

  // Simulate fluctuating "users online" for social proof
  useEffect(() => {
    const interval = setInterval(() => {
      setUsersOnline(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(30, Math.min(80, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCTA = async () => {
    if (user) {
      navigate('/scan');
    } else {
      setLoading(true);
      const { error } = await signInAnonymously();
      setLoading(false);
      if (!error) {
        navigate('/scan');
      }
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

      {/* Live Users Badge */}
      <div className="animate-fade-up mb-4" style={{ animationDelay: '0.02s' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-2 text-xs font-medium text-accent">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          {usersOnline} personas analizando ahora
        </span>
      </div>

      {/* Badge */}
      <div className="animate-fade-up mb-6" style={{ animationDelay: '0.05s' }}>
        <span className="inline-block rounded-full bg-foreground/5 border border-foreground/10 px-5 py-2 text-xs font-medium text-foreground/70 tracking-widest uppercase">
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
        <span className="text-foreground">Tu armonía.</span>
        <br />
        <span 
          className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent italic"
        >
          No la de los libros.
        </span>
      </h1>

      {/* Subheadline */}
      <p className="animate-fade-up mt-6 max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed" style={{ animationDelay: '0.2s' }}>
        Análisis dentofacial con IA que se adapta a ti, no tú a él.
        <br />
        <span className="text-foreground/80 font-medium">Descubre tu potencial facial.</span>
      </p>

      {/* Inclusivity message */}
      <p className="animate-fade-up mt-4 text-sm text-primary font-medium tracking-wide" style={{ animationDelay: '0.25s' }}>
        Para todos. Sin críticas. Sin juicios.
      </p>

      {/* CTA Button */}
      <div className="animate-fade-up mt-10" style={{ animationDelay: '0.3s' }}>
        <Button 
          variant="hero" 
          size="lg" 
          className="group text-base px-10 py-7 relative overflow-hidden"
          onClick={handleCTA}
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : (
            <>
              Descubre tu Puntuación Gratis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        </Button>
      </div>

      {/* Microcopy with urgency */}
      <div className="animate-fade-up mt-6 flex flex-col items-center gap-2" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            4 minutos
          </span>
          <span>·</span>
          <span>100% Gratis</span>
          <span>·</span>
          <span>Sin registro</span>
        </div>
        
        {/* Stars */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-primary text-primary" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">4.9 de 2,847 análisis</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="animate-fade-up absolute bottom-10 left-1/2 -translate-x-1/2" style={{ animationDelay: '0.6s' }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs uppercase tracking-widest">Descubre más</span>
          <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}