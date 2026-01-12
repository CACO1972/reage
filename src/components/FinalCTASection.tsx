import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function FinalCTASection() {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);

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
          {/* Title */}
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-8"
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
            className="group text-base px-10 py-7"
            onClick={handleCTA}
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Descubrirla Ahora
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>

          {/* Social Proof */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-white/50">
              <span className="text-white/70 font-medium">2,847 personas</span> ya descubrieron la suya
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
