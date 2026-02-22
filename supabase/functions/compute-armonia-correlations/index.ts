import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DataPoint {
  metric: number;
  score: number;
}

function pearsonCorrelation(data: DataPoint[]): { r: number; n: number } {
  const n = data.length;
  if (n < 3) return { r: 0, n };

  const sumX = data.reduce((s, d) => s + d.metric, 0);
  const sumY = data.reduce((s, d) => s + d.score, 0);
  const sumXY = data.reduce((s, d) => s + d.metric * d.score, 0);
  const sumX2 = data.reduce((s, d) => s + d.metric * d.metric, 0);
  const sumY2 = data.reduce((s, d) => s + d.score * d.score, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  if (den === 0) return { r: 0, n };
  return { r: num / den, n };
}

function isSignificant(r: number, n: number): boolean {
  if (n < 4) return false;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  // approximate p < 0.05 two-tailed: |t| > 1.96 for large n
  const criticalT = n > 30 ? 1.96 : 2.1;
  return Math.abs(t) > criticalT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse optional filters
    const url = new URL(req.url);
    const gender = url.searchParams.get("gender");
    const ethnicity = url.searchParams.get("ethnicity");
    const saveResults = url.searchParams.get("save") === "true";

    // Fetch joined data
    let query = supabase.from("armonia_complete_view").select("*");
    if (gender) query = query.eq("gender", gender);
    if (ethnicity) query = query.eq("ethnicity", ethnicity);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data found for given filters", correlations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Metrics to correlate against mean_score
    const metricKeys = [
      "face_ratio",
      "symmetry_score",
      "phi_approximation",
    ] as const;

    const contextFilter: Record<string, string> = {};
    if (gender) contextFilter.gender = gender;
    if (ethnicity) contextFilter.ethnicity = ethnicity;

    const correlations = metricKeys.map((key) => {
      const points: DataPoint[] = data
        .filter((d: any) => d[key] != null && d.mean_score != null)
        .map((d: any) => ({ metric: d[key], score: d.mean_score }));

      const { r, n } = pearsonCorrelation(points);
      return {
        metric_name: key,
        correlation_r: Math.round(r * 10000) / 10000,
        sample_size: n,
        is_significant: isSignificant(r, n),
        context_filter: Object.keys(contextFilter).length > 0 ? contextFilter : null,
      };
    });

    // Optionally persist to armonia_correlations
    if (saveResults && correlations.length > 0) {
      const { error: insertError } = await supabase
        .from("armonia_correlations")
        .upsert(
          correlations.map((c) => ({
            metric_name: c.metric_name,
            correlation_r: c.correlation_r,
            sample_size: c.sample_size,
            is_significant: c.is_significant,
            context_filter: c.context_filter ?? {},
          })),
          { onConflict: "metric_name" }
        );
      if (insertError) console.error("Save error:", insertError);
    }

    return new Response(
      JSON.stringify({
        sample_size: data.length,
        filters: contextFilter,
        correlations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
