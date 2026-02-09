

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELIZAOS_API_KEY = Deno.env.get("ELIZAOS_API_KEY");

    if (!ELIZAOS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELIZAOS_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const endpoint = body?.endpoint ?? "models";

    const base = "https://www.elizacloud.ai";
    
    // Test Chat endpoint
    if (endpoint === "chat-test") {
      const chatUrl = `${base}/api/v1/chat`;
      
      // Try multiple payload variations to find what works
      const payloadVariations = [
        // Variation 1: id + UIMessage format (per OpenAPI)
        {
          name: "id + UIMessage parts",
          payload: {
            id: "openai/gpt-4o-mini",
            messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }]
          }
        },
        // Variation 2: model + UIMessage format
        {
          name: "model + UIMessage parts", 
          payload: {
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }]
          }
        },
        // Variation 3: id + simple content format
        {
          name: "id + simple content",
          payload: {
            id: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: "Hello" }]
          }
        },
        // Variation 4: model + simple content format
        {
          name: "model + simple content",
          payload: {
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: "Hello" }]
          }
        },
        // Variation 5: short model name + UIMessage
        {
          name: "short id + UIMessage",
          payload: {
            id: "gpt-4o-mini",
            messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }]
          }
        },
        // Variation 6: Only messages, no model
        {
          name: "only messages (UIMessage)",
          payload: {
            messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }]
          }
        },
      ];

      const results = [];

      for (const variation of payloadVariations) {
        try {
          const response = await fetch(chatUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ELIZAOS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(variation.payload),
          });

          const responseText = await response.text();
          
          results.push({
            name: variation.name,
            status: response.status,
            ok: response.ok,
            success: response.ok,
            contentType: response.headers.get("content-type"),
            response: responseText.slice(0, 500),
            payload: variation.payload,
          });
        } catch (err) {
          results.push({
            name: variation.name,
            error: err instanceof Error ? err.message : String(err),
            payload: variation.payload,
          });
        }
      }

      return new Response(
        JSON.stringify({ results }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Default: list models
    const url = `${base}/api/v1/models`;
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ELIZAOS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "";

    let extracted: unknown = undefined;
    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(text);
        const models = (parsed?.data?.models ?? parsed?.data ?? parsed?.models ?? []) as any[];
        if (Array.isArray(models)) {
          extracted = models.slice(0, 50).map((m) => ({
            id: m?.id ?? m?.name ?? m?.model,
            name: m?.name ?? m?.id ?? m?.model,
            provider: m?.provider ?? m?.owned_by,
          }));
        }
      } catch {
        // ignore
      }
    }

    return new Response(
      JSON.stringify({ contentType, extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
