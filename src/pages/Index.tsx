import Header from "@/components/terminal/Header";
import DiagnosticsPanel from "@/components/terminal/DiagnosticsPanel";
import MainTerminal from "@/components/terminal/MainTerminal";
import DataStream from "@/components/terminal/DataStream";
import { WhaleTracker } from "@/components/whale/WhaleTracker";

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

      {/* Whale Tracker Section */}
      <div className="border-t border-terminal-border/30 p-6 bg-terminal-surface/10">
        <WhaleTracker />
      </div>

      {/* Bottom Data Stream */}
      <DataStream />
    </div>
  );
};

export default Index;
