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
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Unauthorized - Invalid session');
    }

    // Create service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get doctor ID
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (doctorError) {
      console.error('Doctor query error:', doctorError);
      throw new Error(`Database error: ${doctorError.message}`);
    }

    if (!doctor) {
      throw new Error('Doctor profile not found');
    }

    // Generate secure random token
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiryHours || 168)); // Default 7 days

    // Create token record
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('doctor_booking_tokens')
      .insert({
        doctor_id: doctor.id,
        token,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses || null,
        is_active: true
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    // Generate QR code URL
    const qrData = JSON.stringify({
      token,
      type: 'doctor_booking',
      doctor_id: doctor.id,
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
    console.error('Error generating doctor booking QR:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate QR code' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});