import { supabase } from '@/integrations/supabase/client';

export interface WhaleTransaction {
  id: string;
  transaction_hash: string;
  wallet_address: string;
  market_id: string;
  market_title: string | null;
  side: string;
  outcome: string;
  amount: number;
  price: number;
  total_value: number;
  timestamp: string;
  created_at: string;
}

export interface WhaleWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  username: string | null;      // @username for URL (e.g., "Martiini")
  display_name: string | null;  // Display name shown on profile (e.g., "Rotating-Mint")
  total_volume: number | null;
  win_rate: number | null;
  last_active: string | null;
  is_featured: boolean | null;
  created_at: string;
}

export interface MarketSnapshot {
  id: string;
  market_id: string;
  title: string;
  yes_price: number;
  no_price: number;
  volume_24h: number | null;
  liquidity: number | null;
  recorded_at: string;
}

export interface WhaleMarketPreference {
  market_title: string;
  trade_count: number;
  total_volume: number;
  avg_trade_size: number;
  last_traded: string;
  dominant_side: 'buy' | 'sell';
  dominant_outcome: 'YES' | 'NO';
}

export interface WhaleAnalytics {
  wallet_address: string;
  label: string | null;
  total_volume: number;
  total_trades: number;
  avg_trade_size: number;
  win_rate: number | null;
  buy_count: number;
  sell_count: number;
  yes_count: number;
  no_count: number;
  first_seen: string;
  last_active: string;
  preferred_markets: WhaleMarketPreference[];
  recent_transactions: WhaleTransaction[];
}

export const polymarketApi = {
  // Trigger sync from Polymarket
  async syncData(): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.functions.invoke('polymarket-sync');
    
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, ...data };
  },

  // Get recent whale transactions
  async getWhaleTransactions(limit = 50): Promise<WhaleTransaction[]> {
    const { data, error } = await supabase
      .from('whale_transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching whale transactions:', error);
      return [];
    }
    return data || [];
  },

  // Get tracked whale wallets
  async getWhaleWallets(): Promise<WhaleWallet[]> {
    const { data, error } = await supabase
      .from('whale_wallets')
      .select('*')
      .order('total_volume', { ascending: false });

    if (error) {
      console.error('Error fetching whale wallets:', error);
      return [];
    }
    return data || [];
  },

  // Get market snapshots
  async getMarketSnapshots(limit = 20): Promise<MarketSnapshot[]> {
    const { data, error } = await supabase
      .from('market_snapshots')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching market snapshots:', error);
      return [];
    }
    return data || [];
  },

  // Subscribe to realtime whale transactions
  subscribeToTransactions(callback: (tx: WhaleTransaction) => void) {
    const channel = supabase
      .channel('whale-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whale_transactions'
        },
        (payload) => {
          callback(payload.new as WhaleTransaction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get detailed whale analytics for a specific wallet
  async getWhaleAnalytics(walletAddress: string): Promise<WhaleAnalytics | null> {
    // Get wallet info
    const { data: wallet, error: walletError } = await supabase
      .from('whale_wallets')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (walletError || !wallet) {
      console.error('Error fetching wallet:', walletError);
      return null;
    }

    // Get all transactions for this wallet
    const { data: transactions, error: txError } = await supabase
      .from('whale_transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('timestamp', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return null;
    }

    const txList = transactions || [];

    // Calculate analytics
    const buyCount = txList.filter(tx => tx.side.toLowerCase() === 'buy').length;
    const sellCount = txList.filter(tx => tx.side.toLowerCase() === 'sell').length;
    const yesCount = txList.filter(tx => tx.outcome === 'YES').length;
    const noCount = txList.filter(tx => tx.outcome === 'NO').length;
    const totalVolume = txList.reduce((sum, tx) => sum + (tx.total_value || 0), 0);
    const avgTradeSize = txList.length > 0 ? totalVolume / txList.length : 0;

    // Group by market to get preferences
    const marketMap = new Map<string, {
      trades: typeof txList;
      volume: number;
    }>();

    txList.forEach(tx => {
      const title = tx.market_title || 'Unknown Market';
      const existing = marketMap.get(title) || { trades: [], volume: 0 };
      existing.trades.push(tx);
      existing.volume += tx.total_value || 0;
      marketMap.set(title, existing);
    });

    const preferredMarkets: WhaleMarketPreference[] = Array.from(marketMap.entries())
      .map(([market_title, data]) => {
        const buys = data.trades.filter(t => t.side.toLowerCase() === 'buy').length;
        const sells = data.trades.filter(t => t.side.toLowerCase() === 'sell').length;
        const yeses = data.trades.filter(t => t.outcome === 'YES').length;
        const nos = data.trades.filter(t => t.outcome === 'NO').length;
        const latestTrade = data.trades.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        return {
          market_title,
          trade_count: data.trades.length,
          total_volume: data.volume,
          avg_trade_size: data.volume / data.trades.length,
          last_traded: latestTrade?.timestamp || '',
          dominant_side: buys >= sells ? 'buy' : 'sell',
          dominant_outcome: yeses >= nos ? 'YES' : 'NO'
        } as WhaleMarketPreference;
      })
      .sort((a, b) => b.total_volume - a.total_volume)
      .slice(0, 10);

    const timestamps = txList.map(tx => new Date(tx.timestamp).getTime());
    const firstSeen = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : wallet.created_at;
    const lastActive = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : wallet.last_active || wallet.created_at;

    return {
      wallet_address: walletAddress,
      label: wallet.label,
      total_volume: totalVolume || wallet.total_volume || 0,
      total_trades: txList.length,
      avg_trade_size: avgTradeSize,
      win_rate: wallet.win_rate,
      buy_count: buyCount,
      sell_count: sellCount,
      yes_count: yesCount,
      no_count: noCount,
      first_seen: firstSeen,
      last_active: lastActive,
      preferred_markets: preferredMarkets,
      recent_transactions: txList.slice(0, 20)
    };
  }
};
