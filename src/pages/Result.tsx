import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PremiumUpgrade } from '@/components/PremiumUpgrade';
import { AnimatedScoreRing } from '@/components/AnimatedScoreRing';
import { FaceAnalysisOverlay } from '@/components/FaceAnalysisOverlay';
import { Model3DPreview } from '@/components/Model3DPreview';
import { AIInsightCard } from '@/components/AIInsightCard';
import { SmileSimulation } from '@/components/SmileSimulation';
import { ScanningAnimation } from '@/components/ScanningAnimation';
import { TreatmentSuggestions } from '@/components/TreatmentSuggestions';
import { PremiumContentPreview } from '@/components/PremiumContentPreview';
import { ExtendedMetrics } from '@/components/ExtendedMetrics';
import { PremiumReport } from '@/components/PremiumReport';
import { CouponQR } from '@/components/CouponQR';
import { ShareReward } from '@/components/ShareReward';
import ClinicaCTA from '@/components/ClinicaCTA';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Sparkles,
  Box,
  CheckCircle,
  TrendingUp,
  Brain
} from 'lucide-react';

interface Analysis {
  id: string;
  created_at: string;
  mode: 'freemium' | 'premium';
  frontal_rest_url: string | null;
  frontal_smile_url: string | null;
  facial_symmetry_score: number | null;
  facial_midline_deviation_mm: number | null;
  facial_thirds_ratio: { upper: number; middle: number; lower: number } | null;
  smile_score: number | null;
  midline_deviation_mm: number | null;
  gingival_display_mm: number | null;
  buccal_corridor_left: number | null;
  buccal_corridor_right: number | null;
}

interface UserCoupon {
  id: string;
  coupon_code: string;
  discount_percent: number;
  original_value: number;
  expires_at: string | null;
}

function getSmileInsight(score: number, midline: number, gingival: number): string {
  const insights: string[] = [];
  
  if (score >= 85) {
    insights.push('Tu sonrisa tiene una armonía excepcional.');
  } else if (score >= 70) {
    insights.push('Tu sonrisa muestra buena proporción general.');
  } else {
    insights.push('Hay oportunidades para optimizar tu sonrisa.');
  }

  if (midline < 1.5) {
    insights.push('La línea media dental está bien centrada.');
  } else {
    insights.push('Se detecta una ligera desviación en la línea media dental.');
  }

  if (gingival < 2) {
    insights.push('La exposición de encía al sonreír está en rango ideal.');
  } else if (gingival < 4) {
    insights.push('La exposición gingival es ligeramente elevada.');
  }

  return insights.join(' ');
}

function getFacialInsight(symmetry: number, thirds: { upper: number; middle: number; lower: number } | null): string {
  const insights: string[] = [];
  
  if (symmetry >= 90) {
    insights.push('Tu rostro presenta una simetría notable, por encima del promedio.');
  } else if (symmetry >= 80) {
    insights.push('Tu simetría facial está dentro de parámetros saludables.');
  } else {
    insights.push('Se identifican áreas de asimetría que podrían beneficiarse de evaluación.');
  }

  if (thirds) {
    const ideal = 33.33;
    const deviation = Math.max(
      Math.abs(thirds.upper - ideal),
      Math.abs(thirds.middle - ideal),
      Math.abs(thirds.lower - ideal)
    );
    
    if (deviation < 3) {
      insights.push('Las proporciones de los tercios faciales son armónicas.');
    } else {
      insights.push('Las proporciones faciales muestran variación respecto al ideal clásico.');
    }
  }

  return insights.join(' ');
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [coupon, setCoupon] = useState<UserCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const premiumSectionRef = useRef<HTMLDivElement>(null);

  // Test mode: ?testMode=premium or ?testMode=free
  const testMode = searchParams.get('testMode');
  const isTestMode = testMode === 'premium' || testMode === 'free';

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast({
        title: '¡Pago exitoso!',
        description: 'Tu análisis premium está siendo procesado.',
      });
      navigate(`/result/${id}`, { replace: true });
    }
  }, [searchParams]);

  const fetchAnalysis = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/dashboard');
        return;
      }

      const parsedData = {
        ...data,
        facial_thirds_ratio: data.facial_thirds_ratio as { upper: number; middle: number; lower: number } | null
      };

      setAnalysis(parsedData as Analysis);

      if (data.mode === 'premium') {
        const { data: couponData } = await supabase
          .from('user_coupons')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (couponData) {
          setCoupon(couponData as UserCoupon);
        }
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    fetchAnalysis();
  }, [id, user, authLoading]);

  useEffect(() => {
    if (!analysis) return;
    const hasAllData = analysis.smile_score !== null && analysis.facial_symmetry_score !== null;
    if (!hasAllData) {
      const timer = setInterval(() => {
        setRefreshing(true);
        fetchAnalysis();
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [analysis]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalysis();
  };

  const scrollToPremium = () => {
    premiumSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Análisis no encontrado</p>
            <Link to="/dashboard">
              <Button variant="outline">Ir al Dashboard</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const hasSmileData = analysis.smile_score !== null;
  const hasFacialData = analysis.facial_symmetry_score !== null;
  const hasAllData = hasSmileData && hasFacialData;
  
  // Test mode overrides: ?testMode=premium forces premium view, ?testMode=free forces free view
  const isPremium = testMode === 'premium' ? true : testMode === 'free' ? false : analysis.mode === 'premium';

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="glass border-b border-border/50 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Title with animation */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">Tu Análisis Facial</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            {isPremium && (
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Premium Activo</span>
              </div>
            )}
            {isTestMode && (
              <div className="mt-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 text-xs font-medium">
                🧪 Modo Prueba: {testMode === 'premium' ? 'PREMIUM' : 'GRATUITO'}
              </div>
            )}
          </motion.div>

          {!hasAllData ? (
            /* Scanning animation while analyzing */
            analysis.frontal_smile_url ? (
              <ScanningAnimation imageUrl={analysis.frontal_smile_url} />
            ) : analysis.frontal_rest_url ? (
              <ScanningAnimation imageUrl={analysis.frontal_rest_url} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Cargando imágenes...</p>
              </div>
            )
          ) : (
            <div className="space-y-10">
              {/* Hero Scores */}
              <motion.div 
                className="grid grid-cols-2 gap-6 py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AnimatedScoreRing
                  score={analysis.smile_score || 0}
                  label="Smile Score"
                  sublabel="Armonía dental"
                  color="primary"
                  delay={200}
                />
                <AnimatedScoreRing
                  score={analysis.facial_symmetry_score || 0}
                  label="Simetría"
                  sublabel="Balance facial"
                  color="accent"
                  delay={400}
                />
              </motion.div>

              {/* Smile Simulation - Always show if rest image exists */}
              {analysis.frontal_rest_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Simulación de Sonrisa IA
                  </h3>
                  <SmileSimulation
                    restImageUrl={analysis.frontal_rest_url}
                    smileImageUrl={analysis.frontal_smile_url}
                    analysisId={analysis.id}
                  />
                </motion.div>
              )}

              {/* Face Analysis with Overlay */}
              {analysis.frontal_rest_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Mapa de Análisis Facial
                  </h3>
                  <FaceAnalysisOverlay 
                    imageUrl={analysis.frontal_rest_url}
                    symmetryScore={analysis.facial_symmetry_score || undefined}
                    facialThirds={analysis.facial_thirds_ratio}
                    midlineDeviation={analysis.midline_deviation_mm || 0}
                    gingivalDisplay={analysis.gingival_display_mm || 0}
                    buccalCorridorLeft={analysis.buccal_corridor_left || 0}
                    buccalCorridorRight={analysis.buccal_corridor_right || 0}
                  />
                </motion.div>
              )}

              {/* Quick Insight - Free */}
              <AIInsightCard
                title="Resumen General"
                insight={getSmileInsight(
                  analysis.smile_score || 0,
                  analysis.midline_deviation_mm || 0,
                  analysis.gingival_display_mm || 0
                )}
              />

              {/* Extended Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <ExtendedMetrics
                  midlineDeviation={analysis.midline_deviation_mm || 0}
                  gingivalDisplay={analysis.gingival_display_mm || 0}
                  buccalCorridorLeft={analysis.buccal_corridor_left || 0}
                  buccalCorridorRight={analysis.buccal_corridor_right || 0}
                  facialThirds={analysis.facial_thirds_ratio}
                  facialMidlineDeviation={analysis.facial_midline_deviation_mm || 0}
                  isLocked={!isPremium}
                />
              </motion.div>

              {/* Treatment Suggestions (2 free + locked) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <TreatmentSuggestions
                  smileScore={analysis.smile_score || 0}
                  symmetryScore={analysis.facial_symmetry_score || 0}
                  midlineDeviation={analysis.midline_deviation_mm || 0}
                  gingivalDisplay={analysis.gingival_display_mm || 0}
                  isLocked={!isPremium}
                />
              </motion.div>

              {/* 3D Preview - Teaser for Freemium */}
              {analysis.frontal_smile_url && !isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Box className="w-5 h-5 text-primary" />
                    Modelo 3D Interactivo
                  </h3>
                  <Model3DPreview imageUrl={analysis.frontal_smile_url} isLocked={true} />
                </motion.div>
              )}

              {/* Premium Content Preview for Freemium */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <PremiumContentPreview onUpgradeClick={scrollToPremium} />
                </motion.div>
              )}

              {/* Share Reward - Viral mechanic for all users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.35 }}
              >
                <ShareReward
                  analysisId={analysis.id}
                  smileScore={analysis.smile_score || 0}
                />
              </motion.div>

              {/* Locked Premium Insights for Freemium */}
              {!isPremium && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <AIInsightCard
                    title="Recomendaciones Personalizadas"
                    insight=""
                    isLocked={true}
                    lockedPreview="Basado en tus métricas faciales, identificamos 3 áreas de mejora específicas. Tu línea media presenta una desviación que podría corregirse con..."
                  />
                  <AIInsightCard
                    title="Plan de Tratamiento Sugerido"
                    insight=""
                    isLocked={true}
                    lockedPreview="Para optimizar tu armonía facial recomendamos evaluar: 1) Alineación dental mediante ortodoncia, 2) Contorno facial con..."
                  />
                </motion.div>
              )}

              {/* Premium Upgrade CTA or Premium Content */}
              <div ref={premiumSectionRef}>
                {!isPremium ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                  >
                    <PremiumUpgrade analysisId={analysis.id} onSuccess={() => fetchAnalysis()} />
                  </motion.div>
                ) : (
                  <div className="space-y-8">
                    {/* Premium Success Banner */}
                    <motion.div 
                      className="glass rounded-2xl p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Análisis Premium Completo</h2>
                          <p className="text-sm text-muted-foreground">Todas las funciones desbloqueadas</p>
                        </div>
                      </div>

                      <AIInsightCard
                        title="Análisis Completo IA"
                        insight={getFacialInsight(analysis.facial_symmetry_score || 0, analysis.facial_thirds_ratio)}
                      />
                    </motion.div>

                    {/* Premium Report - PDF Profesional */}
                    <PremiumReport
                      analysisId={analysis.id}
                      smileScore={analysis.smile_score || 0}
                      symmetryScore={analysis.facial_symmetry_score || 0}
                      midlineDeviation={analysis.midline_deviation_mm || undefined}
                      gingivalDisplay={analysis.gingival_display_mm || undefined}
                      buccalCorridorLeft={analysis.buccal_corridor_left || undefined}
                      buccalCorridorRight={analysis.buccal_corridor_right || undefined}
                      facialSymmetryScore={analysis.facial_symmetry_score || undefined}
                      facialThirds={analysis.facial_thirds_ratio}
                    />

                    {/* Coupon with QR */}
                    {coupon && (
                      <CouponQR
                        couponCode={coupon.coupon_code}
                        discountPercent={coupon.discount_percent}
                        originalValue={coupon.original_value}
                        expiresAt={coupon.expires_at || undefined}
                      />
                    )}

                    {/* Clínica Miro CTA - Only for Premium users */}
                    <ClinicaCTA />
                  </div>
                )}
              </div>

              {/* Actions */}
              <motion.div 
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                <Link to="/scan" className="flex-1">
                  <Button className="w-full">
                    Nuevo Análisis
                  </Button>
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
