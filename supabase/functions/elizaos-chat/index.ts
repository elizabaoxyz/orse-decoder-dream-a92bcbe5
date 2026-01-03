import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELIZAOS_API_KEY = Deno.env.get('ELIZAOS_API_KEY');

    if (!ELIZAOS_API_KEY) {
      console.error('ELIZAOS_API_KEY is not configured');
      throw new Error('ELIZAOS_API_KEY is not configured');
    }

    console.log('API Key prefix:', ELIZAOS_API_KEY.substring(0, 10) + '...');

    const { message, conversationHistory } = await req.json();
    console.log('Received message:', message);

    type HistoryMsg = { role: string; content: string };
    type PartsMsg = { role: string; parts: { type: "text"; text: string }[] };

    const history: HistoryMsg[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    // Build messages in the Eliza Cloud format (Vercel AI SDK style)
    const partsMessages: PartsMsg[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ type: "text", text: msg.content }],
    }));
    partsMessages.push({ role: "user", parts: [{ type: "text", text: message }] });

    console.log("History length:", history.length, "last user message:", String(message).slice(0, 80));
    console.log("Formatted messages:", JSON.stringify(partsMessages).slice(0, 500));

    // Use the correct Eliza Cloud Chat API format
    const requestBody = {
      messages: JSON.stringify(partsMessages),
      id: "gpt-4o" // Model ID as shown in their API docs
    };

    console.log("Request URL: https://www.elizacloud.ai/api/v1/chat");
    console.log("Request body:", JSON.stringify(requestBody));

    const resp = await fetch("https://www.elizacloud.ai/api/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const respText = await resp.text();
    console.log("Response status:", resp.status);
    console.log("Response body:", respText.slice(0, 500));

    if (!resp.ok) {
      if (resp.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Invalid API key - check your ELIZAOS_API_KEY",
            details: respText,
            status: resp.status,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            details: respText,
            status: resp.status,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          error: "Eliza Cloud API error",
          details: respText,
          status: resp.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse response
    let data: unknown;
    try {
      data = JSON.parse(respText);
    } catch {
      data = respText;
    }

    const extractReply = (payload: unknown): string => {
      if (typeof payload === "string") return payload;
      if (payload === null || payload === undefined) return "";
      if (typeof payload !== "object") return String(payload);

      const p = payload as Record<string, any>;

      // OpenAI compatible format
      if (p.choices?.[0]?.message?.content) return String(p.choices[0].message.content);
      if (p.choices?.[0]?.delta?.content) return String(p.choices[0].delta.content);

      // Common simple formats
      if (p.reply) return String(p.reply);
      if (p.content) return String(p.content);
      if (p.text) return String(p.text);
      if (p.message) return String(p.message);
      if (p.response) return String(p.response);

      return JSON.stringify(p);
    };

    const reply = extractReply(data);
    console.log("Extracted reply:", reply.slice(0, 200));

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in elizaos-chat function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
