import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, Gift, Ticket, Loader2 } from 'lucide-react';

interface PremiumUpgradeProps {
  analysisId: string;
  onSuccess?: () => void;
}

export function PremiumUpgrade({ analysisId, onSuccess }: PremiumUpgradeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/30 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Desbloquea Premium</h3>
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
            <p className="font-medium">Métricas Detalladas</p>
            <p className="text-sm text-muted-foreground">Tercios faciales, línea media, proporciones</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Recomendaciones IA</p>
            <p className="text-sm text-muted-foreground">Sugerencias personalizadas</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Informe PDF</p>
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
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-primary">$5.990</span>
        <span className="text-muted-foreground">CLP</span>
      </div>

      <Button 
        onClick={handleUpgrade} 
        disabled={isLoading}
        className="w-full h-12 text-base font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Obtener Premium
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-3">
        Pago seguro con Flow · Sin suscripciones
      </p>
    </div>
  );
}