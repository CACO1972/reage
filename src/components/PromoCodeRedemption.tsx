import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoCodeRedemptionProps {
  analysisId?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export function PromoCodeRedemption({ analysisId, onSuccess, compact = false }: PromoCodeRedemptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error('Ingresa un código promocional');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('redeem-promo-code', {
        body: { code: code.trim(), analysisId },
      });

      if (error) {
        console.error('Edge function error:', error);
        setStatus('error');
        setMessage('Error al conectar con el servidor');
        return;
      }

      if (data.success) {
        setStatus('success');
        setMessage(data.message || '¡Código canjeado exitosamente!');
        toast.success('🎉 ' + (data.message || '¡Código canjeado!'));
        
        // Reset after success
        setTimeout(() => {
          setCode('');
          setIsOpen(false);
          setStatus('idle');
          onSuccess?.();
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Código inválido');
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setStatus('error');
      setMessage('Error al procesar el código');
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Gift className="w-4 h-4" />
          <span>¿Tienes un código promocional?</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CODIGO2024"
                  className="flex-1 uppercase tracking-wider font-mono"
                  maxLength={20}
                  disabled={isLoading || status === 'success'}
                />
                <Button
                  onClick={handleRedeem}
                  disabled={isLoading || !code.trim() || status === 'success'}
                  size="sm"
                  variant={status === 'success' ? 'default' : 'secondary'}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    'Canjear'
                  )}
                </Button>
              </div>
              
              <AnimatePresence>
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs mt-2 ${
                      status === 'success' ? 'text-green-500' : 'text-destructive'
                    }`}
                  >
                    {status === 'success' ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Código Promocional</h3>
          <p className="text-xs text-muted-foreground">Desbloquea tu informe premium gratis</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ingresa tu código aquí"
            className="uppercase tracking-widest font-mono text-center text-lg py-6 pr-12 bg-background/50"
            maxLength={20}
            disabled={isLoading || status === 'success'}
          />
          {code && (
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
          )}
        </div>

        <Button
          onClick={handleRedeem}
          disabled={isLoading || !code.trim() || status === 'success'}
          className="w-full gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              ¡Desbloqueado!
            </>
          ) : (
            <>
              <Gift className="w-4 h-4" />
              Canjear Código
            </>
          )}
        </Button>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                status === 'success' 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
