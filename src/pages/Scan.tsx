import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCameraCapture } from '@/hooks/useCameraCapture';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    videoRef,
    fileInputRef,
    isCameraOpen,
    isRequestingCamera,
    isProcessing,
    error: cameraError,
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
    resetFileInput,
    readyForAnalysis,
    setCurrentMode,
  } = useCameraCapture({ maxDownscalePx: 2200, lowResWarningPx: 800 });

  const [isUploading, setIsUploading] = useState(false);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);
  
  // File input ref for allowing re-select of same file
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handle camera open with permission tracking
  const handleOpenCamera = async () => {
    setCameraPermissionRequested(true);
    await openCamera();
  };

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

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileInput(file);
    // Reset input to allow re-selecting same file
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
  const stepNumber = currentMode === 'rest' ? 1 : 2;

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
            {(isCameraOpen || isRequestingCamera) ? (
              <div className="space-y-3">
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    playsInline
                    muted
                    autoPlay
                  />
                  
                  {/* Loading overlay when requesting camera */}
                  {isRequestingCamera && !isCameraOpen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="text-center space-y-3">
                        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">Solicitando cámara...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Face guide overlay - only show when camera is open */}
                  {isCameraOpen && (
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                        <defs>
                          <mask id="ovalMask">
                            <rect x="0" y="0" width="100" height="100" fill="white"/>
                            <ellipse cx="50" cy="45" rx="22" ry="30" fill="black"/>
                          </mask>
                        </defs>
                        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.5)" mask="url(#ovalMask)"/>
                        <ellipse cx="50" cy="45" rx="22" ry="30" fill="none" stroke="#d4a853" strokeWidth="0.5"/>
                        {/* Corner brackets */}
                        <path d="M 25 18 L 25 14 L 30 14" fill="none" stroke="#d4a853" strokeWidth="0.4"/>
                        <path d="M 75 18 L 75 14 L 70 14" fill="none" stroke="#d4a853" strokeWidth="0.4"/>
                        <path d="M 25 76 L 25 80 L 30 80" fill="none" stroke="#d4a853" strokeWidth="0.4"/>
                        <path d="M 75 76 L 75 80 L 70 80" fill="none" stroke="#d4a853" strokeWidth="0.4"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Tips bar - only show when camera is open */}
                  {isCameraOpen && (
                    <div className="absolute top-3 left-3 right-3 flex justify-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium bg-black/50 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                        <Sun className="w-3 h-3" />
                        Luz frontal
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium bg-black/50 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                        <User className="w-3 h-3" />
                        Centrado
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium bg-black/50 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                        <Glasses className="w-3 h-3" />
                        Sin lentes
                      </div>
                    </div>
                  )}
                  
                  {/* Current step instruction - only show when camera is open */}
                  {isCameraOpen && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-center text-xs text-white/90 bg-black/50 rounded-lg px-3 py-2 backdrop-blur-sm">
                        {currentMode === 'rest' 
                          ? '😐 Rostro relajado • Labios cerrados'
                          : '😁 Sonrisa natural • Muestra los dientes'
                        }
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Capture button - only enable when camera is fully open */}
                <Button
                  onClick={captureFromCamera}
                  disabled={isProcessing || !isCameraOpen}
                  className="w-full h-14 text-base font-semibold"
                  variant="hero"
                >
                  {(isProcessing || isRequestingCamera) ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Capturar {currentMode === 'rest' ? 'reposo' : 'sonrisa'}
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  className="w-full"
                  disabled={isRequestingCamera && !isCameraOpen}
                >
                  Cancelar
                </Button>
              </div>
            ) : currentPhoto ? (
              /* Photo preview with actions */
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
                        Resolución baja detectada. Para mejores resultados, usa una foto de mayor calidad.
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
                      onClick={() => setCurrentMode('smile')}
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
            ) : (
              /* Initial selection: Camera or Gallery */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleOpenCamera}
                    className="border border-border/50 rounded-2xl py-8 flex flex-col items-center justify-center text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Camera className="w-10 h-10 mb-2 text-primary" />
                    <span className="font-medium">Habilitar cámara</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Modo selfie</span>
                  </button>

                  <label className="border border-border/50 rounded-2xl py-8 flex flex-col items-center justify-center text-sm text-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                    <Upload className="w-10 h-10 mb-2 text-accent" />
                    <span className="font-medium">Subir imagen</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Desde galería</span>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                      className="hidden"
                      onChange={handleGalleryChange}
                    />
                  </label>
                </div>
                
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
