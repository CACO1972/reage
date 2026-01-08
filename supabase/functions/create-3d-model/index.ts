import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tripo3D v2.5 integration placeholder
// API: https://api.wavespeed.ai/api/v3/tripo3d/v2.5/image-to-3d

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
    const wavespeedApiKey = Deno.env.get('WAVESPEED_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify analysis exists
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, frontal_smile_url')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Analysis not found');
    }

    // Create or update analysis_3d record
    const { error: upsertError } = await supabase
      .from('analysis_3d')
      .upsert({
        analysis_id: analysisId,
        status_3d: 'pending',
        wavespeed_task_id: null,
        model_glb_url: null
      });

    if (upsertError) {
      throw upsertError;
    }

    console.log(`3D model creation initiated for ${analysisId}`);

    // TODO: Implement Tripo3D API call when ready
    // POST https://api.wavespeed.ai/api/v3/tripo3d/v2.5/image-to-3d
    // with Authorization: Bearer WAVESPEED_API_KEY
    // and body: { image: frontal_smile_url }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId,
        status: 'pending',
        message: 'Tripo3D integration pending implementation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-3d-model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
