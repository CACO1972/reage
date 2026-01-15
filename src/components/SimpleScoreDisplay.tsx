import { motion } from 'framer-motion';
import { Smile, Sparkles } from 'lucide-react';

interface SimpleScoreDisplayProps {
  smileScore: number;
  symmetryScore: number;
}

export function SimpleScoreDisplay({ smileScore, symmetryScore }: SimpleScoreDisplayProps) {
  const overallScore = Math.round((smileScore + symmetryScore) / 2);
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { text: 'Excepcional', emoji: '🌟' };
    if (score >= 80) return { text: 'Muy bueno', emoji: '✨' };
    if (score >= 70) return { text: 'Bueno', emoji: '👍' };
    if (score >= 60) return { text: 'Promedio', emoji: '📊' };
    return { text: 'Mejorable', emoji: '🎯' };
  };

  const scoreInfo = getScoreLabel(overallScore);

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
          <span className="text-xl text-foreground/80 font-medium">{scoreInfo.text}</span>
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

      {/* Simple interpretation */}
      <motion.p
        className="mt-6 text-muted-foreground text-sm leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {overallScore >= 80 
          ? 'Tu armonía facial está por encima del promedio. El informe detallado incluye oportunidades específicas de mejora.'
          : overallScore >= 65
          ? 'Tu análisis muestra una buena base con áreas de oportunidad. El informe premium detalla recomendaciones personalizadas.'
          : 'Identificamos varias oportunidades para mejorar tu armonía facial. El informe incluye un plan personalizado.'}
      </motion.p>
    </motion.div>
  );
}