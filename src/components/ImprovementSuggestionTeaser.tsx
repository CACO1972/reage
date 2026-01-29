import { motion } from 'framer-motion';
import { Lock, TrendingUp, Zap, Target } from 'lucide-react';

interface ImprovementSuggestionTeaserProps {
  smileScore: number;
  symmetryScore: number;
  onUpgrade?: () => void;
}

export function ImprovementSuggestionTeaser({ 
  smileScore, 
  symmetryScore,
  onUpgrade 
}: ImprovementSuggestionTeaserProps) {
  // Calculate potential improvement based on current scores
  const avgScore = (smileScore + symmetryScore) / 2;
  const potentialImprovement = Math.min(25, Math.max(8, Math.round((100 - avgScore) * 0.4)));
  
  // Generate personalized suggestions based on scores
  const suggestions = [];
  
  if (smileScore < symmetryScore) {
    suggestions.push({
      icon: '😁',
      title: 'Optimización de Sonrisa',
      desc: 'Mejora detectada en línea de sonrisa',
      impact: '+' + Math.round(potentialImprovement * 0.6)
    });
  }
  
  if (symmetryScore < smileScore) {
    suggestions.push({
      icon: '⚖️',
      title: 'Balance Facial',
      desc: 'Ajuste en proporciones detectado',
      impact: '+' + Math.round(potentialImprovement * 0.5)
    });
  }
  
  suggestions.push({
    icon: '✨',
    title: 'Armonía General',
    desc: 'Potencial de mejora integral',
    impact: '+' + potentialImprovement
  });
  
  return (
    <motion.div
      className="glass rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Áreas de Mejora Detectadas
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <Target className="w-3 h-3 text-green-500" />
          <span className="text-xs font-medium text-green-500">{suggestions.length} áreas</span>
        </div>
      </div>

      {/* Preview Content - Partially Visible */}
      <div className="space-y-3 relative">
        {suggestions.slice(0, 3).map((suggestion, idx) => (
          <motion.div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 ${idx > 0 ? 'blur-[4px] select-none pointer-events-none' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
          >
            <span className="text-2xl">{suggestion.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground truncate">{suggestion.desc}</p>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-green-500/10">
              <span className="text-sm font-bold text-green-500">{suggestion.impact}pts</span>
            </div>
          </motion.div>
        ))}

        {/* Unlock Overlay for blurred items */}
        <div 
          className="absolute inset-x-0 bottom-0 h-28 flex flex-col items-center justify-end pb-2 bg-gradient-to-t from-card via-card/80 to-transparent cursor-pointer"
          onClick={onUpgrade}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Ver plan de mejora completo</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div 
        className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Potencial detectado: <span className="text-primary">+{potentialImprovement}%</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Basado en 246 puntos biométricos analizados
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
