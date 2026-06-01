import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_API_URL = "https://api.mercadopago.com";

// Dentalink API configuration
const DENTALINK_API_URL = "https://api.dentalink.healthatom.com/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mercadopagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const dentalinkToken = Deno.env.get("DENTALINK_TOKEN");
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log("Mercado Pago webhook received:", JSON.stringify(body));

    // Verify Mercado Pago webhook signature (HMAC SHA-256)
    if (webhookSecret) {
      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");

      if (!xSignature || !xRequestId) {
        console.error("Missing webhook signature headers");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let ts: string | undefined;
      let hash: string | undefined;
      for (const part of xSignature.split(",")) {
        const [k, v] = part.split("=").map((s) => s.trim());
        if (k === "ts") ts = v;
        if (k === "v1") hash = v;
      }

      const dataId = body.data?.id?.toString() || "";
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
      const computed = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (computed !== hash) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature verification");
    }

    // Handle different notification types
    if (body.type === "payment") {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get payment details from Mercado Pago
      const paymentResponse = await fetch(
        `${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`,
        {
          headers: {
            "Authorization": `Bearer ${mercadopagoToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        console.error("Failed to fetch payment details");
        throw new Error("Failed to fetch payment details");
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      const appointmentId = payment.external_reference;
      const status = payment.status;

      // Map Mercado Pago status to clinic_appointments.status values
      let appointmentStatus: string;
      switch (status) {
        case "approved":
          appointmentStatus = "paid";
          break;
        case "pending":
        case "in_process":
          appointmentStatus = "pending_payment";
          break;
        case "rejected":
        case "cancelled":
          appointmentStatus = "cancelled";
          break;
        default:
          appointmentStatus = "pending_payment";
      }

      // Update appointment in database
      const { data: appointment, error: updateError } = await supabase
        .from("clinic_appointments")
        .update({
          status: appointmentStatus,
          mercadopago_payment_id: paymentId.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating appointment:", updateError);
        throw new Error("Failed to update appointment");
      }

      console.log("Appointment updated:", appointment.id, "Status:", appointmentStatus);

      // If payment completed, create patient and appointment in Dentalink
      if (appointmentStatus === "paid" && dentalinkToken) {
        console.log("Payment completed, creating Dentalink records...");

        try {
          // Create patient in Dentalink
          const patientPayload = {
            nombre: appointment.patient_name.split(" ")[0],
            apellidos: appointment.patient_name.split(" ").slice(1).join(" ") || "",
            email: appointment.patient_email,
            telefono: appointment.patient_phone,
          };

          console.log("Creating Dentalink patient:", JSON.stringify(patientPayload));

          const patientResponse = await fetch(`${DENTALINK_API_URL}/pacientes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Token ${dentalinkToken}`,
            },
            body: JSON.stringify(patientPayload),
          });

          let dentalinkPatientId: string | null = null;

          if (patientResponse.ok) {
            const patientData = await patientResponse.json();
            dentalinkPatientId = patientData.data?.id?.toString();
            console.log("Dentalink patient created:", dentalinkPatientId);
          } else {
            const errorText = await patientResponse.text();
            console.log("Patient creation response:", errorText);
            // Patient might already exist, continue anyway
          }

          // Create appointment in Dentalink if we have a patient ID
          if (dentalinkPatientId && appointment.appointment_date) {
            const appointmentDate = new Date(appointment.appointment_date);
            
            const appointmentPayload = {
              id_paciente: parseInt(dentalinkPatientId),
              id_profesional: appointment.professional_id || 1,
              fecha: appointmentDate.toISOString().split("T")[0],
              hora_inicio: appointmentDate.toTimeString().slice(0, 5),
              duracion: 60, // 1 hour appointment
              estado: "confirmada",
              motivo: "Evaluación Presencial + Radiografía Panorámica (Simetría App)",
            };

            console.log("Creating Dentalink appointment:", JSON.stringify(appointmentPayload));

            const apptResponse = await fetch(`${DENTALINK_API_URL}/citas`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${dentalinkToken}`,
              },
              body: JSON.stringify(appointmentPayload),
            });

            if (apptResponse.ok) {
              const apptData = await apptResponse.json();
              const dentalinkAppointmentId = apptData.data?.id?.toString();
              console.log("Dentalink appointment created:", dentalinkAppointmentId);

              // Update our record with Dentalink IDs
              await supabase
                .from("clinic_appointments")
                .update({
                  dentalink_patient_id: dentalinkPatientId,
                  dentalink_appointment_id: dentalinkAppointmentId,
                })
                .eq("id", appointmentId);
            } else {
              const errorText = await apptResponse.text();
              console.error("Failed to create Dentalink appointment:", errorText);
            }
          }
        } catch (dentalinkError) {
          console.error("Dentalink integration error:", dentalinkError);
          // Don't fail the webhook, just log the error
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
