import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { PhotoRequirementsModal } from '@/components/PhotoRequirementsModal';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  ArrowRight,
  Info,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    videoRef,
    isCameraOpen,
    isCapturing,
    error: cameraError,
    restPhoto,
    smilePhoto,
    currentMode,
    openCamera,
    stopCamera,
    captureFromCamera,
    handleFileInput,
    clearPhoto,
    readyForAnalysis,
    setCurrentMode,
  } = useCameraCapture({ minWidth: 480, minHeight: 640 });

  const [isUploading, setIsUploading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // Best effort auto-open (may still require user gesture depending on browser)
  useEffect(() => {
    if (!authLoading && user && !isCameraOpen && !restPhoto && !smilePhoto) {
      openCamera();
    }
  }, [authLoading, user, isCameraOpen, restPhoto, smilePhoto, openCamera]);

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

  if (authLoading) {
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
        onContinue={() => {
          setShowRequirements(false);
          openCamera();
        }}
      />

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-primary font-medium">
              Análisis estético dentofacial
            </p>
          </div>
          <h1 className="text-2xl font-display font-semibold">
            Escanea tu rostro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentMode === 'rest' 
              ? 'Paso 1 · Rostro en reposo, labios cerrados'
              : 'Paso 2 · Sonrisa natural mostrando dientes'}
          </p>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-28 space-y-4">
          {/* Camera/Capture area */}
          <section className="border border-border/50 rounded-3xl p-4 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                {currentMode === "rest" ? "Foto en reposo" : "Foto sonriendo"}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowRequirements(true)}
                className="text-xs h-7 px-2"
              >
                <Info className="w-3.5 h-3.5 mr-1" />
                Requisitos
              </Button>
            </div>

            {isCameraOpen ? (
              <div className="space-y-3">
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    playsInline
                    muted
                    autoPlay
                  />
                  {/* Simple face guide overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Oval guide */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <mask id="ovalMask">
                          <rect x="0" y="0" width="100" height="100" fill="white"/>
                          <ellipse cx="50" cy="45" rx="22" ry="30" fill="black"/>
                        </mask>
                      </defs>
                      <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.5)" mask="url(#ovalMask)"/>
                      <ellipse cx="50" cy="45" rx="22" ry="30" fill="none" stroke="#d4a853" strokeWidth="0.5"/>
                    </svg>
                    
                    {/* Instructions */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-center text-xs text-white/80 bg-black/40 rounded-lg px-3 py-2 backdrop-blur-sm">
                        {currentMode === 'rest' 
                          ? 'Rostro relajado • Labios cerrados'
                          : 'Sonrisa natural • Muestra los dientes'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Capture button - prominent */}
                <Button
                  onClick={captureFromCamera}
                  disabled={isCapturing}
                  className="w-full h-14 text-base font-semibold"
                  variant="hero"
                >
                  {isCapturing ? (
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
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openCamera}
                  className="border border-border/50 rounded-2xl py-8 flex flex-col items-center justify-center text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Camera className="w-8 h-8 mb-2 text-primary" />
                  <span className="font-medium">Tomar foto</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Cámara frontal</span>
                </button>

                <label className="border border-border/50 rounded-2xl py-8 flex flex-col items-center justify-center text-sm text-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 mb-2 text-accent" />
                  <span className="font-medium">Subir imagen</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Desde galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileInput(file);
                      e.target.value = '';
                    }}
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
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{cameraError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Photo thumbnails */}
          <section className="space-y-3">
            <div className="flex gap-3">
              {/* Rest photo thumbnail */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Reposo</p>
                  {restPhoto && (
                    <button 
                      onClick={() => clearPhoto('rest')}
                      className="text-xs text-destructive hover:underline"
                    >
                      Borrar
                    </button>
                  )}
                </div>
                <motion.div 
                  className={`aspect-[3/4] rounded-xl border overflow-hidden flex items-center justify-center ${
                    restPhoto 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : currentMode === 'rest'
                        ? 'border-primary/50 border-dashed bg-primary/5'
                        : 'border-border/50 border-dashed bg-muted/30'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => restPhoto && setCurrentMode('rest')}
                >
                  {restPhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={restPhoto.preview}
                        alt="Rostro en reposo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2">
                        <CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center px-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                        currentMode === 'rest' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <span className="text-xs font-medium">1</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {currentMode === 'rest' ? 'Capturando...' : 'Pendiente'}
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Smile photo thumbnail */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Sonrisa</p>
                  {smilePhoto && (
                    <button 
                      onClick={() => clearPhoto('smile')}
                      className="text-xs text-destructive hover:underline"
                    >
                      Borrar
                    </button>
                  )}
                </div>
                <motion.div 
                  className={`aspect-[3/4] rounded-xl border overflow-hidden flex items-center justify-center ${
                    smilePhoto 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : currentMode === 'smile'
                        ? 'border-primary/50 border-dashed bg-primary/5'
                        : 'border-border/50 border-dashed bg-muted/30'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {smilePhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={smilePhoto.preview}
                        alt="Rostro sonriendo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2">
                        <CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center px-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                        currentMode === 'smile' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <span className="text-xs font-medium">2</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {currentMode === 'smile' ? 'Capturando...' : 'Pendiente'}
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Quick visual guide (no texto largo) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Bien
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Luz frontal + rostro centrado
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <X className="w-4 h-4 text-destructive" />
                  Evitar
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Sombras fuertes o ángulo inclinado
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer CTA */}
        <footer className="fixed bottom-0 inset-x-0 border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-4 safe-area-pb">
          <Button
            disabled={!readyForAnalysis || isUploading}
            className="w-full h-14 text-base font-semibold"
            onClick={handleAnalyze}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Subiendo...
              </>
            ) : readyForAnalysis ? (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analizar ahora
              </>
            ) : (
              <>
                Completa las 2 fotos
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </footer>
      </div>
    </Layout>
  );
}
