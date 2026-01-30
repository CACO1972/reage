import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PremiumUpgrade } from '@/components/PremiumUpgrade';
import { PromoCodeRedemption } from '@/components/PromoCodeRedemption';
import { SimpleScoreDisplay } from '@/components/SimpleScoreDisplay';
import { SimplifiedSmileSimulation } from '@/components/SimplifiedSmileSimulation';
import { FacialProportionsTeaser } from '@/components/FacialProportionsTeaser';
import { ImprovementSuggestionTeaser } from '@/components/ImprovementSuggestionTeaser';
import { ScanningAnimation } from '@/components/ScanningAnimation';
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
  FileText,
  ChevronDown
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
  raw_ai_payload?: any;
}

interface UserCoupon {
  id: string;
  coupon_code: string;
  discount_percent: number;
  original_value: number;
  expires_at: string | null;
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signInAnonymously } = useAuth();
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
    if (authLoading) return;
    if (!user) {
      signInAnonymously();
      return;
    }
    fetchAnalysis();
  }, [id, user, authLoading, signInAnonymously]);

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
  
  const isPremium = testMode === 'premium' ? true : testMode === 'free' ? false : analysis.mode === 'premium';

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Simple Header */}
        <div className="glass border-b border-border/50 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Link>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-lg">
          {/* Title */}
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold mb-1">Tu Resultado</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long'
              })}
            </p>
            {isTestMode && (
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 text-xs font-medium">
                🧪 Modo Prueba: {testMode?.toUpperCase()}
              </div>
            )}
          </motion.div>

          {!hasAllData ? (
            /* Scanning Animation */
            analysis.frontal_smile_url ? (
              <ScanningAnimation imageUrl={analysis.frontal_smile_url} />
            ) : analysis.frontal_rest_url ? (
              <ScanningAnimation imageUrl={analysis.frontal_rest_url} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Analizando...</p>
              </div>
            )
          ) : (
            <div className="space-y-8">
              {/* Score Display - Simple and Clear */}
              <SimpleScoreDisplay
                smileScore={analysis.smile_score || 0}
                symmetryScore={analysis.facial_symmetry_score || 0}
              />

              {/* Smile Simulation - Visual Impact */}
              {analysis.frontal_rest_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Tu Sonrisa Potencial
                  </h3>
                  <SimplifiedSmileSimulation
                    restImageUrl={analysis.frontal_rest_url}
                    smileImageUrl={null}
                    analysisId={analysis.id}
                    autoGenerate={true}
                  />
                </motion.div>
              )}

              {/* Teaser: Facial Proportions (Premium locked) */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <FacialProportionsTeaser
                    facialThirds={analysis.facial_thirds_ratio}
                    symmetryScore={analysis.facial_symmetry_score || 0}
                    onUpgrade={scrollToPremium}
                  />
                </motion.div>
              )}

              {/* Teaser: Improvement Suggestions (Premium locked) */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <ImprovementSuggestionTeaser
                    smileScore={analysis.smile_score || 0}
                    symmetryScore={analysis.facial_symmetry_score || 0}
                    onUpgrade={scrollToPremium}
                  />
                </motion.div>
              )}

              {/* Share Reward - Viral mechanic */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <ShareReward
                  analysisId={analysis.id}
                  smileScore={analysis.smile_score || 0}
                />
              </motion.div>

              {/* Premium CTA or Content */}
              <div ref={premiumSectionRef}>
                {!isPremium ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                  >
                    {/* What's in the report teaser */}
                    <div className="glass rounded-2xl p-5">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        ¿Qué incluye el Informe Completo?
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</span>
                          246 puntos biométricos analizados
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</span>
                          Análisis de piel y edad estimada
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</span>
                          Recomendaciones personalizadas
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</span>
                          20% descuento en evaluación clínica
                        </li>
                      </ul>
                      
                      <Button 
                        onClick={scrollToPremium}
                        variant="ghost"
                        size="sm"
                        className="w-full mt-4 text-primary"
                      >
                        Ver más
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <PremiumUpgrade analysisId={analysis.id} onSuccess={() => fetchAnalysis()} />
                    
                    {/* Promo Code Option */}
                    <div className="pt-2">
                      <PromoCodeRedemption 
                        analysisId={analysis.id} 
                        onSuccess={() => fetchAnalysis()} 
                        compact 
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    {/* Premium Badge */}
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Premium Activo</span>
                    </div>

                    {/* Premium Report - PDF Download */}
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

                    {/* Coupon */}
                    {coupon && (
                      <CouponQR
                        couponCode={coupon.coupon_code}
                        discountPercent={coupon.discount_percent}
                        originalValue={coupon.original_value}
                        expiresAt={coupon.expires_at || undefined}
                      />
                    )}

                    {/* Clinic CTA */}
                    <ClinicaCTA />
                  </motion.div>
                )}
              </div>

              {/* New Analysis */}
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link to="/scan" className="block">
                  <Button variant="outline" className="w-full">
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