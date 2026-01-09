import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DebugAction = "models" | "agents" | "agent";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELIZAOS_API_KEY = Deno.env.get("ELIZAOS_API_KEY");
    const ELIZAOS_AGENT_ID = Deno.env.get("ELIZAOS_AGENT_ID");

    if (!ELIZAOS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELIZAOS_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: DebugAction = body?.action ?? "models";
    const agentId: string | undefined = body?.agentId ?? ELIZAOS_AGENT_ID ?? undefined;
    const query: string = typeof body?.query === "string" ? body.query : "";

    const base = "https://www.elizacloud.ai";
    const url =
      action === "models"
        ? `${base}/api/v1/models`
        : action === "agents"
          ? `${base}/api/v1/agents`
          : agentId
            ? `${base}/api/v1/agents/${agentId}`
            : `${base}/api/v1/agents`;

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

        // Attempt to extract a compact list for common shapes
        if (action === "models") {
          const models = (parsed?.data?.models ?? parsed?.data ?? parsed?.models ?? []) as any[];
          if (Array.isArray(models)) {
            const filtered = query
              ? models.filter((m) => {
                  const id = String(m?.id ?? "");
                  const name = String(m?.name ?? "");
                  const ownedBy = String(m?.owned_by ?? m?.provider ?? "");
                  const hay = `${id} ${name} ${ownedBy}`.toLowerCase();
                  return hay.includes(query.toLowerCase());
                })
              : models;

            extracted = filtered.slice(0, 50).map((m) => ({
              id: m?.id ?? m?.name ?? m?.model,
              name: m?.name ?? m?.id ?? m?.model,
              rawModel: m?.model,
              provider: m?.provider ?? m?.owned_by,
            }));
          }
        }

        if (action === "agents") {
          const agents = (parsed?.data?.agents ?? parsed?.data ?? parsed?.agents ?? []) as any[];
          if (Array.isArray(agents)) {
            extracted = agents.slice(0, 50).map((a) => ({
              id: a?.id,
              name: a?.name,
              status: a?.status,
            }));
          }
        }

        if (action === "agent") {
          extracted = parsed?.data ?? parsed;
        }
      } catch {
        // ignore
      }
    }

    return new Response(
      JSON.stringify({
        ok: upstream.ok,
        status: upstream.status,
        url,
        contentType,
        extracted,
        preview: text.slice(0, 4000),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
