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
    const ELIZAOS_AGENT_ID = Deno.env.get('ELIZAOS_AGENT_ID');

    if (!ELIZAOS_API_KEY) {
      console.error('ELIZAOS_API_KEY is not configured');
      throw new Error('ELIZAOS_API_KEY is not configured');
    }

    if (!ELIZAOS_AGENT_ID) {
      console.error('ELIZAOS_AGENT_ID is not configured');
      throw new Error('ELIZAOS_AGENT_ID is not configured');
    }

    console.log('API Key prefix:', ELIZAOS_API_KEY.substring(0, 10) + '...');
    console.log('Agent ID:', ELIZAOS_AGENT_ID);

    const { message, conversationHistory } = await req.json();
    console.log('Received message:', message);

    // Build OpenAI-compatible messages (Eliza Cloud is OpenAI chat-completions compatible)
    const messages = (conversationHistory ?? []).map(
      (msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      }),
    );

    // Add the new user message
    messages.push({ role: "user", content: message });

    // Eliza Cloud /chat endpoint expects `id` + `messages` as a JSON-string
    const upstreamBody = {
      id: ELIZAOS_AGENT_ID,
      messages: JSON.stringify(messages),
    };

    console.log(
      "Upstream body (preview):",
      JSON.stringify({
        id: upstreamBody.id,
        messages_preview: messages.map((m: { role: string; content: unknown }) => ({
          role: m.role,
          content: String(m.content).slice(0, 120),
        })),
      }),
    );

    const response = await fetch("https://elizacloud.ai/api/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
    });

    console.log('ElizaOS API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElizaOS API error:", response.status, errorText);

      // IMPORTANT: return 200 so the client receives a structured payload (Supabase invoke treats non-2xx as transport errors)
      const friendlyError =
        response.status === 401
          ? "Invalid API key - check your ELIZAOS_API_KEY"
          : response.status === 429
            ? "Rate limit exceeded"
            : "ElizaOS API error";

      return new Response(
        JSON.stringify({
          error: friendlyError,
          details: errorText,
          status: response.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    console.log('ElizaOS API response:', JSON.stringify(data).slice(0, 500));

    // Extract the assistant's reply - handle different response formats
    let reply = '';
    
    if (data.choices && data.choices[0]?.message?.content) {
      // OpenAI-compatible format
      reply = data.choices[0].message.content;
    } else if (data.content) {
      // Direct content format
      reply = data.content;
    } else if (data.text) {
      // Text format
      reply = data.text;
    } else if (data.message) {
      // Message format
      reply = data.message;
    } else if (typeof data === 'string') {
      // Plain string response
      reply = data;
    } else {
      console.log('Unknown response format, full data:', JSON.stringify(data));
      reply = JSON.stringify(data);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in elizaos-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
