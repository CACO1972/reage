import { useEffect, useRef, useState, useCallback } from "react";

type CaptureMode = "rest" | "smile";

interface UseCameraCaptureOptions {
  maxFileSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
  autoCapture?: boolean;
  requireFaceDetection?: boolean;
  onCountdownStart?: () => void;
  onCountdownTick?: (count: number) => void;
}

interface CaptureResult {
  file: File;
  preview: string;
}

interface FaceDetectionResult {
  detected: boolean;
  centered: boolean;
  goodSize: boolean;
}

export function useCameraCapture(options?: UseCameraCaptureOptions) {
  const {
    maxFileSizeMB = 10,
    minWidth = 640,
    minHeight = 800,
    autoCapture = true,
    requireFaceDetection = true,
    onCountdownStart,
    onCountdownTick,
  } = options || {};

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<number | null>(null);
  const faceDetectionRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const consecutiveDetectionsRef = useRef<number>(0);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPositionValid, setIsPositionValid] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [faceDetectionSupported, setFaceDetectionSupported] = useState(true);

  const [restPhoto, setRestPhoto] = useState<CaptureResult | null>(null);
  const [smilePhoto, setSmilePhoto] = useState<CaptureResult | null>(null);
  const [currentMode, setCurrentMode] = useState<CaptureMode>("rest");

  // Initialize face detector
  useEffect(() => {
    const initFaceDetector = async () => {
      // Check if FaceDetector API is available (Chrome/Edge)
      if ('FaceDetector' in window) {
        try {
          faceDetectorRef.current = new (window as any).FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
          console.log('FaceDetector API initialized');
        } catch (e) {
          console.warn('FaceDetector init failed:', e);
          setFaceDetectionSupported(false);
        }
      } else {
        console.warn('FaceDetector API not available');
        setFaceDetectionSupported(false);
      }
    };
    
    initFaceDetector();
  }, []);

  const stopCamera = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (faceDetectionRef.current) {
      cancelAnimationFrame(faceDetectionRef.current);
      faceDetectionRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
    setCountdown(null);
    setIsPositionValid(false);
    setValidationProgress(0);
    consecutiveDetectionsRef.current = 0;
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);

    const attachStream = async (stream: MediaStream) => {
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");

        try {
          await videoRef.current.play();
          setIsCameraOpen(true);
        } catch (e) {
          setIsCameraOpen(true);
        }
      } else {
        setIsCameraOpen(true);
      }
    };

    const pickFrontDeviceId = async (): Promise<string | null> => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter((d) => d.kind === "videoinput");
        if (!videos.length) return null;

        const preferred = videos.find((d) =>
          /front|user|facetime|selfie/i.test(d.label)
        );
        return (preferred || videos[0]).deviceId || null;
      } catch {
        return null;
      }
    };

    try {
      // 1) First attempt: ask explicitly for selfie camera
      let stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      // 2) If browser still gave us the rear camera, restart using deviceId
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
      const label = track?.label || "";
      const looksRear =
        settings.facingMode === "environment" || /back|rear|environment/i.test(label);

      if (looksRear) {
        stream.getTracks().forEach((t) => t.stop());
        const deviceId = await pickFrontDeviceId();
        if (deviceId) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 1920 },
            },
            audio: false,
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
        }
      }

      await attachStream(stream);
    } catch (e: any) {
      console.error("Camera error:", e);
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setError(
          "Permiso de cámara denegado. Toca 'Tomar foto' y acepta los permisos del navegador."
        );
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        setError("No se encontró cámara. Usa 'Subir imagen'.");
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
        setIsPositionValid(false);
        setValidationProgress(0);
        consecutiveDetectionsRef.current = 0;
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

  const startCountdown = useCallback(() => {
    if (countdownRef.current) return;
    
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
        captureFromCamera();
      }
    }, 1000);
  }, [captureFromCamera, onCountdownStart, onCountdownTick, playCountdownTick]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Analyze face position in frame
  const analyzeFacePosition = useCallback((
    face: any,
    videoWidth: number,
    videoHeight: number
  ): FaceDetectionResult => {
    const box = face.boundingBox;
    
    // Calculate face center
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    
    // Calculate frame center
    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;
    
    // Check if face is centered (within 15% of center)
    const toleranceX = videoWidth * 0.15;
    const toleranceY = videoHeight * 0.15;
    const centered = 
      Math.abs(faceCenterX - frameCenterX) < toleranceX &&
      Math.abs(faceCenterY - frameCenterY) < toleranceY;
    
    // Check face size (should be between 25% and 60% of frame)
    const faceArea = (box.width * box.height) / (videoWidth * videoHeight);
    const goodSize = faceArea > 0.08 && faceArea < 0.5;
    
    return {
      detected: true,
      centered,
      goodSize,
    };
  }, []);

  // Real face detection loop
  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || isCapturing || countdown !== null) return;
    
    const video = videoRef.current;
    let isRunning = true;

    const detectFace = async () => {
      if (!isRunning || !video || video.readyState < 2) {
        if (isRunning) {
          faceDetectionRef.current = requestAnimationFrame(detectFace);
        }
        return;
      }

      try {
        // Use FaceDetector API if available
        if (faceDetectorRef.current && faceDetectionSupported) {
          const faces = await faceDetectorRef.current.detect(video);
          
          if (faces.length > 0) {
            const result = analyzeFacePosition(
              faces[0],
              video.videoWidth,
              video.videoHeight
            );
            
            if (result.detected && result.centered && result.goodSize) {
              consecutiveDetectionsRef.current++;
              
              // Need 5 consecutive good detections (about 0.5 seconds)
              const progress = Math.min((consecutiveDetectionsRef.current / 5) * 100, 100);
              setValidationProgress(progress);
              
              if (consecutiveDetectionsRef.current >= 5) {
                setIsPositionValid(true);
              }
            } else {
              // Reset if position is bad
              consecutiveDetectionsRef.current = Math.max(0, consecutiveDetectionsRef.current - 2);
              setValidationProgress(Math.max(0, (consecutiveDetectionsRef.current / 5) * 100));
              setIsPositionValid(false);
            }
          } else {
            // No face detected
            consecutiveDetectionsRef.current = 0;
            setValidationProgress(0);
            setIsPositionValid(false);
          }
        } else if (!requireFaceDetection) {
          // Fallback: allow capture without face detection
          setValidationProgress(100);
          setIsPositionValid(true);
        }
      } catch (e) {
        console.warn('Face detection error:', e);
      }

      if (isRunning) {
        faceDetectionRef.current = requestAnimationFrame(detectFace);
      }
    };

    // Start detection loop with a small delay to let video initialize
    const timeoutId = setTimeout(() => {
      faceDetectionRef.current = requestAnimationFrame(detectFace);
    }, 500);

    return () => {
      isRunning = false;
      clearTimeout(timeoutId);
      if (faceDetectionRef.current) {
        cancelAnimationFrame(faceDetectionRef.current);
        faceDetectionRef.current = null;
      }
    };
  }, [isCameraOpen, isCapturing, countdown, faceDetectionSupported, requireFaceDetection, analyzeFacePosition]);

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
    setIsPositionValid(false);
    setValidationProgress(0);
    consecutiveDetectionsRef.current = 0;
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
    consecutiveDetectionsRef.current = 0;
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
    faceDetectionSupported,
    openCamera,
    stopCamera,
    captureFromCamera,
    handleFileInput,
    clearPhoto,
    reset,
    setCurrentMode,
    cancelCountdown,
    readyForAnalysis: !!restPhoto && !!smilePhoto,
  };
}
