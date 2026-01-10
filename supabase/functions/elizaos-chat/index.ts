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
    const ELIZAOS_API_KEY = Deno.env.get('ELIZAOS_API_KEY');

    if (!ELIZAOS_API_KEY) {
      console.error('ELIZAOS_API_KEY is not configured');
      throw new Error('ELIZAOS_API_KEY is not configured');
    }

    const { message, conversationHistory } = await req.json();
    console.log('Received message:', message);

    type HistoryMsg = { role: string; content: string };
    const history: HistoryMsg[] = Array.isArray(conversationHistory) ? conversationHistory : [];

    // Build messages array
    const messages = history
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .map((msg) => ({ role: msg.role, content: msg.content }));
    messages.push({ role: 'user', content: message });

    // Keep only recent context
    const recentMessages = messages.slice(-12);

    // Use ElizaBAO character ID from elizacloud.ai
    const CHARACTER_ID = 'af4e609a-7ebc-4f59-8920-b5931a762102';

    console.log('Messages count:', recentMessages.length);

    // Eliza Cloud Agent endpoint - uses character configuration from elizacloud.ai
    const response = await fetch(`https://elizacloud.ai/api/v1/agents/${CHARACTER_ID}/message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        userId: 'web-user',
        roomId: 'elizabao-terminal'
      }),
    });

    const respText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', respText.slice(0, 500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Eliza Cloud API error (${response.status})`, 
          details: respText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response - try SSE format first, then JSON
    let fullContent = "";

    if (respText.includes("data: ")) {
      const lines = respText.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "text-delta" && parsed.textDelta) {
              fullContent += parsed.textDelta;
            } else if (parsed.choices?.[0]?.delta?.content) {
              fullContent += parsed.choices[0].delta.content;
            } else if (parsed.choices?.[0]?.message?.content) {
              fullContent += parsed.choices[0].message.content;
            }
          } catch { /* skip */ }
        }
      }
    }

    if (!fullContent) {
      try {
        const data = JSON.parse(respText);
        fullContent = data.choices?.[0]?.message?.content || 
                      data.content || 
                      data.text || 
                      data.reply || 
                      JSON.stringify(data);
      } catch {
        fullContent = respText;
      }
    }

    return new Response(
      JSON.stringify({ reply: fullContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
