import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSimetria from '@/assets/logo-simetria.png';
import { useAudio } from '@/contexts/AudioContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { loadAudio, play, isLoaded } = useAudio();

  useEffect(() => {
    // Start loading audio immediately
    loadAudio();
  }, [loadAudio]);

  useEffect(() => {
    // Play audio when loaded
    if (isLoaded) {
      play(0.15);
    }
  }, [isLoaded, play]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Large glow effect behind logo - much bigger */}
          <motion.div
            className="absolute h-[50vh] w-[50vh] rounded-full bg-primary/15 blur-[120px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.7 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          
          {/* Secondary glow ring */}
          <motion.div
            className="absolute h-[40vh] w-[40vh] rounded-full border border-primary/20"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.4 }}
            transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
          />

          {/* Logo container - much larger */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1, 
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2 
            }}
          >
            {/* Logo - significantly larger */}
            <motion.img
              src={logoSimetria}
              alt="Simetría"
              className="h-[40vh] w-auto max-h-[400px] md:h-[50vh] md:max-h-[500px]"
              initial={{ filter: 'brightness(0)' }}
              animate={{ filter: 'brightness(1)' }}
              transition={{ duration: 1.5, delay: 0.4 }}
            />

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 1.2, 
                delay: 1.5,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* Bottom line animation - wider */}
          <motion.div
            className="absolute bottom-16 h-px w-0 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ width: '80%' }}
            transition={{ duration: 2, delay: 0.6, ease: 'easeOut' }}
          />
          
          {/* Slogan */}
          <motion.p
            className="absolute bottom-24 font-display text-xl tracking-[0.4em] uppercase text-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Vuelve a fluir
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
