import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_API_URL = "https://api.mercadopago.com";
const APPOINTMENT_PRICE = 39200; // CLP

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mercadopagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!mercadopagoToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const body = await req.json();
    const { 
      patientName, 
      patientEmail, 
      patientPhone, 
      doctorId, 
      doctorName,
      appointmentDate,
      returnUrl 
    } = body;

    if (!patientName || !patientEmail || !patientPhone || !doctorId || !appointmentDate) {
      throw new Error("Missing required fields");
    }

    // Create appointment record in Supabase
    const { data: appointment, error: appointmentError } = await supabase
      .from("clinic_appointments")
      .insert({
        user_id: user.id,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        doctor_id: doctorId,
        doctor_name: doctorName,
        appointment_date: appointmentDate,
        payment_status: "pending",
        amount: APPOINTMENT_PRICE,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error("Error creating appointment:", appointmentError);
      throw new Error("Failed to create appointment record");
    }

    console.log("Created appointment:", appointment.id);

    // Create Mercado Pago preference with 3 interest-free installments
    const preference = {
      items: [
        {
          id: appointment.id,
          title: "Evaluación Presencial - Clínica Miro",
          description: `Evaluación con ${doctorName || 'especialista'} + Radiografía Panorámica`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: APPOINTMENT_PRICE,
        },
      ],
      payer: {
        name: patientName.split(" ")[0],
        surname: patientName.split(" ").slice(1).join(" ") || patientName,
        email: patientEmail,
        phone: {
          number: patientPhone,
        },
      },
      payment_methods: {
        installments: 3,
        default_installments: 3,
      },
      back_urls: {
        success: `${returnUrl}?status=approved&appointment_id=${appointment.id}`,
        failure: `${returnUrl}?status=rejected&appointment_id=${appointment.id}`,
        pending: `${returnUrl}?status=pending&appointment_id=${appointment.id}`,
      },
      auto_return: "approved",
      external_reference: appointment.id,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "CLINICA MIRO",
    };

    console.log("Creating Mercado Pago preference...");

    const mpResponse = await fetch(`${MERCADOPAGO_API_URL}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mercadopagoToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago error:", errorText);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();
    console.log("Mercado Pago preference created:", mpData.id);

    // Update appointment with Mercado Pago preference ID
    await supabase
      .from("clinic_appointments")
      .update({ 
        mercadopago_preference_id: mpData.id,
      })
      .eq("id", appointment.id);

    return new Response(
      JSON.stringify({
        success: true,
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        appointmentId: appointment.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-clinic-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
