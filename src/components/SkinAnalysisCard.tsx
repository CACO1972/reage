import { motion } from 'framer-motion';
import { 
  Droplets, 
  Sun, 
  Sparkles, 
  Eye, 
  Heart,
  Gauge,
  Clock,
  Activity
} from 'lucide-react';

interface SkinAnalysisData {
  overall_score?: number;
  wrinkle_score?: number;
  spots_score?: number;
  texture_score?: number;
  dark_circles_score?: number;
  redness_score?: number;
  pores_score?: number;
  oiliness_score?: number;
  firmness_score?: number;
  eye_bags_score?: number;
  skin_age?: number;
}

interface SkinAnalysisCardProps {
  skinData: SkinAnalysisData | null;
  isLocked?: boolean;
}

const metrics: Array<{
  key: keyof SkinAnalysisData;
  label: string;
  icon: typeof Activity;
  idealRange: [number, number];
}> = [
  { key: 'wrinkle_score', label: 'Arrugas', icon: Activity, idealRange: [70, 100] },
  { key: 'spots_score', label: 'Manchas', icon: Sun, idealRange: [75, 100] },
  { key: 'texture_score', label: 'Textura', icon: Sparkles, idealRange: [70, 100] },
  { key: 'dark_circles_score', label: 'Ojeras', icon: Eye, idealRange: [65, 100] },
  { key: 'redness_score', label: 'Rojeces', icon: Heart, idealRange: [75, 100] },
  { key: 'pores_score', label: 'Poros', icon: Droplets, idealRange: [70, 100] },
  { key: 'firmness_score', label: 'Firmeza', icon: Gauge, idealRange: [65, 100] },
  { key: 'eye_bags_score', label: 'Bolsas', icon: Eye, idealRange: [65, 100] },
];

function ScoreBar({ score, idealRange }: { score: number; idealRange: [number, number] }) {
  const isIdeal = score >= idealRange[0];
  const color = isIdeal ? 'bg-emerald-500' : score >= idealRange[0] - 15 ? 'bg-amber-500' : 'bg-red-400';
  
  return (
    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}

export function SkinAnalysisCard({ skinData, isLocked = false }: SkinAnalysisCardProps) {
  // Check if there's any actual data to display
  const hasData = skinData && Object.keys(skinData).some(key => 
    skinData[key as keyof SkinAnalysisData] !== undefined && 
    skinData[key as keyof SkinAnalysisData] !== null
  );
  
  if (!hasData && !isLocked) {
    return null;
  }

  const overallScore = skinData?.overall_score;
  const skinAge = skinData?.skin_age;
  const hasOverallScore = overallScore !== undefined && overallScore !== null;
  const hasSkinAge = skinAge !== undefined && skinAge !== null;

  if (isLocked) {
    return (
      <motion.div
        className="glass rounded-2xl p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-10 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-white/90">Análisis de Piel AI</p>
            <p className="text-xs text-muted-foreground mt-1">Disponible en Premium</p>
          </div>
        </div>
        
        {/* Blurred preview content */}
        <div className="opacity-30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Análisis de Piel IA</h3>
              <p className="text-xs text-muted-foreground">Powered by Perfect Corp®</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Análisis de Piel IA</h3>
            <p className="text-xs text-muted-foreground">Powered by Perfect Corp®</p>
          </div>
        </div>
        
        {/* Overall score badge - only show if available */}
        {hasOverallScore && (
          <motion.div 
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <div className="text-2xl font-bold text-primary">{overallScore}</div>
            <div className="text-[10px] text-muted-foreground">Score General</div>
          </motion.div>
        )}
      </div>

      {/* Skin Age Feature - only show if available */}
      {hasSkinAge && (
        <motion.div 
          className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Clock className="w-6 h-6 text-primary" />
          <div className="text-center">
            <span className="text-xs text-muted-foreground">Edad Estimada de Piel</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{skinAge}</span>
              <span className="text-sm text-muted-foreground">años</span>
            </div>
          </div>
          <Gauge className="w-6 h-6 text-accent" />
        </motion.div>
      )}

      {/* Metrics Grid - Only show metrics with values */}
      <div className="space-y-3">
      {metrics.map((metric, index) => {
          const score = skinData?.[metric.key] as number | undefined;
          
          // Skip metrics without values
          if (score === undefined || score === null) return null;
          
          const Icon = metric.icon;
          const isIdeal = score >= metric.idealRange[0];
          
          return (
            <motion.div
              key={metric.key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isIdeal ? 'bg-emerald-500/20' : 'bg-amber-500/20'
              }`}>
                <Icon className={`w-4 h-4 ${isIdeal ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/80">{metric.label}</span>
                  <span className={`text-xs font-bold ${isIdeal ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {score.toFixed(0)}%
                  </span>
                </div>
                <ScoreBar score={score} idealRange={metric.idealRange} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <motion.p 
        className="text-[10px] text-center text-muted-foreground mt-4 pt-4 border-t border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Análisis realizado con tecnología de visión artificial médica certificada
      </motion.p>
    </motion.div>
  );
}
