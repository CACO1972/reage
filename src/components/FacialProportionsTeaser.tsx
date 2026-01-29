import { motion } from 'framer-motion';
import { Lock, Ruler, Sparkles } from 'lucide-react';

interface FacialProportionsTeaserProps {
  facialThirds?: { upper: number; middle: number; lower: number } | null;
  symmetryScore?: number;
  onUpgrade?: () => void;
}

export function FacialProportionsTeaser({ 
  facialThirds, 
  symmetryScore,
  onUpgrade 
}: FacialProportionsTeaserProps) {
  // Calculate how close to ideal proportions (33.3% each)
  const idealDeviation = facialThirds 
    ? Math.abs(facialThirds.upper - 33.3) + Math.abs(facialThirds.middle - 33.3) + Math.abs(facialThirds.lower - 33.3)
    : 0;
  
  const proportionScore = Math.max(0, 100 - idealDeviation * 2);
  
  return (
    <motion.div
      className="glass rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          Proporciones Faciales
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Lock className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-primary">Premium</span>
        </div>
      </div>

      {/* Preview Content - Blurred */}
      <div className="relative">
        <div className="blur-[6px] select-none pointer-events-none">
          {/* Facial Thirds Bars */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Superior</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                  style={{ width: `${facialThirds?.upper || 33}%` }}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">{facialThirds?.upper?.toFixed(1) || '33.0'}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Medio</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                  style={{ width: `${facialThirds?.middle || 33}%` }}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">{facialThirds?.middle?.toFixed(1) || '33.0'}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Inferior</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                  style={{ width: `${facialThirds?.lower || 33}%` }}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">{facialThirds?.lower?.toFixed(1) || '33.0'}%</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <span className="text-sm">Armonía Facial</span>
            <span className="text-lg font-bold text-primary">{proportionScore.toFixed(0)}%</span>
          </div>
        </div>

        {/* Unlock Overlay */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card/90 to-transparent cursor-pointer"
          onClick={onUpgrade}
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Desbloquea tu análisis completo</p>
            <p className="text-xs text-muted-foreground mt-1">246 puntos biométricos</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
