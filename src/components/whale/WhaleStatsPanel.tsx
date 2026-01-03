import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, Activity, DollarSign, Target, Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface WhaleWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  total_volume: number | null;
  win_rate: number | null;
  last_active: string | null;
  is_featured: boolean | null;
}

interface WhaleStatsData {
  totalVolume24h: number;
  totalTransactions: number;
  activeWhales: number;
  topBuy: number;
  topSell: number;
  buyVolume: number;
  sellVolume: number;
  yesVolume: number;
  noVolume: number;
  avgTradeSize: number;
}

export const WhaleStatsPanel = () => {
  const [stats, setStats] = useState<WhaleStatsData>({
    totalVolume24h: 0,
    totalTransactions: 0,
    activeWhales: 0,
    topBuy: 0,
    topSell: 0,
    buyVolume: 0,
    sellVolume: 0,
    yesVolume: 0,
    noVolume: 0,
    avgTradeSize: 0,
  });
  const [wallets, setWallets] = useState<WhaleWallet[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WhaleWallet | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: transactions } = await supabase
        .from('whale_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      const { data: walletData } = await supabase
        .from('whale_wallets')
        .select('*')
        .order('total_volume', { ascending: false });

      if (walletData) {
        // Filter out "unknown" labels and limit to 15
        const filteredWallets = walletData
          .filter(w => w.label && w.label.toLowerCase() !== 'unknown')
          .slice(0, 15);
        setWallets(filteredWallets);
      }

      if (transactions && transactions.length > 0) {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recent = transactions.filter(tx => new Date(tx.timestamp) > dayAgo);
        const buys = recent.filter(tx => tx.side === 'buy');
        const sells = recent.filter(tx => tx.side === 'sell');
        const yesOutcomes = recent.filter(tx => tx.outcome === 'YES');
        const noOutcomes = recent.filter(tx => tx.outcome === 'NO');

        setStats({
          totalVolume24h: recent.reduce((sum, tx) => sum + tx.total_value, 0),
          totalTransactions: recent.length,
          activeWhales: new Set(recent.map(tx => tx.wallet_address)).size,
          topBuy: buys.length > 0 ? Math.max(...buys.map(tx => tx.total_value)) : 0,
          topSell: sells.length > 0 ? Math.max(...sells.map(tx => tx.total_value)) : 0,
          buyVolume: buys.reduce((sum, tx) => sum + tx.total_value, 0),
          sellVolume: sells.reduce((sum, tx) => sum + tx.total_value, 0),
          yesVolume: yesOutcomes.reduce((sum, tx) => sum + tx.total_value, 0),
          noVolume: noOutcomes.reduce((sum, tx) => sum + tx.total_value, 0),
          avgTradeSize: recent.length > 0 
            ? recent.reduce((sum, tx) => sum + tx.total_value, 0) / recent.length 
            : 0,
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied!');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const totalBuySell = stats.buyVolume + stats.sellVolume;
  const buyPercent = totalBuySell > 0 ? (stats.buyVolume / totalBuySell) * 100 : 50;
  
  const totalYesNo = stats.yesVolume + stats.noVolume;
  const yesPercent = totalYesNo > 0 ? (stats.yesVolume / totalYesNo) * 100 : 50;

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            24H_VOLUME
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            {formatValue(stats.totalVolume24h)}
          </div>
        </div>

        <div className="p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            TRANSACTIONS
          </div>
          <div className="text-xl font-bold font-mono text-blue-400">
            {stats.totalTransactions}
          </div>
        </div>

        <div className="p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            ACTIVE_WHALES
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">
            {stats.activeWhales}
          </div>
        </div>

        <div className="p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            AVG_TRADE
          </div>
          <div className="text-xl font-bold font-mono text-yellow-400">
            {formatValue(stats.avgTradeSize)}
          </div>
        </div>
      </div>

      {/* Buy/Sell & Yes/No Sentiment Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              BUY_PRESSURE
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              SELL_PRESSURE
              <TrendingDown className="w-3 h-3 text-red-500" />
            </span>
          </div>
          <div className="h-4 bg-muted/30 rounded-full overflow-hidden flex">
            <div 
              className="bg-green-500/80 transition-all duration-500"
              style={{ width: `${buyPercent}%` }}
            />
            <div 
              className="bg-red-500/80 transition-all duration-500"
              style={{ width: `${100 - buyPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-green-500">{formatValue(stats.buyVolume)} ({buyPercent.toFixed(0)}%)</span>
            <span className="text-red-500">{formatValue(stats.sellVolume)} ({(100 - buyPercent).toFixed(0)}%)</span>
          </div>
        </div>

        <div className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-500" />
              YES_OUTCOME
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              NO_OUTCOME
              <Target className="w-3 h-3 text-orange-500" />
            </span>
          </div>
          <div className="h-4 bg-muted/30 rounded-full overflow-hidden flex">
            <div 
              className="bg-blue-500/80 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div 
              className="bg-orange-500/80 transition-all duration-500"
              style={{ width: `${100 - yesPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-blue-500">{formatValue(stats.yesVolume)} ({yesPercent.toFixed(0)}%)</span>
            <span className="text-orange-500">{formatValue(stats.noVolume)} ({(100 - yesPercent).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Top Buy/Sell */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-500/10 border border-green-500/30 space-y-1">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <TrendingUp className="w-3 h-3" />
            LARGEST_BUY
          </div>
          <div className="text-lg font-bold font-mono text-green-500">
            {formatValue(stats.topBuy)}
          </div>
        </div>

        <div className="p-3 bg-red-500/10 border border-red-500/30 space-y-1">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <TrendingDown className="w-3 h-3" />
            LARGEST_SELL
          </div>
          <div className="text-lg font-bold font-mono text-red-500">
            {formatValue(stats.topSell)}
          </div>
        </div>
      </div>

      {/* Whale Wallets List */}
      <div className="p-4 bg-card/50 border border-border/50 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Users className="w-4 h-4" />
          TRACKED_WHALE_WALLETS ({wallets.length})
        </div>
        {wallets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 bg-background/50 border border-border/30 hover:border-primary/50 transition-colors"
              >
                {/* Header with label and featured badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {wallet.is_featured && <span className="text-lg">🐋</span>}
                    <span className="font-bold text-foreground text-sm">
                      {wallet.label || 'Unknown'}
                    </span>
                  </div>
                  <button
                    onClick={() => copyAddress(wallet.wallet_address)}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress === wallet.wallet_address ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">VOLUME:</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {formatValue(wallet.total_volume || 0)}
                    </span>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="p-2 bg-muted/20 rounded text-[10px] font-mono text-muted-foreground break-all mb-3">
                  {wallet.wallet_address}
                </div>

                {/* View on Polymarket Button */}
                <a
                  href={`https://polymarket.com/profile/${wallet.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  VIEW ON POLYMARKET
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            No whale wallets tracked yet. Click SYNC to fetch data.
          </div>
        )}
      </div>
    </div>
  );
};

export default WhaleStatsPanel;
