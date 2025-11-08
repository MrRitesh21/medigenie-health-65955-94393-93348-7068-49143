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
    const { token } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current doctor
    const anonSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get or create doctor profile
    let { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (doctorError) {
      console.error('Error fetching doctor profile:', doctorError);
      throw new Error('Failed to fetch doctor profile');
    }

    if (!doctor) {
      console.log('Doctor profile not found, creating one...');
      // Auto-create doctor profile
      const { data: newDoctor, error: createError } = await supabase
        .from('doctors')
        .insert({
          user_id: user.id,
          specialization: 'General Practitioner',
          qualification: 'MBBS',
          clinic_name: 'Clinic',
          clinic_address: 'Address not set',
          license_number: 'TEMP-' + user.id.substring(0, 8)
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating doctor profile:', createError);
        throw new Error('Failed to create doctor profile');
      }

      doctor = newDoctor;
      console.log('Doctor profile created successfully');
    }

    // Validate token and increment usage
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_and_use_token', {
        p_token: token,
        p_doctor_id: doctor.id
      });

    if (validationError) {
      console.error('Token validation error:', validationError);
      throw validationError;
    }

    const validationResult = validation[0];
    if (!validationResult.is_valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: validationResult.message 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch patient health records
    const patientId = validationResult.patient_id;
    
    // Get patient basic info
    const { data: patient, error: patientInfoError } = await supabase
      .from('patients')
      .select(`
        *,
        profiles!patients_user_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', patientId)
      .single();

    if (patientInfoError) {
      console.error('Error fetching patient info:', patientInfoError);
      throw patientInfoError;
    }

    // Get appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!appointments_doctor_id_fkey (
          specialization,
          clinic_name,
          profiles!doctors_user_id_fkey (
            full_name
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .limit(10);

    // Get prescriptions
    const { data: prescriptions, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctors!prescriptions_doctor_id_fkey (
          specialization,
          profiles!doctors_user_id_fkey (
            full_name
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Access granted',
        patient: {
          full_name: patient.profiles?.full_name,
          email: patient.profiles?.email,
          phone: patient.profiles?.phone,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          blood_group: patient.blood_group,
          address: patient.address,
          medical_conditions: patient.medical_conditions,
          allergies: patient.allergies,
          emergency_contact: patient.emergency_contact
        },
        appointments: appointments || [],
        prescriptions: prescriptions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error accessing records:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to access health records' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});