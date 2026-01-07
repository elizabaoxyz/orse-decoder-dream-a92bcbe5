import { useEffect, useState } from 'react';
import { polymarketApi, WhaleTransaction, WhaleWallet } from '@/lib/api/polymarket';

export const WhaleStats = () => {
  const [stats, setStats] = useState({
    totalVolume24h: 0,
    totalTransactions: 0,
    activeWhales: 0,
    avgWinRate: 0,
    topBuy: 0,
    topSell: 0,
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

      setStats({
        totalVolume24h: recent.reduce((sum, tx) => sum + tx.total_value, 0),
        totalTransactions: recent.length,
        activeWhales: new Set(recent.map(tx => tx.wallet_address)).size,
        avgWinRate: wallets.length > 0 
          ? wallets.reduce((sum, w) => sum + (w.win_rate || 0), 0) / wallets.length 
          : 0,
        topBuy: buys.length > 0 ? Math.max(...buys.map(tx => tx.total_value)) : 0,
        topSell: sells.length > 0 ? Math.max(...sells.map(tx => tx.total_value)) : 0,
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

  const statItems = [
    { label: '24H Volume', value: formatValue(stats.totalVolume24h), color: 'text-terminal-accent' },
    { label: 'Transactions', value: stats.totalTransactions.toString(), color: 'text-blue-400' },
    { label: 'Active Whales', value: stats.activeWhales.toString(), color: 'text-purple-400' },
    { label: 'Avg Win Rate', value: `${stats.avgWinRate.toFixed(1)}%`, color: 'text-primary' },
    { label: 'Top Buy', value: formatValue(stats.topBuy), color: 'text-primary' },
    { label: 'Top Sell', value: formatValue(stats.topSell), color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((stat, index) => (
        <div
          key={stat.label}
          className="p-3 bg-terminal-surface/30 border border-terminal-border/30 rounded-lg text-center"
        >
          <div className={`text-lg font-bold font-mono ${stat.color}`}>
            {stat.value}
          </div>
          <div className="text-xs text-terminal-muted mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
