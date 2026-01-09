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
    if (ELIZAOS_AGENT_ID) console.log('Agent ID:', ELIZAOS_AGENT_ID);

    const { message, conversationHistory } = await req.json();
    console.log('Received message:', message);

    type HistoryMsg = { role: string; content: string };

    const history: HistoryMsg[] = Array.isArray(conversationHistory) ? conversationHistory : [];

    // Build standard OpenAI-style messages
    const messages = history
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    messages.push({ role: 'user', content: message });

    // Keep only recent context
    const recentMessages = messages.slice(-12);

    console.log('Messages count:', recentMessages.length);

    // Prefer agent-specific endpoints (agent API); fall back to generic chat endpoint.
    const urlCandidates = ELIZAOS_AGENT_ID
      ? [
          `https://www.elizacloud.ai/api/v1/agents/${ELIZAOS_AGENT_ID}/chat`,
          `https://www.elizacloud.ai/api/v1/agents/${ELIZAOS_AGENT_ID}/messages`,
          'https://www.elizacloud.ai/api/v1/chat',
        ]
      : ['https://www.elizacloud.ai/api/v1/chat'];

    // Use provider prefix format as required by Eliza Cloud
    const modelName = 'openai/gpt-4o-mini';

    const basePayloads: Array<{ name: string; body: Record<string, unknown> }> = [
      { name: 'model_array', body: { messages: recentMessages, model: modelName } },
      { name: 'id_array', body: { messages: recentMessages, id: modelName } },
    ];

    const payloads = ELIZAOS_AGENT_ID
      ? basePayloads.flatMap((p) => [
          p,
          { name: `${p.name}_agentId`, body: { ...p.body, agentId: ELIZAOS_AGENT_ID } },
          { name: `${p.name}_agent_id`, body: { ...p.body, agent_id: ELIZAOS_AGENT_ID } },
          { name: `${p.name}_characterId`, body: { ...p.body, characterId: ELIZAOS_AGENT_ID } },
        ])
      : basePayloads;

    let chosenText: string | null = null;
    let lastErr: { status: number; text: string; attempt: string; url: string } | null = null;

    outer: for (const url of urlCandidates) {
      for (const p of payloads) {
        console.log('Upstream attempt:', p.name);
        console.log('Request URL:', url);
        console.log('Request body:', JSON.stringify(p.body).slice(0, 800));

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ELIZAOS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(p.body),
        });

        const respText = await resp.text();
        console.log('Response status:', resp.status);
        console.log('Response body preview:', respText.slice(0, 1000));

        if (resp.status === 401) {
          return new Response(
            JSON.stringify({
              error: 'Invalid API key - check your ELIZAOS_API_KEY',
              details: respText,
              status: resp.status,
              attempt: p.name,
              url,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        if (resp.status === 429) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              details: respText,
              status: resp.status,
              attempt: p.name,
              url,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        if (!resp.ok) {
          const retryableByFormat = resp.status === 500 && /Failed to process chat/i.test(respText);
          const retryableByRoute = resp.status === 404 || resp.status === 405;

          if (retryableByFormat || retryableByRoute) {
            lastErr = { status: resp.status, text: respText, attempt: p.name, url };
            continue;
          }

          return new Response(
            JSON.stringify({
              error: 'Eliza Cloud API error',
              details: respText,
              status: resp.status,
              attempt: p.name,
              url,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        chosenText = respText;
        break outer;
      }
    }

    if (!chosenText) {
      return new Response(
        JSON.stringify({
          error: 'Eliza Cloud API error',
          details: lastErr?.text ?? '',
          status: lastErr?.status ?? 500,
          attempt: lastErr?.attempt ?? 'none',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const respText = chosenText;

    // Parse response - try SSE format first, then JSON
    let fullContent = "";

    // Check if response is SSE format
    if (respText.includes("data: ")) {
      const lines = respText.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Handle error response
            if (parsed.type === "error" && parsed.errorText) {
              return new Response(
                JSON.stringify({ error: "Eliza Cloud API error", details: parsed.errorText }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
              );
            }

            // Extract content from various formats
            // Vercel AI SDK text-delta format
            if (parsed.type === "text-delta" && typeof parsed.textDelta === "string") {
              fullContent += parsed.textDelta;
            } else if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
              fullContent += parsed.delta;
            }
            // OpenAI compatible format
            else if (parsed.choices?.[0]?.delta?.content) {
              fullContent += parsed.choices[0].delta.content;
            } else if (parsed.choices?.[0]?.message?.content) {
              fullContent += parsed.choices[0].message.content;
            } else if (parsed.content) {
              fullContent += parsed.content;
            } else if (parsed.text) {
              fullContent += parsed.text;
            } else if (parsed.delta?.content) {
              fullContent += parsed.delta.content;
            } else if (typeof parsed.delta === "string") {
              fullContent += parsed.delta;
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }

    // If no SSE content found, try parsing as regular JSON
    if (!fullContent) {
      try {
        const data = JSON.parse(respText);
        if (data.choices?.[0]?.message?.content) {
          fullContent = data.choices[0].message.content;
        } else if (data.content) {
          fullContent = data.content;
        } else if (data.text) {
          fullContent = data.text;
        } else if (data.reply) {
          fullContent = data.reply;
        } else if (data.response) {
          fullContent = data.response;
        } else if (data.message) {
          fullContent = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else if (data.data?.text) {
          fullContent = data.data.text;
        } else if (data.data?.content) {
          fullContent = data.data.content;
        } else {
          fullContent = JSON.stringify(data);
        }
      } catch {
        fullContent = respText;
      }
    }

    console.log("Extracted reply:", fullContent.slice(0, 200));

    return new Response(JSON.stringify({ reply: fullContent }), {
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
