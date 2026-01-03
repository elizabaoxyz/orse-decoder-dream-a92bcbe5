import { useEffect, useState } from 'react';
import { polymarketApi, WhaleWallet } from '@/lib/api/polymarket';
import { formatDistanceToNow } from 'date-fns';

export const WhaleWalletList = () => {
  const [wallets, setWallets] = useState<WhaleWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      const data = await polymarketApi.getWhaleWallets();
      // Filter out "unknown" labels and limit to 15
      const filteredWallets = data
        .filter(w => !w.label || w.label.toLowerCase() !== 'unknown')
        .slice(0, 15);
      setWallets(filteredWallets);
      setLoading(false);
    };

    fetchWallets();
  }, []);

  const formatVolume = (volume: number | null) => {
    if (!volume) return '$0';
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-terminal-surface/30 animate-pulse rounded border border-terminal-border/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {wallets.length === 0 ? (
        <div className="text-center py-8 text-terminal-muted">
          <p>No whale wallets tracked yet.</p>
        </div>
      ) : (
        wallets.map((wallet, index) => (
          <div
            key={wallet.id}
            className="p-4 bg-terminal-surface/20 border border-terminal-border/30 rounded-lg hover:border-terminal-accent/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {wallet.is_featured && (
                  <span className="text-yellow-400 text-lg">🐋</span>
                )}
                <span className="font-mono text-terminal-foreground">
                  {truncateAddress(wallet.wallet_address)}
                </span>
                {wallet.label && (
                  <span className="text-xs bg-terminal-accent/20 text-terminal-accent px-2 py-0.5 rounded">
                    {wallet.label}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-terminal-muted block text-xs mb-1">Volume</span>
                <span className="text-terminal-accent font-bold">
                  {formatVolume(wallet.total_volume)}
                </span>
              </div>
              <div>
                <span className="text-terminal-muted block text-xs mb-1">Win Rate</span>
                <span className={`font-bold ${
                  (wallet.win_rate || 0) >= 60 ? 'text-green-400' : 
                  (wallet.win_rate || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {wallet.win_rate?.toFixed(1) || '0'}%
                </span>
              </div>
              <div>
                <span className="text-terminal-muted block text-xs mb-1">Last Active</span>
                <span className="text-terminal-foreground/70">
                  {wallet.last_active 
                    ? formatDistanceToNow(new Date(wallet.last_active), { addSuffix: true })
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
