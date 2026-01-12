import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Perfect Corp available skin analysis parameters (SD mode)
const ALL_SKIN_PARAMS = [
  'wrinkle', 'pore', 'texture', 'acne', 'dark_circle_v2', 
  'age_spot', 'firmness', 'moisture', 'oiliness', 'radiance', 
  'redness', 'eye_bag', 'droopy_upper_eyelid', 'droopy_lower_eyelid'
] as const;

// Map AI recommendations to Perfect Corp parameter names
const PARAM_MAPPING: Record<string, string> = {
  'wrinkles': 'wrinkle',
  'pores': 'pore',
  'acne': 'acne',
  'dark_circles': 'dark_circle_v2',
  'spots': 'age_spot',
  'age_spots': 'age_spot',
  'firmness': 'firmness',
  'hydration': 'moisture',
  'moisture': 'moisture',
  'oiliness': 'oiliness',
  'radiance': 'radiance',
  'redness': 'redness',
  'texture': 'texture',
  'eye_bags': 'eye_bag',
  'droopy_eyelids': 'droopy_upper_eyelid'
};

interface PreAnalysisResult {
  recommended_params: string[];
  facial_analysis: {
    symmetry_score: number;
    midline_deviation: number;
    thirds_ratio: { upper: number; middle: number; lower: number };
    face_shape: string;
  };
  rationale: string;
}

interface PerfectCorpSkinResult {
  type: string;
  ui_score: number;
  raw_score: number;
  mask_urls?: string[];
}

async function downloadImage(url: string): Promise<{blob: Blob, contentType: string}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return { blob, contentType };
}

async function uploadToPerfectCorp(
  perfectApiKey: string, 
  imageBlob: Blob, 
  contentType: string,
  fileName: string
): Promise<string> {
  // Step 1: Create file metadata
  const fileSize = imageBlob.size;
  console.log(`Uploading image to Perfect Corp: ${fileName}, size: ${fileSize}, type: ${contentType}`);
  
  const fileResponse = await fetch('https://yce-api-01.makeupar.com/s2s/v2.0/file/skin-analysis', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perfectApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: [{
        content_type: contentType,
        file_name: fileName,
        file_size: fileSize
      }]
    })
  });

  if (!fileResponse.ok) {
    const errorText = await fileResponse.text();
    throw new Error(`File API failed: ${fileResponse.status} - ${errorText}`);
  }

  const fileData = await fileResponse.json();
  const fileInfo = fileData.data?.files?.[0];
  
  if (!fileInfo) {
    throw new Error('No file info in response');
  }

  const fileId = fileInfo.file_id;
  const uploadRequest = fileInfo.requests?.[0];
  
  if (!uploadRequest) {
    throw new Error('No upload URL in response');
  }

  console.log(`Got file_id: ${fileId}, uploading to presigned URL...`);

  // Step 2: Upload to presigned URL
  const uploadHeaders: Record<string, string> = {};
  if (uploadRequest.headers) {
    for (const [key, value] of Object.entries(uploadRequest.headers)) {
      uploadHeaders[key] = String(value);
    }
  }

  const uploadResponse = await fetch(uploadRequest.url, {
    method: uploadRequest.method || 'PUT',
    headers: uploadHeaders,
    body: imageBlob
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  console.log('Image uploaded successfully to Perfect Corp');
  return fileId;
}

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const perfectApiKey = Deno.env.get('PERFECT_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch analysis
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, frontal_smile_url, frontal_rest_url, mode')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Analysis not found');
    }

    console.log(`Processing analysis ${analysisId}, mode: ${analysis.mode}`);

    const imageUrl = analysis.frontal_rest_url || analysis.frontal_smile_url;
    
    if (!imageUrl) {
      throw new Error('No image URL available for analysis');
    }

    let facialSymmetryScore = 85;
    let facialMidlineDeviation = 1.0;
    let facialThirdsRatio = { upper: 33, middle: 33, lower: 34 };
    let selectedParams: string[] = ['wrinkle', 'pore', 'texture', 'dark_circle_v2', 'firmness'];
    let rationale = '';
    let preAnalysisSuccess = false;
    let perfectCorpSuccess = false;
    let skinResults: PerfectCorpSkinResult[] = [];

    // STEP 1: Pre-analysis with Lovable AI to determine relevant parameters
    if (lovableApiKey) {
      try {
        console.log('Running pre-analysis with Lovable AI...');
        
        const preAnalysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are a dermatologist analyzing a facial photo. Your task is to:
1. Identify the TOP 5 most relevant skin concerns for this specific face
2. Provide facial structure measurements

Available skin parameters (choose exactly 5):
- wrinkles: Fine lines and wrinkles
- pores: Visible pore size
- texture: Skin texture irregularities
- acne: Active acne or breakouts
- dark_circles: Under-eye darkness
- spots/age_spots: Pigmentation and sun spots
- firmness: Skin elasticity and sagging
- hydration/moisture: Skin dryness
- oiliness: Excess sebum production
- radiance: Skin brightness and glow
- redness: Inflammation or rosacea
- eye_bags: Puffiness under eyes
- droopy_eyelids: Eyelid drooping

Return ONLY valid JSON:
{
  "recommended_params": ["param1", "param2", "param3", "param4", "param5"],
  "facial_analysis": {
    "symmetry_score": <70-100>,
    "midline_deviation": <0-5 mm>,
    "thirds_ratio": {
      "upper": <25-40>,
      "middle": <25-40>,
      "lower": <25-40>
    },
    "face_shape": "<oval|round|square|heart|oblong>"
  },
  "rationale": "Brief explanation of why these 5 parameters are most relevant for this face"
}`
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageUrl }
                  }
                ]
              }
            ]
          })
        });

        if (preAnalysisResponse.ok) {
          const aiData = await preAnalysisResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed: PreAnalysisResult = JSON.parse(jsonMatch[0]);
            
            // Extract facial metrics
            if (parsed.facial_analysis) {
              facialSymmetryScore = parsed.facial_analysis.symmetry_score ?? 85;
              facialMidlineDeviation = parsed.facial_analysis.midline_deviation ?? 1;
              facialThirdsRatio = parsed.facial_analysis.thirds_ratio ?? { upper: 33, middle: 33, lower: 34 };
            }
            
            rationale = parsed.rationale || '';
            
            // Map recommended params to Perfect Corp format
            if (parsed.recommended_params && Array.isArray(parsed.recommended_params)) {
              const mappedParams = parsed.recommended_params
                .slice(0, 5)
                .map(p => PARAM_MAPPING[p.toLowerCase()] || p)
                .filter(p => ALL_SKIN_PARAMS.includes(p as typeof ALL_SKIN_PARAMS[number]));
              
              if (mappedParams.length >= 3) {
                selectedParams = mappedParams.slice(0, 5);
                console.log('AI selected params:', selectedParams);
              }
            }
            
            preAnalysisSuccess = true;
            console.log('Pre-analysis completed:', { selectedParams, rationale });
          }
        } else {
          console.error('Pre-analysis failed:', preAnalysisResponse.status);
        }
      } catch (err) {
        console.error('Pre-analysis error:', err);
      }
    }

    // STEP 2: Call Perfect Corp API with selected parameters
    if (perfectApiKey) {
      try {
        console.log('Calling Perfect Corp Skin Analysis API...');
        console.log('Using params:', selectedParams);
        
        // Download image from Supabase
        console.log('Downloading image from Supabase...');
        const { blob: imageBlob, contentType } = await downloadImage(imageUrl);
        
        // Upload to Perfect Corp
        const fileId = await uploadToPerfectCorp(
          perfectApiKey,
          imageBlob,
          contentType,
          `analysis-${analysisId}.jpg`
        );
        
        // Create skin analysis task with file_id
        const taskResponse = await fetch('https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-analysis', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perfectApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            src_file_id: fileId,
            dst_actions: selectedParams,
            format: 'json'
          })
        });

        if (!taskResponse.ok) {
          const errorText = await taskResponse.text();
          console.error('Perfect Corp task creation failed:', taskResponse.status, errorText);
          throw new Error(`Perfect Corp API error: ${taskResponse.status}`);
        }

        const taskData = await taskResponse.json();
        const taskId = taskData.data?.task_id;
        
        if (!taskId) {
          console.error('No task_id in Perfect Corp response:', taskData);
          throw new Error('No task_id returned');
        }

        console.log('Perfect Corp task created:', taskId);

        // Poll for results (max 30 seconds)
        let attempts = 0;
        const maxAttempts = 15;
        const pollInterval = 2000;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          const statusResponse = await fetch(
            `https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-analysis/${taskId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${perfectApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!statusResponse.ok) {
            console.error('Status check failed:', statusResponse.status);
            attempts++;
            continue;
          }

          const statusData = await statusResponse.json();
          const taskStatus = statusData.data?.task_status;
          
          console.log(`Poll attempt ${attempts + 1}: status = ${taskStatus}`);

          if (taskStatus === 'success') {
            // Extract results
            const output = statusData.data?.results?.output;
            if (output && Array.isArray(output)) {
              skinResults = output.map((item: any) => ({
                type: item.type,
                ui_score: item.ui_score,
                raw_score: item.raw_score,
                mask_urls: item.mask_urls
              }));
              
              // Also check for skin_age and overall score
              const scoreInfo = statusData.data?.results?.score_info;
              if (scoreInfo) {
                skinResults.push({
                  type: 'overall',
                  ui_score: scoreInfo.all ?? 75,
                  raw_score: scoreInfo.all ?? 75
                });
                if (scoreInfo.skin_age) {
                  skinResults.push({
                    type: 'skin_age',
                    ui_score: scoreInfo.skin_age,
                    raw_score: scoreInfo.skin_age
                  });
                }
              }
              
              perfectCorpSuccess = true;
              console.log('Perfect Corp analysis completed:', skinResults.length, 'metrics');
            }
            break;
          } else if (taskStatus === 'error') {
            console.error('Perfect Corp task failed:', statusData.data?.error);
            break;
          }

          attempts++;
        }

        if (attempts >= maxAttempts && !perfectCorpSuccess) {
          console.warn('Perfect Corp polling timed out');
        }

      } catch (err) {
        console.error('Perfect Corp API error:', err);
      }
    } else {
      console.warn('PERFECT_API_KEY not configured');
    }

    // STEP 3: Build comprehensive payload with tiered access
    const isPremium = analysis.mode === 'premium';
    
    // Normalize thirds to sum to 100
    const thirdsSum = facialThirdsRatio.upper + facialThirdsRatio.middle + facialThirdsRatio.lower;
    if (thirdsSum > 0 && thirdsSum !== 100) {
      facialThirdsRatio = {
        upper: Math.round((facialThirdsRatio.upper / thirdsSum) * 100),
        middle: Math.round((facialThirdsRatio.middle / thirdsSum) * 100),
        lower: Math.round((facialThirdsRatio.lower / thirdsSum) * 100)
      };
    }

    // Structure results for free vs premium
    const freeMetrics = skinResults.slice(0, 1); // Only first metric for free
    const premiumMetrics = skinResults; // All metrics for premium

    // Build skin_analysis object with mapped keys for the frontend
    const skinAnalysis: Record<string, number | undefined> = {};
    const displayMetrics = isPremium ? premiumMetrics : freeMetrics;
    
    for (const result of displayMetrics) {
      switch (result.type) {
        case 'wrinkle':
          skinAnalysis.wrinkle_score = result.ui_score;
          break;
        case 'pore':
          skinAnalysis.pores_score = result.ui_score;
          break;
        case 'texture':
          skinAnalysis.texture_score = result.ui_score;
          break;
        case 'dark_circle_v2':
          skinAnalysis.dark_circles_score = result.ui_score;
          break;
        case 'age_spot':
          skinAnalysis.spots_score = result.ui_score;
          break;
        case 'redness':
          skinAnalysis.redness_score = result.ui_score;
          break;
        case 'oiliness':
          skinAnalysis.oiliness_score = result.ui_score;
          break;
        case 'firmness':
          skinAnalysis.firmness_score = result.ui_score;
          break;
        case 'eye_bag':
          skinAnalysis.eye_bags_score = result.ui_score;
          break;
        case 'overall':
          skinAnalysis.overall_score = result.ui_score;
          break;
        case 'skin_age':
          skinAnalysis.skin_age = result.ui_score;
          break;
      }
    }

    // Get existing payload
    const { data: existingAnalysis } = await supabase
      .from('analyses')
      .select('raw_ai_payload')
      .eq('id', analysisId)
      .single();

    const existingPayload = (existingAnalysis?.raw_ai_payload as Record<string, unknown>) || {};

    const fullPayload = {
      ...existingPayload,
      perfect_corp: {
        analyzed_at: new Date().toISOString(),
        pre_analysis_success: preAnalysisSuccess,
        perfect_corp_success: perfectCorpSuccess,
        api_success: perfectCorpSuccess,
        selected_params: selectedParams,
        rationale: rationale,
        skin_analysis: skinAnalysis, // Structured for frontend
        skin_results: isPremium ? premiumMetrics : freeMetrics, // Raw results
        all_results: premiumMetrics, // Store all for upgrade scenario
        provider: perfectCorpSuccess ? 'perfect_corp' : 'lovable_ai_fallback'
      },
      facial_analysis: {
        symmetry_score: facialSymmetryScore,
        midline_deviation: facialMidlineDeviation,
        thirds_ratio: facialThirdsRatio,
        provider: 'lovable_ai'
      }
    };

    // Update analysis with results
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        facial_symmetry_score: facialSymmetryScore,
        facial_midline_deviation_mm: facialMidlineDeviation,
        facial_thirds_ratio: facialThirdsRatio,
        raw_ai_payload: fullPayload
      })
      .eq('id', analysisId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Analysis completed for ${analysisId}:`, {
      preAnalysis: preAnalysisSuccess,
      perfectCorp: perfectCorpSuccess,
      metricsCount: skinResults.length,
      mode: analysis.mode
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId,
        preAnalysisSuccess,
        perfectCorpSuccess,
        selectedParams,
        metricsCount: skinResults.length,
        mode: analysis.mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in run-facial-analysis-perfect:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
