import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { polymarketApi, WhaleAnalytics } from '@/lib/api/polymarket';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Activity, BarChart3, Clock, Wallet } from 'lucide-react';

interface WhaleDetailModalProps {
  walletAddress: string | null;
  onClose: () => void;
}

export const WhaleDetailModal = ({ walletAddress, onClose }: WhaleDetailModalProps) => {
  const [analytics, setAnalytics] = useState<WhaleAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      setLoading(true);
      polymarketApi.getWhaleAnalytics(walletAddress).then((data) => {
        setAnalytics(data);
        setLoading(false);
      });
    }
  }, [walletAddress]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Dialog open={!!walletAddress} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-terminal-background border-terminal-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-terminal-foreground">
            <Wallet className="w-5 h-5 text-terminal-accent" />
            <span className="font-mono">{walletAddress ? truncateAddress(walletAddress) : ''}</span>
            {analytics?.label && (
              <span className="text-sm bg-terminal-accent/20 text-terminal-accent px-2 py-0.5 rounded">
                {analytics.label}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-terminal-surface/30 animate-pulse rounded" />
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={<BarChart3 className="w-4 h-4" />}
                label="TOTAL_VOLUME"
                value={formatValue(analytics.total_volume)}
                color="text-terminal-accent"
              />
              <StatCard
                icon={<Activity className="w-4 h-4" />}
                label="TRADE_COUNT"
                value={analytics.total_trades.toString()}
                color="text-blue-400"
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="AVG_TRADE"
                value={formatValue(analytics.avg_trade_size)}
                color="text-purple-400"
              />
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="WIN_RATE"
                value={analytics.win_rate ? `${analytics.win_rate.toFixed(1)}%` : 'N/A'}
                color={analytics.win_rate && analytics.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}
              />
            </div>

            {/* Trading Behavior */}
            <div className="p-4 bg-terminal-surface/20 border border-terminal-border/30 rounded-lg">
              <h3 className="text-sm font-semibold text-terminal-foreground mb-3">TRADING_BEHAVIOR_ANALYSIS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-terminal-muted mb-1">
                    <span>Buy vs Sell</span>
                    <span>{analytics.buy_count} / {analytics.sell_count}</span>
                  </div>
                  <div className="h-2 bg-terminal-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      style={{ 
                        width: `${analytics.buy_count + analytics.sell_count > 0 
                          ? (analytics.buy_count / (analytics.buy_count + analytics.sell_count)) * 100 
                          : 50}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-400">BUY</span>
                    <span className="text-red-400">SELL</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-terminal-muted mb-1">
                    <span>YES vs NO</span>
                    <span>{analytics.yes_count} / {analytics.no_count}</span>
                  </div>
                  <div className="h-2 bg-terminal-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ 
                        width: `${analytics.yes_count + analytics.no_count > 0 
                          ? (analytics.yes_count / (analytics.yes_count + analytics.no_count)) * 100 
                          : 50}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-blue-400">YES</span>
                    <span className="text-orange-400">NO</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-terminal-muted mt-4 pt-3 border-t border-terminal-border/30">
                <span>First Active: {formatDistanceToNow(new Date(analytics.first_seen), { addSuffix: true })}</span>
                <span>Last Active: {formatDistanceToNow(new Date(analytics.last_active), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Preferred Markets */}
            <div className="p-4 bg-terminal-surface/20 border border-terminal-border/30 rounded-lg">
              <h3 className="text-sm font-semibold text-terminal-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-terminal-accent" />
                PREFERRED_MARKETS (Top {analytics.preferred_markets.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {analytics.preferred_markets.map((market, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-terminal-background/50 border border-terminal-border/20 rounded hover:border-terminal-accent/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm text-terminal-foreground line-clamp-1 flex-1">
                        {market.market_title}
                      </p>
                      <span className="text-terminal-accent font-bold text-sm whitespace-nowrap">
                        {formatValue(market.total_volume)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-terminal-muted">
                      <span>{market.trade_count} trades</span>
                      <span>•</span>
                      <span>Avg {formatValue(market.avg_trade_size)}</span>
                      <span>•</span>
                      <span className={market.dominant_side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                        {market.dominant_side === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                      <span className={market.dominant_outcome === 'YES' ? 'text-blue-400' : 'text-orange-400'}>
                        {market.dominant_outcome}
                      </span>
                    </div>
                  </div>
                ))}
                {analytics.preferred_markets.length === 0 && (
                  <p className="text-center text-terminal-muted py-4">No trading records</p>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="p-4 bg-terminal-surface/20 border border-terminal-border/30 rounded-lg">
              <h3 className="text-sm font-semibold text-terminal-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                RECENT_TRANSACTIONS
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {analytics.recent_transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-2 bg-terminal-background/50 border border-terminal-border/20 rounded flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        tx.side.toLowerCase() === 'buy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.side.toUpperCase()}
                      </span>
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        tx.outcome === 'YES' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {tx.outcome}
                      </span>
                      <span className="text-xs text-terminal-muted line-clamp-1 max-w-[200px]">
                        {tx.market_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-terminal-accent font-bold">{formatValue(tx.total_value)}</span>
                      <span className="text-terminal-muted">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-terminal-muted">
            Unable to load data
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StatCard = ({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
}) => (
  <div className="p-3 bg-terminal-surface/20 border border-terminal-border/30 rounded-lg">
    <div className="flex items-center gap-2 text-terminal-muted mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
);
