import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Scan, Activity, Eye, Smile, Brain } from 'lucide-react';

interface ScanningAnimationProps {
  imageUrl: string;
  onComplete?: () => void;
  duration?: number; // Total duration in seconds
}

const ANALYSIS_PHASES = [
  { 
    id: 'detecting',
    label: 'Detectando rostro',
    icon: Target,
    subtext: 'Calibrando puntos de referencia...',
    duration: 2
  },
  { 
    id: 'landmarks',
    label: 'Mapeando 68 landmarks faciales',
    icon: Scan,
    subtext: 'Identificando estructura ósea...',
    duration: 3
  },
  { 
    id: 'symmetry',
    label: 'Calculando simetría bilateral',
    icon: Activity,
    subtext: 'Analizando proporciones áureas...',
    duration: 3
  },
  { 
    id: 'thirds',
    label: 'Evaluando tercios faciales',
    icon: Eye,
    subtext: 'Superior • Medio • Inferior',
    duration: 2
  },
  { 
    id: 'smile',
    label: 'Analizando armonía dental',
    icon: Smile,
    subtext: 'Evaluando línea de sonrisa...',
    duration: 3
  },
  { 
    id: 'ai',
    label: 'Procesando con Motor ArmonIA™',
    icon: Brain,
    subtext: 'Generando insights personalizados...',
    duration: 2
  },
];

// 68 facial landmark points
const SCAN_POINTS = [
  // Face contour (0-16)
  { x: 18, y: 42 }, { x: 19, y: 50 }, { x: 21, y: 58 }, { x: 24, y: 66 }, { x: 28, y: 73 },
  { x: 34, y: 78 }, { x: 40, y: 82 }, { x: 47, y: 84 }, { x: 53, y: 84 }, { x: 60, y: 82 },
  { x: 66, y: 78 }, { x: 72, y: 73 }, { x: 76, y: 66 }, { x: 79, y: 58 }, { x: 81, y: 50 }, { x: 82, y: 42 },
  // Left eyebrow (17-21)
  { x: 26, y: 30 }, { x: 30, y: 27 }, { x: 35, y: 26 }, { x: 40, y: 28 }, { x: 44, y: 30 },
  // Right eyebrow (22-26)
  { x: 56, y: 30 }, { x: 60, y: 28 }, { x: 65, y: 26 }, { x: 70, y: 27 }, { x: 74, y: 30 },
  // Nose bridge (27-30)
  { x: 50, y: 34 }, { x: 50, y: 40 }, { x: 50, y: 46 }, { x: 50, y: 52 },
  // Nose bottom (31-35)
  { x: 44, y: 54 }, { x: 47, y: 56 }, { x: 50, y: 57 }, { x: 53, y: 56 }, { x: 56, y: 54 },
  // Left eye (36-41)
  { x: 30, y: 38 }, { x: 33, y: 36 }, { x: 37, y: 36 }, { x: 40, y: 38 },
  { x: 37, y: 40 }, { x: 33, y: 40 },
  // Right eye (42-47)
  { x: 60, y: 38 }, { x: 63, y: 36 }, { x: 67, y: 36 }, { x: 70, y: 38 },
  { x: 67, y: 40 }, { x: 63, y: 40 },
  // Outer mouth (48-59)
  { x: 38, y: 66 }, { x: 42, y: 63 }, { x: 46, y: 62 }, { x: 50, y: 63 },
  { x: 54, y: 62 }, { x: 58, y: 63 }, { x: 62, y: 66 },
  { x: 58, y: 70 }, { x: 54, y: 72 }, { x: 50, y: 73 }, { x: 46, y: 72 }, { x: 42, y: 70 },
  // Inner mouth (60-67)
  { x: 40, y: 66 }, { x: 46, y: 65 }, { x: 50, y: 65 }, { x: 54, y: 65 }, { x: 60, y: 66 },
  { x: 54, y: 68 }, { x: 50, y: 69 }, { x: 46, y: 68 },
];

// Connection lines between landmarks
const CONNECTIONS = [
  // Face contour
  [0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,8], [8,9], [9,10], [10,11], [11,12], [12,13], [13,14], [14,15],
  // Eyebrows
  [16,17], [17,18], [18,19], [19,20], [21,22], [22,23], [23,24], [24,25],
  // Nose
  [26,27], [27,28], [28,29], [30,31], [31,32], [32,33], [33,34],
  // Left eye
  [35,36], [36,37], [37,38], [38,39], [39,40], [40,35],
  // Right eye
  [41,42], [42,43], [43,44], [44,45], [45,46], [46,41],
  // Mouth outer
  [47,48], [48,49], [49,50], [50,51], [51,52], [52,53], [53,54], [54,55], [55,56], [56,57], [57,58], [58,47],
];

export function ScanningAnimation({ imageUrl, onComplete, duration = 15 }: ScanningAnimationProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [visiblePoints, setVisiblePoints] = useState<number[]>([]);
  const [scanLineY, setScanLineY] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({
    symmetry: 0,
    proportion: '0:0',
    landmarks: 0
  });

  // Calculate total progress
  const totalProgress = useMemo(() => {
    return Math.round(((duration - timeRemaining) / duration) * 100);
  }, [duration, timeRemaining]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 0.1));
    }, 100);

    return () => clearInterval(interval);
  }, [timeRemaining, onComplete]);

  // Phase progression
  useEffect(() => {
    let elapsed = duration - timeRemaining;
    let accumulatedTime = 0;
    
    for (let i = 0; i < ANALYSIS_PHASES.length; i++) {
      if (elapsed <= accumulatedTime + ANALYSIS_PHASES[i].duration) {
        setCurrentPhaseIndex(i);
        const phaseElapsed = elapsed - accumulatedTime;
        setPhaseProgress((phaseElapsed / ANALYSIS_PHASES[i].duration) * 100);
        break;
      }
      accumulatedTime += ANALYSIS_PHASES[i].duration;
    }
  }, [timeRemaining, duration]);

  // Animate scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLineY(prev => (prev >= 100 ? 0 : prev + 1.5));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Progressively reveal points based on total progress
  useEffect(() => {
    const pointsToShow = Math.floor((totalProgress / 100) * SCAN_POINTS.length);
    const indices = Array.from({ length: pointsToShow }, (_, i) => i);
    setVisiblePoints(indices);
  }, [totalProgress]);

  // Update live metrics
  useEffect(() => {
    const updateMetrics = () => {
      setLiveMetrics({
        symmetry: Math.min(87.4, 50 + (totalProgress * 0.374)),
        proportion: totalProgress > 30 ? '1:1.62' : `1:${(1 + totalProgress * 0.02).toFixed(2)}`,
        landmarks: Math.min(68, Math.floor(totalProgress * 0.68))
      });
    };
    updateMetrics();
  }, [totalProgress]);

  const currentPhase = ANALYSIS_PHASES[currentPhaseIndex];
  const PhaseIcon = currentPhase?.icon || Target;

  // Format time remaining
  const formatTime = useCallback((seconds: number) => {
    const secs = Math.ceil(seconds);
    return `${secs}s`;
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      <div className="relative aspect-[3/4]">
        {/* User's photo as background */}
        <img 
          src={imageUrl} 
          alt="Análisis en progreso" 
          className="w-full h-full object-cover opacity-60"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

        {/* SVG Overlay for scanning effects */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="hsl(38, 70%, 50%)" />
              <stop offset="50%" stopColor="hsl(38, 90%, 70%)" />
              <stop offset="70%" stopColor="hsl(38, 70%, 50%)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Scanning line */}
          <motion.line
            x1="5"
            y1={scanLineY}
            x2="95"
            y2={scanLineY}
            stroke="url(#scanGradient)"
            strokeWidth="0.3"
            filter="url(#glow)"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />

          {/* Face oval */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="32"
            ry="42"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.25"
            strokeDasharray="4,2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 2 }}
          />

          {/* Vertical midline */}
          <motion.line
            x1="50" y1="10" x2="50" y2="92"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.15"
            strokeDasharray="2,3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
          />

          {/* Horizontal thirds */}
          {[28, 52, 75].map((y, i) => (
            <motion.line
              key={y}
              x1="20" y1={y} x2="80" y2={y}
              stroke="hsl(38, 70%, 50%)"
              strokeWidth="0.15"
              strokeDasharray="2,3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 1.5 + i * 0.3 }}
            />
          ))}

          {/* Connection lines */}
          {CONNECTIONS.map(([from, to], i) => {
            const isVisible = visiblePoints.includes(from) && visiblePoints.includes(to);
            return (
              <AnimatePresence key={`conn-${i}`}>
                {isVisible && (
                  <motion.line
                    x1={SCAN_POINTS[from].x}
                    y1={SCAN_POINTS[from].y}
                    x2={SCAN_POINTS[to].x}
                    y2={SCAN_POINTS[to].y}
                    stroke="hsl(38, 60%, 45%)"
                    strokeWidth="0.15"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
            );
          })}

          {/* Landmark points */}
          {SCAN_POINTS.map((point, i) => (
            <AnimatePresence key={`point-${i}`}>
              {visiblePoints.includes(i) && (
                <motion.g>
                  {/* Outer pulse ring */}
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="1.5"
                    fill="none"
                    stroke="hsl(38, 70%, 50%)"
                    strokeWidth="0.1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: (i * 0.03) % 1 }}
                  />
                  {/* Core point */}
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="0.6"
                    fill="hsl(38, 80%, 55%)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                </motion.g>
              )}
            </AnimatePresence>
          ))}

          {/* Corner brackets */}
          <motion.path d="M 12 18 L 12 12 L 20 12" fill="none" stroke="hsl(38, 70%, 50%)" strokeWidth="0.4" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} />
          <motion.path d="M 88 18 L 88 12 L 80 12" fill="none" stroke="hsl(38, 70%, 50%)" strokeWidth="0.4" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} />
          <motion.path d="M 12 88 L 12 94 L 20 94" fill="none" stroke="hsl(38, 70%, 50%)" strokeWidth="0.4" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} />
          <motion.path d="M 88 88 L 88 94 L 80 94" fill="none" stroke="hsl(38, 70%, 50%)" strokeWidth="0.4" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} />
        </svg>

        {/* Live metrics - Left */}
        <motion.div
          className="absolute left-3 top-1/3 px-2.5 py-2 rounded-lg bg-black/80 backdrop-blur-sm border border-primary/40"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
        >
          <p className="text-[9px] text-muted-foreground font-medium">Simetría</p>
          <motion.p 
            className="text-lg font-bold text-primary"
            key={Math.round(liveMetrics.symmetry)}
          >
            {liveMetrics.symmetry.toFixed(1)}%
          </motion.p>
        </motion.div>

        {/* Live metrics - Right */}
        <motion.div
          className="absolute right-3 top-1/3 px-2.5 py-2 rounded-lg bg-black/80 backdrop-blur-sm border border-primary/40 text-right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.5 }}
        >
          <p className="text-[9px] text-muted-foreground font-medium">Proporción</p>
          <p className="text-lg font-bold text-primary">{liveMetrics.proportion}</p>
        </motion.div>

        {/* Top status bar */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-xs font-bold text-primary tracking-wide">ANÁLISIS IA ACTIVO</span>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div 
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-green-400">EN VIVO</span>
            </div>
          </div>
        </div>

        {/* Time remaining badge */}
        <motion.div
          className="absolute top-12 right-3 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tiempo:</span>
            <span className="text-sm font-bold text-primary">{formatTime(timeRemaining)}</span>
          </div>
        </motion.div>

        {/* Bottom panel */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent">
          <motion.div 
            className="rounded-xl p-3 border border-primary/30 bg-black/60 backdrop-blur-md"
            key={currentPhaseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/30"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PhaseIcon className="w-5 h-5 text-primary" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{currentPhase?.label}</h4>
                <p className="text-xs text-muted-foreground truncate">{currentPhase?.subtext}</p>
              </div>
              <div className="text-right">
                <motion.span 
                  className="text-2xl font-bold text-primary"
                  key={totalProgress}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  {totalProgress}%
                </motion.span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                style={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Phase indicators */}
            <div className="flex justify-center gap-2 mt-3">
              {ANALYSIS_PHASES.map((_, i) => (
                <motion.div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentPhaseIndex 
                      ? 'bg-primary scale-125' 
                      : i < currentPhaseIndex 
                        ? 'bg-primary/60' 
                        : 'bg-muted/40'
                  }`}
                  animate={i === currentPhaseIndex ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              ))}
            </div>

            {/* Landmarks counter */}
            <div className="flex justify-center mt-2">
              <span className="text-[10px] text-muted-foreground">
                {liveMetrics.landmarks}/68 landmarks detectados
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}