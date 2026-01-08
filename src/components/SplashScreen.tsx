import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSimetria from '@/assets/logo-simetria.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

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
          {/* Glow effect behind logo */}
          <motion.div
            className="absolute h-64 w-64 rounded-full bg-primary/20 blur-3xl md:h-96 md:w-96"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.6 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Logo container */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2 
            }}
          >
            {/* Logo */}
            <motion.img
              src={logoSimetria}
              alt="Simetría"
              className="h-32 w-auto md:h-48 lg:h-56"
              initial={{ filter: 'brightness(0)' }}
              animate={{ filter: 'brightness(1)' }}
              transition={{ duration: 1.2, delay: 0.5 }}
            />

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 1, 
                delay: 1.2,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* Bottom line animation */}
          <motion.div
            className="absolute bottom-20 h-px w-0 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ width: '60%' }}
            transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
