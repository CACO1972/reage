import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function FinalCTASection() {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(23);

  // Simulate decreasing spots for scarcity
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft(prev => {
        if (prev <= 5) return 23; // Reset when too low
        const decrease = Math.random() > 0.7 ? 1 : 0;
        return prev - decrease;
      });
    }, 30000);
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
    <section className="relative z-10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Scarcity Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive mb-8">
            <Clock className="w-4 h-4" />
            <span>Solo {spotsLeft} análisis gratuitos hoy</span>
          </div>

          {/* Title */}
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight mb-8"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}
          >
            Tu rostro ya tiene armonía.
            <br />
            <span className="italic bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              Solo necesitas verla.
            </span>
          </h2>

          {/* CTA Button */}
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
                Descubrirla Ahora — Es Gratis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          </Button>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-sm">
              <Shield className="w-4 h-4 text-accent" />
              <span>100% Privado</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span>Resultado en 4 min</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Sin registro</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground/70 font-medium">2,847 personas</span> ya descubrieron la suya
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}