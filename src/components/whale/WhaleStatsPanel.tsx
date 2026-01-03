import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, Activity, DollarSign, Target, Zap, ExternalLink } from 'lucide-react';

interface WhaleWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  total_volume: number | null;
  win_rate: number | null;
  last_active: string | null;
  is_featured: boolean | null;
}

interface WhaleTransaction {
  wallet_address: string;
  market_title: string | null;
  side: string;
  outcome: string;
  total_value: number;
  timestamp: string;
  market_id: string;
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

  useEffect(() => {
    const fetchData = async () => {
      // Fetch transactions
      const { data: transactions } = await supabase
        .from('whale_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      // Fetch wallets
      const { data: walletData } = await supabase
        .from('whale_wallets')
        .select('*')
        .order('total_volume', { ascending: false });

      if (walletData) {
        setWallets(walletData);
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

  const getPolygonScanUrl = (address: string) => {
    return `https://polygonscan.com/address/${address}`;
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
        {/* Buy vs Sell */}
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

        {/* Yes vs No Outcome */}
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
      <div className="p-3 bg-card/50 border border-border/50 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          TRACKED_WHALE_WALLETS ({wallets.length})
        </div>
        {wallets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto scrollbar-thin">
            {wallets.map((wallet) => (
              <a
                key={wallet.id}
                href={getPolygonScanUrl(wallet.wallet_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-background/50 border border-border/30 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary text-xs">
                    {formatAddress(wallet.wallet_address)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="font-mono text-xs text-foreground">
                  {formatValue(wallet.total_volume || 0)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">
            No whale wallets tracked yet. Whales appear when trades &gt;$5000 are detected.
          </div>
        )}
      </div>
    </div>
  );
};

export default WhaleStatsPanel;
