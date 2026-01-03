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

    type HistoryMsg = { role: string; content: string };
    type OpenAIMsg = { role: string; content: string };
    type PartsMsg = { role: string; parts: { type: "text"; text: string }[] };

    const history: HistoryMsg[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    const openaiMessages: OpenAIMsg[] = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    openaiMessages.push({ role: "user", content: message });

    const partsMessages: PartsMsg[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ type: "text", text: msg.content }],
    }));
    partsMessages.push({ role: "user", parts: [{ type: "text", text: message }] });

    const candidates: Array<{
      name: string;
      url: string;
      body: Record<string, unknown>;
    }> = [
      {
        name: "chat_parts_id",
        url: "https://elizacloud.ai/api/v1/chat",
        body: { id: ELIZAOS_AGENT_ID, messages: JSON.stringify(partsMessages) },
      },
      {
        name: "chat_openai_id",
        url: "https://elizacloud.ai/api/v1/chat",
        body: { id: ELIZAOS_AGENT_ID, messages: JSON.stringify(openaiMessages) },
      },
      {
        name: "chat_parts_agentId",
        url: "https://elizacloud.ai/api/v1/chat",
        body: { agentId: ELIZAOS_AGENT_ID, messages: JSON.stringify(partsMessages) },
      },
      {
        name: "chat_openai_agentId",
        url: "https://elizacloud.ai/api/v1/chat",
        body: { agentId: ELIZAOS_AGENT_ID, messages: JSON.stringify(openaiMessages) },
      },
      {
        name: "chat_completions_model",
        url: "https://elizacloud.ai/api/v1/chat/completions",
        body: { model: ELIZAOS_AGENT_ID, messages: openaiMessages, stream: false },
      },
    ];

    console.log(
      "History length:",
      history.length,
      "last user message:",
      String(message).slice(0, 80),
    );

    let lastErr: { status: number; text: string; attempt: string } | null = null;

    let data: unknown = null;
    for (const c of candidates) {
      console.log("Upstream attempt:", c.name, c.url);

      const resp = await fetch(c.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ELIZAOS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(c.body),
      });

      const respText = await resp.text();
      console.log(
        "Upstream status:",
        c.name,
        resp.status,
        "body preview:",
        respText.slice(0, 300),
      );

      if (resp.ok) {
        try {
          data = JSON.parse(respText);
        } catch {
          data = respText;
        }
        break;
      }

      // Return 200 for these so the client can show a friendly message.
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
      // Extra diagnostics: try to verify the agent exists (best-effort)
      let agentCheck: { status: number; bodyPreview: string } | null = null;
      try {
        const r = await fetch(`https://elizacloud.ai/api/v1/agents/${ELIZAOS_AGENT_ID}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${ELIZAOS_API_KEY}`,
            "Content-Type": "application/json",
          },
        });
        const t = await r.text();
        agentCheck = { status: r.status, bodyPreview: t.slice(0, 300) };
        console.log("Agent check status:", r.status, "body preview:", t.slice(0, 300));
      } catch (e) {
        console.log("Agent check failed:", e);
      }

      return new Response(
        JSON.stringify({
          error: "ElizaOS API error",
          details: lastErr?.text ?? "No response body",
          status: lastErr?.status ?? 500,
          attempt: lastErr?.attempt ?? "none",
          agentCheck,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const extractReply = (payload: unknown): string => {
      if (typeof payload === "string") return payload;
      if (payload === null || payload === undefined) return "";
      if (typeof payload !== "object") return String(payload);

      const p = payload as Record<string, any>;

      // OpenAI compatible (non-stream)
      if (p.choices?.[0]?.message?.content) return String(p.choices[0].message.content);
      // OpenAI compatible (some gateways)
      if (p.choices?.[0]?.delta?.content) return String(p.choices[0].delta.content);

      // Common simple formats
      if (p.reply) return String(p.reply);
      if (p.content) return String(p.content);
      if (p.text) return String(p.text);
      if (p.message) return String(p.message);

      return JSON.stringify(p);
    };

    const reply = extractReply(data);

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
