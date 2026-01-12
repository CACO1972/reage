import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/contexts/AudioContext';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import logoSimetria from '@/assets/logo-simetria.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'exit'>('logo');
  const { loadAudio, play, isLoaded } = useAudio();
  const { playSFX } = useElevenLabs({ volume: 0.4 });
  const sfxPlayedRef = useRef(false);

  useEffect(() => {
    loadAudio();
  }, [loadAudio]);

  useEffect(() => {
    if (isLoaded) {
      play(0.15);
    }
  }, [isLoaded, play]);

  // Play subtle SFX on mount - elegant whoosh/shimmer
  // This is a non-critical enhancement that fails gracefully
  useEffect(() => {
    const playSplashSound = async () => {
      if (sfxPlayedRef.current) return;
      sfxPlayedRef.current = true;
      
      try {
        await playSFX('Subtle elegant digital shimmer whoosh, soft and luxurious, high-end brand reveal sound', 2);
      } catch {
        // Silently fail - SFX is optional enhancement
        // API key may lack sound_generation permission
      }
    };
    
    // Delay slightly to not block initial render
    const timer = setTimeout(playSplashSound, 100);
    return () => clearTimeout(timer);
  }, [playSFX]);

  useEffect(() => {
    // Phase 1: Logo appears (0-1.2s)
    // Phase 2: Tagline appears (1.2s-2.4s)
    // Phase 3: Exit (2.4s-3s)
    const taglineTimer = setTimeout(() => setPhase('tagline'), 1200);
    const exitTimer = setTimeout(() => setPhase('exit'), 2400);
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, 3000);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-[hsl(220,25%,4%)]">
            {/* Radial gradient pulse */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3] }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle at 50% 50%, hsl(38, 70%, 50%, 0.15) 0%, transparent 60%)'
              }}
            />
            
            {/* Animated rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
                initial={{ width: 100, height: 100, opacity: 0 }}
                animate={{ 
                  width: [100, 400 + i * 150], 
                  height: [100, 400 + i * 150], 
                  opacity: [0, 0.5, 0] 
                }}
                transition={{ 
                  duration: 2.5, 
                  delay: i * 0.3, 
                  ease: 'easeOut' 
                }}
              />
            ))}

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full bg-primary/60"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -50 - Math.random() * 50]
                }}
                transition={{ 
                  duration: 2 + Math.random(), 
                  delay: 0.5 + Math.random() * 1,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ 
                scale: phase === 'exit' ? 1.1 : 1, 
                opacity: phase === 'exit' ? 0 : 1, 
                filter: 'blur(0px)' 
              }}
              transition={{ 
                duration: 0.8, 
                ease: [0.23, 1, 0.32, 1] // Custom easing for smooth reveal
              }}
              className="relative"
            >
              {/* Logo glow */}
              <motion.div
                className="absolute inset-0 blur-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.4] }}
                transition={{ duration: 1.5, delay: 0.3 }}
                style={{
                  background: 'radial-gradient(circle, hsl(38, 70%, 50%, 0.5) 0%, transparent 70%)'
                }}
              />
              
              <img
                src={logoSimetria}
                alt="Simetría"
                className="relative w-48 h-auto drop-shadow-2xl"
              />
            </motion.div>

            {/* Tagline */}
            <AnimatePresence>
              {(phase === 'tagline' || phase === 'exit') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: phase === 'exit' ? 0 : 1, 
                    y: phase === 'exit' ? -10 : 0 
                  }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm tracking-[0.3em] text-primary/80 font-light uppercase">
                    Armonía facial
                  </p>
                  <motion.div
                    className="mt-3 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: 120 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(220,25%,4%)] to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
