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
      return new Response(
        JSON.stringify({ error: 'ELIZAOS_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt } = await req.json();
    console.log('Image generation prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call ElizaOS Cloud image generation API
    const response = await fetch('https://elizacloud.ai/api/v1/generate-image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    const respText = await response.text();
    console.log('Image API response status:', response.status);
    console.log('Image API response:', respText.slice(0, 500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Image generation failed (${response.status})`, 
          details: respText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response
    let data;
    try {
      data = JSON.parse(respText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid response format', raw: respText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return image URL
    const imageUrl = data.url || data.image_url || data.imageUrl || data.data?.[0]?.url;
    
    return new Response(
      JSON.stringify({ imageUrl, raw: data }),
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
