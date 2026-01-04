import { useState, useEffect } from "react";
import Header from "@/components/terminal/Header";
import DiagnosticsPanel from "@/components/terminal/DiagnosticsPanel";
import MainTerminal from "@/components/terminal/MainTerminal";
import WhaleStatsPanel from "@/components/whale/WhaleStatsPanel";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";
import MobileNav from "@/components/mobile/MobileNav";
import MobileAgentCard from "@/components/mobile/MobileAgentCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("home");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Set up realtime subscription to check connection status
    const channel = supabase
      .channel('connection-check')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whale_transactions' }, () => {})
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col scanlines noise crt-flicker">
        {/* Fixed Header */}
        <Header />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-16">
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

          {activeTab === "agent" && (
            <div className="terminal-panel relative min-h-full">
              <AsciiMouseEffect />
              <div className="terminal-header">🤖 AI_AGENT</div>
              <MobileAgentCard isConnected={isConnected} />
            </div>
          )}
        </div>

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
    </div>
  );
};

export default Index;