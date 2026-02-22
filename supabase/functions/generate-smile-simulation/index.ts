import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractStoragePath(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl);
    // Path format: /storage/v1/object/sign/<bucket>/<path>
    const match = url.pathname.match(/\/storage\/v1\/object\/sign\/([^?]+)/);
    if (match) {
      const fullPath = match[1]; // e.g. "simetria-images/userId/file.jpg"
      // Remove bucket name prefix
      const parts = fullPath.split('/');
      return parts.slice(1).join('/'); // remove "simetria-images"
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
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

    // Download image directly from storage to avoid signed URL expiration issues
    let imageBase64: string;
    const storagePath = extractStoragePath(restImageUrl);
    
    if (storagePath) {
      console.log('Downloading image from storage path:', storagePath);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('simetria-images')
        .download(storagePath);
      
      if (downloadError || !fileData) {
        console.error('Storage download error:', downloadError);
        throw new Error('Failed to download source image from storage');
      }
      
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const mimeType = storagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      imageBase64 = `data:${mimeType};base64,${base64}`;
      console.log('Image downloaded and converted to base64, size:', base64.length);
    } else {
      // Fallback: try using the URL directly
      console.log('Could not extract storage path, using URL directly');
      imageBase64 = restImageUrl;
    }

    // Use Lovable AI to generate a smile simulation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transform this portrait photo to show the SAME person with a beautiful, natural, warm smile showing teeth. 

CRITICAL RULES:
- Keep the EXACT same person, face shape, skin tone, hair, lighting, background, clothing
- ONLY modify the mouth/lips area to create a natural smile
- The smile must show upper teeth naturally
- Make it look like a genuine, warm, confident smile - NOT artificial
- Maintain identical image quality, resolution, framing and composition
- Do NOT change eyes, nose, skin, or any other facial feature
- The result must be photorealistic and indistinguishable from a real photo`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    console.log('AI response status:', response.status);

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
      throw new Error(`AI generation failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('AI response keys:', Object.keys(data));
    
    // Try multiple response formats
    let generatedImageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageBase64) {
      // Try inline_data format
      const parts = data.choices?.[0]?.message?.content;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part.type === 'image_url' && part.image_url?.url) {
            generatedImageBase64 = part.image_url.url;
            break;
          }
          if (part.inline_data) {
            generatedImageBase64 = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }
      }
    }

    if (!generatedImageBase64) {
      console.error('No image in response. Response structure:', JSON.stringify(data).substring(0, 1000));
      throw new Error('No image generated by AI');
    }

    // Extract base64 data
    const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), (c: string) => c.charCodeAt(0));

    // Upload to storage
    const fileName = `smile-simulations/${analysisId}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('simetria-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to save generated image');
    }

    // Get signed URL (30 days)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('simetria-images')
      .createSignedUrl(fileName, 60 * 60 * 24 * 30);

    if (urlError || !urlData?.signedUrl) {
      console.error('URL generation error:', urlError);
      throw new Error('Failed to generate image URL');
    }

    const smileImageUrl = urlData.signedUrl;

    // Update analysis
    const { error: updateError } = await supabase
      .from('analyses')
      .update({ smile_simulation_url: smileImageUrl })
      .eq('id', analysisId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log(`Smile simulation generated successfully for ${analysisId}`);

    return new Response(
      JSON.stringify({ success: true, analysisId, smileImageUrl }),
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
