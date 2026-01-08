import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Smile, 
  ScanFace, 
  ArrowLeft, 
  RefreshCw, 
  Download,
  ChevronRight,
  Lock,
  Sparkles,
  Box
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

function MetricCard({ 
  label, 
  value, 
  unit = '', 
  description,
  isGood = true 
}: { 
  label: string; 
  value: number | null; 
  unit?: string;
  description?: string;
  isGood?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {value !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${isGood ? 'bg-accent/10 text-accent' : 'bg-amber-500/10 text-amber-500'}`}>
            {isGood ? 'Normal' : 'A mejorar'}
          </span>
        )}
      </div>
      {value !== null ? (
        <p className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(1) : value}{unit}
        </p>
      ) : (
        <div className="h-8 flex items-center">
          <div className="w-24 h-3 bg-muted rounded-full animate-pulse" />
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

function LoadingSection({ title }: { title: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        <div>
          <div className="w-32 h-5 bg-muted rounded animate-pulse mb-1" />
          <div className="w-20 h-4 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-2xl bg-muted/50">
            <div className="w-20 h-4 bg-muted rounded animate-pulse mb-2" />
            <div className="w-16 h-6 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      // Parse facial_thirds_ratio from JSON
      const parsedData = {
        ...data,
        facial_thirds_ratio: data.facial_thirds_ratio as { upper: number; middle: number; lower: number } | null
      };

      setAnalysis(parsedData as Analysis);
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

  // Auto-refresh while metrics are loading
  useEffect(() => {
    if (!analysis) return;

    const hasAllData = 
      analysis.smile_score !== null && 
      analysis.facial_symmetry_score !== null;

    if (!hasAllData) {
      const timer = setInterval(() => {
        setRefreshing(true);
        fetchAnalysis();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [analysis]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalysis();
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

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="glass border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Tu Análisis</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Images Preview */}
          {(analysis.frontal_rest_url || analysis.frontal_smile_url) && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {analysis.frontal_rest_url && (
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                  <img 
                    src={analysis.frontal_rest_url} 
                    alt="Reposo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {analysis.frontal_smile_url && (
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                  <img 
                    src={analysis.frontal_smile_url} 
                    alt="Sonrisa" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Analysis Sections */}
          <div className="space-y-6">
            {/* Smile Analysis */}
            {hasSmileData ? (
              <div className="glass rounded-2xl p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Smile className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Análisis de Sonrisa</h2>
                    <p className="text-sm text-muted-foreground">Métricas dentales</p>
                  </div>
                </div>

                {/* Smile Score */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Smile Score</p>
                  <p className="text-5xl font-bold text-gradient">
                    {analysis.smile_score?.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">de 100</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Desviación línea media"
                    value={analysis.midline_deviation_mm}
                    unit=" mm"
                    isGood={(analysis.midline_deviation_mm ?? 0) < 2}
                  />
                  <MetricCard
                    label="Exposición gingival"
                    value={analysis.gingival_display_mm}
                    unit=" mm"
                    isGood={(analysis.gingival_display_mm ?? 0) < 3}
                  />
                  <MetricCard
                    label="Corredor bucal izq."
                    value={analysis.buccal_corridor_left}
                    unit="%"
                    isGood={(analysis.buccal_corridor_left ?? 0) >= 5}
                  />
                  <MetricCard
                    label="Corredor bucal der."
                    value={analysis.buccal_corridor_right}
                    unit="%"
                    isGood={(analysis.buccal_corridor_right ?? 0) >= 5}
                  />
                </div>
              </div>
            ) : (
              <LoadingSection title="Análisis de Sonrisa" />
            )}

            {/* Facial Analysis */}
            {hasFacialData ? (
              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <ScanFace className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Análisis Facial</h2>
                    <p className="text-sm text-muted-foreground">Perfect Corp AI</p>
                  </div>
                </div>

                {/* Symmetry Score */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Simetría Facial</p>
                  <p className="text-5xl font-bold text-gradient">
                    {analysis.facial_symmetry_score?.toFixed(0)}%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Desviación línea media"
                    value={analysis.facial_midline_deviation_mm}
                    unit=" mm"
                    isGood={(analysis.facial_midline_deviation_mm ?? 0) < 3}
                  />
                  {analysis.facial_thirds_ratio && (
                    <>
                      <MetricCard
                        label="Tercio superior"
                        value={analysis.facial_thirds_ratio.upper}
                        unit="%"
                        description="Frente"
                      />
                      <MetricCard
                        label="Tercio medio"
                        value={analysis.facial_thirds_ratio.middle}
                        unit="%"
                        description="Nariz"
                      />
                      <MetricCard
                        label="Tercio inferior"
                        value={analysis.facial_thirds_ratio.lower}
                        unit="%"
                        description="Labios/Mentón"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <LoadingSection title="Análisis Facial" />
            )}

            {/* Premium Features (Locked) */}
            <div className="glass rounded-2xl p-6 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Funciones Premium</h2>
                  <p className="text-sm text-muted-foreground">Desbloquea más análisis</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full p-4 rounded-xl bg-muted/50 flex items-center justify-between group hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Análisis de Piel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full p-4 rounded-xl bg-muted/50 flex items-center justify-between group hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Modelo 3D Educativo</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <Button variant="outline" className="flex-1" disabled>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Link to="/scan" className="flex-1">
              <Button className="w-full">
                Nuevo Análisis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
