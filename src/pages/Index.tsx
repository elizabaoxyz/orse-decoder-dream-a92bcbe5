import Header from "@/components/terminal/Header";
import DiagnosticsPanel from "@/components/terminal/DiagnosticsPanel";
import MainTerminal from "@/components/terminal/MainTerminal";
import DataStream from "@/components/terminal/DataStream";
import MarketList from "@/components/terminal/MarketList";

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

        {/* Right Sidebar - Markets */}
        <aside className="w-72 border-l border-border bg-card hidden lg:block">
          <MarketList />
        </aside>
      </div>

      {/* Bottom Data Stream - Now shows Whale Transactions */}
      <DataStream />
    </div>
  );
};

export default Index;
