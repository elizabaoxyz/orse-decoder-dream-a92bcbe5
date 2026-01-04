import Header from "@/components/terminal/Header";
import DiagnosticsPanel from "@/components/terminal/DiagnosticsPanel";
import MainTerminal from "@/components/terminal/MainTerminal";
import WhaleStatsPanel from "@/components/whale/WhaleStatsPanel";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col scanlines noise crt-flicker">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Diagnostics (hidden on mobile) */}
        <div className="hidden lg:block">
          <DiagnosticsPanel />
        </div>

        {/* Main Terminal Area */}
        <div className="flex-1 flex flex-col">
          <MainTerminal />
        </div>
      </div>

      {/* Whale Analytics Dashboard */}
      <div className="terminal-panel border-t border-border relative">
        <AsciiMouseEffect />
        <div className="terminal-header">🐋 WHALE_ANALYTICS_DASHBOARD</div>
        <div className="p-2 md:p-4">
          <WhaleStatsPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
