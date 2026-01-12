import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/contexts/AudioContext';
import splashVideo from '@/assets/splash-video.mp4';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { loadAudio, play, isLoaded } = useAudio();

  useEffect(() => {
    loadAudio();
  }, [loadAudio]);

  useEffect(() => {
    if (isLoaded) {
      play(0.15);
    }
  }, [isLoaded, play]);

  const handleVideoEnd = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  useEffect(() => {
    // Fallback timer in case video doesn't trigger onEnded
    const fallbackTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 8000);

    return () => clearTimeout(fallbackTimer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <video
            ref={videoRef}
            src={splashVideo}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="h-full w-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
