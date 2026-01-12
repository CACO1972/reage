import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, GripVertical } from 'lucide-react';

interface SmileSimulationProps {
  restImageUrl: string;
  smileImageUrl: string;
}

export function SmileSimulation({ restImageUrl, smileImageUrl }: SmileSimulationProps) {
  const [clipPosition, setClipPosition] = useState(50); // 0-100, percentage from left
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setClipPosition(percentage);
  }, []);

  const handleStart = useCallback((clientX: number) => {
    isDragging.current = true;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setClipPosition(percentage);
    }
  }, []);

  const handleEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => handleEnd();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current) {
      handleMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => handleEnd();

  const isMoreSmile = clipPosition > 50;

  return (
    <div className="space-y-4">
      {/* Comparison slider container */}
      <div 
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-card cursor-ew-resize select-none touch-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Smile image (full background) */}
        <div className="absolute inset-0">
          <img 
            src={smileImageUrl} 
            alt="Sonrisa"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        </div>
        
        {/* Rest image (clipped from left) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${clipPosition}%` }}
        >
          <img 
            src={restImageUrl} 
            alt="Rostro en reposo"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ 
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
              maxWidth: 'none'
            }}
            draggable={false}
          />
        </div>

        {/* Divider line with handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 -ml-0.5 z-10"
          style={{ left: `${clipPosition}%` }}
        >
          {/* Glowing line */}
          <div className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
          
          {/* Handle */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm
                       flex items-center justify-center shadow-xl border-2 border-primary/30"
            animate={{ 
              scale: isDragging.current ? 1.1 : 1,
              boxShadow: isDragging.current 
                ? '0 0 30px rgba(212, 168, 83, 0.6)' 
                : '0 10px 40px rgba(0, 0, 0, 0.4)'
            }}
            transition={{ duration: 0.2 }}
          >
            <GripVertical className="w-5 h-5 text-primary" />
          </motion.div>

          {/* Decorative arrows */}
          <div className="absolute top-1/2 left-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <motion.span 
              className="absolute -left-8 text-white/80 text-lg font-bold"
              animate={{ x: [-2, -6, -2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              ‹
            </motion.span>
            <motion.span 
              className="absolute left-4 text-white/80 text-lg font-bold"
              animate={{ x: [2, 6, 2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              ›
            </motion.span>
          </div>
        </div>

        {/* Labels */}
        <motion.div 
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-muted/30"
          animate={{ opacity: clipPosition > 15 ? 1 : 0 }}
        >
          <span className="text-sm font-medium">😐 Reposo</span>
        </motion.div>

        <motion.div 
          className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40"
          animate={{ opacity: clipPosition < 85 ? 1 : 0 }}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Sonrisa</span>
          </div>
        </motion.div>

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Instruction text */}
        <motion.div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/90 text-sm font-medium drop-shadow-lg">
            ← Desliza para comparar →
          </p>
        </motion.div>
      </div>

      {/* Info card */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white">Comparador de Sonrisa</h4>
            <p className="text-sm text-muted-foreground">
              {isMoreSmile ? 'Visualiza tu potencial de sonrisa' : 'Observa tu expresión natural'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className={`w-2 h-2 rounded-full ${isMoreSmile ? 'bg-primary' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {Math.round(100 - clipPosition)}% sonrisa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}