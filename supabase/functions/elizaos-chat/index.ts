

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHARACTER_ID = 'af4e609a-7ebc-4f59-8920-b5931a762102';
const ELIZA_BASE_URL = 'https://elizacloud.ai/api/eliza';

// In-memory room cache (per function instance)
const roomCache: Map<string, string> = new Map();

async function createRoom(apiKey: string, sessionId: string): Promise<string> {
  console.log('Creating new room for session:', sessionId);
  
  const response = await fetch(`${ELIZA_BASE_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      characterId: CHARACTER_ID,
      name: `ElizaBAO Chat - ${sessionId}`
    }),
  });

  const respText = await response.text();
  console.log('Create room response:', response.status, respText);

  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.status} - ${respText}`);
  }

  const data = JSON.parse(respText);
  const roomId = data.id || data.roomId || data.room_id || data.data?.id;
  
  if (!roomId) {
    console.error('Room response structure:', JSON.stringify(data));
    throw new Error('Room ID not found in response');
  }

  console.log('Created room:', roomId);
  return roomId;
}

async function sendMessage(apiKey: string, roomId: string, text: string, retries = 2): Promise<string> {
  console.log('Sending message to room:', roomId);
  
  const response = await fetch(`${ELIZA_BASE_URL}/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const respText = await response.text();
  console.log('Message response status:', response.status);
  console.log('Message response:', respText.slice(0, 1000));

  if (!response.ok) {
    // If room not found, clear cache and throw to retry
    if (response.status === 404) {
      throw new Error('ROOM_NOT_FOUND');
    }
    
    // Retry on 500 errors (ElizaCloud transient issues like pool errors)
    if (response.status === 500 && retries > 0) {
      console.log(`Server error, retrying... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
      return sendMessage(apiKey, roomId, text, retries - 1);
    }
    
    throw new Error(`Failed to send message: ${response.status} - ${respText}`);
  }

  // Parse the response - Eliza returns message objects
  try {
    const data = JSON.parse(respText);
    console.log('Parsed data type:', typeof data, Array.isArray(data) ? 'array' : 'object');
    
    // Extract text from various response structures
    const extractText = (obj: any): string | null => {
      if (!obj) return null;
      if (typeof obj === 'string') return obj;
      
      // Handle {message: {content: {text: ...}}} structure
      if (obj.message?.content?.text) return obj.message.content.text;
      
      // Handle {content: {text: ...}} structure
      if (obj.content?.text) return obj.content.text;
      if (typeof obj.content === 'string') return obj.content;
      
      // Direct fields
      if (obj.text) return obj.text;
      if (typeof obj.message === 'string') return obj.message;
      
      return null;
    };

    // Try single object first (most common response)
    const text = extractText(data);
    if (text) return text;

    // If it's an array, get the assistant's message (usually the last one)
    if (Array.isArray(data)) {
      const agentMessages = data.filter(msg => msg.agentId || msg.role === 'assistant');
      if (agentMessages.length > 0) {
        const lastMsg = agentMessages[agentMessages.length - 1];
        const msgText = extractText(lastMsg);
        if (msgText) return msgText;
      }
      if (data.length > 0) {
        const msgText = extractText(data[data.length - 1]);
        if (msgText) return msgText;
      }
    }
    
    // Try nested data structure
    if (data.data) {
      const nestedText = extractText(data.data);
      if (nestedText) return nestedText;
    }
    
    if (data.messages && Array.isArray(data.messages)) {
      const lastMsg = data.messages[data.messages.length - 1];
      const msgText = extractText(lastMsg);
      if (msgText) return msgText;
    }
    
    console.log('Could not extract text, full structure:', JSON.stringify(data));
    return 'I received your message but could not parse the response.';
  } catch (e) {
    console.error('Parse error:', e);
    return respText;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELIZAOS_API_KEY = Deno.env.get('ELIZAOS_API_KEY');

    if (!ELIZAOS_API_KEY) {
      console.error('ELIZAOS_API_KEY is not configured');
      throw new Error('ELIZAOS_API_KEY is not configured');
    }

    const { message, sessionId } = await req.json();
    console.log('Received message:', message);
    console.log('Session ID:', sessionId);

    // Use session ID or generate one
    const chatSessionId = sessionId || `default-${Date.now()}`;
    
    // Get or create room for this session
    let roomId = roomCache.get(chatSessionId);
    
    if (!roomId) {
      roomId = await createRoom(ELIZAOS_API_KEY, chatSessionId);
      roomCache.set(chatSessionId, roomId);
    }

    // Try to send message, create new room if current one is invalid
    let reply: string;
    try {
      reply = await sendMessage(ELIZAOS_API_KEY, roomId, message);
    } catch (error) {
      if (error instanceof Error && error.message === 'ROOM_NOT_FOUND') {
        console.log('Room not found, creating new one...');
        roomCache.delete(chatSessionId);
        roomId = await createRoom(ELIZAOS_API_KEY, chatSessionId);
        roomCache.set(chatSessionId, roomId);
        reply = await sendMessage(ELIZAOS_API_KEY, roomId, message);
      } else {
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ reply, roomId }),
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
