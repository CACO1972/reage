import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmileSimulationProps {
  restImageUrl: string;
  smileImageUrl: string | null;
  analysisId?: string;
}

export function SmileSimulation({ restImageUrl, smileImageUrl, analysisId }: SmileSimulationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSmile, setGeneratedSmile] = useState<string | null>(smileImageUrl);
  const [showComparison, setShowComparison] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setGeneratedSmile(smileImageUrl);
  }, [smileImageUrl]);

  const generateSmileWithAI = async () => {
    if (!analysisId) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-smile-simulation', {
        body: { analysisId, restImageUrl }
      });

      if (invokeError) throw invokeError;
      
      if (data?.smileImageUrl) {
        setGeneratedSmile(data.smileImageUrl);
        toast({
          title: '✨ Simulación generada',
          description: 'Tu sonrisa ha sido simulada con IA'
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Error al generar simulación');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo generar la simulación'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // If no smile image yet, show generation UI
  if (!generatedSmile) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-card">
          <img 
            src={restImageUrl} 
            alt="Tu rostro"
            className="w-full h-full object-cover"
          />
          
          {/* Overlay for generation */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6">
            {isGenerating ? (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <Loader2 className="w-20 h-20 text-primary animate-spin" />
                  <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-white font-medium mb-1">Generando sonrisa con IA...</p>
                <p className="text-white/60 text-sm">Esto puede tomar unos segundos</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-white/80 text-sm mb-3">{error}</p>
                <Button onClick={generateSmileWithAI} variant="outline" size="sm">
                  Reintentar
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                className="text-center w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Wand2 className="w-10 h-10 text-primary mx-auto mb-3" />
                <h4 className="text-white font-semibold mb-2">Simulación de Sonrisa</h4>
                <p className="text-white/60 text-sm mb-4">
                  Nuestra IA generará una simulación realista de cómo podría lucir tu sonrisa
                </p>
                <Button 
                  onClick={generateSmileWithAI}
                  className="w-full"
                  disabled={!analysisId}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar Simulación IA
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show comparison between rest and smile
  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 p-1 rounded-xl bg-muted/50">
        <button
          onClick={() => setShowComparison(true)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            showComparison 
              ? 'bg-primary text-primary-foreground shadow' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Comparación
        </button>
        <button
          onClick={() => setShowComparison(false)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            !showComparison 
              ? 'bg-primary text-primary-foreground shadow' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Solo Sonrisa
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showComparison ? (
          <motion.div
            key="comparison"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* Rest image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
              <img 
                src={restImageUrl} 
                alt="Reposo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">😐</span>
                  <span className="text-white text-sm font-medium">Reposo</span>
                </div>
              </div>
            </div>

            {/* Smile image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
              <img 
                src={generatedSmile} 
                alt="Sonrisa simulada"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-primary text-sm font-medium">Simulación IA</span>
                </div>
              </div>
              {/* AI badge */}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40">
                <span className="text-[10px] font-medium text-primary">✨ IA</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="smile-only"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-2xl overflow-hidden aspect-[3/4]"
          >
            <img 
              src={generatedSmile} 
              alt="Sonrisa simulada"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Simulación IA</span>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
              <p className="text-white text-center text-sm">
                Proyección de sonrisa generada con inteligencia artificial
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info card */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Simulación con IA</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta proyección es orientativa y muestra una aproximación de cómo podría lucir tu sonrisa. 
              Los resultados reales pueden variar según el tratamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}