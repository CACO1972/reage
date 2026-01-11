import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FaceGuideOverlay } from '@/components/FaceGuideOverlay';
import { PhotoRequirementsModal } from '@/components/PhotoRequirementsModal';
import { Camera, Upload, X, CheckCircle2, ArrowRight, RotateCcw, Info, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'rest' | 'smile';
type CaptureMode = 'current' | 'historical';

interface ImageData {
  file: File;
  preview: string;
}

export default function Scan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('rest');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('current');
  const [restImage, setRestImage] = useState<ImageData | null>(null);
  const [smileImage, setSmileImage] = useState<ImageData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showRequirements, setShowRequirements] = useState(true);
  const [positionValid, setPositionValid] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file type - accept more formats for gallery uploads
      const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
      if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Formato no válido',
          description: 'Solo se permiten imágenes (JPEG, PNG, HEIC, WebP).',
        });
        resolve(false);
        return;
      }

      // Check file size (max 15MB for historical photos)
      const maxSize = captureMode === 'historical' ? 15 : 10;
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Imagen muy grande',
          description: `El tamaño máximo es ${maxSize}MB.`,
        });
        resolve(false);
        return;
      }

      // Check resolution
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const minRes = captureMode === 'historical' ? 320 : 480;
        const maxRes = 8192;
        
        if (img.width < minRes || img.height < minRes) {
          toast({
            variant: 'destructive',
            title: 'Resolución baja',
            description: `Mínimo ${minRes}x${minRes} píxeles requeridos.`,
          });
          resolve(false);
          return;
        }

        if (img.width > maxRes || img.height > maxRes) {
          toast({
            variant: 'destructive',
            title: 'Resolución muy alta',
            description: `Máximo ${maxRes}x${maxRes} píxeles permitidos.`,
          });
          resolve(false);
          return;
        }

        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        toast({
          variant: 'destructive',
          title: 'Error al leer imagen',
          description: 'No se pudo procesar la imagen seleccionada.',
        });
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1920, min: 640 }, 
          height: { ideal: 1080, min: 480 } 
        }
      });
      setCameraStream(stream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(error.name === 'NotAllowedError' 
        ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.'
        : 'No se pudo acceder a la cámara.');
      toast({
        variant: 'destructive',
        title: 'Error de cámara',
        description: error.name === 'NotAllowedError' 
          ? 'Permiso denegado. Habilita la cámara en configuración.'
          : 'No se pudo acceder a la cámara.',
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
    setPositionValid(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Mirror horizontally for natural selfie
    ctx.translate(videoWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `${step}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = URL.createObjectURL(blob);
      
      if (step === 'rest') {
        setRestImage({ file, preview });
      } else {
        setSmileImage({ file, preview });
      }
      
      stopCamera();
      
      // Play capture sound
      playShutterSound();
    }, 'image/jpeg', 0.95);
  }, [step, stopCamera]);

  const playShutterSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.15;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input to allow reselecting same file
    e.target.value = '';

    const isValid = await validateImage(file);
    if (!isValid) return;

    const preview = URL.createObjectURL(file);
    
    if (step === 'rest') {
      setRestImage({ file, preview });
    } else {
      setSmileImage({ file, preview });
    }
  };

  const clearImage = (type: Step) => {
    if (type === 'rest') {
      if (restImage) URL.revokeObjectURL(restImage.preview);
      setRestImage(null);
    } else {
      if (smileImage) URL.revokeObjectURL(smileImage.preview);
      setSmileImage(null);
    }
  };

  const uploadImages = async () => {
    if (!restImage || !smileImage || !user) return;

    setIsUploading(true);

    try {
      const restPath = `${user.id}/${Date.now()}-rest.jpg`;
      const { error: restError } = await supabase.storage
        .from('simetria-images')
        .upload(restPath, restImage.file);

      if (restError) throw restError;

      const smilePath = `${user.id}/${Date.now()}-smile.jpg`;
      const { error: smileError } = await supabase.storage
        .from('simetria-images')
        .upload(smilePath, smileImage.file);

      if (smileError) throw smileError;

      const { data: restUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(restPath, 3600 * 24 * 7); // 7 days

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

      // Trigger analysis edge functions
      supabase.functions.invoke('analyze-smile-basic', {
        body: { analysisId: analysis.id }
      });

      supabase.functions.invoke('run-facial-analysis-perfect', {
        body: { analysisId: analysis.id }
      });

      toast({
        title: '¡Imágenes subidas!',
        description: 'Procesando tu análisis...',
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

  const handleRequirementsContinue = () => {
    setShowRequirements(false);
    // Auto-start camera for current photos
    if (captureMode === 'current') {
      startCamera();
    }
  };

  const currentImage = step === 'rest' ? restImage : smileImage;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <PhotoRequirementsModal 
        open={showRequirements} 
        onOpenChange={setShowRequirements}
        onContinue={handleRequirementsContinue}
      />

      <div className="min-h-screen pt-4 pb-24">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Mode selector */}
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={captureMode === 'current' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCaptureMode('current')}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Foto Actual
            </Button>
            <Button
              variant={captureMode === 'historical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCaptureMode('historical')}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              Foto Histórica
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div 
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                step === 'rest' ? 'text-primary' : restImage ? 'text-green-500' : 'text-muted-foreground'
              }`}
              onClick={() => restImage && setStep('rest')}
              whileTap={{ scale: 0.95 }}
            >
              {restImage ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  step === 'rest' ? 'border-primary text-primary' : 'border-muted-foreground'
                }`}>
                  1
                </div>
              )}
              <span className="text-sm font-medium">Reposo</span>
            </motion.div>
            
            <div className="w-8 h-px bg-border" />
            
            <motion.div 
              className={`flex items-center gap-2 ${
                step === 'smile' ? 'text-primary' : smileImage ? 'text-green-500' : 'text-muted-foreground'
              }`}
            >
              {smileImage ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  step === 'smile' ? 'border-primary text-primary' : 'border-muted-foreground'
                }`}>
                  2
                </div>
              )}
              <span className="text-sm font-medium">Sonrisa</span>
            </motion.div>
          </div>

          {/* Instructions */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center mb-4"
            >
              <h1 className="text-xl font-bold mb-1">
                {step === 'rest' ? 'Foto en reposo' : 'Foto sonriendo'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 'rest' 
                  ? 'Expresión neutra, labios relajados y cerrados.'
                  : 'Sonrisa natural mostrando los dientes.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Info button */}
          <div className="flex justify-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowRequirements(true)}
              className="text-xs text-muted-foreground"
            >
              <Info className="w-4 h-4 mr-1" />
              Ver requisitos
            </Button>
          </div>

          {/* Capture Area */}
          <motion.div 
            className="aspect-[3/4] rounded-3xl overflow-hidden bg-muted mb-6 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {isCapturing ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <FaceGuideOverlay 
                  isActive={isCapturing} 
                  onPositionValid={setPositionValid}
                />
              </>
            ) : currentImage ? (
              <>
                <motion.img
                  src={currentImage.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <button
                  onClick={() => clearImage(step)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-center gap-2 bg-green-500/20 backdrop-blur-md rounded-full py-2 px-4 border border-green-500/30">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Foto capturada</span>
                  </div>
                </div>
              </>
            ) : cameraError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6">
                <Camera className="w-16 h-16 mb-4 opacity-50 text-destructive" />
                <p className="text-sm text-center text-destructive mb-4">{cameraError}</p>
                <Button variant="outline" onClick={startCamera}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">
                  {captureMode === 'current' ? 'Captura una foto' : 'Sube una foto histórica'}
                </p>
              </div>
            )}
          </motion.div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Actions */}
          <div className="space-y-3">
            {isCapturing ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={stopCamera}
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={capturePhoto}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Capturar
                </Button>
              </div>
            ) : currentImage ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => clearImage(step)}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Repetir
                </Button>
                {step === 'rest' ? (
                  <Button
                    className="flex-1"
                    onClick={() => setStep('smile')}
                  >
                    Siguiente
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : restImage && smileImage ? (
                  <Button
                    className="flex-1"
                    onClick={uploadImages}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Analizar
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {captureMode === 'historical' ? 'Subir histórica' : 'Galería'}
                </Button>
                {captureMode === 'current' && (
                  <Button
                    className="flex-1"
                    onClick={startCamera}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Cámara
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          {step === 'smile' && !smileImage && restImage && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setStep('rest')}
              className="mt-4 text-sm text-primary hover:underline mx-auto block"
            >
              ← Volver a foto en reposo
            </motion.button>
          )}
        </div>
      </div>
    </Layout>
  );
}
