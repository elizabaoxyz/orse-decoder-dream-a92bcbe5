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

    console.log('API Key prefix:', ELIZAOS_API_KEY.substring(0, 10) + '...');
    console.log('Agent ID (if set):', ELIZAOS_AGENT_ID ?? '(not set)');

    const { message, conversationHistory } = await req.json();
    console.log('Received message:', message);

    type HistoryMsg = { role: string; content: string };
    type PartsMsg = { role: string; parts: { type: "text"; text: string }[] };

    const history: HistoryMsg[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    // Build messages in the Eliza Cloud format (Vercel AI SDK style)
    const partsMessages: PartsMsg[] = history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((msg) => ({
        role: msg.role,
        parts: [{ type: "text", text: msg.content }],
      }));
    partsMessages.push({ role: "user", parts: [{ type: "text", text: message }] });

    console.log("History length:", history.length, "last user message:", String(message).slice(0, 80));
    console.log("Formatted messages preview:", JSON.stringify(partsMessages).slice(0, 500));

    const url = "https://www.elizacloud.ai/api/v1/chat";

    const messagesStr = JSON.stringify(partsMessages);

    const candidates: Array<{ name: string; body: Record<string, unknown> }> = [];

    // 1) Try agent-style (older ElizaOS integration patterns)
    if (ELIZAOS_AGENT_ID) {
      candidates.push(
        { name: "agent_id_messages_string", body: { messages: messagesStr, id: ELIZAOS_AGENT_ID } },
        { name: "agent_id_messages_array", body: { messages: partsMessages, id: ELIZAOS_AGENT_ID } },
        { name: "agentId_field_messages_string", body: { messages: messagesStr, agentId: ELIZAOS_AGENT_ID } },
        { name: "agentId_field_messages_array", body: { messages: partsMessages, agentId: ELIZAOS_AGENT_ID } },
      );
    }

    // 2) Try model-style (as shown in API Explorer examples)
    candidates.push(
      { name: "model_id_messages_string", body: { messages: messagesStr, id: "gpt-4o" } },
      { name: "model_id_messages_array", body: { messages: partsMessages, id: "gpt-4o" } },
      { name: "model_field_messages_string", body: { messages: messagesStr, model: "gpt-4o" } },
      { name: "model_field_messages_array", body: { messages: partsMessages, model: "gpt-4o" } },
    );

    let lastErr: { status: number; text: string; attempt: string } | null = null;
    let data: unknown = null;

    for (const c of candidates) {
      console.log("Upstream attempt:", c.name);
      console.log("Request URL:", url);
      console.log("Request body preview:", JSON.stringify(c.body).slice(0, 700));

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ELIZAOS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(c.body),
      });

      const respText = await resp.text();
      console.log("Response status:", c.name, resp.status);
      console.log("Response body preview:", respText.slice(0, 500));

      if (resp.ok) {
        try {
          data = JSON.parse(respText);
        } catch {
          data = respText;
        }
        break;
      }

      if (resp.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Invalid API key - check your ELIZAOS_API_KEY",
            details: respText,
            status: resp.status,
            attempt: c.name,
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
            attempt: c.name,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      lastErr = { status: resp.status, text: respText, attempt: c.name };
    }

    if (data === null) {
      return new Response(
        JSON.stringify({
          error: "Eliza Cloud API error",
          details: lastErr?.text ?? "No response body",
          status: lastErr?.status ?? 500,
          attempt: lastErr?.attempt ?? "none",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
