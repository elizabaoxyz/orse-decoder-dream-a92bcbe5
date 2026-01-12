import PluginCard from "./PluginCard";
import AsciiMouseEffect from "./AsciiMouseEffect";
import ElizaChat from "./ElizaChat";
import agentAvatarBase from "@/assets/agent-avatar.jpg";
import { cacheBust } from "@/lib/utils";
import { Wifi, WifiOff, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const agentAvatar = cacheBust(agentAvatarBase);

const MainTerminal = () => {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('terminal-connection')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whale_transactions' }, () => {})
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const plugins = [
    {
      title: "Crypto Prices",
      version: "v1.0.0",
      toolCount: 3,
      description: "Real-time cryptocurrency price data from major exchanges. Get current prices, 24h changes, market cap, and volume for thousands of cryptocurrencies.",
      tools: ["get_price", "get_market_data", "list_trending"],
      pricing: "Free tier available",
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcp/demos/crypto/sse",
      serverKey: "crypto-prices",
      serverType: "sse",
    },
    {
      title: "Time & Timezone",
      version: "v1.0.0",
      toolCount: 5,
      description: "Get current time, convert between timezones, and perform date calculations. Perfect for scheduling and time-aware agents.",
      tools: ["get_current_time", "convert_timezone", "format_date", "calculate_time_diff", "list_timezones"],
      pricing: "Free to use",
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcp/demos/time/sse",
      serverKey: "time-server",
      serverType: "sse",
    },
    {
      title: "ElizaOS Platform",
      version: "v1.0.0",
      toolCount: 25,
      description: "Access ElizaOS platform features: credits, usage, generations, conversations, and agent management via MCP.",
      tools: ["check_credits", "get_usage", "generate_text", "generate_image", "list_agents", "conversation_management"],
      pricing: "Uses your credit balance (requires authentication)",
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcp",
      serverKey: "eliza-platform",
      serverType: "http",
    },
    {
      title: "Polymarket",
      version: "v1.0.0",
      toolCount: 8,
      description: "Full Polymarket prediction market integration. Access markets, order books, price history, trade events, and place orders via CLOB API.",
      tools: ["GET_ALL_MARKETS", "GET_CLOB_MARKETS", "GET_ORDER_BOOK", "GET_PRICE_HISTORY", "GET_TRADE_EVENTS", "GET_LAST_TRADE_PRICE", "PLACE_ORDER", "CANCEL_ORDER"],
      pricing: "Requires CLOB_API_URL environment variable",
      enabled: true,
      endpoint: "https://clob.polymarket.com",
      serverKey: "polymarket",
      serverType: "http",
    },
    {
      title: "Weather Data",
      version: "v1.0.0",
      toolCount: 4,
      description: "Current weather conditions and forecasts for locations worldwide. Temperature, humidity, wind, and more.",
      tools: ["get_current_weather", "get_weather_forecast", "compare_weather", "search_location"],
      pricing: "Free to use",
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcps/weather/sse",
      serverKey: "weather",
      serverType: "sse",
    },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      {/* Terminal Primary */}
      <div className="terminal-panel flex-1 relative">
        <AsciiMouseEffect />
        <div className="terminal-header">ElizaOS Cloud Agent ID : af4e609a-7ebc-4f59-8920-b5931a762102</div>
        
        <div className="p-4 md:p-8 lg:p-12 space-y-4 md:space-y-6 lg:space-y-8">
          {/* Mobile: Agent Card + Title Row */}
          <div className="flex items-start gap-4">
            {/* Agent Avatar - visible on mobile */}
            <a
              href="https://www.elizacloud.ai/dashboard/chat?characterId=af4e609a-7ebc-4f59-8920-b5931a762102"
              target="_blank"
              rel="noopener noreferrer"
              className="block md:hidden shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg animate-pulse" />
                <div className="relative z-10 p-[2px] rounded-full bg-gradient-to-br from-primary to-emerald-400">
                  <div className="rounded-full bg-background p-0.5">
                    <img 
                      src={agentAvatar}
                      alt="Agent" 
                      className="w-16 h-16 object-contain rounded-full"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-card border border-border px-1.5 py-0.5 rounded-full">
                  {isConnected ? (
                    <Wifi className="w-2.5 h-2.5 text-green-400" />
                  ) : (
                    <WifiOff className="w-2.5 h-2.5 text-red-400" />
                  )}
                </div>
              </div>
            </a>

            {/* Title & Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-5xl lg:text-7xl font-bold text-foreground tracking-tight glitch">
                ElizaBAO<span className="text-primary">_</span>
              </h1>
              <div className="w-12 md:w-24 h-0.5 md:h-1 bg-primary mt-1 md:mt-2 pulse-glow" />
              
              {/* Mobile: Compact info */}
              <div className="mt-2 md:hidden space-y-1">
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="text-muted-foreground">ELIZABAO</span>
                  <a
                    href="https://www.elizacloud.ai/dashboard/chat?characterId=af4e609a-7ebc-4f59-8920-b5931a762102"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary"
                  >
                    CHAT <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>



          {/* Eliza Chat Interface - Above plugins */}
          <ElizaChat />

          {/* Enabled Plugins Count */}
          <div className="text-[10px] md:text-xs text-muted-foreground">
            <span className="text-foreground">{t('pluginsMcpEnabled')}</span>{" "}
            <span className="text-primary">{plugins.filter(p => p.enabled).length}</span>
          </div>

          {/* Plugin Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {plugins.map((plugin) => (
              <PluginCard key={plugin.title} {...plugin} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainTerminal;
