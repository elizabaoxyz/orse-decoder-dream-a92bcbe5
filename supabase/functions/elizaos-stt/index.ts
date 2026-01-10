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

    // Get the audio file from form data
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Audio file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('STT request - file size:', audioFile.size, 'type:', audioFile.type);

    // Forward to ElizaOS Cloud STT API (ElevenLabs)
    const sttFormData = new FormData();
    sttFormData.append('audio', audioFile);

    const response = await fetch('https://elizacloud.ai/api/elevenlabs/stt', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
      },
      body: sttFormData,
    });

    const respText = await response.text();
    console.log('STT API response status:', response.status);
    console.log('STT API response:', respText.slice(0, 500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `STT failed (${response.status})`, 
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
      // If not JSON, treat as plain text transcription
      data = { text: respText };
    }

    const transcription = data.text || data.transcription || data.transcript || respText;

    return new Response(
      JSON.stringify({ text: transcription, raw: data }),
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
