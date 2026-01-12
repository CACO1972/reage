import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface FacialThirds {
  upper: number;
  middle: number;
  lower: number;
}

interface AIMetrics {
  smile_arc?: string;
  tooth_visibility?: number;
  smile_symmetry?: number;
  lip_fullness?: string;
  golden_ratio_compliance?: number;
  ai_analyzed?: boolean;
}

interface FaceAnalysisOverlayProps {
  imageUrl: string;
  symmetryScore?: number;
  facialThirds?: FacialThirds | null;
  midlineDeviation?: number;
  gingivalDisplay?: number;
  buccalCorridorLeft?: number;
  buccalCorridorRight?: number;
  aiMetrics?: AIMetrics | null;
  showPoints?: boolean;
}

export function FaceAnalysisOverlay({ 
  imageUrl, 
  symmetryScore, 
  facialThirds,
  midlineDeviation = 0,
  gingivalDisplay = 0,
  buccalCorridorLeft = 0,
  buccalCorridorRight = 0,
  aiMetrics,
  showPoints = true 
}: FaceAnalysisOverlayProps) {
  
  // Calculate facial thirds positions
  const faceTop = 10;
  const faceBottom = 90;
  const faceHeight = faceBottom - faceTop;
  
  const thirds = facialThirds || { upper: 33.3, middle: 33.3, lower: 33.4 };
  const upperEnd = faceTop + (faceHeight * thirds.upper / 100);
  const middleEnd = upperEnd + (faceHeight * thirds.middle / 100);
  
  // Midline visualization
  const midlineX = 50 + (midlineDeviation * 3);
  
  // Ideal range checks
  const isThirdsIdeal = (value: number) => Math.abs(value - 33.33) < 4;
  const isMidlineIdeal = Math.abs(midlineDeviation) < 2;
  const isGingivalIdeal = gingivalDisplay >= 0 && gingivalDisplay <= 3;
  const isBuccalIdeal = (v: number) => v >= 5 && v <= 12;

  const getStatusColor = (isIdeal: boolean) => isIdeal ? 'text-emerald-400' : 'text-amber-400';
  const getStatusBg = (isIdeal: boolean) => isIdeal ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-amber-500/20 border-amber-500/40';

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <img 
        src={imageUrl} 
        alt="Análisis facial" 
        className="w-full h-full object-cover"
      />
      
      {showPoints && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Facial Thirds Zones with smooth fills */}
          <motion.rect
            x="20" y={faceTop} width="60" height={upperEnd - faceTop}
            fill="url(#goldGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.rect
            x="20" y={upperEnd} width="60" height={middleEnd - upperEnd}
            fill="url(#goldGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <motion.rect
            x="20" y={middleEnd} width="60" height={faceBottom - middleEnd}
            fill="url(#goldGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />

          {/* Horizontal division lines */}
          {[faceTop, upperEnd, middleEnd, faceBottom].map((y, i) => (
            <motion.line
              key={`line-${i}`}
              x1="18" y1={y} x2="82" y2={y}
              stroke="hsl(38, 70%, 60%)"
              strokeWidth="0.4"
              strokeDasharray={i === 0 || i === 3 ? "2,2" : "0"}
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
            />
          ))}

          {/* Central Midline with deviation indicator */}
          <motion.line
            x1={midlineX} y1={faceTop + 5} x2={midlineX} y2={faceBottom - 5}
            stroke={isMidlineIdeal ? "hsl(160, 70%, 50%)" : "hsl(38, 80%, 55%)"}
            strokeWidth="0.8"
            strokeDasharray="4,2"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
          />

          {/* Ideal reference line if deviation exists */}
          {Math.abs(midlineDeviation) > 0.5 && (
            <motion.line
              x1="50" y1={faceTop + 5} x2="50" y2={faceBottom - 5}
              stroke="white"
              strokeWidth="0.3"
              strokeDasharray="1,3"
              opacity="0.4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1 }}
            />
          )}

          {/* Gingival display zone */}
          <motion.rect
            x="35" y="62" width="30" height="5"
            rx="2"
            fill={isGingivalIdeal ? "hsl(160, 70%, 45%)" : "hsl(38, 70%, 50%)"}
            fillOpacity="0.5"
            stroke={isGingivalIdeal ? "hsl(160, 70%, 50%)" : "hsl(38, 80%, 55%)"}
            strokeWidth="0.5"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          />

          {/* Key facial landmarks */}
          {/* Eyes */}
          {[{ x: 35, y: 36 }, { x: 65, y: 36 }].map((p, i) => (
            <motion.g key={`eye-${i}`}>
              <motion.circle
                cx={p.x} cy={p.y} r="4"
                fill="none"
                stroke="hsl(38, 70%, 60%)"
                strokeWidth="0.4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
              />
              <motion.circle
                cx={p.x} cy={p.y} r="1"
                fill="hsl(38, 70%, 60%)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.3 + i * 0.1 }}
              />
            </motion.g>
          ))}

          {/* Nose */}
          <motion.circle
            cx="50" cy="52" r="2"
            fill="hsl(28, 80%, 50%)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4 }}
          />

          {/* Mouth landmarks */}
          {[{ x: 37, y: 65 }, { x: 50, y: 66 }, { x: 63, y: 65 }].map((p, i) => (
            <motion.circle
              key={`mouth-${i}`}
              cx={p.x} cy={p.y} r="1.2"
              fill="hsl(38, 70%, 55%)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 + i * 0.1 }}
            />
          ))}
        </svg>
      )}

      {/* Floating Labels - Left side thirds */}
      <div className="absolute left-1 top-0 bottom-0 flex flex-col pointer-events-none" style={{ paddingTop: '10%', paddingBottom: '10%' }}>
        {[
          { value: thirds.upper, label: 'Superior' },
          { value: thirds.middle, label: 'Medio' },
          { value: thirds.lower, label: 'Inferior' }
        ].map((third, i) => (
          <motion.div
            key={i}
            className="flex-1 flex items-center"
            style={{ height: `${third.value}%` }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.2 }}
          >
            <div className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
              isThirdsIdeal(third.value) 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-primary/90 text-background'
            }`}>
              {third.value.toFixed(0)}%
            </div>
          </motion.div>
        ))}
      </div>

      {/* Score badge - top right */}
      {symmetryScore !== undefined && (
        <motion.div 
          className="absolute top-3 right-3 px-4 py-2 rounded-xl bg-background/95 backdrop-blur-md border border-primary/50 shadow-xl"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.5, type: 'spring' }}
        >
          <div className="text-center">
            <span className="text-2xl font-bold text-primary">{symmetryScore.toFixed(0)}</span>
            <span className="text-lg text-primary/80">%</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Simetría Facial</span>
        </motion.div>
      )}

      {/* Bottom Metrics Panel */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-4 px-3"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
      >
        {/* Main metrics grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Midline */}
          <div className={`rounded-lg p-2 text-center border ${getStatusBg(isMidlineIdeal)}`}>
            <div className={`text-base font-bold ${getStatusColor(isMidlineIdeal)}`}>
              {midlineDeviation.toFixed(1)}<span className="text-xs">mm</span>
            </div>
            <div className="text-[9px] text-white/60 mt-0.5">Línea Media</div>
            {isMidlineIdeal && <CheckCircle className="w-3 h-3 text-emerald-400 mx-auto mt-1" />}
          </div>

          {/* Gingival */}
          <div className={`rounded-lg p-2 text-center border ${getStatusBg(isGingivalIdeal)}`}>
            <div className={`text-base font-bold ${getStatusColor(isGingivalIdeal)}`}>
              {gingivalDisplay.toFixed(1)}<span className="text-xs">mm</span>
            </div>
            <div className="text-[9px] text-white/60 mt-0.5">Exp. Gingival</div>
            {isGingivalIdeal && <CheckCircle className="w-3 h-3 text-emerald-400 mx-auto mt-1" />}
          </div>

          {/* Buccal Corridor Left */}
          <div className={`rounded-lg p-2 text-center border ${getStatusBg(isBuccalIdeal(buccalCorridorLeft))}`}>
            <div className={`text-base font-bold ${getStatusColor(isBuccalIdeal(buccalCorridorLeft))}`}>
              {buccalCorridorLeft.toFixed(0)}<span className="text-xs">%</span>
            </div>
            <div className="text-[9px] text-white/60 mt-0.5">Corredor Izq</div>
          </div>

          {/* Buccal Corridor Right */}
          <div className={`rounded-lg p-2 text-center border ${getStatusBg(isBuccalIdeal(buccalCorridorRight))}`}>
            <div className={`text-base font-bold ${getStatusColor(isBuccalIdeal(buccalCorridorRight))}`}>
              {buccalCorridorRight.toFixed(0)}<span className="text-xs">%</span>
            </div>
            <div className="text-[9px] text-white/60 mt-0.5">Corredor Der</div>
          </div>
        </div>

        {/* AI Metrics Row (if available) */}
        {aiMetrics?.ai_analyzed && (
          <motion.div 
            className="flex items-center justify-between px-2 py-2 rounded-lg bg-primary/10 border border-primary/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px]">🤖</span>
              </div>
              <span className="text-[10px] text-primary font-medium">Análisis IA</span>
            </div>
            <div className="flex gap-3 text-[10px]">
              {aiMetrics.smile_arc && (
                <span className="text-white/70">Arco: <span className="text-white font-medium capitalize">{aiMetrics.smile_arc}</span></span>
              )}
              {aiMetrics.tooth_visibility !== undefined && (
                <span className="text-white/70">Dientes: <span className="text-white font-medium">{aiMetrics.tooth_visibility}</span></span>
              )}
              {aiMetrics.golden_ratio_compliance !== undefined && (
                <span className="text-white/70">Φ: <span className="text-white font-medium">{aiMetrics.golden_ratio_compliance}%</span></span>
              )}
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] text-white/50">Rango ideal</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] text-white/50">Fuera de rango</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}