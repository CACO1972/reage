import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X, CheckCircle2, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';

type Step = 'rest' | 'smile';

interface ImageData {
  file: File;
  preview: string;
}

export default function Scan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('rest');
  const [restImage, setRestImage] = useState<ImageData | null>(null);
  const [smileImage, setSmileImage] = useState<ImageData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
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
      // Check file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Formato no válido',
          description: 'Solo se permiten imágenes JPEG o PNG.',
        });
        resolve(false);
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Imagen muy grande',
          description: 'El tamaño máximo es 10MB.',
        });
        resolve(false);
        return;
      }

      // Check resolution - more flexible for camera captures
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const minRes = 480; // Reducido para capturas de cámara
        const maxRes = 4096; // Aumentado para cámaras modernas
        
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
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280, min: 640 }, 
          height: { ideal: 720, min: 480 } 
        }
      });
      setCameraStream(stream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        variant: 'destructive',
        title: 'Error de cámara',
        description: 'No se pudo acceder a la cámara. Verifica los permisos.',
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Usar dimensiones reales del video
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Espejear horizontalmente para selfie natural
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
    }, 'image/jpeg', 0.92);
  }, [step]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input para permitir seleccionar el mismo archivo
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
      // Upload rest image
      const restPath = `${user.id}/${Date.now()}-rest.jpg`;
      const { error: restError } = await supabase.storage
        .from('simetria-images')
        .upload(restPath, restImage.file);

      if (restError) throw restError;

      // Upload smile image
      const smilePath = `${user.id}/${Date.now()}-smile.jpg`;
      const { error: smileError } = await supabase.storage
        .from('simetria-images')
        .upload(smilePath, smileImage.file);

      if (smileError) throw smileError;

      // Get signed URLs
      const { data: restUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(restPath, 3600 * 24); // 24 hours

      const { data: smileUrl } = await supabase.storage
        .from('simetria-images')
        .createSignedUrl(smilePath, 3600 * 24);

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

      // Trigger analysis edge functions in parallel
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

      // Navigate to results
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

  const currentImage = step === 'rest' ? restImage : smileImage;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-8 pb-24">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 'rest' ? 'text-primary' : restImage ? 'text-accent' : 'text-muted-foreground'}`}>
              {restImage ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${step === 'rest' ? 'border-primary text-primary' : 'border-muted-foreground'}`}>
                  1
                </div>
              )}
              <span className="text-sm font-medium">Reposo</span>
            </div>
            
            <div className="w-8 h-px bg-border" />
            
            <div className={`flex items-center gap-2 ${step === 'smile' ? 'text-primary' : smileImage ? 'text-accent' : 'text-muted-foreground'}`}>
              {smileImage ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${step === 'smile' ? 'border-primary text-primary' : 'border-muted-foreground'}`}>
                  2
                </div>
              )}
              <span className="text-sm font-medium">Sonrisa</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {step === 'rest' ? 'Foto en reposo' : 'Foto sonriendo'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'rest' 
                ? 'Mira de frente con expresión neutra, labios cerrados.'
                : 'Muestra tu mejor sonrisa natural, con dientes visibles.'}
            </p>
          </div>

          {/* Capture Area */}
          <div className="aspect-square rounded-3xl overflow-hidden bg-muted mb-6 relative">
            {isCapturing ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2/3 h-4/5 border-2 border-white/50 rounded-[50%]" />
                </div>
              </>
            ) : currentImage ? (
              <>
                <img
                  src={currentImage.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => clearImage(step)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">Captura o sube una foto</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/*"
            capture="user"
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
                  Subir
                </Button>
                <Button
                  className="flex-1"
                  onClick={startCamera}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Cámara
                </Button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 rounded-2xl bg-muted/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Consejos para mejores resultados:</p>
                <ul className="space-y-1">
                  <li>• Buena iluminación frontal</li>
                  <li>• Rostro centrado y recto</li>
                  <li>• Fondo neutro</li>
                  <li>• Sin gafas ni accesorios</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          {step === 'smile' && !smileImage && restImage && (
            <button
              onClick={() => setStep('rest')}
              className="mt-4 text-sm text-primary hover:underline mx-auto block"
            >
              ← Volver a foto en reposo
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
