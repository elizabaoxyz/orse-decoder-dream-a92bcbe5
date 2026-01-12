import PluginCard from "./PluginCard";
import AsciiMouseEffect from "./AsciiMouseEffect";
import ElizaChat from "./ElizaChat";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plug } from "lucide-react";
import { useState } from "react";

const MainTerminal = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <main className="flex-1 flex overflow-hidden relative">
      {/* Global ASCII Mouse Effect - covers entire main area including sidebar */}
      <AsciiMouseEffect />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-0">
        <div className="flex-1 p-2 md:p-4 lg:p-6 flex flex-col min-h-0">
          <ElizaChat />
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-6 h-16 bg-card border border-border rounded-l-lg hover:bg-muted transition-colors"
        style={{ right: sidebarOpen ? '280px' : '0' }}
      >
        {sidebarOpen ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Plugin Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-l border-border bg-card/30 backdrop-blur-sm transition-all duration-300 relative z-0 ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {t('pluginsMcpEnabled')} <span className="text-primary">{plugins.filter(p => p.enabled).length}</span>
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.title} {...plugin} compact />
          ))}
        </div>

        {/* Coming Soon Apps */}
        <div className="p-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t('comingSoon')}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/50">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">iOS App</p>
                <p className="text-[9px] text-muted-foreground">Coming Soon</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/50">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 2.047a.75.75 0 0 0-.977.4l-1.91 4.39a9.75 9.75 0 0 0-5.272 0l-1.91-4.39a.75.75 0 0 0-1.377.6l1.793 4.12A9.752 9.752 0 0 0 2.25 15v.75c0 3.452 2.798 6.25 6.25 6.25h7c3.452 0 6.25-2.798 6.25-6.25V15a9.752 9.752 0 0 0-5.62-8.833l1.793-4.12a.75.75 0 0 0-.4-.977zM8 14.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm8 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">Android App</p>
                <p className="text-[9px] text-muted-foreground">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
};

export default MainTerminal;
