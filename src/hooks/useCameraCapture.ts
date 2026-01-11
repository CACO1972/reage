import { useEffect, useRef, useState, useCallback } from "react";

type CaptureMode = "rest" | "smile";

interface UseCameraCaptureOptions {
  maxFileSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
  autoCapture?: boolean;
  onCountdownStart?: () => void;
  onCountdownTick?: (count: number) => void;
}

interface CaptureResult {
  file: File;
  preview: string;
}

export function useCameraCapture(options?: UseCameraCaptureOptions) {
  const {
    maxFileSizeMB = 10,
    minWidth = 640,
    minHeight = 800,
    autoCapture = true,
    onCountdownStart,
    onCountdownTick,
  } = options || {};

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<number | null>(null);
  const autoValidRef = useRef<number | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPositionValid, setIsPositionValid] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  const [restPhoto, setRestPhoto] = useState<CaptureResult | null>(null);
  const [smilePhoto, setSmilePhoto] = useState<CaptureResult | null>(null);
  const [currentMode, setCurrentMode] = useState<CaptureMode>("rest");

  const stopCamera = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (autoValidRef.current) {
      clearInterval(autoValidRef.current);
      autoValidRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
    setCountdown(null);
    setIsPositionValid(false);
    setValidationProgress(0);
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);
    try {
      // Request camera with explicit user-facing (selfie) mode
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { exact: "user" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 1920, min: 960 },
        },
        audio: false,
      };

      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback if exact constraint fails (some devices don't support it)
        console.log("Falling back to non-exact facingMode");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280, min: 640 },
            height: { ideal: 1920, min: 960 },
          },
          audio: false,
        });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsCameraOpen(true);
          } catch (e) {
            console.error("Video play error:", e);
            setError("Error al reproducir video. Toca la pantalla para reintentar.");
          }
        };
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setError("Permiso de cámara denegado. Habilítalo en la configuración del navegador.");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setError("No se encontró cámara frontal. Usa 'Subir imagen'.");
      } else if (e.name === "OverconstrainedError") {
        setError("La cámara no soporta el modo selfie. Usa 'Subir imagen'.");
      } else {
        setError("No se pudo acceder a la cámara. Comprueba permisos o usa 'Subir imagen'.");
      }
      stopCamera();
    }
  }, [stopCamera]);

  const validateImage = async (blob: Blob): Promise<string | null> => {
    const sizeMB = blob.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      return `La imagen supera los ${maxFileSizeMB} MB.`;
    }

    try {
      const bitmap = await createImageBitmap(blob);
      if (bitmap.width < minWidth || bitmap.height < minHeight) {
        return `Resolución insuficiente. Mínimo ${minWidth}×${minHeight}px.`;
      }
    } catch (e) {
      return "No se pudo procesar la imagen.";
    }

    return null;
  };

  const playSound = useCallback((frequency: number, duration: number, volume: number = 0.15) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = volume;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const playCountdownTick = useCallback((count: number) => {
    // Higher pitch for final count
    const freq = count === 1 ? 880 : 660;
    playSound(freq, 0.1, 0.2);
  }, [playSound]);

  const playShutterSound = useCallback(() => {
    playSound(1200, 0.15, 0.25);
  }, [playSound]);

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 1920;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");
      
      // Mirror horizontally for natural selfie
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("No se pudo generar imagen"))),
          "image/jpeg",
          0.92
        )
      );

      const msg = await validateImage(blob);
      if (msg) {
        setError(msg);
        setIsCapturing(false);
        return;
      }

      const file = new File(
        [blob],
        currentMode === "rest" ? "rostro_reposo.jpg" : "rostro_sonrisa.jpg",
        { type: "image/jpeg" }
      );

      const preview = URL.createObjectURL(blob);

      playShutterSound();

      if (currentMode === "rest") {
        setRestPhoto({ file, preview });
        setCurrentMode("smile");
        // Reset validation for next photo
        setIsPositionValid(false);
        setValidationProgress(0);
      } else {
        setSmilePhoto({ file, preview });
        stopCamera();
      }
    } catch (e) {
      console.error("Capture error:", e);
      setError("Error al capturar la foto. Intenta nuevamente.");
    } finally {
      setIsCapturing(false);
      setCountdown(null);
    }
  }, [currentMode, playShutterSound, stopCamera]);

  // Start countdown when position is valid
  const startCountdown = useCallback(() => {
    if (countdownRef.current) return; // Already counting
    
    onCountdownStart?.();
    let count = 3;
    setCountdown(count);
    playCountdownTick(count);
    onCountdownTick?.(count);

    countdownRef.current = window.setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        playCountdownTick(count);
        onCountdownTick?.(count);
      } else {
        setCountdown(0);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        // Auto capture
        captureFromCamera();
      }
    }, 1000);
  }, [captureFromCamera, onCountdownStart, onCountdownTick, playCountdownTick]);

  // Cancel countdown
  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Handle position validation from face guide
  const handlePositionValidation = useCallback((isValid: boolean) => {
    setIsPositionValid(isValid);
    
    if (isValid && autoCapture && isCameraOpen && !countdown && !isCapturing) {
      // Position is valid, start countdown
      startCountdown();
    } else if (!isValid && countdown) {
      // Position lost, cancel countdown
      cancelCountdown();
    }
  }, [autoCapture, isCameraOpen, countdown, isCapturing, startCountdown, cancelCountdown]);

  // Simulate position validation progress (for demo - in production use face detection)
  useEffect(() => {
    if (!isCameraOpen || !autoCapture) return;

    let progress = 0;
    autoValidRef.current = window.setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        setValidationProgress(100);
        setIsPositionValid(true);
        if (autoValidRef.current) {
          clearInterval(autoValidRef.current);
          autoValidRef.current = null;
        }
      } else {
        setValidationProgress(Math.min(progress, 99));
      }
    }, 800);

    return () => {
      if (autoValidRef.current) {
        clearInterval(autoValidRef.current);
        autoValidRef.current = null;
      }
    };
  }, [isCameraOpen, autoCapture, currentMode]);

  // Auto-start countdown when position becomes valid
  useEffect(() => {
    if (isPositionValid && autoCapture && isCameraOpen && !countdown && !isCapturing) {
      startCountdown();
    }
  }, [isPositionValid, autoCapture, isCameraOpen, countdown, isCapturing, startCountdown]);

  const handleFileInput = useCallback(
    async (file: File) => {
      setError(null);
      
      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen.");
        return;
      }
      
      const msg = await validateImage(file);
      if (msg) {
        setError(msg);
        return;
      }
      
      const preview = URL.createObjectURL(file);
      
      if (currentMode === "rest") {
        setRestPhoto({ file, preview });
        setCurrentMode("smile");
      } else {
        setSmilePhoto({ file, preview });
      }
    },
    [currentMode]
  );

  const clearPhoto = useCallback((mode: CaptureMode) => {
    if (mode === "rest") {
      if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
      setRestPhoto(null);
      setCurrentMode("rest");
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
      setSmilePhoto(null);
    } else {
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
      setSmilePhoto(null);
      setCurrentMode("smile");
    }
    // Reset validation
    setIsPositionValid(false);
    setValidationProgress(0);
  }, [restPhoto, smilePhoto]);

  const reset = useCallback(() => {
    if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
    if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    setRestPhoto(null);
    setSmilePhoto(null);
    setCurrentMode("rest");
    setError(null);
    setIsPositionValid(false);
    setValidationProgress(0);
    stopCamera();
  }, [restPhoto, smilePhoto, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    };
  }, []);

  return {
    videoRef,
    isCameraOpen,
    isCapturing,
    error,
    restPhoto,
    smilePhoto,
    currentMode,
    countdown,
    isPositionValid,
    validationProgress,
    openCamera,
    stopCamera,
    captureFromCamera,
    handleFileInput,
    clearPhoto,
    reset,
    setCurrentMode,
    handlePositionValidation,
    cancelCountdown,
    readyForAnalysis: !!restPhoto && !!smilePhoto,
  };
}
