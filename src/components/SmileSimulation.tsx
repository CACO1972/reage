import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SmileSimulationProps {
  restImageUrl: string;
  smileImageUrl: string;
}

export function SmileSimulation({ restImageUrl, smileImageUrl }: SmileSimulationProps) {
  const [blendValue, setBlendValue] = useState(0); // 0 = rest, 100 = smile
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const animationRef = useRef<number | null>(null);

  // Smooth animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setBlendValue(prev => {
        if (direction === 'forward') {
          if (prev >= 100) {
            setDirection('backward');
            return 100;
          }
          return prev + 0.8;
        } else {
          if (prev <= 0) {
            setDirection('forward');
            return 0;
          }
          return prev - 0.8;
        }
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, direction]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const reset = () => {
    setBlendValue(0);
    setDirection('forward');
    setIsPlaying(true);
  };

  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false);
    setBlendValue(value[0]);
  };

  const smileOpacity = blendValue / 100;
  const isSmiling = blendValue > 50;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-card">
        {/* Rest image (base layer) */}
        <div className="absolute inset-0">
          <img 
            src={restImageUrl} 
            alt="Rostro en reposo"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Smile image (overlay with opacity) */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: smileOpacity }}
        >
          <img 
            src={smileImageUrl} 
            alt="Sonrisa"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Animated particles when smiling */}
        <AnimatePresence>
          {isSmiling && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                  style={{
                    left: `${30 + Math.random() * 40}%`,
                    top: `${40 + Math.random() * 30}%`,
                  }}
                  initial={{ opacity: 0, scale: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0.5],
                    y: -30 - Math.random() * 20,
                    x: (Math.random() - 0.5) * 30
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Blend indicator badge */}
        <motion.div 
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/30"
          animate={{ scale: isSmiling ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 transition-colors ${isSmiling ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-sm font-semibold">
              {Math.round(blendValue)}%
            </span>
          </div>
        </motion.div>

        {/* State indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <motion.div 
            className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/20"
            animate={{ 
              backgroundColor: isSmiling ? 'rgba(212, 168, 83, 0.2)' : 'rgba(0, 0, 0, 0.6)'
            }}
          >
            <motion.div 
              className={`w-2 h-2 rounded-full ${isSmiling ? 'bg-primary' : 'bg-muted-foreground'}`}
              animate={{ scale: isSmiling ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.5, repeat: isSmiling ? Infinity : 0 }}
            />
            <span className="text-sm font-medium">
              {isSmiling ? '😊 Sonriendo' : '😐 Reposo'}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Simulación de Sonrisa</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="h-8 px-3"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Animar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Manual slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Reposo</span>
            <span>Sonrisa completa</span>
          </div>
          <Slider
            value={[blendValue]}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Desliza o deja que se anime automáticamente para ver la transición
        </p>
      </div>
    </div>
  );
}