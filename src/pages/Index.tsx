import Header from "@/components/terminal/Header";
import DiagnosticsPanel from "@/components/terminal/DiagnosticsPanel";
import MainTerminal from "@/components/terminal/MainTerminal";
import DataStream from "@/components/terminal/DataStream";
import WhaleStatsPanel from "@/components/whale/WhaleStatsPanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col scanlines noise crt-flicker">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Diagnostics */}
        <DiagnosticsPanel />

        {/* Main Terminal Area */}
        <div className="flex-1 flex flex-col">
          <MainTerminal />
        </div>
      </div>

      {/* Bottom Data Stream - Whale Transactions */}
      <DataStream />

      {/* Whale Analytics Dashboard - Below Transaction Feed */}
      <div className="terminal-panel border-t border-border">
        <div className="terminal-header">🐋 WHALE_ANALYTICS_DASHBOARD</div>
        <div className="p-4">
          <WhaleStatsPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
