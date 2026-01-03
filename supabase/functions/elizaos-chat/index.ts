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

    const { message, conversationHistory } = await req.json();
    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory?.length || 0);

    // Build messages array in Vercel AI SDK UIMessage format
    const messages = conversationHistory?.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      parts: [{ type: 'text', text: msg.content }]
    })) || [];

    // Add the new user message
    messages.push({
      role: 'user',
      parts: [{ type: 'text', text: message }]
    });

    console.log('Sending to ElizaOS API with', messages.length, 'messages');

    const response = await fetch('https://elizacloud.ai/api/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ELIZAOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: JSON.stringify(messages),
        id: ELIZAOS_AGENT_ID,
      }),
    });

    console.log('ElizaOS API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElizaOS API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'ElizaOS API error', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('ElizaOS API response:', JSON.stringify(data).slice(0, 200));

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
    } else if (typeof data === 'string') {
      // Plain string response
      reply = data;
    } else {
      console.log('Unknown response format:', JSON.stringify(data));
      reply = 'I received your message but could not parse the response.';
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
