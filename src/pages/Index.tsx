import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/terminal/Header";
import DiagnosticsPanel from "@/components/terminal/DiagnosticsPanel";
import MainTerminal from "@/components/terminal/MainTerminal";
import WhaleStatsPanel from "@/components/whale/WhaleStatsPanel";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";
import MobileNav from "@/components/mobile/MobileNav";
import FloatingChatButton from "@/components/mobile/FloatingChatButton";
import { useIsMobile } from "@/hooks/use-mobile";

const Footer = () => (
  <footer className="border-t border-border bg-card/50 px-4 py-3 text-center">
    <Link
      to="/legal/transparency"
      className="text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest"
    >
      Transparency / History
    </Link>
  </footer>
);

const Index = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("home");

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col scanlines noise crt-flicker">
        {/* Fixed Header */}
        <Header />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-20">
          {activeTab === "home" && (
            <MainTerminal />
          )}

          {activeTab === "whale" && (
            <div className="terminal-panel relative min-h-full">
              <AsciiMouseEffect />
              <div className="terminal-header">🐋 WHALE_ANALYTICS</div>
              <div className="p-3">
                <WhaleStatsPanel showStatsOnly={true} />
              </div>
            </div>
          )}

          {activeTab === "wallets" && (
            <div className="terminal-panel relative min-h-full">
              <AsciiMouseEffect />
              <div className="terminal-header">💼 WHALE_WALLETS</div>
              <div className="p-3">
                <WhaleStatsPanel showStatsOnly={false} showWalletsOnly={true} />
              </div>
            </div>
          )}
          
          {/* Footer in mobile scroll area */}
          <Footer />
        </div>

        {/* Floating Chat Button */}
        <FloatingChatButton />

        {/* Fixed Bottom Navigation */}
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-background flex flex-col scanlines noise crt-flicker">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Diagnostics */}
        <DiagnosticsPanel />

        {/* Main Terminal Area */}
        <div className="flex-1 flex flex-col">
          <MainTerminal />
        </div>
      </div>

      {/* Whale Analytics Dashboard */}
      <div className="terminal-panel border-t border-border relative">
        <AsciiMouseEffect />
        <div className="terminal-header">🐋 WHALE_ANALYTICS_DASHBOARD</div>
        <div className="p-4">
          <WhaleStatsPanel />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;