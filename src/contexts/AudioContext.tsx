import { createContext, useContext, ReactNode, useCallback, useEffect, useState, useRef } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  isLoaded: boolean;
  volume: number;
  play: (vol?: number) => Promise<void>;
  pause: () => void;
  setVolume: (vol: number) => void;
  loadAudio: () => Promise<void>;
}

const AudioCtx = createContext<AudioContextType | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.12);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        console.warn('Could not load ambient audio');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;
        setIsLoaded(true);
      }
    } catch (error) {
      console.warn('Error loading ambient audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  const fadeIn = useCallback((targetVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const duration = 2500;
    const steps = 40;
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
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      fadeIn(targetVolume ?? volume);
    } catch (error) {
      console.warn('Could not play audio:', error);
    }
  }, [fadeIn, volume]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <AudioCtx.Provider value={{ isPlaying, isLoaded, volume, play, pause, setVolume, loadAudio }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}