import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_API_URL = 'https://www.flow.cl/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const flowApiKey = Deno.env.get('FLOW_API_KEY')!;
    const flowSecretKey = Deno.env.get('FLOW_SECRET_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse form data from webhook
    const formData = await req.formData();
    const token = formData.get('token') as string;

    if (!token) {
      console.error('No token in webhook');
      throw new Error('No token provided');
    }

    console.log('Processing webhook for token:', token);

    // Get payment status from Flow
    const params: Record<string, string> = {
      apiKey: flowApiKey,
      token,
    };

    // Create signature
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys.map(key => `${key}${params[key]}`).join('');
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(flowSecretKey);
    const messageData = encoder.encode(signatureString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    params.s = signatureHex;

    const queryString = new URLSearchParams(params).toString();
    const flowResponse = await fetch(`${FLOW_API_URL}/payment/getStatus?${queryString}`);
    const paymentStatus = await flowResponse.json();

    console.log('Flow payment status:', JSON.stringify(paymentStatus));

    if (!flowResponse.ok || paymentStatus.code) {
      console.error('Flow status error:', paymentStatus);
      throw new Error(paymentStatus.message || 'Error getting payment status');
    }

    // Find payment by token
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('flow_token', token)
      .single();

    if (findError || !payment) {
      console.error('Payment not found:', findError);
      throw new Error('Payment not found');
    }

    // Map Flow status to our status
    // Flow statuses: 1=pending, 2=paid, 3=rejected, 4=cancelled
    let newStatus = 'pending';
    if (paymentStatus.status === 2) {
      newStatus = 'completed';
    } else if (paymentStatus.status === 3) {
      newStatus = 'rejected';
    } else if (paymentStatus.status === 4) {
      newStatus = 'cancelled';
    }

    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        status: newStatus,
        flow_order: paymentStatus.flowOrder?.toString()
      })
      .eq('id', payment.id);

    console.log(`Payment ${payment.id} updated to status: ${newStatus}`);

    // If payment completed, grant premium benefits
    if (newStatus === 'completed') {
      // Add premium credit
      const { error: creditError } = await supabase.rpc('increment_credits', {
        p_user_id: payment.user_id,
        p_premium: 1,
        p_basic: 1 // Bonus basic analysis
      });

      if (creditError) {
        // Fallback: direct update
        console.log('RPC failed, using direct update');
        await supabase
          .from('profiles')
          .update({ 
            premium_credits: supabase.rpc('add_one', { current: 'premium_credits' }),
            basic_credits: supabase.rpc('add_one', { current: 'basic_credits' })
          })
          .eq('id', payment.user_id);
      }

      // Generate Clínica Miro coupon
      const couponCode = `MIRO25-${payment.id.substring(0, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 months validity

      await supabase
        .from('user_coupons')
        .insert({
          user_id: payment.user_id,
          coupon_code: couponCode,
          coupon_type: 'clinica_miro_25',
          discount_percent: 25,
          original_value: 49000,
          expires_at: expiresAt.toISOString()
        });

      console.log(`Generated coupon ${couponCode} for user ${payment.user_id}`);

      // If there's an analysis_id in metadata, upgrade it to premium
      const analysisId = payment.metadata?.analysis_id;
      if (analysisId) {
        await supabase
          .from('analyses')
          .update({ mode: 'premium' })
          .eq('id', analysisId);
        
        // Trigger 3D model generation
        await supabase.functions.invoke('create-3d-model', {
          body: { analysisId }
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});