import { useEffect, useState } from "react";
import FoxMascot from "./FoxMascot";
import { supabase } from "@/integrations/supabase/client";

interface WhaleActivity {
  wallet: string;
  market: string;
  side: string;
  amount: number;
}

const DiagnosticsPanel = () => {
  const [entropy, setEntropy] = useState(0.999);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [whaleActivities, setWhaleActivities] = useState<WhaleActivity[]>([]);

  useEffect(() => {
    // Fetch whale transactions
    const fetchWhaleData = async () => {
      const { data } = await supabase
        .from('whale_transactions')
        .select('wallet_address, market_title, side, total_value')
        .order('timestamp', { ascending: false })
        .limit(15);
      
      if (data && data.length > 0) {
        setWhaleActivities(data.map(tx => ({
          wallet: tx.wallet_address,
          market: tx.market_title || 'Unknown',
          side: tx.side,
          amount: tx.total_value
        })));
      } else {
        // Show placeholder if no real data
        setWhaleActivities([
          { wallet: '0x1a2b...3c4d', market: 'Awaiting data...', side: 'BUY', amount: 0 }
        ]);
      }
    };
    
    fetchWhaleData();
    const interval = setInterval(fetchWhaleData, 30000);

    const entropyTimer = setInterval(() => {
      setEntropy(0.990 + Math.random() * 0.009);
    }, 2000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearInterval(interval);
      clearInterval(entropyTimer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const formatWallet = (address: string) => {
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const formatMarket = (title: string) => {
    if (title.length > 18) {
      return title.slice(0, 18) + '...';
    }
    return title;
  };

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      {/* elizaOS Deploy */}
      <div className="terminal-panel flex-shrink-0">
        <div className="terminal-header">elizaOS Deploy</div>
        <div className="p-4">
          <FoxMascot />
          <div className="space-y-2 text-xs mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ElizaOS</span>
              <span className="text-foreground">MCP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plugins</span>
              <span className="text-foreground">Polymarket</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FREQ</span>
              <span className="text-foreground">145.8MHZ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ENTROPY</span>
              <span className="text-foreground">{entropy.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MOUSE_X</span>
              <span className="text-foreground">{mousePos.x}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MOUSE_Y</span>
              <span className="text-foreground">{mousePos.y}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Whale Activity */}
      <div className="terminal-panel flex-1 overflow-hidden">
        <div className="terminal-header">🐋 WHALE_ACTIVITY</div>
        <div className="p-3 overflow-y-auto h-full max-h-[400px] scrollbar-thin">
          <div className="space-y-2 text-xs">
            {whaleActivities.map((activity, idx) => (
              <div key={idx} className="border-b border-border/30 pb-2">
                <div className="flex justify-between">
                  <span className="text-primary font-mono">{formatWallet(activity.wallet)}</span>
                  <span className={activity.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                    {activity.side}
                  </span>
                </div>
                <div className="text-muted-foreground truncate" title={activity.market}>
                  {formatMarket(activity.market)}
                </div>
                {activity.amount > 0 && (
                  <div className="text-foreground">${activity.amount.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DiagnosticsPanel;
