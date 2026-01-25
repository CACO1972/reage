import { motion } from 'framer-motion';
import { Smile, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';

interface SimpleScoreDisplayProps {
  smileScore: number;
  symmetryScore: number;
}

export function SimpleScoreDisplay({ smileScore, symmetryScore }: SimpleScoreDisplayProps) {
  const overallScore = Math.round((smileScore + symmetryScore) / 2);
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { text: 'Excepcional', emoji: '🌟', color: 'text-primary' };
    if (score >= 80) return { text: 'Muy bueno', emoji: '✨', color: 'text-primary' };
    if (score >= 70) return { text: 'Bueno', emoji: '👍', color: 'text-accent' };
    if (score >= 60) return { text: 'Promedio', emoji: '📊', color: 'text-muted-foreground' };
    return { text: 'Con potencial', emoji: '🎯', color: 'text-accent' };
  };

  const getPotentialGain = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 80) return 10;
    if (score >= 70) return 15;
    if (score >= 60) return 20;
    return 25;
  };

  const scoreInfo = getScoreLabel(overallScore);
  const potentialGain = getPotentialGain(overallScore);

  return (
    <motion.div
      className="glass rounded-3xl p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main Score */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <div className="text-7xl font-bold text-primary mb-2">
          {overallScore}
          <span className="text-4xl text-primary/70">%</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">{scoreInfo.emoji}</span>
          <span className={`text-xl font-medium ${scoreInfo.color}`}>{scoreInfo.text}</span>
        </div>
      </motion.div>

      {/* Breakdown */}
      <motion.div 
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-card/50 rounded-2xl p-4">
          <Smile className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{Math.round(smileScore)}%</div>
          <div className="text-sm text-muted-foreground">Sonrisa</div>
        </div>
        <div className="bg-card/50 rounded-2xl p-4">
          <Sparkles className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{Math.round(symmetryScore)}%</div>
          <div className="text-sm text-muted-foreground">Simetría</div>
        </div>
      </motion.div>

      {/* Potential Gain - Creates desire for premium */}
      <motion.div
        className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">Potencial detectado</span>
        </div>
        <p className="text-sm text-foreground/80">
          Podrías mejorar hasta <span className="font-bold text-primary">+{potentialGain}%</span> con las recomendaciones del informe profesional.
        </p>
      </motion.div>

      {/* Interpretation with CTA hook */}
      <motion.div
        className="mt-4 p-4 rounded-xl bg-card/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          {overallScore >= 80 
            ? 'Tu armonía facial está por encima del promedio. El informe premium revela exactamente qué pequeños ajustes podrían llevarte al siguiente nivel.'
            : overallScore >= 65
            ? 'Tu análisis muestra una buena base con oportunidades claras de mejora. El informe premium incluye un plan de acción personalizado.'
            : 'Identificamos varias oportunidades para mejorar tu armonía. El informe premium detalla cada área y cómo optimizarla.'}
        </p>
        
        {/* Subtle CTA */}
        <div className="flex items-center justify-center gap-1 mt-3 text-primary text-sm font-medium">
          <span>Ver cómo mejorar</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}