import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Eye, Ruler, Camera } from 'lucide-react';

interface FaceFramingOverlayProps {
  currentMode: 'rest' | 'smile';
  /** Show validation indicators (face detected, centered, etc.) */
  showValidation?: boolean;
  /** Validation states */
  validation?: {
    faceDetected: boolean;
    centered: boolean;
    sizeOk: boolean;
    frontal: boolean;
  };
  /** Show auto-capture countdown */
  autoCapturing?: boolean;
  autoCaptureCountdown?: number;
}

/**
 * Professional face framing overlay with standardization guides
 * - Oval face guide with proper proportions
 * - PROMINENT center midline for alignment
 * - Facial thirds reference lines
 * - Eye level guide
 * - Auto-capture indicator when position is valid
 */
export function FaceFramingOverlay({ 
  currentMode, 
  showValidation = false,
  validation,
  autoCapturing = false,
  autoCaptureCountdown
}: FaceFramingOverlayProps) {
  const isValid = validation && 
    validation.faceDetected && 
    validation.centered && 
    validation.sizeOk && 
    validation.frontal;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Main SVG overlay */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 133" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient for the oval guide */}
          <linearGradient id="frameGuideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Valid state gradient */}
          <linearGradient id="validGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Mask for darkening outside the oval */}
          <mask id="frameOvalMask">
            <rect x="0" y="0" width="100" height="133" fill="white"/>
            <ellipse cx="50" cy="52" rx="36" ry="46" fill="black"/>
          </mask>

          {/* Dashed line pattern */}
          <pattern id="dashPattern" patternUnits="userSpaceOnUse" width="4" height="1">
            <rect x="0" y="0" width="2" height="1" fill="rgba(255,255,255,0.5)" />
          </pattern>
        </defs>

        {/* Darkened area outside oval - darker for better contrast */}
        <rect 
          x="0" y="0" 
          width="100" height="133" 
          fill="rgba(0,0,0,0.55)" 
          mask="url(#frameOvalMask)"
        />

        {/* Main oval guide with animation */}
        <motion.ellipse 
          cx="50" 
          cy="52" 
          rx="36" 
          ry="46" 
          fill="none" 
          stroke={isValid ? "url(#validGradient)" : "url(#frameGuideGradient)"}
          strokeWidth="0.6"
          strokeDasharray="3 2"
          initial={{ opacity: 0.7 }}
          animate={{ 
            opacity: [0.7, 1, 0.7],
            strokeWidth: isValid ? 0.8 : 0.6
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* === STANDARDIZATION GUIDES === */}
        
        {/* Center vertical axis (MIDLINE) - More prominent */}
        <motion.line 
          x1="50" y1="6" x2="50" y2="98"
          stroke={isValid ? "#22c55e" : "hsl(var(--primary))"}
          strokeWidth="0.6"
          strokeDasharray="3 2"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: isValid ? 1 : 0.85 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Midline center marker */}
        <motion.circle
          cx="50"
          cy="52"
          r="1.5"
          fill="none"
          stroke={isValid ? "#22c55e" : "hsl(var(--primary))"}
          strokeWidth="0.4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Midline top indicator */}
        <motion.polygon
          points="50,4 48,8 52,8"
          fill={isValid ? "#22c55e" : "hsl(var(--primary))"}
          opacity={0.7}
        />

        {/* === FACIAL THIRDS GUIDES === */}
        {/* Hairline level */}
        <motion.line 
          x1="20" y1="15" x2="80" y2="15"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.25"
          strokeDasharray="1.5 2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
        />
        
        {/* Eyebrow level (upper third) */}
        <motion.line 
          x1="18" y1="35" x2="82" y2="35"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.4"
          strokeWidth="0.3"
          strokeDasharray="2 2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.7 }}
        />
        
        {/* Eye level marker */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.8 }}
        >
          {/* Left eye guide */}
          <circle cx="36" cy="42" r="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
          {/* Right eye guide */}
          <circle cx="64" cy="42" r="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
          {/* Eye level line */}
          <line x1="28" y1="42" x2="72" y2="42" stroke="rgba(255,255,255,0.25)" strokeWidth="0.2" strokeDasharray="1 2" />
        </motion.g>

        {/* Nose base (middle third end) */}
        <motion.line 
          x1="22" y1="60" x2="78" y2="60"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.4"
          strokeWidth="0.3"
          strokeDasharray="2 2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.9 }}
        />

        {/* Mouth level */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1 }}
        >
          {/* Mouth area guide */}
          <ellipse cx="50" cy="72" rx="14" ry="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.25" strokeDasharray="1 1.5" />
          {/* Mouth center line */}
          <line x1="36" y1="72" x2="64" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="0.2" />
        </motion.g>

        {/* Chin level (lower third end) */}
        <motion.line 
          x1="28" y1="90" x2="72" y2="90"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.35"
          strokeWidth="0.3"
          strokeDasharray="2 2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.1 }}
        />

        {/* Corner brackets for framing */}
        <g stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" opacity="0.8">
          <path d="M 10 12 L 10 5 L 18 5" />
          <path d="M 90 12 L 90 5 L 82 5" />
          <path d="M 10 100 L 10 107 L 18 107" />
          <path d="M 90 100 L 90 107 L 82 107" />
        </g>

        {/* Thirds labels (small) */}
        <text x="7" y="26" fontSize="2.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">1/3</text>
        <text x="7" y="48" fontSize="2.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">2/3</text>
        <text x="7" y="76" fontSize="2.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">3/3</text>
      </svg>

      {/* Validation indicators */}
      {showValidation && validation && (
        <div className="absolute top-4 right-4 flex flex-col gap-1.5">
          <ValidationIndicator 
            label="Rostro" 
            valid={validation.faceDetected} 
          />
          <ValidationIndicator 
            label="Centrado" 
            valid={validation.centered} 
          />
          <ValidationIndicator 
            label="Tamaño" 
            valid={validation.sizeOk} 
          />
          <ValidationIndicator 
            label="Frontal" 
            valid={validation.frontal} 
          />
        </div>
      )}

      {/* Auto-capture indicator */}
      {autoCapturing && autoCaptureCountdown !== undefined && (
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-green-500/30 border-2 border-green-500/60 backdrop-blur-md">
            <Camera className="w-8 h-8 text-green-400 animate-pulse" />
            <span className="text-green-400 font-bold text-lg">
              Capturando en {autoCaptureCountdown}...
            </span>
          </div>
        </motion.div>
      )}

      {/* Mode-specific instruction */}
      <motion.div 
        className="absolute bottom-20 left-4 right-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center">
          <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl backdrop-blur-md ${
            isValid 
              ? 'bg-green-500/20 border border-green-500/40' 
              : 'bg-black/60 border border-white/10'
          }`}>
            {isValid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-300 font-medium">
                  ¡Perfecto! Mantén la posición
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-primary/80" />
                  <Eye className="w-4 h-4 text-primary/80" />
                </div>
                <span className="text-sm text-white/90 font-medium">
                  Alinea tu rostro con la línea central
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bottom instruction */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className={`inline-block text-xs rounded-lg px-3 py-1.5 backdrop-blur-sm ${
          currentMode === 'rest' 
            ? 'text-blue-300 bg-blue-500/30' 
            : 'text-amber-300 bg-amber-500/30'
        }`}>
          {currentMode === 'rest' 
            ? '😐 Expresión relajada • Labios cerrados • Mirada al frente'
            : '😁 Sonrisa natural • Muestra los dientes superiores'
          }
        </div>
      </div>
    </div>
  );
}

/** Small validation indicator badge */
function ValidationIndicator({ label, valid }: { label: string; valid: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium backdrop-blur-sm ${
        valid 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-red-500/20 text-red-400/70 border border-red-500/20'
      }`}
    >
      {valid ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {label}
    </motion.div>
  );
}
