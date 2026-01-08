import { motion } from 'framer-motion';
import { Lightbulb, Lock, ChevronRight } from 'lucide-react';

interface AIInsightCardProps {
  title: string;
  insight: string;
  isLocked?: boolean;
  lockedPreview?: string;
}

export function AIInsightCard({ title, insight, isLocked = false, lockedPreview }: AIInsightCardProps) {
  return (
    <motion.div 
      className={`relative rounded-2xl overflow-hidden ${isLocked ? 'bg-muted/30' : 'bg-gradient-to-br from-primary/10 via-accent/5 to-transparent'} border ${isLocked ? 'border-muted' : 'border-primary/20'} p-5`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLocked ? 'bg-muted' : 'bg-primary/20'}`}>
          {isLocked ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Lightbulb className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">Análisis con IA</p>
        </div>
      </div>

      {isLocked ? (
        <div className="relative">
          <p className="text-sm text-muted-foreground line-clamp-2 blur-sm select-none">
            {lockedPreview || 'Basado en tu análisis facial, identificamos oportunidades de mejora en la proporción de los tercios faciales y la simetría del contorno...'}
          </p>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/80 to-transparent">
            <span className="text-xs text-primary flex items-center gap-1">
              Desbloquear con Premium
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      ) : (
        <motion.p 
          className="text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {insight}
        </motion.p>
      )}

      {/* Decorative corner */}
      {!isLocked && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
      )}
    </motion.div>
  );
}