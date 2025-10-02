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
    const { symptoms } = await req.json();

    if (!symptoms) {
      throw new Error("Symptoms are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a symptom analysis AI with MULTILINGUAL support. Analyze symptoms in ANY language provided.

LANGUAGE HANDLING:
- Respond in the SAME language as the patient's input
- If symptoms are in Hindi/Spanish/Arabic/etc., provide analysis in that language
- Maintain medical accuracy across all languages

OUTPUT STRUCTURE (follow exactly, translate section headers to patient's language):

**SEVERITY**: [🟢 Mild / 🟡 Moderate / 🔴 Severe / ⚠️ EMERGENCY]

**POSSIBLE CONDITIONS** (ranked by likelihood):
1. [Condition name] - [1-line explanation]
2. [Condition name] - [1-line explanation]
3. [Condition name] - [1-line explanation]

**RECOMMENDED SPECIALIST**: [Specialty] (e.g., General Practitioner, Cardiologist, Dermatologist)

**TIMEFRAME**: [See doctor within: 24 hours / This week / Can wait / NOW]

**RED FLAGS** (if any): [List emergency warning signs to watch for]

**SELF-CARE** (if mild): [2-3 specific actions]

---
⚠️ **DISCLAIMER**: This is an AI assessment, not a diagnosis. Consult a licensed doctor for medical advice.

REASONING APPROACH:
1. Detect patient's language from symptoms text
2. Consider symptom pattern, duration, and severity
3. Rule out emergencies first (chest pain → cardiac, severe headache → neurological)
4. Use probabilistic reasoning based on common presentations
5. Default to "seek medical care" when uncertain
6. RESPOND ENTIRELY in the patient's language

Be direct, evidence-based, culturally sensitive, and always err on the side of caution.`;

    console.log("Analyzing symptoms:", symptoms);

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
          { role: "user", content: `Patient symptoms: ${symptoms}` }
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
      throw new Error("Failed to analyze symptoms");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    console.log("Analysis complete");

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in symptom-checker:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
