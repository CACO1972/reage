import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePerfectCorpCamera } from '@/hooks/usePerfectCorpCamera';
import { PerfectCorpCameraOverlay } from '@/components/PerfectCorpCameraOverlay';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Sun,
  User,
  Glasses,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    isSDKLoaded,
    isSDKLoading,
    isCameraOpen,
    isCapturing,
    faceQuality,
    error: cameraError,
    restPhoto,
    smilePhoto,
    currentMode,
    readyForAnalysis,
    openCamera,
    closeCamera,
    setCurrentMode,
    retakePhoto,
    clearPhotos,
  } = usePerfectCorpCamera();

  const [isUploading, setIsUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

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

  // Handle gallery file selection (fallback)
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For fallback gallery upload, we'll process and set the photo
    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      
      // Convert to File with proper type
      fetch(preview)
        .then(res => res.blob())
        .then(blob => {
          const photoFile = new File([blob], `gallery-${currentMode}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          // We need to handle this separately since the hook doesn't expose setRestPhoto/setSmilePhoto
          // For now, show a toast suggesting to use the camera
          toast({
            title: 'Usa la cámara profesional',
            description: 'Para mejor calidad de análisis, usa la cámara con validación automática.',
          });
        });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
            {/* Perfect Corp Camera Module Container */}
            <div id="YMK-module" className={`${isCameraOpen || isCapturing ? 'block' : 'hidden'}`}>
              {/* Perfect Corp SDK renders here */}
            </div>

            {(isCameraOpen || isCapturing) && (
              <div className="space-y-3">
                {/* Face quality overlay */}
                <PerfectCorpCameraOverlay 
                  faceQuality={faceQuality} 
                  currentMode={currentMode}
                />
                
                {/* Loading indicator while SDK initializes */}
                {isSDKLoading && (
                  <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Cargando cámara profesional...</p>
                    </div>
                  </div>
                )}
                
                {/* Cancel button */}
                <Button
                  onClick={closeCamera}
                  variant="ghost"
                  className="w-full mt-4"
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
                  
                  {/* Quality badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-green-500/90 text-white text-[10px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Validada por IA
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
                        // Open camera for smile after brief delay
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
                {/* Main camera button - Perfect Corp SDK */}
                <button
                  onClick={openCamera}
                  disabled={isSDKLoading}
                  className="w-full border border-primary/50 rounded-2xl py-10 flex flex-col items-center justify-center text-sm text-foreground hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {isSDKLoading ? (
                    <Loader2 className="w-12 h-12 mb-3 text-primary animate-spin" />
                  ) : (
                    <Camera className="w-12 h-12 mb-3 text-primary" />
                  )}
                  <span className="font-semibold text-base">
                    {isSDKLoading ? 'Cargando...' : 'Abrir cámara profesional'}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Validación automática de calidad
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

                {/* Fallback gallery option - smaller */}
                <label className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>O subir desde galería (no recomendado)</span>
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
              {cameraError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{cameraError}</p>
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
