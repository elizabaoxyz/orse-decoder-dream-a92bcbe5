import { useEffect, useState, useCallback } from "react";
import FoxMascot from "./FoxMascot";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newTradeFlash, setNewTradeFlash] = useState(false);

  const fetchWhaleData = useCallback(async () => {
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
      setWhaleActivities([
        { wallet: '0x1a2b...3c4d', market: 'Waiting for data...', side: 'BUY', amount: 0 }
      ]);
    }
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('🔄 Syncing Polymarket data...');
    
    try {
      const { data, error } = await supabase.functions.invoke('polymarket-sync');
      
      if (error) {
        throw error;
      }
      
      if (data?.success) {
        toast.success(`✅ Synced! Found ${data.transactions_found || 0} whale trades`);
        setLastSync(new Date().toLocaleTimeString());
        await fetchWhaleData();
      } else {
        toast.error(`❌ Sync failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('❌ Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchWhaleData();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('whale-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whale_transactions'
        },
        (payload) => {
          console.log('🐋 New whale transaction:', payload);
          const newTx = payload.new as any;
          
          // Flash effect for new trade
          setNewTradeFlash(true);
          setTimeout(() => setNewTradeFlash(false), 1000);
          
          // Add to top of list
          setWhaleActivities(prev => [{
            wallet: newTx.wallet_address,
            market: newTx.market_title || 'Unknown',
            side: newTx.side,
            amount: newTx.total_value
          }, ...prev.slice(0, 14)]);
          
          // Show toast for large trades
          if (newTx.total_value >= 5000) {
            toast.success(`🐋 Whale Alert: $${newTx.total_value.toLocaleString()} ${newTx.side.toUpperCase()}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Periodic refresh as backup
    const interval = setInterval(fetchWhaleData, 30000);

    const entropyTimer = setInterval(() => {
      setEntropy(0.990 + Math.random() * 0.009);
    }, 2000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      clearInterval(entropyTimer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [fetchWhaleData]);

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
              <span className="text-muted-foreground">REALTIME</span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Whale Activity */}
      <div className={`terminal-panel flex-1 overflow-hidden transition-colors ${newTradeFlash ? 'bg-primary/10' : ''}`}>
        <div className="terminal-header flex items-center justify-between">
          <span className="flex items-center gap-1">
            🐋 WHALE_LIVE
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
          </span>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'SYNCING...' : 'SYNC'}
          </button>
        </div>
        <div className="p-3 overflow-y-auto h-full max-h-[400px] scrollbar-thin">
          {lastSync && (
            <div className="text-[10px] text-muted-foreground mb-2 border-b border-border/30 pb-1">
              Last sync: {lastSync} | Auto: every 2min
            </div>
          )}
          <div className="space-y-2 text-xs">
            {whaleActivities.map((activity, idx) => (
              <div 
                key={idx} 
                className={`border-b border-border/30 pb-2 transition-all ${idx === 0 && newTradeFlash ? 'bg-primary/20 -mx-1 px-1' : ''}`}
              >
                <div className="flex justify-between">
                  <span className="text-primary font-mono">{formatWallet(activity.wallet)}</span>
                  <span className={activity.side === 'BUY' || activity.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                    {activity.side.toUpperCase()}
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
