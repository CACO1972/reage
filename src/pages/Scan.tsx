import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SimpleCameraOverlay } from '@/components/SimpleCameraOverlay';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CaptureMode = 'rest' | 'smile';

interface CaptureResult {
  file: File;
  preview: string;
  lowResWarning?: boolean;
}

/**
 * Process and downscale image if needed
 */
async function processImage(
  blob: Blob,
  maxPx: number = 2200
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  
  const maxDim = Math.max(width, height);
  const scale = maxDim > maxPx ? maxPx / maxDim : 1;
  
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();
  
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      'image/jpeg',
      0.85
    );
  });
  
  return { blob: jpegBlob, width: newWidth, height: newHeight };
}

export default function Scan() {
  const { user, loading: authLoading, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Photos state
  const [restPhoto, setRestPhoto] = useState<CaptureResult | null>(null);
  const [smilePhoto, setSmilePhoto] = useState<CaptureResult | null>(null);
  const [currentMode, setCurrentMode] = useState<CaptureMode>('rest');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isBootstrappingAuth, setIsBootstrappingAuth] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const readyForAnalysis = !!restPhoto && !!smilePhoto;

  // Stop camera and cleanup tracks
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }, []);

  // Open camera with getUserMedia
  const openCamera = useCallback(async () => {
    setError(null);
    
    try {
      // Try front camera first with ideal constraints
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 1920 },
          },
          audio: false,
        });
      } catch {
        // Fallback to basic facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          // Final fallback: any camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      setIsCameraOpen(true);

      // Wait for video element to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed:', playError);
        }
      }
    } catch (e: any) {
      console.error('Camera error:', e);
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        setError('Permiso de cámara denegado. Acepta los permisos o sube desde galería.');
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        setError('No se encontró cámara. Usa "Subir desde galería".');
      } else {
        setError('No se pudo acceder a la cámara. Usa "Subir desde galería".');
      }
      stopCamera();
    }
  }, [stopCamera]);

  // Start countdown then capture
  const startCountdown = useCallback(() => {
    if (!videoRef.current || countdown !== null) return;
    
    setCountdown(3);
    
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        captureNow();
      }
    }, 800);
  }, [countdown]);

  // Actual capture (called after countdown)
  const captureNow = useCallback(async () => {
    if (!videoRef.current) return;
    
    setIsCapturing(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 1920;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      
      // Mirror horizontally for natural selfie (scaleX(-1))
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('No se pudo generar imagen'))),
          'image/jpeg',
          0.85
        )
      );

      // Process (downscale if needed)
      const { blob: processedBlob, width, height } = await processImage(blob);
      
      // Check low resolution
      const minDim = Math.min(width, height);
      const isLowRes = minDim < 800;

      const file = new File(
        [processedBlob],
        currentMode === 'rest' ? 'rostro_reposo.jpg' : 'rostro_sonrisa.jpg',
        { type: 'image/jpeg' }
      );

      const preview = URL.createObjectURL(processedBlob);

      // Haptic feedback
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } catch {
        // Haptic not supported
      }

      // Save photo and advance
      if (currentMode === 'rest') {
        setRestPhoto({ file, preview, lowResWarning: isLowRes });
        setCurrentMode('smile');
        stopCamera();
      } else {
        setSmilePhoto({ file, preview, lowResWarning: isLowRes });
        stopCamera();
      }
      
    } catch (e) {
      console.error('Capture error:', e);
      setError('Error al capturar. Intenta nuevamente.');
    } finally {
      setIsCapturing(false);
    }
  }, [currentMode, stopCamera]);

  // Public capture function that starts countdown
  const capturePhoto = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  // Handle gallery file selection
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setIsCapturing(true);
    
    try {
      const { blob: processedBlob, width, height } = await processImage(file);
      
      const minDim = Math.min(width, height);
      const isLowRes = minDim < 800;
      
      const processedFile = new File(
        [processedBlob],
        currentMode === 'rest' ? 'rostro_reposo.jpg' : 'rostro_sonrisa.jpg',
        { type: 'image/jpeg' }
      );
      
      const preview = URL.createObjectURL(processedBlob);
      
      if (currentMode === 'rest') {
        setRestPhoto({ file: processedFile, preview, lowResWarning: isLowRes });
        setCurrentMode('smile');
      } else {
        setSmilePhoto({ file: processedFile, preview, lowResWarning: isLowRes });
      }
    } catch (err) {
      console.error('File processing error:', err);
      setError('No se pudo procesar la imagen. Prueba con otra.');
    } finally {
      setIsCapturing(false);
    }
    
    e.target.value = '';
  };

  // Retake photo
  const retakePhoto = useCallback((mode: CaptureMode) => {
    if (mode === 'rest') {
      if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
      setRestPhoto(null);
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
      setSmilePhoto(null);
      setCurrentMode('rest');
    } else {
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
      setSmilePhoto(null);
      setCurrentMode('smile');
    }
    openCamera();
  }, [restPhoto, smilePhoto, openCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    };
  }, []);

  // Ensure we always have a session (anonymous by default)
  useEffect(() => {
    if (authLoading) return;
    if (user) return;

    let cancelled = false;
    setIsBootstrappingAuth(true);

    signInAnonymously()
      .then(({ error }) => {
        if (error) throw error;
      })
      .catch((err) => {
        console.error('Error creating anonymous session:', err);
        if (!cancelled) navigate('/', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setIsBootstrappingAuth(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, signInAnonymously, navigate]);

  if (authLoading || isBootstrappingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleAnalyze = async () => {
    if (!restPhoto || !smilePhoto || !user) return;

    setIsUploading(true);

    try {
      // Upload rest image
      const restPath = `${user.id}/${Date.now()}-rest.jpg`;
      const { error: restError } = await supabase.storage
        .from('simetria-images')
        .upload(restPath, restPhoto.file);

      if (restError) throw restError;

      // Upload smile image
      const smilePath = `${user.id}/${Date.now()}-smile.jpg`;
      const { error: smileError } = await supabase.storage
        .from('simetria-images')
        .upload(smilePath, smilePhoto.file);

      if (smileError) throw smileError;

      // Get signed URLs
      const { data: restUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(restPath, 3600 * 24 * 7);

      const { data: smileUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(smilePath, 3600 * 24 * 7);

      if (!restUrl?.signedUrl || !smileUrl?.signedUrl) {
        throw new Error('Error generando URLs');
      }

      // Create analysis record
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          frontal_rest_url: restUrl.signedUrl,
          frontal_smile_url: smileUrl.signedUrl,
          mode: 'freemium'
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Trigger analysis edge functions
      supabase.functions.invoke('analyze-smile-basic', {
        body: { analysisId: analysis.id }
      });

      supabase.functions.invoke('run-facial-analysis-perfect', {
        body: { analysisId: analysis.id }
      });

      toast({
        title: '¡Imágenes subidas!',
        description: 'Procesando tu análisis con IA...',
      });

      navigate(`/result/${analysis.id}`);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir',
        description: error.message || 'Inténtalo de nuevo.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentPhoto = currentMode === 'rest' ? restPhoto : smilePhoto;

  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
        {/* Header with progress */}
        <header className="px-4 pt-6 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-primary font-medium">
              Análisis estético dentofacial
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              restPhoto ? 'bg-green-500 text-white' : currentMode === 'rest' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {restPhoto ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <div className={`flex-1 h-1 rounded-full ${restPhoto ? 'bg-green-500' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              smilePhoto ? 'bg-green-500 text-white' : currentMode === 'smile' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {smilePhoto ? <CheckCircle2 className="w-4 h-4" /> : '2'}
            </div>
          </div>

          <h1 className="text-xl font-display font-semibold">
            {currentMode === 'rest' ? 'Foto en reposo' : 'Foto sonriendo'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentMode === 'rest' 
              ? 'Paso 1/2 · Rostro relajado, labios cerrados'
              : 'Paso 2/2 · Sonrisa natural mostrando dientes'}
          </p>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-28 space-y-4">
          {/* Camera/Photo area */}
          <section className="relative">
            {/* Camera view */}
            {isCameraOpen && (
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                {/* Simple visual overlay */}
                <SimpleCameraOverlay currentMode={currentMode} />
                
                {/* Countdown overlay */}
                <AnimatePresence>
                  {countdown !== null && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center z-30 bg-black/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.span
                        key={countdown}
                        className="text-8xl font-display font-bold text-white drop-shadow-lg"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {countdown}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Capture button */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={capturePhoto}
                    disabled={isCapturing || countdown !== null}
                    className="w-18 h-18 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    style={{ width: '72px', height: '72px' }}
                  >
                    {isCapturing ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : countdown !== null ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {isCameraOpen && (
              <div className="space-y-3 mt-3">
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Photo preview */}
            {!isCameraOpen && !isCapturing && currentPhoto && (
              <div className="space-y-3">
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black">
                  <img
                    src={currentPhoto.preview}
                    alt={currentMode === 'rest' ? 'Foto en reposo' : 'Foto sonriendo'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-8 h-8 text-green-500 drop-shadow-lg" />
                  </div>
                  
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-green-500/90 text-white text-[10px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Capturada
                  </div>
                </div>
                
                {/* Low resolution warning */}
                <AnimatePresence>
                  {currentPhoto.lowResWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-400">
                        Resolución baja detectada. Para mejores resultados, usa mejor iluminación.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Actions: Repeat / Next */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => retakePhoto(currentMode)}
                    variant="outline"
                    className="h-12"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Repetir
                  </Button>
                  
                  {currentMode === 'rest' ? (
                    <Button
                      onClick={() => {
                        setCurrentMode('smile');
                        setTimeout(() => openCamera(), 300);
                      }}
                      className="h-12"
                      variant="hero"
                    >
                      Siguiente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAnalyze}
                      disabled={!readyForAnalysis || isUploading}
                      className="h-12"
                      variant="hero"
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analizar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Initial selection: Camera or Gallery */}
            {!isCameraOpen && !isCapturing && !currentPhoto && (
              <div className="space-y-3">
                {/* Main camera button */}
                <button
                  onClick={openCamera}
                  className="w-full border border-primary/50 rounded-2xl py-10 flex flex-col items-center justify-center text-sm text-foreground hover:bg-primary/5 transition-colors"
                >
                  <Camera className="w-12 h-12 mb-3 text-primary" />
                  <span className="font-semibold text-base">Abrir cámara</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Captura manual
                  </span>
                </button>
                
                {/* Tips cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Bien
                    </div>
                    <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                      <li>• Luz frontal uniforme</li>
                      <li>• Rostro centrado</li>
                      <li>• Sin accesorios</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <X className="w-4 h-4" />
                      Evitar
                    </div>
                    <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                      <li>• Sombras fuertes</li>
                      <li>• Ángulo inclinado</li>
                      <li>• Lentes/gorras</li>
                    </ul>
                  </div>
                </div>

                {/* Fallback gallery option */}
                <label className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>O subir desde galería</span>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                    className="hidden"
                    onChange={handleGalleryChange}
                  />
                </label>
              </div>
            )}

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Thumbnails - always visible */}
          <section className="flex gap-3">
            {/* Rest photo thumbnail */}
            <motion.div 
              className={`flex-1 aspect-[3/4] rounded-xl border overflow-hidden flex items-center justify-center cursor-pointer ${
                restPhoto 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : currentMode === 'rest'
                    ? 'border-primary/50 border-dashed bg-primary/5'
                    : 'border-border/50 border-dashed bg-muted/30'
              }`}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (restPhoto && currentMode !== 'rest') {
                  setCurrentMode('rest');
                }
              }}
            >
              {restPhoto ? (
                <div className="relative w-full h-full">
                  <img
                    src={restPhoto.preview}
                    alt="Reposo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-lg" />
                  </div>
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-white">
                    Reposo
                  </div>
                </div>
              ) : (
                <div className="text-center px-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${
                    currentMode === 'rest' ? 'bg-primary/30 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className="text-[10px] font-bold">1</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Reposo</span>
                </div>
              )}
            </motion.div>

            {/* Smile photo thumbnail */}
            <motion.div 
              className={`flex-1 aspect-[3/4] rounded-xl border overflow-hidden flex items-center justify-center cursor-pointer ${
                smilePhoto 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : currentMode === 'smile'
                    ? 'border-primary/50 border-dashed bg-primary/5'
                    : 'border-border/50 border-dashed bg-muted/30'
              }`}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (smilePhoto && currentMode !== 'smile') {
                  setCurrentMode('smile');
                } else if (restPhoto && !smilePhoto) {
                  setCurrentMode('smile');
                }
              }}
            >
              {smilePhoto ? (
                <div className="relative w-full h-full">
                  <img
                    src={smilePhoto.preview}
                    alt="Sonrisa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-lg" />
                  </div>
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-white">
                    Sonrisa
                  </div>
                </div>
              ) : (
                <div className="text-center px-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${
                    currentMode === 'smile' ? 'bg-primary/30 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className="text-[10px] font-bold">2</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Sonrisa</span>
                </div>
              )}
            </motion.div>
          </section>
        </main>

        {/* Footer CTA - only show when both photos ready */}
        <AnimatePresence>
          {readyForAnalysis && currentMode === 'smile' && smilePhoto && (
            <motion.footer 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 inset-x-0 border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-4 safe-area-pb"
            >
              <Button
                disabled={isUploading}
                className="w-full h-14 text-base font-semibold"
                onClick={handleAnalyze}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analizar ahora
                  </>
                )}
              </Button>
            </motion.footer>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
