import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FaceFramingOverlay } from '@/components/FaceFramingOverlay';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Loader2,
  Smile,
  Meh,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CaptureMode = 'rest' | 'smile';
type FlowState = 'initial' | 'camera' | 'preview' | 'transition' | 'complete';

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
  const [flowState, setFlowState] = useState<FlowState>('initial');
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
  }, []);

  // Open camera with getUserMedia
  const openCamera = useCallback(async () => {
    setError(null);
    setFlowState('camera');
    
    try {
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
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;

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
      setFlowState('initial');
      stopCamera();
    }
  }, [stopCamera]);

  // Start countdown and capture
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
    }, 700);
  }, [countdown]);

  // Actual capture
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
      
      // Mirror horizontally
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

      const { blob: processedBlob, width, height } = await processImage(blob);
      
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
      } catch {}

      stopCamera();

      if (currentMode === 'rest') {
        setRestPhoto({ file, preview, lowResWarning: isLowRes });
        setFlowState('preview');
      } else {
        setSmilePhoto({ file, preview, lowResWarning: isLowRes });
        setFlowState('complete');
      }
      
    } catch (e) {
      console.error('Capture error:', e);
      setError('Error al capturar. Intenta nuevamente.');
    } finally {
      setIsCapturing(false);
    }
  }, [currentMode, stopCamera]);

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
        setFlowState('preview');
      } else {
        setSmilePhoto({ file: processedFile, preview, lowResWarning: isLowRes });
        setFlowState('complete');
      }
    } catch (err) {
      console.error('File processing error:', err);
      setError('No se pudo procesar la imagen. Prueba con otra.');
    } finally {
      setIsCapturing(false);
    }
    
    e.target.value = '';
  };

  // Advance to smile capture
  const advanceToSmile = useCallback(() => {
    setFlowState('transition');
    
    // Show transition screen briefly
    setTimeout(() => {
      setCurrentMode('smile');
      setFlowState('initial');
    }, 1500);
  }, []);

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
    }
    setFlowState('initial');
  }, [restPhoto, smilePhoto]);

  // Cancel camera
  const cancelCamera = useCallback(() => {
    stopCamera();
    setFlowState(restPhoto || smilePhoto ? 'preview' : 'initial');
  }, [stopCamera, restPhoto, smilePhoto]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (restPhoto?.preview) URL.revokeObjectURL(restPhoto.preview);
      if (smilePhoto?.preview) URL.revokeObjectURL(smilePhoto.preview);
    };
  }, []);

  // Ensure we always have a session
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
      const restPath = `${user.id}/${Date.now()}-rest.jpg`;
      const { error: restError } = await supabase.storage
        .from('simetria-images')
        .upload(restPath, restPhoto.file);

      if (restError) throw restError;

      const smilePath = `${user.id}/${Date.now()}-smile.jpg`;
      const { error: smileError } = await supabase.storage
        .from('simetria-images')
        .upload(smilePath, smilePhoto.file);

      if (smileError) throw smileError;

      const { data: restUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(restPath, 3600 * 24 * 7);

      const { data: smileUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(smilePath, 3600 * 24 * 7);

      if (!restUrl?.signedUrl || !smileUrl?.signedUrl) {
        throw new Error('Error generando URLs');
      }

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

  // Transition screen between photos
  if (flowState === 'transition') {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-display font-bold mb-2">¡Foto 1 lista!</h2>
            <p className="text-muted-foreground mb-8">Ahora necesitamos tu mejor sonrisa</p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 border border-primary/30"
            >
              <Smile className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-primary">Siguiente: Sonrisa</p>
                <p className="text-sm text-muted-foreground">Sonrisa natural mostrando dientes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-primary font-medium">Análisis estético</p>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
              currentMode === 'rest' 
                ? 'bg-primary text-primary-foreground' 
                : restPhoto 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {restPhoto ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Meh className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">1. Reposo</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-border" />
            
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
              currentMode === 'smile' 
                ? 'bg-primary text-primary-foreground' 
                : smilePhoto 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {smilePhoto ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Smile className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">2. Sonrisa</span>
            </div>
          </div>

          {/* Current step title */}
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold">
              {currentMode === 'rest' ? 'Foto en reposo' : 'Foto sonriendo'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentMode === 'rest' 
                ? 'Rostro relajado, labios cerrados naturalmente'
                : 'Sonrisa natural mostrando tus dientes'}
            </p>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-6">
          {/* Camera view */}
          {flowState === 'camera' && (
            <div className="space-y-4">
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                <FaceFramingOverlay currentMode={currentMode} />

                {/* Countdown overlay */}
                <AnimatePresence>
                  {countdown !== null && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center z-30 bg-black/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.span
                        key={countdown}
                        className="text-9xl font-display font-bold text-white drop-shadow-2xl"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {countdown}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Mode indicator badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${
                    currentMode === 'rest' 
                      ? 'bg-blue-500/80 text-white' 
                      : 'bg-amber-500/80 text-white'
                  }`}>
                    {currentMode === 'rest' ? (
                      <>
                        <Meh className="w-5 h-5" />
                        <span className="font-medium">Rostro relajado</span>
                      </>
                    ) : (
                      <>
                        <Smile className="w-5 h-5" />
                        <span className="font-medium">¡Sonríe!</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Capture button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={startCountdown}
                    disabled={isCapturing || countdown !== null}
                    className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shadow-2xl"
                  >
                    {isCapturing || countdown !== null ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white" />
                    )}
                  </button>
                  <p className="text-center text-sm text-white/80 mt-3 font-medium">
                    Toca para capturar
                  </p>
                </div>
              </div>

              <Button onClick={cancelCamera} variant="ghost" className="w-full">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Photo preview after capture */}
          {(flowState === 'preview' || flowState === 'complete') && (
            <div className="space-y-4">
              {/* Current captured photo */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black">
                <img
                  src={currentMode === 'rest' ? restPhoto?.preview : smilePhoto?.preview}
                  alt={currentMode === 'rest' ? 'Foto en reposo' : 'Foto sonriendo'}
                  className="w-full h-full object-cover"
                />
                
                {/* Success badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {currentMode === 'rest' ? 'Foto 1 lista' : 'Foto 2 lista'}
                </div>
              </div>

              {/* Low res warning */}
              {((currentMode === 'rest' && restPhoto?.lowResWarning) || 
                (currentMode === 'smile' && smilePhoto?.lowResWarning)) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    Resolución baja. Para mejores resultados, usa más iluminación.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => retakePhoto(currentMode)}
                  variant="outline"
                  className="h-14"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir
                </Button>
                
                {flowState === 'preview' && currentMode === 'rest' ? (
                  <Button
                    onClick={advanceToSmile}
                    variant="hero"
                    className="h-14"
                  >
                    <Smile className="w-5 h-5 mr-2" />
                    Continuar
                  </Button>
                ) : flowState === 'complete' ? (
                  <Button
                    onClick={handleAnalyze}
                    disabled={!readyForAnalysis || isUploading}
                    variant="hero"
                    className="h-14"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analizar
                      </>
                    )}
                  </Button>
                ) : null}
              </div>

              {/* Show both thumbnails when complete */}
              {flowState === 'complete' && restPhoto && smilePhoto && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-green-500/50">
                    <img src={restPhoto.preview} alt="Reposo" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                      <Meh className="w-3 h-3" />
                      Reposo
                    </div>
                  </div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-green-500/50">
                    <img src={smilePhoto.preview} alt="Sonrisa" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                      <Smile className="w-3 h-3" />
                      Sonrisa
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial state - camera or gallery selection */}
          {flowState === 'initial' && (
            <div className="space-y-4">
              {/* Visual instruction card */}
              <div className={`rounded-2xl p-6 text-center ${
                currentMode === 'rest' 
                  ? 'bg-blue-500/10 border border-blue-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  currentMode === 'rest' ? 'bg-blue-500/20' : 'bg-amber-500/20'
                }`}>
                  {currentMode === 'rest' ? (
                    <Meh className="w-8 h-8 text-blue-400" />
                  ) : (
                    <Smile className="w-8 h-8 text-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {currentMode === 'rest' ? 'Expresión neutral' : 'Tu mejor sonrisa'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentMode === 'rest' 
                    ? 'Mira al frente con el rostro relajado y los labios cerrados naturalmente'
                    : 'Sonríe de forma natural mostrando tus dientes superiores'}
                </p>
              </div>

              {/* Camera button */}
              <Button
                onClick={openCamera}
                variant="hero"
                className="w-full h-16 text-lg"
              >
                <Camera className="w-6 h-6 mr-3" />
                Abrir cámara
              </Button>
              
              {/* Tips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-400 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recomendado
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1">
                    <li>• Luz frontal uniforme</li>
                    <li>• Rostro centrado</li>
                    <li>• Sin lentes/gorras</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-2">
                    <X className="w-3.5 h-3.5" />
                    Evitar
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1">
                    <li>• Sombras fuertes</li>
                    <li>• Ángulo inclinado</li>
                    <li>• Contraluz</li>
                  </ul>
                </div>
              </div>

              {/* Gallery fallback */}
              <label className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
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

              {/* Show rest photo thumbnail if exists */}
              {restPhoto && currentMode === 'smile' && (
                <div className="flex gap-3 mt-4">
                  <div className="relative w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 border-green-500/50">
                    <img src={restPhoto.preview} alt="Reposo" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                      ✓ Reposo
                    </div>
                  </div>
                  <div className="flex-1 flex items-center">
                    <p className="text-sm text-muted-foreground">
                      Foto 1 completada. Ahora toma la foto sonriendo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Fixed footer CTA when both photos ready */}
        <AnimatePresence>
          {flowState === 'complete' && readyForAnalysis && (
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
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
