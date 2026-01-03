import { useEffect, useState } from 'react';
import { polymarketApi, WhaleTransaction, WhaleWallet } from '@/lib/api/polymarket';
import { TrendingUp, TrendingDown, Users, Activity, DollarSign, Target, Zap, BarChart3 } from 'lucide-react';

interface WhaleStatsData {
  totalVolume24h: number;
  totalTransactions: number;
  activeWhales: number;
  avgWinRate: number;
  topBuy: number;
  topSell: number;
  buyVolume: number;
  sellVolume: number;
  yesVolume: number;
  noVolume: number;
  avgTradeSize: number;
  topMarkets: { title: string; volume: number }[];
}

export const WhaleStatsPanel = () => {
  const [stats, setStats] = useState<WhaleStatsData>({
    totalVolume24h: 0,
    totalTransactions: 0,
    activeWhales: 0,
    avgWinRate: 0,
    topBuy: 0,
    topSell: 0,
    buyVolume: 0,
    sellVolume: 0,
    yesVolume: 0,
    noVolume: 0,
    avgTradeSize: 0,
    topMarkets: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [transactions, wallets] = await Promise.all([
        polymarketApi.getWhaleTransactions(100),
        polymarketApi.getWhaleWallets(),
      ]);

      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recent = transactions.filter(tx => new Date(tx.timestamp) > dayAgo);
      const buys = recent.filter(tx => tx.side === 'buy');
      const sells = recent.filter(tx => tx.side === 'sell');
      const yesOutcomes = recent.filter(tx => tx.outcome === 'YES');
      const noOutcomes = recent.filter(tx => tx.outcome === 'NO');

      // Calculate top markets by volume
      const marketVolumes = new Map<string, { title: string; volume: number }>();
      recent.forEach(tx => {
        const existing = marketVolumes.get(tx.market_id) || { title: tx.market_title || 'Unknown', volume: 0 };
        existing.volume += tx.total_value;
        marketVolumes.set(tx.market_id, existing);
      });
      const topMarkets = Array.from(marketVolumes.values())
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      setStats({
        totalVolume24h: recent.reduce((sum, tx) => sum + tx.total_value, 0),
        totalTransactions: recent.length,
        activeWhales: new Set(recent.map(tx => tx.wallet_address)).size,
        avgWinRate: wallets.length > 0 
          ? wallets.reduce((sum, w) => sum + (w.win_rate || 0), 0) / wallets.length 
          : 0,
        topBuy: buys.length > 0 ? Math.max(...buys.map(tx => tx.total_value)) : 0,
        topSell: sells.length > 0 ? Math.max(...sells.map(tx => tx.total_value)) : 0,
        buyVolume: buys.reduce((sum, tx) => sum + tx.total_value, 0),
        sellVolume: sells.reduce((sum, tx) => sum + tx.total_value, 0),
        yesVolume: yesOutcomes.reduce((sum, tx) => sum + tx.total_value, 0),
        noVolume: noOutcomes.reduce((sum, tx) => sum + tx.total_value, 0),
        avgTradeSize: recent.length > 0 
          ? recent.reduce((sum, tx) => sum + tx.total_value, 0) / recent.length 
          : 0,
        topMarkets,
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
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

      {/* Top Markets */}
      {stats.topMarkets.length > 0 && (
        <div className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="w-3 h-3" />
            TOP_WHALE_MARKETS
          </div>
          <div className="space-y-1">
            {stats.topMarkets.map((market, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-4">{i + 1}.</span>
                <span className="flex-1 truncate text-foreground">{market.title}</span>
                <span className="font-mono text-primary">{formatValue(market.volume)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhaleStatsPanel;
