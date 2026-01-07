import { useEffect, useState } from 'react';
import { polymarketApi, WhaleTransaction } from '@/lib/api/polymarket';
import { formatDistanceToNow } from 'date-fns';

export const WhaleTransactionFeed = () => {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await polymarketApi.getWhaleTransactions(30);
      setTransactions(data);
      setLoading(false);
    };

    fetchTransactions();

    // Subscribe to realtime updates
    const unsubscribe = polymarketApi.subscribeToTransactions((newTx) => {
      setTransactions(prev => [newTx, ...prev.slice(0, 29)]);
    });

    return unsubscribe;
  }, []);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-terminal-surface/30 animate-pulse rounded border border-terminal-border/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-terminal-muted">
          <p>No whale transactions yet.</p>
          <p className="text-sm mt-2">Click "SYNC DATA" to fetch latest trades.</p>
        </div>
      ) : (
        transactions.map((tx, index) => (
          <div
            key={tx.id}
            className="p-3 bg-terminal-surface/20 border border-terminal-border/30 rounded hover:bg-terminal-surface/40 transition-all group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  tx.side === 'buy' 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {tx.side.toUpperCase()}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  tx.outcome === 'YES' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {tx.outcome}
                </span>
                <span className="text-terminal-accent font-bold">
                  {formatValue(tx.total_value)}
                </span>
              </div>
              <span className="text-terminal-muted text-xs">
                {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-terminal-foreground/80 line-clamp-1 mb-1">
              {tx.market_title || 'Unknown Market'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-terminal-muted">
              <span className="font-mono">{truncateAddress(tx.wallet_address)}</span>
              <span>@ {(tx.price * 100).toFixed(1)}¢</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
