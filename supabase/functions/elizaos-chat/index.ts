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

    // Build messages in the Eliza Cloud format (Vercel AI SDK style with parts)
    const partsMessages: PartsMsg[] = history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((msg) => ({
        role: msg.role,
        parts: [{ type: "text", text: msg.content }],
      }));
    partsMessages.push({ role: "user", parts: [{ type: "text", text: message }] });

    console.log("History length:", history.length, "last user message:", String(message).slice(0, 80));

    const url = "https://www.elizacloud.ai/api/v1/chat";

    // Use gpt-4o model with stringified messages as per Eliza Cloud API format
    const requestBody = {
      messages: JSON.stringify(partsMessages),
      id: "gpt-4o"
    };

    console.log("Request URL:", url);
    console.log("Request body:", JSON.stringify(requestBody));

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", resp.status);
    console.log("Content-Type:", resp.headers.get("content-type"));

    if (!resp.ok) {
      const errorText = await resp.text();
      console.log("Error response:", errorText);

      if (resp.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Invalid API key - check your ELIZAOS_API_KEY",
            details: errorText,
            status: resp.status,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            details: errorText,
            status: resp.status,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          error: "Eliza Cloud API error",
          details: errorText,
          status: resp.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Handle streaming response (SSE format)
    const respText = await resp.text();
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
          if (parsed.choices?.[0]?.delta?.content) {
            fullContent += parsed.choices[0].delta.content;
          } else if (parsed.choices?.[0]?.message?.content) {
            fullContent += parsed.choices[0].message.content;
          } else if (parsed.content) {
            fullContent += parsed.content;
          } else if (parsed.text) {
            fullContent += parsed.text;
          } else if (parsed.delta?.content) {
            fullContent += parsed.delta.content;
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
