import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Scan, Clock, ChevronRight, Sparkles } from 'lucide-react';

interface AnalysisSummary {
  id: string;
  created_at: string;
  smile_score: number | null;
  facial_symmetry_score: number | null;
  frontal_smile_url: string | null;
}

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    const fetchAnalyses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('id, created_at, smile_score, facial_symmetry_score, frontal_smile_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setAnalyses(data || []);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Hola 👋</h1>
            <p className="text-muted-foreground">
              {profile?.plan === 'free' ? (
                <>Plan gratuito • <Link to="#" className="text-primary hover:underline">Actualizar a Premium</Link></>
              ) : (
                <>Plan {profile?.plan}</>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link to="/scan">
              <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Scan className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Nuevo Análisis</h3>
                <p className="text-sm text-muted-foreground">Escanea tu sonrisa</p>
              </div>
            </Link>
            
            <div className="glass rounded-2xl p-6 opacity-60">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Premium</h3>
              <p className="text-sm text-muted-foreground">Próximamente</p>
            </div>
          </div>

          {/* Analysis History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Historial</h2>
              {analyses.length > 0 && (
                <span className="text-sm text-muted-foreground">{analyses.length} análisis</span>
              )}
            </div>

            {analyses.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Sin análisis aún</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Realiza tu primer análisis para ver tus resultados aquí.
                </p>
                <Link to="/scan">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Comenzar Análisis
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((analysis, index) => {
                  const isProcessing = analysis.smile_score === null && analysis.facial_symmetry_score === null;
                  
                  return (
                    <Link
                      key={analysis.id}
                      to={`/result/${analysis.id}`}
                      className="block animate-slide-up"
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      <div className="glass rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            {analysis.frontal_smile_url ? (
                              <img
                                src={analysis.frontal_smile_url}
                                alt="Smile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Scan className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium mb-1">
                              {new Date(analysis.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            {isProcessing ? (
                              <div className="flex items-center gap-2 text-sm text-amber-500">
                                <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                                Procesando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {analysis.smile_score !== null && (
                                  <span>Sonrisa: <span className="text-foreground font-medium">{analysis.smile_score.toFixed(0)}</span></span>
                                )}
                                {analysis.facial_symmetry_score !== null && (
                                  <span>Facial: <span className="text-foreground font-medium">{analysis.facial_symmetry_score.toFixed(0)}%</span></span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
