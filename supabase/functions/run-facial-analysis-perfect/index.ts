import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkinAnalysisResult {
  overall_score: number;
  wrinkle_score: number;
  spots_score: number;
  texture_score: number;
  dark_circles_score: number;
  redness_score: number;
  pores_score: number;
  oiliness_score: number;
  skin_age: number;
}

interface FacialAnalysisResult {
  symmetry_score: number;
  midline_deviation: number;
  thirds_ratio: { upper: number; middle: number; lower: number };
  face_shape: string;
  eye_distance_ratio: number;
  nose_ratio: number;
  lip_ratio: number;
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch analysis
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, frontal_smile_url, frontal_rest_url')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Analysis not found');
    }

    console.log(`Processing comprehensive facial analysis for ${analysisId}`);

    const imageUrl = analysis.frontal_rest_url || analysis.frontal_smile_url;
    
    if (!imageUrl) {
      throw new Error('No image URL available for analysis');
    }

    let facialSymmetryScore = 85;
    let facialMidlineDeviation = 1.0;
    let facialThirdsRatio = { upper: 33, middle: 33, lower: 34 };
    let skinAnalysisData: SkinAnalysisResult | null = null;
    let facialAnalysisData: FacialAnalysisResult | null = null;
    let apiSuccess = false;

    if (lovableApiKey) {
      try {
        console.log('Running comprehensive AI analysis with Lovable AI...');
        
        // Combined facial structure + skin analysis using Gemini
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    text: `You are a professional dermatologist and facial aesthetics expert. Analyze this facial photo comprehensively.

Return ONLY valid JSON with these exact fields:

{
  "facial_analysis": {
    "symmetry_score": <70-100, measure bilateral facial symmetry>,
    "midline_deviation": <0-5 mm, deviation of facial midline>,
    "thirds_ratio": {
      "upper": <25-40, forehead to brow percentage>,
      "middle": <25-40, brow to nose base percentage>,
      "lower": <25-40, nose base to chin percentage>
    },
    "face_shape": "<oval|round|square|heart|oblong>",
    "eye_distance_ratio": <0.3-0.5, interpupillary distance ratio>,
    "nose_ratio": <0.2-0.4, nose width to face width>,
    "lip_ratio": <0.3-0.5, lip width to face width>
  },
  "skin_analysis": {
    "overall_score": <60-100, overall skin health>,
    "wrinkle_score": <60-100, lower means more wrinkles>,
    "spots_score": <60-100, lower means more spots/pigmentation>,
    "texture_score": <60-100, skin texture smoothness>,
    "dark_circles_score": <60-100, lower means more dark circles>,
    "redness_score": <60-100, lower means more redness>,
    "pores_score": <60-100, lower means more visible pores>,
    "oiliness_score": <60-100, balance score>,
    "skin_age": <estimated biological skin age in years>
  }
}

Be clinically accurate. The thirds must sum to approximately 100.
Consider lighting conditions and image quality in your assessment.`
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

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              
              // Extract facial analysis
              if (parsed.facial_analysis) {
                facialAnalysisData = {
                  symmetry_score: parsed.facial_analysis.symmetry_score ?? 85,
                  midline_deviation: parsed.facial_analysis.midline_deviation ?? 1,
                  thirds_ratio: parsed.facial_analysis.thirds_ratio ?? { upper: 33, middle: 33, lower: 34 },
                  face_shape: parsed.facial_analysis.face_shape ?? 'oval',
                  eye_distance_ratio: parsed.facial_analysis.eye_distance_ratio ?? 0.4,
                  nose_ratio: parsed.facial_analysis.nose_ratio ?? 0.3,
                  lip_ratio: parsed.facial_analysis.lip_ratio ?? 0.35
                };
                
                facialSymmetryScore = facialAnalysisData.symmetry_score;
                facialMidlineDeviation = facialAnalysisData.midline_deviation;
                facialThirdsRatio = facialAnalysisData.thirds_ratio;
                
                console.log('Facial analysis extracted:', facialAnalysisData);
              }
              
              // Extract skin analysis
              if (parsed.skin_analysis) {
                skinAnalysisData = {
                  overall_score: parsed.skin_analysis.overall_score ?? 75,
                  wrinkle_score: parsed.skin_analysis.wrinkle_score ?? 80,
                  spots_score: parsed.skin_analysis.spots_score ?? 85,
                  texture_score: parsed.skin_analysis.texture_score ?? 78,
                  dark_circles_score: parsed.skin_analysis.dark_circles_score ?? 70,
                  redness_score: parsed.skin_analysis.redness_score ?? 82,
                  pores_score: parsed.skin_analysis.pores_score ?? 75,
                  oiliness_score: parsed.skin_analysis.oiliness_score ?? 80,
                  skin_age: parsed.skin_analysis.skin_age ?? 35
                };
                
                console.log('Skin analysis extracted:', skinAnalysisData);
              }
              
              apiSuccess = true;
              console.log('AI analysis completed successfully');
              
            } catch (parseErr) {
              console.error('Failed to parse AI response:', parseErr);
            }
          }
        } else {
          console.error('AI API request failed:', aiResponse.status);
        }
      } catch (apiError) {
        console.error('AI API error:', apiError);
      }
    } else {
      console.warn('LOVABLE_API_KEY not configured');
    }

    // Normalize thirds to sum to 100
    const thirdsSum = facialThirdsRatio.upper + facialThirdsRatio.middle + facialThirdsRatio.lower;
    if (thirdsSum > 0) {
      facialThirdsRatio = {
        upper: (facialThirdsRatio.upper / thirdsSum) * 100,
        middle: (facialThirdsRatio.middle / thirdsSum) * 100,
        lower: (facialThirdsRatio.lower / thirdsSum) * 100
      };
    }

    // Build comprehensive raw payload
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
        api_success: apiSuccess,
        skin_analysis: skinAnalysisData,
        facial_analysis: facialAnalysisData,
        provider: 'lovable_ai_gemini'
      }
    };

    // Update analysis with comprehensive results
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

    console.log(`Comprehensive facial analysis completed for ${analysisId}, API success: ${apiSuccess}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId,
        apiSuccess,
        skinAnalysis: skinAnalysisData !== null,
        facialAnalysis: facialAnalysisData !== null
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
