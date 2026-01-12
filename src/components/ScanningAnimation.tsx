import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Scan, Sparkles, Zap, Target, Activity, Eye, Smile } from 'lucide-react';

interface ScanningAnimationProps {
  imageUrl: string;
  analysisProgress?: number; // 0-100
}

const ANALYSIS_PHASES = [
  { 
    id: 'detecting',
    label: 'Detectando rostro',
    icon: Target,
    subtext: 'Calibrando puntos de referencia...',
    progress: 15 
  },
  { 
    id: 'landmarks',
    label: 'Mapeando 68 landmarks faciales',
    icon: Scan,
    subtext: 'Identificando estructura ósea...',
    progress: 30 
  },
  { 
    id: 'symmetry',
    label: 'Calculando simetría bilateral',
    icon: Activity,
    subtext: 'Analizando proporciones...',
    progress: 45 
  },
  { 
    id: 'thirds',
    label: 'Evaluando tercios faciales',
    icon: Eye,
    subtext: 'Superior • Medio • Inferior',
    progress: 60 
  },
  { 
    id: 'smile',
    label: 'Analizando armonía dental',
    icon: Smile,
    subtext: 'Evaluando línea de sonrisa...',
    progress: 75 
  },
  { 
    id: 'ai',
    label: 'Procesando con IA avanzada',
    icon: Brain,
    subtext: 'Generando insights personalizados...',
    progress: 90 
  },
];

// Simulated facial landmarks for scanning animation
const SCAN_POINTS = [
  // Face contour (left side)
  { x: 22, y: 45 }, { x: 24, y: 55 }, { x: 26, y: 65 }, { x: 30, y: 72 }, { x: 36, y: 78 },
  // Chin
  { x: 44, y: 82 }, { x: 50, y: 84 }, { x: 56, y: 82 },
  // Face contour (right side)
  { x: 64, y: 78 }, { x: 70, y: 72 }, { x: 74, y: 65 }, { x: 76, y: 55 }, { x: 78, y: 45 },
  // Left eyebrow
  { x: 30, y: 32 }, { x: 34, y: 30 }, { x: 38, y: 30 }, { x: 42, y: 32 },
  // Right eyebrow
  { x: 58, y: 32 }, { x: 62, y: 30 }, { x: 66, y: 30 }, { x: 70, y: 32 },
  // Left eye
  { x: 32, y: 38 }, { x: 36, y: 36 }, { x: 40, y: 38 }, { x: 36, y: 40 },
  // Right eye
  { x: 60, y: 38 }, { x: 64, y: 36 }, { x: 68, y: 38 }, { x: 64, y: 40 },
  // Nose
  { x: 50, y: 42 }, { x: 50, y: 48 }, { x: 50, y: 54 }, { x: 46, y: 56 }, { x: 50, y: 58 }, { x: 54, y: 56 },
  // Mouth
  { x: 40, y: 66 }, { x: 44, y: 64 }, { x: 50, y: 65 }, { x: 56, y: 64 }, { x: 60, y: 66 },
  { x: 56, y: 68 }, { x: 50, y: 69 }, { x: 44, y: 68 },
];

// Guide lines for face analysis
const GUIDE_LINES = [
  // Vertical midline
  { x1: 50, y1: 20, x2: 50, y2: 85 },
  // Horizontal thirds
  { x1: 25, y1: 30, x2: 75, y2: 30 },
  { x1: 25, y1: 56, x2: 75, y2: 56 },
  // Eye line
  { x1: 28, y1: 38, x2: 72, y2: 38 },
  // Mouth line
  { x1: 35, y1: 66, x2: 65, y2: 66 },
];

// Data metrics that appear during scan
const METRICS_DATA = [
  { label: 'Simetría', value: '87.4%', x: 8, y: 25 },
  { label: 'Proporción', value: '1:1.62', x: 75, y: 25 },
  { label: 'Línea Media', value: '+0.8mm', x: 8, y: 75 },
  { label: 'Corredor Bucal', value: '12%', x: 75, y: 75 },
];

export function ScanningAnimation({ imageUrl, analysisProgress = 0 }: ScanningAnimationProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [visiblePoints, setVisiblePoints] = useState<number[]>([]);
  const [scanLineY, setScanLineY] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);

  // Cycle through analysis phases
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % ANALYSIS_PHASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Animate scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLineY(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Progressively reveal points
  useEffect(() => {
    const revealPoints = () => {
      const pointsToShow = Math.floor((scanLineY / 100) * SCAN_POINTS.length);
      const indices = Array.from({ length: pointsToShow }, (_, i) => i);
      setVisiblePoints(indices);
    };
    revealPoints();
  }, [scanLineY]);

  // Show metrics after initial scan
  useEffect(() => {
    const timer = setTimeout(() => setShowMetrics(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const phase = ANALYSIS_PHASES[currentPhase];
  const PhaseIcon = phase.icon;

  // Generate random "data stream" values
  const dataStream = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      value: (Math.random() * 100).toFixed(1),
      offset: Math.random() * 100,
    }));
  }, [currentPhase]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      {/* User's photo as background */}
      <div className="relative aspect-[3/4]">
        <img 
          src={imageUrl} 
          alt="Análisis en progreso" 
          className="w-full h-full object-cover opacity-70"
        />

        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* SVG Overlay for scanning effects */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Scanning line */}
          <motion.line
            x1="0"
            y1={scanLineY}
            x2="100"
            y2={scanLineY}
            stroke="url(#scanGradient)"
            strokeWidth="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <defs>
            <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="hsl(38, 70%, 50%)" />
              <stop offset="50%" stopColor="hsl(38, 90%, 60%)" />
              <stop offset="70%" stopColor="hsl(38, 70%, 50%)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Guide lines - draw progressively */}
          {GUIDE_LINES.map((line, i) => (
            <motion.line
              key={`guide-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(38, 70%, 50%)"
              strokeWidth="0.2"
              strokeDasharray="2,2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 1.5, delay: i * 0.5 }}
            />
          ))}

          {/* Facial landmark points - appear progressively */}
          {SCAN_POINTS.map((point, i) => (
            <AnimatePresence key={`point-${i}`}>
              {visiblePoints.includes(i) && (
                <motion.g>
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="0.8"
                    fill="hsl(38, 80%, 55%)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill="none"
                    stroke="hsl(38, 70%, 50%)"
                    strokeWidth="0.15"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                  />
                </motion.g>
              )}
            </AnimatePresence>
          ))}

          {/* Face oval outline */}
          <motion.ellipse
            cx="50"
            cy="52"
            rx="28"
            ry="36"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.3"
            strokeDasharray="3,2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />

          {/* Corner brackets */}
          <motion.path
            d="M 18 25 L 18 20 L 24 20"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.5 }}
          />
          <motion.path
            d="M 82 25 L 82 20 L 76 20"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.6 }}
          />
          <motion.path
            d="M 18 85 L 18 90 L 24 90"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.7 }}
          />
          <motion.path
            d="M 82 85 L 82 90 L 76 90"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.8 }}
          />
        </svg>

        {/* Floating metrics during scan */}
        <AnimatePresence>
          {showMetrics && METRICS_DATA.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="absolute px-2 py-1 rounded bg-black/70 backdrop-blur-sm border border-primary/30"
              style={{ left: `${metric.x}%`, top: `${metric.y}%` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.2 }}
            >
              <p className="text-[8px] text-muted-foreground">{metric.label}</p>
              <p className="text-xs font-bold text-primary">{metric.value}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Data stream effect on sides */}
        <div className="absolute left-1 top-1/4 bottom-1/4 w-12 overflow-hidden opacity-50">
          {dataStream.slice(0, 4).map((item, i) => (
            <motion.div
              key={i}
              className="text-[7px] font-mono text-primary/70 whitespace-nowrap"
              animate={{ y: [0, -20] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              {item.value}%
            </motion.div>
          ))}
        </div>
        <div className="absolute right-1 top-1/4 bottom-1/4 w-12 overflow-hidden opacity-50 text-right">
          {dataStream.slice(4).map((item, i) => (
            <motion.div
              key={i}
              className="text-[7px] font-mono text-primary/70 whitespace-nowrap"
              animate={{ y: [0, -20] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              {item.value}%
            </motion.div>
          ))}
        </div>

        {/* Top status bar */}
        <div className="absolute top-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-[10px] font-medium text-primary">ANÁLISIS IA ACTIVO</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-400">EN VIVO</span>
            </div>
          </div>
        </div>

        {/* Bottom panel - current phase */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <motion.div 
            className="glass rounded-xl p-4 border border-primary/30"
            key={currentPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PhaseIcon className="w-5 h-5 text-primary" />
              </motion.div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">{phase.label}</h4>
                <p className="text-[11px] text-muted-foreground">{phase.subtext}</p>
              </div>
              <div className="text-right">
                <motion.span 
                  className="text-lg font-bold text-primary"
                  key={phase.progress}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {phase.progress}%
                </motion.span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${phase.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Phase indicators */}
            <div className="flex justify-center gap-1.5 mt-3">
              {ANALYSIS_PHASES.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentPhase ? 'bg-primary' : i < currentPhase ? 'bg-primary/50' : 'bg-muted'
                  }`} 
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}