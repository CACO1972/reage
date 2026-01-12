import { motion } from 'framer-motion';

interface FacialThirds {
  upper: number;
  middle: number;
  lower: number;
}

interface FaceAnalysisOverlayProps {
  imageUrl: string;
  symmetryScore?: number;
  facialThirds?: FacialThirds | null;
  midlineDeviation?: number;
  gingivalDisplay?: number;
  showPoints?: boolean;
}

export function FaceAnalysisOverlay({ 
  imageUrl, 
  symmetryScore, 
  facialThirds,
  midlineDeviation = 0,
  gingivalDisplay = 0,
  showPoints = true 
}: FaceAnalysisOverlayProps) {
  
  // Calculate facial thirds positions (based on typical face proportions)
  // Forehead starts around y=10, chin ends around y=90
  const faceTop = 12;
  const faceBottom = 88;
  const faceHeight = faceBottom - faceTop;
  
  // Calculate actual thirds positions based on measurements or defaults
  const thirds = facialThirds || { upper: 33.3, middle: 33.3, lower: 33.4 };
  const upperEnd = faceTop + (faceHeight * thirds.upper / 100);
  const middleEnd = upperEnd + (faceHeight * thirds.middle / 100);
  
  // Midline deviation visualization (shifted from center)
  const midlineX = 50 + (midlineDeviation * 2); // Scale deviation for visibility
  
  // Check if values are in ideal range
  const isThirdsIdeal = (value: number) => Math.abs(value - 33.33) < 3;
  const isMidlineIdeal = Math.abs(midlineDeviation) < 1.5;
  const isGingivalIdeal = gingivalDisplay >= 0 && gingivalDisplay <= 3;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <img 
        src={imageUrl} 
        alt="Análisis facial" 
        className="w-full h-full object-cover"
      />
      
      {showPoints && (
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Gradient for thirds zones */}
            <linearGradient id="upperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="middleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(28, 80%, 45%)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(28, 80%, 45%)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(28, 80%, 45%)" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="lowerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(38, 70%, 50%)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Facial Thirds Zones */}
          {/* Upper Third (Forehead to Eyebrows) */}
          <motion.rect
            x="22"
            y={faceTop}
            width="56"
            height={upperEnd - faceTop}
            fill="url(#upperGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          
          {/* Middle Third (Eyebrows to Nose Base) */}
          <motion.rect
            x="22"
            y={upperEnd}
            width="56"
            height={middleEnd - upperEnd}
            fill="url(#middleGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
          
          {/* Lower Third (Nose Base to Chin) */}
          <motion.rect
            x="22"
            y={middleEnd}
            width="56"
            height={faceBottom - middleEnd}
            fill="url(#lowerGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          />

          {/* Horizontal Division Lines for Thirds */}
          {/* Top line (hairline) */}
          <motion.line
            x1="22" y1={faceTop} x2="78" y2={faceTop}
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            strokeDasharray="2,1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          
          {/* Eyebrow line */}
          <motion.line
            x1="22" y1={upperEnd} x2="78" y2={upperEnd}
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
          
          {/* Nose base line */}
          <motion.line
            x1="22" y1={middleEnd} x2="78" y2={middleEnd}
            stroke="hsl(28, 80%, 45%)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />
          
          {/* Chin line */}
          <motion.line
            x1="22" y1={faceBottom} x2="78" y2={faceBottom}
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            strokeDasharray="2,1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 0.8, delay: 1 }}
          />

          {/* Central Midline - showing deviation */}
          <motion.line
            x1={midlineX}
            y1={faceTop}
            x2={midlineX}
            y2={faceBottom}
            stroke={isMidlineIdeal ? "hsl(142, 70%, 45%)" : "hsl(38, 70%, 50%)"}
            strokeWidth="0.6"
            strokeDasharray="3,2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          />
          
          {/* Ideal midline reference (always at 50) */}
          {midlineDeviation !== 0 && (
            <motion.line
              x1="50"
              y1={faceTop}
              x2="50"
              y2={faceBottom}
              stroke="hsl(0, 0%, 60%)"
              strokeWidth="0.3"
              strokeDasharray="1,2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.5, delay: 1 }}
            />
          )}

          {/* Gingival Display Zone (mouth area) */}
          <motion.rect
            x="35"
            y="64"
            width="30"
            height="4"
            rx="1"
            fill={isGingivalIdeal ? "hsl(142, 70%, 45%)" : "hsl(38, 70%, 50%)"}
            fillOpacity="0.4"
            stroke={isGingivalIdeal ? "hsl(142, 70%, 45%)" : "hsl(38, 70%, 50%)"}
            strokeWidth="0.3"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          />

          {/* Face Oval */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="28"
            ry="40"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.3"
            strokeDasharray="4,3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 2, delay: 0.1 }}
          />

          {/* Key Landmark Points */}
          {/* Eyes */}
          {[{ x: 36, y: 38 }, { x: 64, y: 38 }].map((point, i) => (
            <motion.g key={`eye-${i}`}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill="none"
                stroke="hsl(38, 70%, 50%)"
                strokeWidth="0.4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.4 + i * 0.1 }}
              />
            </motion.g>
          ))}
          
          {/* Nose tip */}
          <motion.circle
            cx="50"
            cy="54"
            r="1.5"
            fill="hsl(28, 80%, 45%)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.6 }}
          />
          
          {/* Mouth corners */}
          {[{ x: 38, y: 66 }, { x: 62, y: 66 }].map((point, i) => (
            <motion.circle
              key={`mouth-${i}`}
              cx={point.x}
              cy={point.y}
              r="1"
              fill="hsl(38, 70%, 50%)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.7 + i * 0.1 }}
            />
          ))}
        </svg>
      )}

      {/* Floating Labels - Facial Thirds */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col pointer-events-none" style={{ paddingTop: '12%', paddingBottom: '12%' }}>
        {/* Upper Third Label */}
        <motion.div 
          className="flex-1 flex items-center justify-center"
          style={{ height: `${thirds.upper}%` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          <div className={`-rotate-90 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded ${isThirdsIdeal(thirds.upper) ? 'bg-green-500/80 text-white' : 'bg-primary/80 text-background'}`}>
            {thirds.upper.toFixed(0)}%
          </div>
        </motion.div>
        
        {/* Middle Third Label */}
        <motion.div 
          className="flex-1 flex items-center justify-center"
          style={{ height: `${thirds.middle}%` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className={`-rotate-90 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded ${isThirdsIdeal(thirds.middle) ? 'bg-green-500/80 text-white' : 'bg-bronze/80 text-background'}`}>
            {thirds.middle.toFixed(0)}%
          </div>
        </motion.div>
        
        {/* Lower Third Label */}
        <motion.div 
          className="flex-1 flex items-center justify-center"
          style={{ height: `${thirds.lower}%` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4 }}
        >
          <div className={`-rotate-90 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded ${isThirdsIdeal(thirds.lower) ? 'bg-green-500/80 text-white' : 'bg-primary/80 text-background'}`}>
            {thirds.lower.toFixed(0)}%
          </div>
        </motion.div>
      </div>

      {/* Right Side Labels */}
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between pointer-events-none py-[15%]">
        {/* Upper label */}
        <motion.div
          className="text-[9px] text-primary/90 font-medium text-right"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
        >
          <span className="bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            Frente
          </span>
        </motion.div>
        
        {/* Middle label */}
        <motion.div
          className="text-[9px] text-bronze font-medium text-right"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3 }}
        >
          <span className="bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            Nariz
          </span>
        </motion.div>
        
        {/* Lower label */}
        <motion.div
          className="text-[9px] text-primary/90 font-medium text-right"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
        >
          <span className="bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            Boca-Mentón
          </span>
        </motion.div>
      </div>

      {/* Score badge */}
      {symmetryScore !== undefined && (
        <motion.div 
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-primary/40 shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8 }}
        >
          <span className="text-sm font-bold text-primary">{symmetryScore.toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground ml-1">Simetría</span>
        </motion.div>
      )}

      {/* Bottom Info Panel */}
      <motion.div 
        className="absolute bottom-2 left-2 right-2 rounded-xl bg-background/90 backdrop-blur-md border border-border/50 shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <div className="p-3 space-y-2">
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Midline */}
            <div className="space-y-0.5">
              <div className={`text-xs font-semibold ${isMidlineIdeal ? 'text-green-500' : 'text-primary'}`}>
                {midlineDeviation.toFixed(1)}mm
              </div>
              <div className="text-[9px] text-muted-foreground">Desv. Línea Media</div>
              {isMidlineIdeal && (
                <div className="text-[8px] text-green-500 font-medium">✓ Ideal</div>
              )}
            </div>
            
            {/* Gingival */}
            <div className="space-y-0.5">
              <div className={`text-xs font-semibold ${isGingivalIdeal ? 'text-green-500' : 'text-primary'}`}>
                {gingivalDisplay.toFixed(1)}mm
              </div>
              <div className="text-[9px] text-muted-foreground">Exp. Gingival</div>
              {isGingivalIdeal && (
                <div className="text-[8px] text-green-500 font-medium">✓ Ideal (0-3mm)</div>
              )}
            </div>
            
            {/* Thirds Balance */}
            <div className="space-y-0.5">
              <div className="flex justify-center gap-0.5">
                <div className={`w-2 h-3 rounded-sm ${isThirdsIdeal(thirds.upper) ? 'bg-green-500' : 'bg-primary'}`} />
                <div className={`w-2 h-3 rounded-sm ${isThirdsIdeal(thirds.middle) ? 'bg-green-500' : 'bg-bronze'}`} />
                <div className={`w-2 h-3 rounded-sm ${isThirdsIdeal(thirds.lower) ? 'bg-green-500' : 'bg-primary'}`} />
              </div>
              <div className="text-[9px] text-muted-foreground">Tercios Faciales</div>
              <div className="text-[8px] text-muted-foreground">Ideal: 33% c/u</div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-1 border-t border-border/30">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[8px] text-muted-foreground">Ideal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[8px] text-muted-foreground">Fuera de rango</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
