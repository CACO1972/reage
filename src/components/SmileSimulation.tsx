import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SmileSimulationProps {
  restImageUrl: string;
  smileImageUrl: string;
}

export function SmileSimulation({ restImageUrl, smileImageUrl }: SmileSimulationProps) {
  const [showSmile, setShowSmile] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSmile(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-card">
      <div className="absolute inset-0">
        <img 
          src={restImageUrl} 
          alt="Rostro en reposo"
          className="w-full h-full object-cover"
        />
      </div>
      
      <AnimatePresence>
        {showSmile && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <img 
              src={smileImageUrl} 
              alt="Sonrisa"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {showSmile ? 'Sonrisa' : 'Reposo'}
        </span>
        <div className="flex gap-1 ml-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${!showSmile ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${showSmile ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </div>
    </div>
  );
}
