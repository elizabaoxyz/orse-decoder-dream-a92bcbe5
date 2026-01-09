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

    const history: HistoryMsg[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    // Build OpenAI-style messages
    const openaiMessages = history
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .map((msg) => ({ role: msg.role, content: msg.content }));
    openaiMessages.push({ role: "user", content: message });

    // Keep only recent context
    const recentMessages = openaiMessages.slice(-12);

    console.log("History length:", history.length, "last user message:", String(message).slice(0, 80));

    // Try multiple API endpoint formats
    const endpoints = [
      // Primary endpoint - base chat API with characterId in body
      { url: "https://www.elizacloud.ai/api/v1/chat", name: "base_chat" },
      // Alternative endpoint formats
      { url: "https://www.elizacloud.ai/api/chat", name: "api_chat" },
      { url: `https://www.elizacloud.ai/${ELIZAOS_AGENT_ID}/message`, name: "agent_message" },
      { url: `https://www.elizacloud.ai/api/agents/${ELIZAOS_AGENT_ID}/message`, name: "agents_message" },
    ];

    const payloadVariants = [
      // Variant 1: OpenAI-style with characterId
      { name: "openai_with_characterId", body: { messages: recentMessages, characterId: ELIZAOS_AGENT_ID } },
      // Variant 2: Simple text message
      { name: "simple_text", body: { text: message, characterId: ELIZAOS_AGENT_ID } },
      // Variant 3: message field
      { name: "message_field", body: { message: message, characterId: ELIZAOS_AGENT_ID } },
      // Variant 4: content field
      { name: "content_field", body: { content: message, characterId: ELIZAOS_AGENT_ID } },
      // Variant 5: OpenAI format with model
      { name: "openai_with_model", body: { messages: recentMessages, characterId: ELIZAOS_AGENT_ID, model: "gpt-4o" } },
    ];

    let chosen: { name: string; respText: string } | null = null;
    let lastErr: { status: number; text: string; attempt: string } | null = null;

    // Try each endpoint with each payload variant
    outer:
    for (const endpoint of endpoints) {
      for (const payload of payloadVariants) {
        const attemptName = `${endpoint.name}_${payload.name}`;
        console.log("Upstream attempt:", attemptName);
        console.log("URL:", endpoint.url);
        console.log("Request body:", JSON.stringify(payload.body).slice(0, 800));

        try {
          const resp = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ELIZAOS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload.body),
          });

          const respText = await resp.text();
          console.log("Response status:", attemptName, resp.status);
          console.log("Response body preview:", respText.slice(0, 500));

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

          if (!resp.ok) {
            lastErr = { status: resp.status, text: respText, attempt: attemptName };
            continue;
          }

          // Check for SSE error in successful response
          if (respText.includes('"type":"error"')) {
            const errorMatch = respText.match(/"errorText"\s*:\s*"([^"]+)"/);
            if (errorMatch) {
              lastErr = { status: 200, text: errorMatch[1], attempt: attemptName };
              continue;
            }
          }

          chosen = { name: attemptName, respText };
          break outer;
        } catch (fetchError) {
          console.log("Fetch error for", attemptName, ":", fetchError);
          lastErr = { status: 0, text: String(fetchError), attempt: attemptName };
          continue;
        }
      }
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
            if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
              fullContent += parsed.delta;
            } else if (parsed.choices?.[0]?.delta?.content) {
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
