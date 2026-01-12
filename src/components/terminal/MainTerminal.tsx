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
      title: t('pluginCryptoPrices'),
      version: "v1.0.0",
      toolCount: 3,
      description: t('pluginCryptoPricesDesc'),
      tools: ["get_price", "get_market_data", "list_trending"],
      pricing: t('pluginCryptoPricesPricing'),
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcp/demos/crypto/sse",
      serverKey: "crypto-prices",
      serverType: "sse",
    },
    {
      title: t('pluginTimeTimezone'),
      version: "v1.0.0",
      toolCount: 5,
      description: t('pluginTimeTimezoneDesc'),
      tools: ["get_current_time", "convert_timezone", "format_date", "calculate_time_diff", "list_timezones"],
      pricing: t('pluginTimeTimezonePricing'),
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcp/demos/time/sse",
      serverKey: "time-server",
      serverType: "sse",
    },
    {
      title: t('pluginElizaOSPlatform'),
      version: "v1.0.0",
      toolCount: 25,
      description: t('pluginElizaOSPlatformDesc'),
      tools: ["check_credits", "get_usage", "generate_text", "generate_image", "list_agents", "conversation_management"],
      pricing: t('pluginElizaOSPlatformPricing'),
      enabled: true,
      endpoint: "https://www.elizacloud.ai/api/mcp",
      serverKey: "eliza-platform",
      serverType: "http",
    },
    {
      title: t('pluginPolymarket'),
      version: "v1.0.0",
      toolCount: 8,
      description: t('pluginPolymarketDesc'),
      tools: ["GET_ALL_MARKETS", "GET_CLOB_MARKETS", "GET_ORDER_BOOK", "GET_PRICE_HISTORY", "GET_TRADE_EVENTS", "GET_LAST_TRADE_PRICE", "PLACE_ORDER", "CANCEL_ORDER"],
      pricing: t('pluginPolymarketPricing'),
      enabled: true,
      endpoint: "https://clob.polymarket.com",
      serverKey: "polymarket",
      serverType: "http",
    },
    {
      title: t('pluginWeatherData'),
      version: "v1.0.0",
      toolCount: 4,
      description: t('pluginWeatherDataDesc'),
      tools: ["get_current_weather", "get_weather_forecast", "compare_weather", "search_location"],
      pricing: t('pluginWeatherDataPricing'),
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
        
        <div className="p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8">
          {/* Hero Section */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Agent Avatar */}
            <a
              href="https://www.elizacloud.ai/dashboard/chat?characterId=af4e609a-7ebc-4f59-8920-b5931a762102"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 group"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg animate-pulse" />
                <div className="relative z-10 p-[2px] rounded-full bg-gradient-to-br from-primary to-emerald-400">
                  <div className="rounded-full bg-background p-0.5">
                    <img 
                      src={agentAvatar}
                      alt="ElizaBAO Agent" 
                      className="w-14 h-14 md:w-20 md:h-20 object-contain rounded-full"
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

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                ElizaBAO<span className="text-primary">_</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Powered by ElizaOS
              </p>
            </div>
          </div>

          {/* Eliza Chat Interface */}
          <ElizaChat />

          {/* Plugins Section */}
          <div className="space-y-3">
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
      </div>
    </main>
  );
};

export default MainTerminal;
