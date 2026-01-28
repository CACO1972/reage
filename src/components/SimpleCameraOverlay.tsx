import { motion } from 'framer-motion';

interface SimpleCameraOverlayProps {
  currentMode: 'rest' | 'smile';
}

/**
 * Simple visual positioning frame overlay.
 * - NO face detection or validation
 * - NO blocking behavior
 * - pointer-events: none
 * - Just visual guide
 */
export function SimpleCameraOverlay({ currentMode }: SimpleCameraOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Oval face positioning guide */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 133" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient for the oval guide */}
          <linearGradient id="ovalGuideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Mask for darkening outside the oval */}
          <mask id="faceMask">
            <rect x="0" y="0" width="100" height="133" fill="white"/>
            <ellipse cx="50" cy="55" rx="28" ry="38" fill="black"/>
          </mask>
        </defs>

        {/* Darkened area outside oval */}
        <rect 
          x="0" y="0" 
          width="100" height="133" 
          fill="rgba(0,0,0,0.5)" 
          mask="url(#faceMask)"
        />

        {/* Main oval guide */}
        <motion.ellipse 
          cx="50" 
          cy="55" 
          rx="28" 
          ry="38" 
          fill="none" 
          stroke="url(#ovalGuideGradient)" 
          strokeWidth="0.6"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Corner brackets for framing */}
        <g stroke="hsl(var(--primary))" strokeWidth="0.4" fill="none" opacity="0.7">
          <path d="M 18 22 L 18 16 L 25 16" />
          <path d="M 82 22 L 82 16 L 75 16" />
          <path d="M 18 94 L 18 100 L 25 100" />
          <path d="M 82 94 L 82 100 L 75 100" />
        </g>
      </svg>

      {/* Guide text at bottom */}
      <div className="absolute bottom-16 left-4 right-4 text-center">
        <div className="inline-block text-sm text-white/90 bg-black/60 rounded-lg px-4 py-2 backdrop-blur-sm">
          Coloca tu rostro dentro del marco
        </div>
      </div>

      {/* Mode instruction */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="inline-block text-xs text-white/80 bg-black/40 rounded-lg px-3 py-1.5 backdrop-blur-sm">
          {currentMode === 'rest' 
            ? '😐 Rostro relajado • Labios cerrados'
            : '😁 Sonrisa natural • Muestra los dientes'
          }
        </div>
      </div>
    </div>
  );
}
