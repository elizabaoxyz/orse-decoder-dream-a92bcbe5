const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    const { text, voice_id } = await req.json();
    console.log('TTS request - text length:', text?.length, 'voice_id:', voice_id);

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call ElizaOS Cloud TTS API (ElevenLabs)
    const response = await fetch('https://elizacloud.ai/api/elevenlabs/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: voice_id || 'rachel', // Default voice
      }),
    });

    console.log('TTS API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `TTS failed (${response.status})`, 
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return audio as base64 or URL depending on API response
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('audio')) {
      // Convert audio buffer to base64
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      return new Response(
        JSON.stringify({ 
          audioBase64: base64Audio,
          contentType: contentType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // JSON response with URL
      const data = await response.json();
      return new Response(
        JSON.stringify({ audioUrl: data.url || data.audio_url, raw: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
