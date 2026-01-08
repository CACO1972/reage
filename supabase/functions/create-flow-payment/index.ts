import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_API_URL = 'https://www.flow.cl/api';
const PREMIUM_PRICE = 5990; // CLP

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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { returnUrl, analysisId } = await req.json();

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount: PREMIUM_PRICE,
        currency: 'CLP',
        payment_type: 'premium_analysis',
        status: 'pending',
        metadata: { analysis_id: analysisId }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      throw new Error('Error creating payment record');
    }

    // Prepare Flow payment data
    const commerceOrder = payment.id;
    const subject = 'Análisis Premium Simetría';
    const email = user.email || '';
    const urlConfirmation = `${supabaseUrl}/functions/v1/flow-webhook`;
    const urlReturn = returnUrl || `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/result/${analysisId}`;

    // Create signature for Flow
    const params: Record<string, string> = {
      apiKey: flowApiKey,
      commerceOrder,
      subject,
      currency: 'CLP',
      amount: PREMIUM_PRICE.toString(),
      email,
      urlConfirmation,
      urlReturn,
    };

    // Sort params alphabetically and create signature string
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys.map(key => `${key}${params[key]}`).join('');
    
    // Generate HMAC-SHA256 signature
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

    // Call Flow API to create payment
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    console.log('Creating Flow payment order...');
    
    const flowResponse = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const flowData = await flowResponse.json();
    console.log('Flow response:', JSON.stringify(flowData));

    if (!flowResponse.ok || flowData.code) {
      console.error('Flow API error:', flowData);
      throw new Error(flowData.message || 'Error creating Flow payment');
    }

    // Update payment with Flow token
    await supabase
      .from('payments')
      .update({
        flow_token: flowData.token,
        flow_order: flowData.flowOrder?.toString()
      })
      .eq('id', payment.id);

    // Return redirect URL
    const redirectUrl = `${flowData.url}?token=${flowData.token}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        redirectUrl,
        paymentId: payment.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});