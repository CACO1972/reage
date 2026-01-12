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
    const { analysisId, restImageUrl } = await req.json();
    
    if (!analysisId || !restImageUrl) {
      throw new Error('analysisId and restImageUrl are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Generating smile simulation for analysis ${analysisId}`);

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to generate a smile simulation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transform this portrait photo to show the person with a natural, warm, and genuine smile. Keep the exact same person, lighting, background, and all facial features identical. Only change the mouth area to show a beautiful, natural smile with visible teeth. The smile should look authentic and not artificial. Maintain perfect image quality and resolution."
              },
              {
                type: "image_url",
                image_url: {
                  url: restImageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const generatedImageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageBase64) {
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated');
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `smile-simulation-${analysisId}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('analysis-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to save generated image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('analysis-images')
      .getPublicUrl(fileName);

    const smileImageUrl = urlData.publicUrl;

    // Update analysis with smile simulation URL
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        frontal_smile_url: smileImageUrl
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log(`Smile simulation generated successfully for ${analysisId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId,
        smileImageUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-smile-simulation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});