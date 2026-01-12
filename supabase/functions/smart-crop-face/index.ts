// Smart Crop Face - AI-powered image adaptation for facial analysis

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CropResult {
  success: boolean;
  croppedImageBase64?: string;
  message?: string;
  wasAdapted: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl } = await req.json();
    
    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, message: "Se requiere imageBase64 o imageUrl" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, message: "API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Prepare image for analysis
    const imageContent = imageUrl 
      ? { type: "image_url", image_url: { url: imageUrl } }
      : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

    // Step 1: Analyze if the image needs adaptation
    console.log("[SmartCrop] Analyzing image for face framing...");
    
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
                text: `Analyze this image for facial analysis suitability. Respond in JSON format ONLY:
{
  "hasFace": true/false,
  "isFrontal": true/false,
  "isWellFramed": true/false,
  "needsCropping": true/false,
  "faceVisible": "full" | "partial" | "none",
  "issues": ["list of issues if any"],
  "suggestion": "brief suggestion to fix"
}

Consider these criteria:
- Face should be clearly visible and frontal
- Face should occupy 40-80% of the image height
- Face should be centered
- No heavy obstructions (sunglasses OK to mention but still process)
- Can be portrait or selfie orientation`
              },
              imageContent
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!analysisResponse.ok) {
      console.error("[SmartCrop] Analysis API failed:", analysisResponse.status);
      // Return original image if analysis fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          wasAdapted: false, 
          message: "Imagen aceptada sin modificaciones" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices?.[0]?.message?.content || "";
    
    console.log("[SmartCrop] Analysis result:", analysisText);

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.warn("[SmartCrop] Could not parse analysis JSON, using defaults");
      analysis = { hasFace: true, needsCropping: false, isWellFramed: true };
    }

    // If no face detected, return error
    if (!analysis?.hasFace || analysis?.faceVisible === "none") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          wasAdapted: false,
          message: "No se detectó un rostro en la imagen. Por favor sube una foto donde tu cara sea claramente visible." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If image is already well-framed, return success without modification
    if (analysis?.isWellFramed && !analysis?.needsCropping) {
      console.log("[SmartCrop] Image is already well-framed");
      return new Response(
        JSON.stringify({ 
          success: true, 
          wasAdapted: false, 
          message: "Imagen aceptada" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Use AI to generate a properly cropped version
    console.log("[SmartCrop] Adapting image to focus on face...");
    
    const editResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
                text: `Crop and reframe this image to create a professional portrait photo for facial analysis:
- Center the face in the frame
- Face should occupy approximately 60-70% of the image height
- Include from hairline/forehead to chin, with some space above
- Maintain the 3:4 portrait aspect ratio
- Keep natural lighting and colors
- Do not add any filters, effects, or modifications to the face itself
- Simply reframe/crop to focus on the face

Output a clean, professional portrait crop.`
              },
              imageContent
            ]
          }
        ],
        modalities: ["image", "text"],
        max_tokens: 500
      })
    });

    if (!editResponse.ok) {
      console.error("[SmartCrop] Edit API failed:", editResponse.status);
      // Return success anyway - better to use original than block the user
      return new Response(
        JSON.stringify({ 
          success: true, 
          wasAdapted: false, 
          message: "Imagen aceptada (procesamiento alternativo)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const editData = await editResponse.json();
    const editedImage = editData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (editedImage) {
      // Extract base64 from data URL
      const base64Match = editedImage.match(/base64,(.+)/);
      const croppedBase64 = base64Match ? base64Match[1] : null;

      if (croppedBase64) {
        console.log("[SmartCrop] Successfully adapted image");
        return new Response(
          JSON.stringify({ 
            success: true, 
            wasAdapted: true,
            croppedImageBase64: croppedBase64,
            message: "Imagen adaptada automáticamente para análisis óptimo" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If edit failed, still accept the original
    console.log("[SmartCrop] Edit did not return image, using original");
    return new Response(
      JSON.stringify({ 
        success: true, 
        wasAdapted: false, 
        message: "Imagen aceptada" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[SmartCrop] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        wasAdapted: false,
        message: "Error al procesar imagen" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});