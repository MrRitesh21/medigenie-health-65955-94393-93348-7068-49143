import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosis, symptoms, patientAge, allergies } = await req.json();

    if (!diagnosis || !symptoms) {
      throw new Error("Diagnosis and symptoms are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a prescription generation AI for doctors. Generate evidence-based, safe medication plans.

OUTPUT FORMAT (must follow exactly):

**PRESCRIPTION**

📋 **Primary Medications**:
1. [Drug Name] [Dose] - [Route] - [Frequency] - [Duration]
   • Purpose: [One line explanation]
   • Take: [Specific timing, e.g., "With breakfast and dinner"]

2. [Drug Name] [Dose] - [Route] - [Frequency] - [Duration]
   • Purpose: [One line]
   • Take: [Specific timing]

💊 **Supportive/Adjunct** (if needed):
- [Medication for symptom relief, e.g., antiemetics, analgesics]

⚠️ **SAFETY CHECKS**:
${allergies ? `✓ Verified: No cross-reactivity with ${allergies}` : '⚠️ No allergy information provided - verify before prescribing'}
${patientAge ? `✓ Dosing adjusted for age ${patientAge}` : '⚠️ Age-specific dosing not verified'}
• Drug interactions: [List if any, or state "None identified"]
• Contraindications to verify: [List 2-3 key ones]

📅 **Follow-up**: [Specific timeframe, e.g., "Re-evaluate in 7 days" or "Return if no improvement in 48 hours"]

🚨 **Red Flags** (tell patient to return if):
- [Symptom indicating treatment failure]
- [Symptom indicating adverse reaction]

---
**DISCLAIMER**: AI-suggested prescription. Doctor must verify dosing, contraindications, and interactions before issuing.

REASONING RULES:
1. Use evidence-based first-line treatments
2. Prefer generic names over brand names
3. Consider patient age for dosing (pediatric/geriatric adjustments)
4. Flag potential drug-allergy cross-reactions
5. Include rationale for each medication
6. Keep regimen simple (prefer once/twice daily when possible)
7. Specify duration to prevent antibiotic resistance or chronic overuse

Be conservative, specific, and always include safety warnings.`;

    const patientInfo = `
    Diagnosis: ${diagnosis}
    Symptoms: ${symptoms}
    ${patientAge ? `Patient Age: ${patientAge} years` : ''}
    ${allergies ? `Known Allergies: ${allergies}` : 'No known allergies reported'}
    `;

    console.log("Generating prescription for:", diagnosis);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please suggest a prescription for:\n${patientInfo}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate prescription");
    }

    const data = await response.json();
    const prescription = data.choices?.[0]?.message?.content;

    console.log("Prescription generated successfully");

    return new Response(
      JSON.stringify({ prescription }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in prescription-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});