import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SimplifiedSmileSimulationProps {
  restImageUrl: string;
  smileImageUrl: string | null;
  analysisId?: string;
}

export function SimplifiedSmileSimulation({ restImageUrl, smileImageUrl, analysisId }: SimplifiedSmileSimulationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSmile, setGeneratedSmile] = useState<string | null>(smileImageUrl);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setGeneratedSmile(smileImageUrl);
  }, [smileImageUrl]);

  const generateSmileWithAI = async () => {
    if (!analysisId) return;
    
    setIsGenerating(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-smile-simulation', {
        body: { analysisId, restImageUrl }
      });

      if (invokeError) throw invokeError;
      
      if (data?.smileImageUrl) {
        setGeneratedSmile(data.smileImageUrl);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  // If no smile image yet, show generation UI
  if (!generatedSmile) {
    return (
      <motion.div 
        className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <img 
          src={restImageUrl} 
          alt="Tu rostro"
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-end p-8">
          {isGenerating ? (
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-white font-medium">Generando simulación...</p>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Wand2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="text-white text-xl font-semibold mb-2">Visualiza tu Sonrisa</h4>
              <p className="text-white/70 text-sm mb-6">
                Nuestra IA puede mostrarte cómo podría lucir tu sonrisa ideal
              </p>
              <Button 
                onClick={generateSmileWithAI}
                size="lg"
                className="w-full"
                disabled={!analysisId}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generar Simulación IA
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Before/After Slider
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div 
        className="relative rounded-3xl overflow-hidden aspect-[3/4] cursor-ew-resize select-none"
        onMouseMove={handleSliderMove}
        onTouchMove={handleSliderMove}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* Before (Rest) Image - Full background */}
        <img 
          src={restImageUrl} 
          alt="Antes"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* After (Smile) Image - Revealed by slider */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={generatedSmile} 
            alt="Después"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-xl"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-gray-600 -mr-1" />
            <ChevronRight className="w-4 h-4 text-gray-600 -ml-1" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
          <span className="text-white text-sm font-medium">Antes</span>
        </div>
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm">
          <span className="text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Simulación IA
          </span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-muted-foreground">
        Desliza para comparar antes y después
      </p>
    </motion.div>
  );
}