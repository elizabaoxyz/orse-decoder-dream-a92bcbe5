import PluginCard from "./PluginCard";
import AsciiMouseEffect from "./AsciiMouseEffect";
const MainTerminal = () => {
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
  ];

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      {/* Terminal Primary */}
      <div className="terminal-panel flex-1 relative">
        <AsciiMouseEffect />
        <div className="terminal-header">DORAMOS_TERMINAL_PRIMARY</div>
        
        <div className="p-4 md:p-8 lg:p-12 space-y-4 md:space-y-6 lg:space-y-8">
          {/* Main Title */}
          <div>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-foreground tracking-tight glitch">
              DoramOS<span className="text-primary">_</span>
            </h1>
            <div className="w-16 md:w-24 h-0.5 md:h-1 bg-primary mt-2 pulse-glow" />
          </div>

          {/* Description */}
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-[10px] md:text-sm max-w-xl leading-relaxed uppercase tracking-wide">
              Official Polymarket Partner | ElizaOS
            </p>
            <p className="text-primary text-xs md:text-sm font-bold uppercase tracking-wide">
              CA: SOON
            </p>
          </div>
          <div className="text-[10px] md:text-xs space-y-0.5 font-mono">
            <p><span className="text-muted-foreground/70">NAME:</span><span className="text-primary">AI16ZDORAM</span></p>
            <p className="hidden md:block"><span className="text-muted-foreground/70">AGENT_ID:</span><span className="text-white">6328b8c7-3add-4fef-a0c5-9f74adacdb43</span></p>
          </div>

          {/* Enabled Plugins Count */}
          <div className="text-[10px] md:text-xs text-muted-foreground">
            <span className="text-foreground">Enabled</span>{" "}
            <span className="text-primary">{plugins.filter(p => p.enabled).length}</span>
          </div>

          {/* Plugin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {plugins.map((plugin) => (
              <PluginCard key={plugin.title} {...plugin} />
            ))}
          </div>

          {/* Command Input */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pb-4 md:pb-0">
            <span className="text-primary">&gt;&gt;</span>
            <span className="cursor-blink">ENTER_COMMAND...</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainTerminal;
