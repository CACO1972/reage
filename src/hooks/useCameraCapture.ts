import { useEffect, useRef, useState, useCallback } from "react";

type CaptureMode = "rest" | "smile";

interface UseCameraCaptureOptions {
  maxFileSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
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
  } = options || {};

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // First attempt: ask explicitly for selfie camera
      let stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      // If browser gave us rear camera, restart using deviceId
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
          "Permiso de cámara denegado. Acepta los permisos del navegador."
        );
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        setError("No se encontró cámara. Usa 'Subir imagen'.");
      } else {
        setError("No se pudo acceder a la cámara. Usa 'Subir imagen'.");
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
    } catch (e) {
      // Audio not supported
    }
  }, []);

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
      } else {
        setSmilePhoto({ file, preview });
        stopCamera();
      }
    } catch (e) {
      console.error("Capture error:", e);
      setError("Error al capturar. Intenta nuevamente.");
    } finally {
      setIsCapturing(false);
    }
  }, [currentMode, playShutterSound, stopCamera]);

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
  }, [restPhoto, smilePhoto]);

  const reset = useCallback(() => {
    if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
    if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    setRestPhoto(null);
    setSmilePhoto(null);
    setCurrentMode("rest");
    setError(null);
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
    openCamera,
    stopCamera,
    captureFromCamera,
    handleFileInput,
    clearPhoto,
    reset,
    setCurrentMode,
    readyForAnalysis: !!restPhoto && !!smilePhoto,
  };
}
