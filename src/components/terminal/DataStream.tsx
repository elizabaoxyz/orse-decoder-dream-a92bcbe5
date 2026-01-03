import { useEffect, useState } from "react";
import { polymarketApi, WhaleTransaction } from "@/lib/api/polymarket";
import { formatDistanceToNow } from "date-fns";

const DataStream = () => {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await polymarketApi.getWhaleTransactions(20);
      setTransactions(data);
      setLoading(false);
    };

    fetchTransactions();

    // Subscribe to realtime updates
    const unsubscribe = polymarketApi.subscribeToTransactions((newTx) => {
      setTransactions(prev => [newTx, ...prev.slice(0, 19)]);
    });

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await polymarketApi.syncData();
      const data = await polymarketApi.getWhaleTransactions(20);
      setTransactions(data);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}..${addr.slice(-2)}`;
  };

  const truncateTitle = (title: string | null, maxLen = 35) => {
    if (!title) return "Unknown";
    if (title.length <= maxLen) return title;
    return title.slice(0, maxLen) + "...";
  };

  return (
    <div className="terminal-panel border-t border-border">
      <div className="terminal-header justify-between">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary animate-pulse" />
          🐋 WHALE_TRANSACTION_FEED
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs text-terminal-accent hover:text-terminal-foreground transition-colors disabled:opacity-50"
          >
            {syncing ? "⟳ SYNCING..." : "⟳ SYNC"}
          </button>
          <span className="text-foreground">{transactions.length} TRANSACTIONS</span>
        </div>
      </div>
      <div className="p-3 overflow-hidden">
        {loading ? (
          <div className="text-center text-terminal-muted text-sm py-2">Loading whale data...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-terminal-muted text-sm py-2">
            No whale transactions. Click SYNC to fetch data.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {transactions.slice(0, 8).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-2 p-2 bg-terminal-surface/20 rounded border border-terminal-border/20 hover:border-terminal-accent/30 transition-all"
              >
                {/* Side & Outcome */}
                <div className="flex flex-col gap-0.5">
                  <span className={`font-mono text-[10px] px-1 rounded ${
                    tx.side === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.side.toUpperCase()}
                  </span>
                  <span className={`font-mono text-[10px] px-1 rounded ${
                    tx.outcome === 'YES' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {tx.outcome}
                  </span>
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-terminal-accent font-bold">
                      {formatValue(tx.total_value)}
                    </span>
                    <span className="text-terminal-muted text-[10px]">
                      {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-terminal-foreground/70 truncate text-[10px]">
                    {truncateTitle(tx.market_title)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-terminal-muted">
                    <span className="font-mono">{truncateAddress(tx.wallet_address)}</span>
                    <span>@{(tx.price * 100).toFixed(0)}¢</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataStream;
