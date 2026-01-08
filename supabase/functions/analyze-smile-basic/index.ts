import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId } = await req.json();
    
    if (!analysisId) {
      throw new Error('analysisId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify analysis exists
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, user_id, frontal_smile_url')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Analysis not found');
    }

    console.log(`Processing smile analysis for ${analysisId}`);

    // Simulated smile analysis metrics
    // In production, this would call a dental AI API
    const smileScore = 75 + Math.random() * 20; // 75-95
    const midlineDeviation = Math.random() * 2; // 0-2mm
    const gingivalDisplay = Math.random() * 3; // 0-3mm
    const buccalCorridorLeft = 5 + Math.random() * 10; // 5-15%
    const buccalCorridorRight = 5 + Math.random() * 10; // 5-15%

    // Update analysis with results
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        smile_score: smileScore,
        midline_deviation_mm: midlineDeviation,
        gingival_display_mm: gingivalDisplay,
        buccal_corridor_left: buccalCorridorLeft,
        buccal_corridor_right: buccalCorridorRight,
        raw_ai_payload: {
          simetria_dental: {
            version: '1.0',
            processed_at: new Date().toISOString(),
            smile_score: smileScore,
            midline_deviation_mm: midlineDeviation,
            gingival_display_mm: gingivalDisplay,
            buccal_corridors: { left: buccalCorridorLeft, right: buccalCorridorRight }
          }
        }
      })
      .eq('id', analysisId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Smile analysis completed for ${analysisId}`);

    return new Response(
      JSON.stringify({ success: true, analysisId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-smile-basic:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
