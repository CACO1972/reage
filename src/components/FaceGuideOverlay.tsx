import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Sun, Move, ZoomIn, RotateCcw } from 'lucide-react';

interface FaceGuideOverlayProps {
  isActive: boolean;
  onPositionValid?: (isValid: boolean) => void;
}

type FeedbackType = 'center' | 'distance' | 'tilt' | 'lighting';

interface FeedbackItem {
  type: FeedbackType;
  label: string;
  icon: React.ReactNode;
  isValid: boolean;
}

export function FaceGuideOverlay({ isActive, onPositionValid }: FaceGuideOverlayProps) {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([
    { type: 'center', label: 'Centrado', icon: <Move className="w-4 h-4" />, isValid: false },
    { type: 'distance', label: 'Distancia', icon: <ZoomIn className="w-4 h-4" />, isValid: false },
    { type: 'tilt', label: 'Nivelado', icon: <RotateCcw className="w-4 h-4" />, isValid: false },
    { type: 'lighting', label: 'Iluminación', icon: <Sun className="w-4 h-4" />, isValid: false },
  ]);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [allValid, setAllValid] = useState(false);

  // Simulated validation - in production would use face-api.js or TensorFlow
  // This creates a realistic UX while user positions themselves
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 4);
      
      // Simulate gradual validation as user adjusts position
      // In production, this would be replaced with actual face detection
      setFeedbackItems(prev => {
        const newItems = [...prev];
        const randomIndex = Math.floor(Math.random() * 4);
        
        // Gradually validate items over time (simulating user adjustment)
        if (Math.random() > 0.3) {
          newItems[randomIndex] = { ...newItems[randomIndex], isValid: true };
        }
        
        return newItems;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    const valid = feedbackItems.every(item => item.isValid);
    setAllValid(valid);
    onPositionValid?.(valid);

    // Play subtle audio feedback when all valid
    if (valid && isActive) {
      playValidationSound();
    }
  }, [feedbackItems, isActive, onPositionValid]);

  const playValidationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const resetValidation = () => {
    setFeedbackItems(prev => prev.map(item => ({ ...item, isValid: false })));
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
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

        {/* Inner alignment guides */}
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

        {/* Corner brackets for framing */}
        {/* Top left */}
        <path d="M 25 22 L 25 18 L 30 18" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
        {/* Top right */}
        <path d="M 75 22 L 75 18 L 70 18" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
        {/* Bottom left */}
        <path d="M 25 72 L 25 76 L 30 76" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
        {/* Bottom right */}
        <path d="M 75 72 L 75 76 L 70 76" fill="none" stroke={allValid ? "#22c55e" : "#d4a853"} strokeWidth="0.3"/>
      </svg>

      {/* Feedback indicators */}
      <div className="absolute top-4 left-4 right-4 flex justify-center gap-2">
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
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
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
                <span className="text-green-400 font-medium">¡Listo para capturar!</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </motion.div>
                <span className="text-amber-400 font-medium">Ajusta tu posición</span>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center text-xs text-white/70 bg-black/30 rounded-lg px-3 py-2 backdrop-blur-sm">
          Alinea tu rostro dentro del óvalo • Ojos a la altura de los círculos • Mentón sobre la línea inferior
        </div>
      </div>
    </div>
  );
}
