import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WaveSpeed Tripo3D API
const WAVESPEED_API_BASE = 'https://api.wavespeed.ai/api/v3';

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

    // Get current 3D status
    const { data: analysis3d, error: fetchError } = await supabase
      .from('analysis_3d')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();

    if (fetchError || !analysis3d) {
      return new Response(
        JSON.stringify({ 
          status: 'not_started',
          analysisId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already completed or failed, return current status
    if (analysis3d.status_3d === 'completed' || analysis3d.status_3d === 'failed') {
      return new Response(
        JSON.stringify({ 
          status: analysis3d.status_3d,
          modelUrl: analysis3d.model_glb_url,
          analysisId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If processing and we have a task ID, check WaveSpeed for updates
    if (analysis3d.status_3d === 'processing' && analysis3d.wavespeed_task_id && wavespeedApiKey) {
      try {
        const statusResponse = await fetch(
          `${WAVESPEED_API_BASE}/tripo3d/v2.5/task/${analysis3d.wavespeed_task_id}`,
          {
            headers: { 'Authorization': `Bearer ${wavespeedApiKey}` }
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = statusData.data?.status || statusData.status;
          
          console.log(`Checking Tripo3D task ${analysis3d.wavespeed_task_id}:`, status);

          if (status === 'completed' || status === 'success') {
            const modelUrl = statusData.data?.model_url || statusData.model_url || 
                            statusData.data?.glb_url || statusData.glb_url ||
                            statusData.data?.result?.model_url;
            
            if (modelUrl) {
              // Update database with completed status
              await supabase
                .from('analysis_3d')
                .update({ 
                  status_3d: 'completed',
                  model_glb_url: modelUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('analysis_id', analysisId);

              return new Response(
                JSON.stringify({ 
                  status: 'completed',
                  modelUrl,
                  analysisId 
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else if (status === 'failed' || status === 'error') {
            await supabase
              .from('analysis_3d')
              .update({ 
                status_3d: 'failed',
                updated_at: new Date().toISOString()
              })
              .eq('analysis_id', analysisId);

            return new Response(
              JSON.stringify({ 
                status: 'failed',
                analysisId 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (apiErr) {
        console.error('WaveSpeed status check error:', apiErr);
      }
    }

    // Still processing
    return new Response(
      JSON.stringify({ 
        status: analysis3d.status_3d,
        taskId: analysis3d.wavespeed_task_id,
        analysisId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-3d-model-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
