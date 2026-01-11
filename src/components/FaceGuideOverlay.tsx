import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Sun, Move, ZoomIn, RotateCcw } from 'lucide-react';

interface FaceGuideOverlayProps {
  isActive: boolean;
  countdown: number | null;
  validationProgress: number;
  isPositionValid: boolean;
  captureMode: 'rest' | 'smile';
}

type FeedbackType = 'center' | 'distance' | 'tilt' | 'lighting';

interface FeedbackItem {
  type: FeedbackType;
  label: string;
  icon: React.ReactNode;
  isValid: boolean;
}

export function FaceGuideOverlay({ 
  isActive, 
  countdown,
  validationProgress,
  isPositionValid,
  captureMode
}: FaceGuideOverlayProps) {
  const feedbackItems: FeedbackItem[] = useMemo(() => {
    const progress = validationProgress;
    return [
      { type: 'center', label: 'Centrado', icon: <Move className="w-4 h-4" />, isValid: progress >= 25 },
      { type: 'distance', label: 'Distancia', icon: <ZoomIn className="w-4 h-4" />, isValid: progress >= 50 },
      { type: 'tilt', label: 'Nivelado', icon: <RotateCcw className="w-4 h-4" />, isValid: progress >= 75 },
      { type: 'lighting', label: 'Iluminación', icon: <Sun className="w-4 h-4" />, isValid: progress >= 100 },
    ];
  }, [validationProgress]);

  const allValid = isPositionValid;
  const isCountingDown = countdown !== null && countdown > 0;

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Countdown overlay */}
      <AnimatePresence>
        {isCountingDown && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Glowing ring */}
              <div className="absolute inset-0 -m-8">
                <svg className="w-40 h-40" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(212, 168, 83, 0.3)"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#d4a853"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 283 }}
                    transition={{ duration: 1, ease: "linear" }}
                    style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                  />
                </svg>
              </div>
              
              {/* Number */}
              <span className="text-8xl font-bold text-primary drop-shadow-[0_0_30px_rgba(212,168,83,0.8)]">
                {countdown}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional oval face guide */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Gradient for the guide */}
          <linearGradient id="ovalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={allValid ? "#22c55e" : "#d4a853"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={allValid ? "#16a34a" : "#b8860b"} stopOpacity="0.6" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Mask for darkening outside the oval */}
          <mask id="ovalMask">
            <rect x="0" y="0" width="100" height="100" fill="white"/>
            <ellipse cx="50" cy="45" rx="22" ry="30" fill="black"/>
          </mask>
        </defs>

        {/* Darkened area outside oval */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#ovalMask)"/>

        {/* Progress ring around oval */}
        <ellipse 
          cx="50" 
          cy="45" 
          rx="23" 
          ry="31" 
          fill="none" 
          stroke="rgba(212,168,83,0.2)" 
          strokeWidth="0.8"
        />
        
        {/* Animated progress indicator */}
        <ellipse 
          cx="50" 
          cy="45" 
          rx="23" 
          ry="31" 
          fill="none" 
          stroke={allValid ? "#22c55e" : "#d4a853"}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray={`${validationProgress * 1.9} 190`}
          className="transition-all duration-300"
          style={{ transformOrigin: 'center' }}
        />

        {/* Main oval guide */}
        <ellipse 
          cx="50" 
          cy="45" 
          rx="22" 
          ry="30" 
          fill="none" 
          stroke="url(#ovalGradient)" 
          strokeWidth="0.5"
          filter="url(#glow)"
          className={allValid ? '' : 'animate-pulse'}
        />

        {/* Inner alignment guides - only show when not counting down */}
        {!isCountingDown && (
          <>
            {/* Horizontal center line (eye level) */}
            <line 
              x1="30" y1="40" x2="70" y2="40" 
              stroke={feedbackItems[0].isValid ? "#22c55e" : "#d4a853"} 
              strokeWidth="0.15" 
              strokeDasharray="2,1"
              opacity="0.6"
            />

            {/* Vertical center line */}
            <line 
              x1="50" y1="18" x2="50" y2="72" 
              stroke={feedbackItems[0].isValid ? "#22c55e" : "#d4a853"} 
              strokeWidth="0.15" 
              strokeDasharray="2,1"
              opacity="0.6"
            />

            {/* Eye position markers */}
            <circle cx="40" cy="40" r="1.5" fill="none" stroke={feedbackItems[0].isValid ? "#22c55e" : "#d4a853"} strokeWidth="0.2" opacity="0.5"/>
            <circle cx="60" cy="40" r="1.5" fill="none" stroke={feedbackItems[0].isValid ? "#22c55e" : "#d4a853"} strokeWidth="0.2" opacity="0.5"/>

            {/* Nose tip marker */}
            <circle cx="50" cy="52" r="1" fill="none" stroke={feedbackItems[0].isValid ? "#22c55e" : "#d4a853"} strokeWidth="0.2" opacity="0.5"/>

            {/* Chin marker */}
            <line 
              x1="42" y1="68" x2="58" y2="68" 
              stroke={feedbackItems[0].isValid ? "#22c55e" : "#d4a853"} 
              strokeWidth="0.15" 
              opacity="0.5"
            />
          </>
        )}

        {/* Corner brackets for framing */}
        <path d="M 25 22 L 25 18 L 30 18" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
        <path d="M 75 22 L 75 18 L 70 18" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
        <path d="M 25 72 L 25 76 L 30 76" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
        <path d="M 75 72 L 75 76 L 70 76" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
      </svg>

      {/* Feedback indicators - hide during countdown */}
      <AnimatePresence>
        {!isCountingDown && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-4 right-4 flex justify-center gap-2"
          >
            {feedbackItems.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-colors duration-300 ${
                  item.isValid 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-black/40 text-amber-400 border border-amber-500/30'
                }`}
              >
                {item.isValid ? <Check className="w-3 h-3" /> : item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {!isCountingDown && (
          <motion.div
            key={allValid ? 'ready' : 'adjusting'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-20 left-4 right-4 text-center"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${
              allValid 
                ? 'bg-green-500/20 border border-green-500/40' 
                : 'bg-black/50 border border-amber-500/30'
            }`}>
              {allValid ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">¡Preparando captura automática!</span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </motion.div>
                  <span className="text-amber-400 font-medium">
                    {captureMode === 'rest' ? 'Mantén rostro relajado' : 'Sonríe naturalmente'}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
        
        {isCountingDown && (
          <motion.div
            key="countdown-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-4 right-4 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-primary/20 border border-primary/40">
              <span className="text-primary font-medium">¡Mantén la posición!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center text-xs text-white/70 bg-black/30 rounded-lg px-3 py-2 backdrop-blur-sm">
          {captureMode === 'rest' 
            ? 'Rostro relajado • Labios cerrados • Mirada al frente'
            : 'Sonrisa natural • Muestra los dientes • Ojos abiertos'
          }
        </div>
      </div>
    </div>
  );
}
