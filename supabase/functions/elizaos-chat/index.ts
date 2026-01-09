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
    type PartsMsg = { role: string; parts: { type: "text"; text: string }[] };

    const history: HistoryMsg[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    const looksLikeSSE = (text: string) => {
      const t = text.trim();
      return (
        t.startsWith("data:") ||
        t.includes("\ndata:") ||
        t.includes("data: [DONE]") ||
        t.includes('"type":"error"')
      );
    };

    // Build messages in the Eliza Cloud format (Vercel AI SDK style with parts)
    // NOTE: We must drop any prior assistant messages that accidentally stored raw SSE (e.g. lines starting with "data:")
    // because sending them back as conversation history can cause upstream 500 errors.
    const partsMessages: PartsMsg[] = history
      .filter((m) => {
        if (!m || typeof m.content !== 'string') return false;
        if (m.role !== 'user' && m.role !== 'assistant') return false;
        if (looksLikeSSE(m.content)) return false;
        return true;
      })
      .map((msg) => ({
        role: msg.role,
        parts: [{ type: "text", text: msg.content }],
      }));
    partsMessages.push({ role: "user", parts: [{ type: "text", text: message }] });

    console.log("History length:", history.length, "last user message:", String(message).slice(0, 80));

    // Use the agent-specific chat endpoint
    const url = `https://www.elizacloud.ai/api/v1/chat/${ELIZAOS_AGENT_ID}`;

    // Safety: keep only recent context to avoid upstream processing failures
    const recentPartsMessages = partsMessages.slice(-12);

    // Also prepare an OpenAI-style messages format (some gateways prefer this)
    const openaiMessages = recentPartsMessages.map((m) => ({
      role: m.role,
      content: m.parts?.[0]?.text ?? "",
    }));

    const candidates: Array<{ name: string; body: Record<string, unknown> }> = [
      // Try with characterId in body first
      { name: "with_characterId_parts", body: { messages: recentPartsMessages, characterId: ELIZAOS_AGENT_ID } },
      { name: "with_characterId_openai", body: { messages: openaiMessages, characterId: ELIZAOS_AGENT_ID } },
      // Vercel AI SDK "parts" format (stringified)
      { name: "gpt-4o_parts_string", body: { messages: JSON.stringify(recentPartsMessages), id: "gpt-4o", characterId: ELIZAOS_AGENT_ID } },
      { name: "gpt-4o_parts_array", body: { messages: recentPartsMessages, id: "gpt-4o", characterId: ELIZAOS_AGENT_ID } },
      // OpenAI-style format
      { name: "gpt-4o_openai_string", body: { messages: JSON.stringify(openaiMessages), id: "gpt-4o", characterId: ELIZAOS_AGENT_ID } },
      { name: "gpt-4o_openai_array", body: { messages: openaiMessages, id: "gpt-4o", characterId: ELIZAOS_AGENT_ID } },
      // Fallback to a cheaper/commonly-available model
      { name: "gpt-4o-mini_parts_string", body: { messages: JSON.stringify(recentPartsMessages), id: "gpt-4o-mini", characterId: ELIZAOS_AGENT_ID } },
      { name: "gpt-4o-mini_parts_array", body: { messages: recentPartsMessages, id: "gpt-4o-mini", characterId: ELIZAOS_AGENT_ID } },
      { name: "gpt-4o-mini_openai_string", body: { messages: JSON.stringify(openaiMessages), id: "gpt-4o-mini", characterId: ELIZAOS_AGENT_ID } },
      { name: "gpt-4o-mini_openai_array", body: { messages: openaiMessages, id: "gpt-4o-mini", characterId: ELIZAOS_AGENT_ID } },
    ];

    const extractSseErrorText = (text: string): string | null => {
      for (const line of text.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed?.type === "error" && typeof parsed?.errorText === "string") return parsed.errorText;
        } catch {
          // ignore
        }
      }
      return null;
    };

    let chosen: { name: string; respText: string } | null = null;
    let lastErr: { status: number; text: string; attempt: string } | null = null;

    for (const c of candidates) {
      console.log("Upstream attempt:", c.name);
      console.log("Request body:", JSON.stringify(c.body).slice(0, 800));

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

      if (!resp.ok) {
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
        continue;
      }

      // Some successful (200) responses are SSE with an error event
      const sseError = extractSseErrorText(respText);
      if (sseError) {
        console.log("SSE error from upstream:", sseError);

        // Try the next candidate for common "not found" / processing errors
        if (/not found/i.test(sseError) || /failed to process chat/i.test(sseError)) {
          lastErr = { status: 200, text: sseError, attempt: c.name };
          continue;
        }

        return new Response(
          JSON.stringify({ error: "Eliza Cloud API error", details: sseError, status: 200, attempt: c.name }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      chosen = { name: c.name, respText };
      break;
    }

    if (!chosen) {
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

    const respText = chosen.respText;
    console.log("Chosen attempt:", chosen.name);
    console.log("Raw response preview:", respText.slice(0, 500));
    // Parse SSE stream to extract content
    let fullContent = "";
    const lines = respText.split("\n");
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Handle different response formats
          if (parsed.type === "error" && parsed.errorText) {
            return new Response(
              JSON.stringify({
                error: "Eliza Cloud API error",
                details: parsed.errorText,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          
          // Extract content from various possible formats
          // Vercel AI SDK format (text-delta events)
          if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
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
