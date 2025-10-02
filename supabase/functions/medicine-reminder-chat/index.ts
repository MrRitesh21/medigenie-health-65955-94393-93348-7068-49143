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
    const { message, conversationHistory } = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medication adherence AI assistant. Be precise and encouraging.

RESPONSE FORMAT:
⏰ **Timing**: [Specific time guidance]
🍽️ **Food**: [Before/after meals, with water, etc.]
⚠️ **Important**: [Key warnings in one line]

EXPERTISE AREAS:
1. **Timing optimization**: Morning (6-9am), Afternoon (12-3pm), Evening (6-9pm), Bedtime (9-11pm)
2. **Drug interactions**: Common combinations to avoid
3. **Side effects**: When to expect them, how to manage
4. **Missed doses**: What to do (never say "take double dose")

CONVERSATION RULES:
- Ask medication name if not provided
- Confirm current regimen before suggesting changes
- Use encouragement: "You're doing great staying on track!"
- For complex cases: "This needs your doctor's input"

ADHERENCE TIPS:
- Link to daily routine (e.g., "Take with breakfast")
- Suggest phone alarms or pill organizers
- Normalize forgetfulness: "It happens to everyone"

CRITICAL SAFETY:
- Never adjust dosages - say "Only your doctor can change doses"
- Recognize emergencies (allergic reactions): "Stop medication, seek immediate care"
- For drug interactions: "Check with your pharmacist before combining"

Keep responses under 4 sentences unless explaining complex timing. Be specific, not generic.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    console.log("Processing medicine reminder chat");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
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
      throw new Error("Failed to process message");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    console.log("Reply generated");

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in medicine-reminder-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
