import { useState, useCallback, useRef } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Default voice ID provided by user
const DEFAULT_VOICE_ID = '0cheeVA5B3Cv6DGq65cT';

interface UseElevenLabsOptions {
  volume?: number;
}

export function useElevenLabs(options: UseElevenLabsOptions = {}) {
  const { volume = 1.0 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  }, []);

  const playTTS = useCallback(async (text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<void> => {
    setIsLoading(true);
    setError(null);
    stopAudio();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;
      
      await audio.play();
      
      // Cleanup when audio finishes
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error playing TTS';
      setError(message);
      console.error('TTS error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [volume, stopAudio]);

  const playSFX = useCallback(async (prompt: string, duration?: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    stopAudio();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-sfx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ prompt, duration }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `SFX request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;
      
      await audio.play();
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error playing SFX';
      setError(message);
      console.error('SFX error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [volume, stopAudio]);

  return {
    playTTS,
    playSFX,
    stopAudio,
    isLoading,
    error,
  };
}
