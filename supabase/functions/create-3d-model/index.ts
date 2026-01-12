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

    // Verify analysis exists and get image
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, frontal_smile_url, frontal_rest_url')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Analysis not found');
    }

    const imageUrl = analysis.frontal_smile_url || analysis.frontal_rest_url;
    if (!imageUrl) {
      throw new Error('No image available for 3D generation');
    }

    console.log(`Starting 3D model generation for ${analysisId}`);

    // Upsert analysis_3d record - set to processing
    const { error: upsertError } = await supabase
      .from('analysis_3d')
      .upsert({
        analysis_id: analysisId,
        status_3d: 'processing',
        wavespeed_task_id: null,
        model_glb_url: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'analysis_id' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }

    if (!wavespeedApiKey) {
      console.warn('WAVESPEED_API_KEY not configured - using placeholder');
      
      // Update to failed status
      await supabase
        .from('analysis_3d')
        .update({ 
          status_3d: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('analysis_id', analysisId);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WaveSpeed API not configured',
          analysisId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Step 1: Create Tripo3D image-to-3d task
      console.log('Creating Tripo3D task with WaveSpeed API...');
      
      const createTaskResponse = await fetch(`${WAVESPEED_API_BASE}/tripo3d/v2.5/image-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wavespeedApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl,
          face_limit: 50000, // Optimized for web viewing
          texture: true,
          pbr: true
        })
      });

      if (!createTaskResponse.ok) {
        const errText = await createTaskResponse.text();
        console.error('WaveSpeed task creation failed:', createTaskResponse.status, errText);
        throw new Error(`WaveSpeed API error: ${createTaskResponse.status}`);
      }

      const taskData = await createTaskResponse.json();
      const taskId = taskData.data?.task_id || taskData.task_id;

      if (!taskId) {
        console.error('No task ID in response:', taskData);
        throw new Error('No task ID returned from WaveSpeed');
      }

      console.log('Tripo3D task created:', taskId);

      // Save task ID for polling
      await supabase
        .from('analysis_3d')
        .update({ 
          wavespeed_task_id: taskId,
          status_3d: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('analysis_id', analysisId);

      // Step 2: Poll for completion (max 2 minutes in edge function)
      let attempts = 0;
      const maxAttempts = 20;
      let modelUrl: string | null = null;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 6000)); // 6 second intervals
        
        const statusResponse = await fetch(`${WAVESPEED_API_BASE}/tripo3d/v2.5/task/${taskId}`, {
          headers: { 'Authorization': `Bearer ${wavespeedApiKey}` }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = statusData.data?.status || statusData.status;
          
          console.log(`Tripo3D task status (${attempts + 1}/${maxAttempts}):`, status);

          if (status === 'completed' || status === 'success') {
            modelUrl = statusData.data?.model_url || statusData.model_url || 
                       statusData.data?.glb_url || statusData.glb_url ||
                       statusData.data?.result?.model_url;
            
            if (modelUrl) {
              console.log('3D model generated successfully:', modelUrl);
              break;
            }
          } else if (status === 'failed' || status === 'error') {
            throw new Error('Tripo3D task failed');
          }
        }
        attempts++;
      }

      if (modelUrl) {
        // Success - update with model URL
        await supabase
          .from('analysis_3d')
          .update({ 
            status_3d: 'completed',
            model_glb_url: modelUrl,
            updated_at: new Date().toISOString()
          })
          .eq('analysis_id', analysisId);

        console.log(`3D model completed for ${analysisId}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            analysisId,
            taskId,
            modelUrl,
            status: 'completed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Still processing - frontend will poll
        console.log(`3D model still processing for ${analysisId}, task: ${taskId}`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            analysisId,
            taskId,
            status: 'processing',
            message: 'Model generation in progress. Poll for status.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (apiError) {
      console.error('WaveSpeed API error:', apiError);
      
      await supabase
        .from('analysis_3d')
        .update({ 
          status_3d: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('analysis_id', analysisId);

      throw apiError;
    }

  } catch (error) {
    console.error('Error in create-3d-model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
