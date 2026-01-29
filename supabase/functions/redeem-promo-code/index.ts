import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RedeemRequest {
  code: string;
  analysisId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado. Inicia sesión primero." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to get their ID
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("[RedeemPromo] Auth error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Sesión inválida. Vuelve a iniciar sesión." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code, analysisId }: RedeemRequest = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    console.log(`[RedeemPromo] User ${user.id} attempting to redeem code: ${cleanCode}`);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find the promo code
    const { data: promoCode, error: codeError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .single();

    if (codeError || !promoCode) {
      console.log("[RedeemPromo] Code not found or inactive:", cleanCode);
      return new Response(
        JSON.stringify({ success: false, error: "Código no válido o expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      console.log("[RedeemPromo] Code expired:", cleanCode);
      return new Response(
        JSON.stringify({ success: false, error: "Este código ha expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if max uses reached
    if (promoCode.times_used >= promoCode.max_uses) {
      console.log("[RedeemPromo] Code max uses reached:", cleanCode);
      return new Response(
        JSON.stringify({ success: false, error: "Este código ya alcanzó su límite de uso" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Check if user already redeemed this code
    const { data: existingRedemption } = await supabase
      .from("promo_code_redemptions")
      .select("id")
      .eq("promo_code_id", promoCode.id)
      .eq("user_id", user.id)
      .single();

    if (existingRedemption) {
      console.log("[RedeemPromo] User already redeemed this code");
      return new Response(
        JSON.stringify({ success: false, error: "Ya has usado este código anteriormente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create redemption record
    const { error: redemptionError } = await supabase
      .from("promo_code_redemptions")
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id,
        analysis_id: analysisId || null,
      });

    if (redemptionError) {
      console.error("[RedeemPromo] Failed to create redemption:", redemptionError);
      return new Response(
        JSON.stringify({ success: false, error: "Error al procesar el código" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Increment times_used
    const { error: updateError } = await supabase
      .from("promo_codes")
      .update({ times_used: promoCode.times_used + 1 })
      .eq("id", promoCode.id);

    if (updateError) {
      console.error("[RedeemPromo] Failed to update times_used:", updateError);
    }

    // 7. Apply benefit based on type
    if (promoCode.benefit_type === "premium_report") {
      // Add 1 premium credit to user's profile
      const { error: creditError } = await supabase.rpc("increment_credits", {
        p_user_id: user.id,
        p_premium: 1,
        p_basic: 0,
      });

      if (creditError) {
        console.error("[RedeemPromo] Failed to add credits:", creditError);
        return new Response(
          JSON.stringify({ success: false, error: "Error al aplicar el beneficio" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[RedeemPromo] Success! Added 1 premium credit to user ${user.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "¡Código canjeado exitosamente! Tu informe premium está desbloqueado.",
        benefitType: promoCode.benefit_type,
        description: promoCode.description,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[RedeemPromo] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
