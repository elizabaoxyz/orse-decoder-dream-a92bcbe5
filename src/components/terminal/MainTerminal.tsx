import PluginCard from "./PluginCard";

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
    },
    {
      title: "Time & Timezone",
      version: "v1.0.0",
      toolCount: 5,
      description: "Get current time, convert between timezones, and perform date calculations. Perfect for scheduling and time-aware agents.",
      tools: ["get_current_time", "convert_timezone", "format_date", "add_time", "subtract_time"],
      pricing: "Free to use",
      enabled: true,
    },
    {
      title: "ElizaOS Platform",
      version: "v1.0.0",
      toolCount: 25,
      description: "Access ElizaOS platform features: credits, usage, generations, conversations, and agent management via MCP.",
      tools: ["check_credits", "get_usage", "generate_text", "list_conversations", "manage_agent", "get_generations"],
      pricing: "Uses your credit balance (requires authentication)",
      enabled: true,
    },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      {/* Terminal Primary */}
      <div className="terminal-panel flex-1">
        <div className="terminal-header">DORAMOS_TERMINAL_PRIMARY</div>
        
        <div className="p-8 lg:p-12 space-y-8">
          {/* Main Title */}
          <div>
            <h1 className="text-6xl lg:text-7xl font-bold text-foreground tracking-tight glitch">
              DoramOS<span className="text-primary">_</span>
            </h1>
            <div className="w-24 h-1 bg-primary mt-2 pulse-glow" />
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed uppercase tracking-wide">
            Official Polymarket Partner | Powered by ElizaOS
          </p>
          <div className="text-xs mt-2 space-y-0.5 font-mono">
            <p><span className="text-muted-foreground/70">NAME:</span><span className="text-primary">AI16ZDORAM</span></p>
            <p><span className="text-muted-foreground/70">AGENT_ID:</span><span className="text-white">6328b8c7-3add-4fef-a0c5-9f74adacdb43</span></p>
          </div>

          {/* Enabled Plugins Count */}
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground">Enabled</span>{" "}
            <span className="text-primary">{plugins.filter(p => p.enabled).length}</span>
          </div>

          {/* Plugin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin) => (
              <PluginCard key={plugin.title} {...plugin} />
            ))}
          </div>

          {/* Command Input */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">&gt;&gt;</span>
            <span className="cursor-blink">ENTER_COMMAND...</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainTerminal;
