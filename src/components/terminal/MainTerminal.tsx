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
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="terminal-panel flex-1 relative flex flex-col h-full">
        <AsciiMouseEffect />
        <div className="flex-1 p-2 md:p-4 lg:p-6 flex flex-col min-h-0">
          <ElizaChat />
        </div>
      </div>
    </main>
  );
};

export default MainTerminal;
