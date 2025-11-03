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
    const { symptoms, specialization, patientLocation, maxDistance } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch verified doctors with ratings
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select(`
        *,
        doctor_ratings_summary (
          average_rating,
          total_ratings
        ),
        profiles!doctors_user_id_fkey (
          full_name,
          phone
        )
      `)
      .eq('is_verified', true);

    if (doctorsError) throw doctorsError;

    // Filter by specialization if provided
    let filteredDoctors = doctors;
    if (specialization) {
      filteredDoctors = doctors.filter(d => 
        d.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
    }

    // Calculate distance and filter if location provided
    if (patientLocation?.latitude && patientLocation?.longitude) {
      filteredDoctors = filteredDoctors.map(doctor => {
        if (doctor.latitude && doctor.longitude) {
          const distance = calculateDistance(
            patientLocation.latitude,
            patientLocation.longitude,
            parseFloat(doctor.latitude),
            parseFloat(doctor.longitude)
          );
          return { ...doctor, distance };
        }
        return { ...doctor, distance: null };
      }).filter(d => !maxDistance || (d.distance && d.distance <= maxDistance));
    }

    // Use AI to analyze and rank doctors
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const systemPrompt = `You are a medical matching AI assistant. Analyze patient symptoms and doctor profiles to recommend the top 3 best-fit doctors.

Consider:
1. Specialization match with symptoms
2. Doctor experience and qualifications
3. Patient ratings and reviews
4. Distance from patient
5. Consultation fees

Return ONLY a JSON array of the top 3 doctor IDs in order of best match, with reasoning for each.
Format: [{"doctor_id": "uuid", "match_score": 0-100, "reasoning": "brief explanation"}]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Patient Symptoms: ${symptoms}\n\nAvailable Doctors:\n${JSON.stringify(filteredDoctors.map(d => ({
              id: d.id,
              name: d.profiles?.full_name,
              specialization: d.specialization,
              experience_years: d.experience_years,
              consultation_fee: d.consultation_fee,
              average_rating: d.doctor_ratings_summary?.[0]?.average_rating || 0,
              total_ratings: d.doctor_ratings_summary?.[0]?.total_ratings || 0,
              distance: d.distance,
              bio: d.bio
            })), null, 2)}` 
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error('AI matching failed');
    }

    const aiData = await aiResponse.json();
    const aiRecommendations = JSON.parse(
      aiData.choices[0].message.content.replace(/```json\n?|\n?```/g, '')
    );

    // Build final response with full doctor details
    const recommendations = aiRecommendations.map((rec: any) => {
      const doctor = filteredDoctors.find(d => d.id === rec.doctor_id);
      return {
        ...doctor,
        match_score: rec.match_score,
        match_reasoning: rec.reasoning,
        full_name: doctor?.profiles?.full_name,
        average_rating: doctor?.doctor_ratings_summary?.[0]?.average_rating || 0,
        total_ratings: doctor?.doctor_ratings_summary?.[0]?.total_ratings || 0
      };
    });

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in smart-doctor-matching:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}