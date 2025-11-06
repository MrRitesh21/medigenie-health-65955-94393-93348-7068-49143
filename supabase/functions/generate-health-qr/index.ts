import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expiryHours, maxUses } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Extract JWT from Authorization header and verify it
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized - Invalid session');
    }
    
    console.log('Authenticated user:', user.id);

    // Get patient ID
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      throw new Error('Patient profile not found');
    }

    // Generate secure random token
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiryHours || 24));

    // Create token record
    const { data: tokenData, error: tokenError } = await supabase
      .from('health_record_tokens')
      .insert({
        patient_id: patient.id,
        token,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses || null,
        is_active: true
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    // Generate QR code URL (using a public QR API)
    const qrData = JSON.stringify({
      token,
      type: 'health_record_access',
      expires: expiresAt.toISOString()
    });
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    return new Response(
      JSON.stringify({
        token,
        qrCodeUrl,
        expiresAt: expiresAt.toISOString(),
        maxUses: maxUses || null,
        tokenData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating QR:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate QR code' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});