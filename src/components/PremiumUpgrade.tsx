import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, Gift, Ticket, Loader2, Clock, Users, Shield, Zap } from 'lucide-react';

interface PremiumUpgradeProps {
  analysisId: string;
  onSuccess?: () => void;
}

// Countdown hook - expires at midnight
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      
      const diff = midnight.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

export function PremiumUpgrade({ analysisId, onSuccess }: PremiumUpgradeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const countdown = useCountdown();

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-flow-payment', {
        body: {
          analysisId,
          returnUrl: `${window.location.origin}/result/${analysisId}?payment=success`
        }
      });

      if (error) throw error;

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al procesar',
        description: error.message || 'Inténtalo de nuevo.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/30 p-6 backdrop-blur-sm overflow-hidden relative">
      {/* Urgency Banner */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 py-2 px-4">
        <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>Oferta termina en</span>
          <span className="font-mono font-bold">
            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Desbloquea Premium</h3>
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">
            847 personas ya lo tienen hoy
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Modelo 3D Facial</p>
              <p className="text-sm text-muted-foreground">Visualiza tu rostro en 3D interactivo</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">246 Métricas Detalladas</p>
              <p className="text-sm text-muted-foreground">Tercios faciales, línea media, proporciones</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Recomendaciones Personalizadas</p>
              <p className="text-sm text-muted-foreground">Plan de acción específico para ti</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Informe PDF Profesional</p>
              <p className="text-sm text-muted-foreground">Descarga y comparte tu análisis</p>
            </div>
          </div>

          <div className="pt-3 border-t border-primary/20">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary">+1 Análisis Básico Gratis</p>
                <p className="text-sm text-muted-foreground">Para ti o para compartir</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Ticket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">20% Dcto. Clínica Miro</p>
              <p className="text-sm text-muted-foreground">
                Evaluación presencial (valor $49.000)
              </p>
            </div>
          </div>

          {/* Investment Notice */}
          <div className="pt-3 mt-2 border-t border-primary/20">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <p className="text-xs text-center text-white/80 leading-relaxed">
                💡 <span className="font-medium text-emerald-400">Inversión inteligente:</span> el costo de 
                este informe + la evaluación se abonan al tratamiento si decides realizarlo.
              </p>
            </div>
          </div>
        </div>

        {/* Price with Anchor */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-lg text-muted-foreground line-through">$12.990</span>
          <span className="text-3xl font-bold text-primary">$5.990</span>
          <span className="text-sm text-muted-foreground">CLP</span>
          <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
            -54%
          </span>
        </div>

        <Button 
          onClick={handleUpgrade} 
          disabled={isLoading}
          className="w-full h-14 text-base font-semibold relative overflow-hidden group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Obtener Premium Ahora
            </>
          )}
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </Button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            <span>Resultado inmediato</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Sin suscripciones · Acceso de por vida
        </p>
      </div>
    </div>
  );
}