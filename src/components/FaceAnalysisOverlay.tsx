import { motion } from 'framer-motion';

interface FaceAnalysisOverlayProps {
  imageUrl: string;
  symmetryScore?: number;
  showPoints?: boolean;
}

export function FaceAnalysisOverlay({ imageUrl, symmetryScore, showPoints = true }: FaceAnalysisOverlayProps) {
  // Simulated facial landmark points (relative positions 0-100)
  const landmarks = [
    // Eyes
    { x: 35, y: 38, label: 'Ojo izq.' },
    { x: 65, y: 38, label: 'Ojo der.' },
    // Nose
    { x: 50, y: 50, label: 'Centro' },
    // Mouth corners
    { x: 38, y: 65, label: '' },
    { x: 62, y: 65, label: '' },
    // Jaw
    { x: 25, y: 55, label: '' },
    { x: 75, y: 55, label: '' },
    // Forehead
    { x: 50, y: 25, label: '' },
    // Chin
    { x: 50, y: 78, label: '' },
  ];

  const lines = [
    // Vertical center line
    { x1: 50, y1: 15, x2: 50, y2: 85 },
    // Horizontal eye line
    { x1: 25, y1: 38, x2: 75, y2: 38 },
    // Horizontal mouth line
    { x1: 30, y1: 65, x2: 70, y2: 65 },
  ];

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
          {/* Guide lines */}
          {lines.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(38, 70%, 50%)"
              strokeWidth="0.3"
              strokeDasharray="2,2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
            />
          ))}
          
          {/* Landmark points */}
          {landmarks.map((point, i) => (
            <motion.g key={i}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill="hsl(38, 70%, 50%)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
              />
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="none"
                stroke="hsl(38, 70%, 50%)"
                strokeWidth="0.3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.3 }}
              />
            </motion.g>
          ))}

          {/* Face oval guide */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="28"
            ry="38"
            fill="none"
            stroke="hsl(38, 70%, 50%)"
            strokeWidth="0.4"
            strokeDasharray="4,2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 2, delay: 0.3 }}
          />
        </svg>
      )}

      {/* Score badge */}
      {symmetryScore && (
        <motion.div 
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-sm font-semibold text-primary">{symmetryScore.toFixed(0)}% Simetría</span>
        </motion.div>
      )}

      {/* Analysis indicator */}
      <motion.div 
        className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-muted-foreground">42 puntos de referencia analizados</span>
        </div>
      </motion.div>
    </div>
  );
}