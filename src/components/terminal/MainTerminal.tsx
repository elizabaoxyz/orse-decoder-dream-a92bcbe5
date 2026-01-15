import PluginCard from "./PluginCard";
import AsciiMouseEffect from "./AsciiMouseEffect";
import ElizaChat from "./ElizaChat";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plug, Hammer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import iosAppIcon from "@/assets/ios-app-icon.png";
import androidAppIcon from "@/assets/android-app-icon.webp";

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
          {/* Builder Card */}
          <Link to="/builder">
            <div className="group relative border border-border bg-card/50 p-2.5 cursor-pointer rounded-2xl transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 overflow-hidden mb-2">
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
                  animation: 'breathe 3s ease-in-out infinite'
                }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Hammer className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-foreground font-medium text-xs truncate group-hover:text-primary transition-colors duration-300">
                    Builder
                  </h3>
                </div>
                <span className="text-[8px] text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded">NEW</span>
              </div>
            </div>
          </Link>

          {plugins.map((plugin) => (
            <PluginCard key={plugin.title} {...plugin} compact />
          ))}
        </div>

        {/* Coming Soon Apps */}
        <div className="p-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t('comingSoon')}</p>
          <div className="space-y-2">
            <div className="group flex items-center gap-2 p-2.5 bg-muted/30 rounded-2xl border border-border/50 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 overflow-hidden relative">
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)'
                }}
              />
              <img src={iosAppIcon} alt="iOS" className="w-8 h-8 rounded-xl object-cover relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <div className="flex-1 relative z-10">
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">iOS App</p>
                <p className="text-[9px] text-muted-foreground">Coming Soon</p>
              </div>
            </div>
            <div className="group flex items-center gap-2 p-2.5 bg-muted/30 rounded-2xl border border-border/50 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 overflow-hidden relative">
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)'
                }}
              />
              <img src={androidAppIcon} alt="Android" className="w-7 h-7 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 shrink-0" />
              <div className="flex-1 relative z-10">
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Android App</p>
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
