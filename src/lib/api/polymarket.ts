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
  }
};
