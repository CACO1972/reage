import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const { prompt, duration } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Generating SFX:', { prompt, duration });

    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration || 5,
        prompt_influence: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // If the key lacks sound_generation permission, treat it as a non-fatal feature toggle.
      // Returning 204 avoids surfacing a 500 to the client/app while keeping behavior explicit.
      if (
        response.status === 401 &&
        (errorText.includes('missing_permissions') || errorText.includes('sound_generation'))
      ) {
        console.warn('ElevenLabs SFX disabled: missing sound_generation permission');
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      console.error('ElevenLabs SFX error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('SFX generated successfully, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating SFX:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
