import { useState, useEffect, useRef, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UseAmbientAudioOptions {
  autoPlay?: boolean;
  initialVolume?: number;
  fadeInDuration?: number;
}

export function useAmbientAudio(options: UseAmbientAudioOptions = {}) {
  const { autoPlay = false, initialVolume = 0.15, fadeInDuration = 2000 } = options;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const loadAudio = useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-ambient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          prompt: 'Gentle spa ambient soundscape, soft flowing water, peaceful wellness atmosphere, calming meditation music, serene and tranquil',
          duration: 22
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load ambient audio');
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        audioUrlRef.current = audioUrl;
        
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;
        
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading ambient audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  const fadeIn = useCallback((targetVolume: number, duration: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const steps = 30;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  }, []);

  const play = useCallback(async (targetVolume?: number) => {
    const audio = audioRef.current;
    if (!audio) {
      await loadAudio();
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      fadeIn(targetVolume ?? volume, fadeInDuration);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, [loadAudio, fadeIn, volume, fadeInDuration]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Auto-play when loaded
  useEffect(() => {
    if (autoPlay && isLoaded && !isPlaying) {
      play();
    }
  }, [autoPlay, isLoaded, isPlaying, play]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    isLoading,
    isLoaded,
    volume,
    loadAudio,
    play,
    pause,
    setVolume,
  };
}