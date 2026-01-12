import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, Activity, DollarSign, Target, Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { WhaleDetailModal } from './WhaleDetailModal';
import { useTranslation } from 'react-i18next';

interface WhaleStatsPanelProps {
  showStatsOnly?: boolean;
  showWalletsOnly?: boolean;
}

interface WhaleWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  username: string | null;
  display_name: string | null;
  total_volume: number | null;
  win_rate: number | null;
  last_active: string | null;
  is_featured: boolean | null;
  positions_value: number | null;
  total_pnl: number | null;
  percent_pnl: number | null;
  active_positions: number | null;
  profile_image: string | null;
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

export const WhaleStatsPanel = ({ showStatsOnly = false, showWalletsOnly = false }: WhaleStatsPanelProps) => {
  const { t } = useTranslation();
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
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const { data: transactions, count } = await supabase
        .from('whale_transactions')
        .select('wallet_address, side, total_value, outcome, timestamp', { count: 'exact' })
        .gte('timestamp', dayAgo)
        .order('timestamp', { ascending: false })
        .limit(1000);

      const { data: walletData } = await supabase
        .from('whale_wallets')
        .select('*')
        .order('total_volume', { ascending: false });

      if (walletData) {
        const filteredWallets = walletData
          .filter(w => w.label && w.label.toLowerCase() !== 'unknown')
          .slice(0, 15);
        setWallets(filteredWallets);
      }

      const recent = transactions || [];

      if (recent.length > 0) {
        const buys = recent.filter(tx => tx.side === 'buy');
        const sells = recent.filter(tx => tx.side === 'sell');
        const yesOutcomes = recent.filter(tx => tx.outcome === 'YES');
        const noOutcomes = recent.filter(tx => tx.outcome === 'NO');

        setStats({
          totalVolume24h: recent.reduce((sum, tx) => sum + tx.total_value, 0),
          totalTransactions: count ?? recent.length,
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
    toast.success(t('addressCopied'));
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const totalBuySell = stats.buyVolume + stats.sellVolume;
  const buyPercent = totalBuySell > 0 ? (stats.buyVolume / totalBuySell) * 100 : 50;
  
  const totalYesNo = stats.yesVolume + stats.noVolume;
  const yesPercent = totalYesNo > 0 ? (stats.yesVolume / totalYesNo) * 100 : 50;

  // Show only wallets
  if (showWalletsOnly) {
    return (
      <div className="space-y-4">
        <div className="p-2 md:p-4 bg-card/50 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
            <Users className="w-4 h-4" />
            {t('whaleWalletsCount')} ({wallets.length})
          </div>
          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  onClick={() => setSelectedWallet(wallet)}
                  className="p-3 bg-background/50 border border-border/30 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {wallet.profile_image ? (
                        <img 
                          src={wallet.profile_image} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : wallet.is_featured ? (
                        <span className="text-base">🐋</span>
                      ) : null}
                      <div className="flex flex-col min-w-0">
                        {wallet.username ? (
                          <span className="font-bold text-primary text-xs truncate">
                            @{wallet.username}
                          </span>
                        ) : (
                          <span className="font-bold text-foreground text-xs truncate">
                            {formatAddress(wallet.wallet_address)}
                          </span>
                        )}
                        {wallet.display_name && wallet.username && (
                          <span className="text-[9px] text-muted-foreground truncate">
                            {wallet.display_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary flex-shrink-0">
                      {formatValue(wallet.total_volume || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {formatAddress(wallet.wallet_address)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyAddress(wallet.wallet_address); }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {copiedAddress === wallet.wallet_address ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                      <a
                        href={wallet.username ? `https://polymarket.com/@${wallet.username}` : `https://polymarket.com/profile/${wallet.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-primary" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t('noWhaleWallets')}
            </div>
          )}
        </div>
        <WhaleDetailModal 
          walletAddress={selectedWallet?.wallet_address || null} 
          onClose={() => setSelectedWallet(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            {t('volume24h')}
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            {formatValue(stats.totalVolume24h)}
          </div>
        </div>

        <div className="p-2 md:p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            {t('txs')}
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-blue-400">
            {stats.totalTransactions}
          </div>
        </div>

        <div className="p-2 md:p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {t('whales')}
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-purple-400">
            {stats.activeWhales}
          </div>
        </div>

        <div className="p-2 md:p-3 bg-card/50 border border-border/50 space-y-1">
          <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            {t('avg')}
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-yellow-400">
            {formatValue(stats.avgTradeSize)}
          </div>
        </div>
      </div>

      {/* Buy/Sell & Yes/No Sentiment Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <div className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              {t('buyPressure')}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              {t('sellPressure')}
              <TrendingDown className="w-3 h-3 text-red-500" />
            </span>
          </div>
          <div className="h-4 bg-muted/30 rounded-full overflow-hidden flex">
            <div 
              className="bg-primary/80 transition-all duration-500"
              style={{ width: `${buyPercent}%` }}
            />
            <div 
              className="bg-red-500/80 transition-all duration-500"
              style={{ width: `${100 - buyPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-primary">{formatValue(stats.buyVolume)} ({buyPercent.toFixed(0)}%)</span>
            <span className="text-red-500">{formatValue(stats.sellVolume)} ({(100 - buyPercent).toFixed(0)}%)</span>
          </div>
        </div>

        <div className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-500" />
              {t('yesOutcome')}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              {t('noOutcome')}
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
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="p-3 bg-primary/10 border border-primary/30 space-y-1">
          <div className="flex items-center gap-2 text-xs text-primary">
            <TrendingUp className="w-3 h-3" />
            {t('largestBuy')}
          </div>
          <div className="text-lg font-bold font-mono text-primary">
            {formatValue(stats.topBuy)}
          </div>
        </div>

        <div className="p-3 bg-red-500/10 border border-red-500/30 space-y-1">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <TrendingDown className="w-3 h-3" />
            {t('largestSell')}
          </div>
          <div className="text-lg font-bold font-mono text-red-500">
            {formatValue(stats.topSell)}
          </div>
        </div>
      </div>

      {/* Whale Wallets List - hidden if showStatsOnly */}
      {!showStatsOnly && (
        <div className="p-2 md:p-4 bg-card/50 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
            <Users className="w-4 h-4" />
            {t('whaleWalletsCount')} ({wallets.length})
          </div>
          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  onClick={() => setSelectedWallet(wallet)}
                  className="p-3 md:p-4 bg-background/50 border border-border/30 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {wallet.profile_image ? (
                        <img 
                          src={wallet.profile_image} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : wallet.is_featured ? (
                        <span className="text-base md:text-lg">🐋</span>
                      ) : null}
                      <div className="flex flex-col min-w-0">
                        {wallet.username ? (
                          <span className="font-bold text-primary text-xs md:text-sm truncate">
                            @{wallet.username}
                          </span>
                        ) : (
                          <span className="font-bold text-foreground text-xs md:text-sm truncate">
                            {formatAddress(wallet.wallet_address)}
                          </span>
                        )}
                        {wallet.display_name && wallet.username && (
                          <span className="text-[9px] md:text-[10px] text-muted-foreground truncate">
                            {wallet.display_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyAddress(wallet.wallet_address); }}
                      className="p-1.5 hover:bg-muted rounded transition-colors"
                      title="Copy address"
                    >
                      {copiedAddress === wallet.wallet_address ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-2 md:mb-3">
                    <span className="text-[10px] md:text-xs text-muted-foreground">{t('volumeLabel')}:</span>
                    <span className="font-mono text-xs md:text-sm font-bold text-primary">
                      {formatValue(wallet.total_volume || 0)}
                    </span>
                  </div>
                  <div className="p-1.5 md:p-2 bg-muted/20 rounded text-[8px] md:text-[10px] font-mono text-muted-foreground break-all mb-2 md:mb-3">
                    {wallet.wallet_address}
                  </div>
                  <a
                    href={wallet.username ? `https://polymarket.com/@${wallet.username}` : `https://polymarket.com/profile/${wallet.wallet_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-1.5 md:gap-2 p-2 md:p-2.5 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-colors text-xs md:text-sm font-medium"
                  >
                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">VIEW ON </span>POLYMARKET
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t('noWhaleWallets')}
            </div>
          )}
        </div>
      )}
      {/* Whale Detail Modal */}
      <WhaleDetailModal 
        walletAddress={selectedWallet?.wallet_address || null} 
        onClose={() => setSelectedWallet(null)} 
      />
    </div>
  );
};

export default WhaleStatsPanel;
