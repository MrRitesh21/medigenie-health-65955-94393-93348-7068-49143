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
    const { reportText, language } = await req.json();

    if (!reportText) {
      throw new Error("Report text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetLanguage = language === "hindi" ? "Hindi" : "English";
    
    const hindiTemplate = `
**KEY FINDINGS**:
1. [परीक्षण का नाम]:
   • आपका स्तर: [मान]
   • सामान्य सीमा: [सीमा]
   • स्थिति: 🟢 सामान्य / 🟡 थोड़ा ऊंचा-नीचा / 🔴 चिंताजनक
   • इसका मतलब: [सरल व्याख्या]

**SIMPLIFIED EXPLANATION**:
[सरल शब्दों में समझाएं कि ये परीक्षण क्यों किए गए और क्या पता चला]

**WHAT YOU SHOULD KNOW**:
• [महत्वपूर्ण जानकारी #1]
• [महत्वपूर्ण जानकारी #2]

**NEXT STEPS**:
[डॉक्टर से क्या पूछें या क्या करें]

---
⚠️ यह व्याख्या केवल समझने के लिए है। इलाज के लिए डॉक्टर से परामर्श करें।

TRANSLATION RULES:
1. Replace medical jargon: "leukocytes" → "सफेद रक्त कोशिकाएं (रोग से लड़ने वाली)"
2. Use analogies in Hindi
3. Contextualize numbers: "सामान्य 12-16 है, आपका 14 है - यह अच्छा है!"
4. Be reassuring when values are normal
5. For abnormal: Explain without alarming, suggest doctor consultation
6. Use emojis for quick visual understanding`;

    const englishTemplate = `
**KEY FINDINGS**:
1. [Test Name]:
   • Your level: [Value]
   • Normal range: [Range]
   • Status: 🟢 Normal / 🟡 Slightly off / 🔴 Concerning
   • What this means: [Simple explanation]

**SIMPLIFIED EXPLANATION**:
[Explain in plain language why these tests were done and what was found]

**WHAT YOU SHOULD KNOW**:
• [Practical insight #1]
• [Practical insight #2]

**NEXT STEPS**:
[What to ask your doctor or what to do next]

---
⚠️ This explanation is for understanding only. Consult your doctor for treatment.

TRANSLATION RULES:
1. Replace medical jargon: "leukocytes" → "white blood cells (infection fighters)"
2. Use analogies: "Hemoglobin carries oxygen like a delivery truck carries packages"
3. Contextualize numbers: "Normal is 12-16, yours is 14 - that's good!"
4. Be reassuring when values are normal
5. For abnormal: Explain without alarming, suggest doctor consultation
6. Use emojis for quick visual understanding`;

    const languageTemplate = language === "hindi" ? hindiTemplate : englishTemplate;
    
    const systemPrompt = `You are a medical report translator AI. Convert complex lab reports into ${targetLanguage} that an 8th grader can understand.

OUTPUT STRUCTURE:

**📊 YOUR REPORT SUMMARY**

**Tests Done**: [List in simple terms]

${languageTemplate}

Keep language conversational and empathetic.`;

    console.log("Simplifying medical report in", targetLanguage);

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
          { role: "user", content: `Please simplify this medical report:\n\n${reportText}` }
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
      throw new Error("Failed to simplify report");
    }

    const data = await response.json();
    const simplifiedReport = data.choices?.[0]?.message?.content;

    console.log("Simplification complete");

    return new Response(
      JSON.stringify({ simplifiedReport }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in report-simplifier:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
