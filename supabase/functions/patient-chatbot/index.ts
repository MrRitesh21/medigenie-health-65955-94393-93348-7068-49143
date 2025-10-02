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
    const { message, history } = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical AI assistant. Follow these rules strictly:

RESPONSE FORMAT:
- Maximum 3 sentences unless complex explanation needed
- Use bullet points for lists
- Bold key medical terms using **term**

CORE PRINCIPLES:
1. NEVER diagnose - say "This could be [condition], but consult a doctor for diagnosis"
2. For emergencies (chest pain, severe bleeding, difficulty breathing): Immediately say "⚠️ SEEK EMERGENCY CARE NOW"
3. Use 8th-grade reading level - replace jargon with simple terms
4. Always cite action items: "Next step: [specific action]"

CONVERSATION FLOW:
- If symptom described → ask duration, severity (1-10), and triggers
- If medication asked → explain purpose, common side effects, and timing
- If procedure asked → explain why it's done, what to expect, recovery time

CONSTRAINTS:
- No speculation beyond general medical knowledge
- Acknowledge limitations: "I don't have access to your medical records"
- For follow-ups, reference previous context naturally

Be warm and reassuring while staying concise and actionable.`;

    console.log("Processing patient query");

    // Format conversation history
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history (last 10 messages to keep context manageable)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      messages.push(...recentHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })));
    }

    // Add current message
    messages.push({ role: "user", content: message });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
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
      throw new Error("Failed to get chatbot response");
    }

    const data = await response.json();
    const chatResponse = data.choices?.[0]?.message?.content;

    console.log("Chatbot response generated");

    return new Response(
      JSON.stringify({ response: chatResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in patient-chatbot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
