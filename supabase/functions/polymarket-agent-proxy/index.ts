

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_BASE = "http://152.42.181.178:3001";

const ALLOWED_ENDPOINTS = ['/api/scan', '/api/analyze', '/api/search', '/api/chat', '/api/autonomy/start', '/api/autonomy/stop', '/api/autonomy/status', '/api/history'];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint
    if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint. Allowed: ${ALLOWED_ENDPOINTS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = `${API_BASE}${endpoint}`;
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);

    // Get request body if present (for POST requests)
    let body = null;
    if (req.method === 'POST') {
      body = await req.text();
      console.log('Request body:', body);
    }

    // Determine the HTTP method to use
    const method = url.searchParams.get('method') || req.method;

    // Forward the request
    const response = await fetch(targetUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? body : undefined,
    });

    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText.substring(0, 500));

    // Return the response
    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Proxy request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
