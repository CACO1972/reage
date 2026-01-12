import { useEffect, useRef, useState, useCallback } from "react";

type CaptureMode = "rest" | "smile";

interface UseCameraCaptureOptions {
  maxDownscalePx?: number; // Max dimension for auto-downscale
  lowResWarningPx?: number; // Below this, show warning
}

interface CaptureResult {
  file: File;
  preview: string;
  lowResWarning?: boolean;
}

// Supported MIME types
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/webp",
  "image/heic",
  "image/heif",
];

/**
 * Downscales an image if needed and converts to JPEG
 */
async function processImage(
  blob: Blob,
  maxPx: number
): Promise<{ blob: Blob; width: number; height: number }> {
  // Create image bitmap from blob
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  
  // Calculate scale factor
  const maxDim = Math.max(width, height);
  const scale = maxDim > maxPx ? maxPx / maxDim : 1;
  
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  // Create canvas and draw scaled image
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();
  
  // Convert to JPEG
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
      "image/jpeg",
      0.92
    );
  });
  
  return { blob: jpegBlob, width: newWidth, height: newHeight };
}

export function useCameraCapture(options?: UseCameraCaptureOptions) {
  const {
    maxDownscalePx = 2200,
    lowResWarningPx = 800,
  } = options || {};

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowResWarning, setLowResWarning] = useState(false);

  const [restPhoto, setRestPhoto] = useState<CaptureResult | null>(null);
  const [smilePhoto, setSmilePhoto] = useState<CaptureResult | null>(null);
  const [currentMode, setCurrentMode] = useState<CaptureMode>("rest");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);
    setLowResWarning(false);

    const attachStream = async (stream: MediaStream) => {
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");

        try {
          await videoRef.current.play();
          setIsCameraOpen(true);
        } catch {
          setIsCameraOpen(true);
        }
      } else {
        setIsCameraOpen(true);
      }
    };

    // Try with ideal constraints first, fallback to basic
    const tryGetUserMedia = async () => {
      // First attempt: ideal selfie constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 1920 },
          },
          audio: false,
        });
        return stream;
      } catch (e) {
        console.warn("Ideal constraints failed, trying basic...");
      }

      // Second attempt: basic facingMode user
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        return stream;
      } catch (e) {
        console.warn("FacingMode user failed, trying any camera...");
      }

      // Final fallback: any camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      return stream;
    };

    try {
      const stream = await tryGetUserMedia();
      
      // Check if we got rear camera and try to switch
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
      const label = track?.label || "";
      const looksRear =
        settings.facingMode === "environment" || /back|rear|environment/i.test(label);

      if (looksRear) {
        // Try to find front camera by device enumeration
        try {
          stream.getTracks().forEach((t) => t.stop());
          const devices = await navigator.mediaDevices.enumerateDevices();
          const frontDevice = devices.find(
            (d) => d.kind === "videoinput" && /front|user|facetime|selfie/i.test(d.label)
          );
          
          if (frontDevice?.deviceId) {
            const frontStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: frontDevice.deviceId } },
              audio: false,
            });
            await attachStream(frontStream);
            return;
          }
        } catch {
          // Use whatever we have
        }
      }

      await attachStream(stream);
    } catch (e: any) {
      console.error("Camera error:", e);
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setError("Permiso de cámara denegado. Acepta los permisos o sube desde galería.");
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        setError("No se encontró cámara. Usa 'Subir desde galería'.");
      } else {
        setError("No se pudo acceder a la cámara. Usa 'Subir desde galería'.");
      }
      stopCamera();
    }
  }, [stopCamera]);

  const playShutterSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.25;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch {
      // Audio not supported
    }
  }, []);

  const savePhoto = useCallback((result: CaptureResult) => {
    if (currentMode === "rest") {
      setRestPhoto(result);
      setCurrentMode("smile");
    } else {
      setSmilePhoto(result);
      stopCamera();
    }
    setLowResWarning(!!result.lowResWarning);
  }, [currentMode, stopCamera]);

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    setError(null);
    setLowResWarning(false);
    
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

      // Process (downscale if needed)
      const { blob: processedBlob, width, height } = await processImage(blob, maxDownscalePx);
      
      // Check low resolution
      const minDim = Math.min(width, height);
      const isLowRes = minDim < lowResWarningPx;

      const file = new File(
        [processedBlob],
        currentMode === "rest" ? "rostro_reposo.jpg" : "rostro_sonrisa.jpg",
        { type: "image/jpeg" }
      );

      const preview = URL.createObjectURL(processedBlob);

      playShutterSound();
      savePhoto({ file, preview, lowResWarning: isLowRes });
      
    } catch (e) {
      console.error("Capture error:", e);
      setError("Error al capturar. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [currentMode, playShutterSound, savePhoto, maxDownscalePx, lowResWarningPx]);

  const handleFileInput = useCallback(
    async (file: File) => {
      setError(null);
      setLowResWarning(false);
      setIsProcessing(true);
      
      try {
        // Check file type
        const type = file.type.toLowerCase();
        const isAccepted = ACCEPTED_TYPES.some(t => type.includes(t.split('/')[1])) || 
                          file.name.toLowerCase().match(/\.(jpe?g|png|webp|heic|heif)$/);
        
        if (!isAccepted) {
          setError("Formato no soportado. Usa JPEG, PNG, WebP o HEIC.");
          return;
        }
        
        // Process image (downscale + convert to JPEG)
        const { blob, width, height } = await processImage(file, maxDownscalePx);
        
        // Check low resolution
        const minDim = Math.min(width, height);
        const isLowRes = minDim < lowResWarningPx;
        
        const processedFile = new File(
          [blob],
          currentMode === "rest" ? "rostro_reposo.jpg" : "rostro_sonrisa.jpg",
          { type: "image/jpeg" }
        );
        
        const preview = URL.createObjectURL(blob);
        
        savePhoto({ file: processedFile, preview, lowResWarning: isLowRes });
        
      } catch (e) {
        console.error("File processing error:", e);
        setError("No se pudo procesar la imagen. Prueba con otra.");
      } finally {
        setIsProcessing(false);
      }
    },
    [currentMode, savePhoto, maxDownscalePx, lowResWarningPx]
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
    setLowResWarning(false);
  }, [restPhoto, smilePhoto]);

  const retakePhoto = useCallback((mode: CaptureMode) => {
    clearPhoto(mode);
    setCurrentMode(mode);
    openCamera();
  }, [clearPhoto, openCamera]);

  const reset = useCallback(() => {
    if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
    if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    setRestPhoto(null);
    setSmilePhoto(null);
    setCurrentMode("rest");
    setError(null);
    setLowResWarning(false);
    stopCamera();
  }, [restPhoto, smilePhoto, stopCamera]);

  // Reset file input to allow re-selecting same file
  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    };
  }, []);

  return {
    videoRef,
    fileInputRef,
    isCameraOpen,
    isProcessing,
    error,
    lowResWarning,
    restPhoto,
    smilePhoto,
    currentMode,
    openCamera,
    stopCamera,
    captureFromCamera,
    handleFileInput,
    clearPhoto,
    retakePhoto,
    reset,
    resetFileInput,
    setCurrentMode,
    readyForAnalysis: !!restPhoto && !!smilePhoto,
  };
}
