import { supabase } from '@/integrations/supabase/client';

export interface BuilderTrade {
  id: string;
  tradeType: string;
  takerOrderHash: string;
  builder: string;
  market: string;
  assetId: string;
  side: string;
  size: string;
  sizeUsdc: string;
  price: string;
  status: string;
  outcome: string;
  outcomeIndex: number;
  owner: string;
  maker: string;
  transactionHash: string;
  matchTime: string;
  bucketIndex: number;
  fee: string;
  feeUsdc: string;
  err_msg?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BuilderTradesPaginatedResponse {
  trades: BuilderTrade[];
  next_cursor: string;
  limit: number;
  count: number;
}

export interface BuilderStats {
  totalTrades: number;
  totalVolumeUsdc: string;
  totalFeesUsdc: string;
  uniqueMarkets: number;
  uniqueUsers: number;
}

export interface HealthCheckResponse {
  connected: boolean;
  builderApiConfigured: boolean;
  chainId: number;
  endpoint: string;
}

export interface TradeParams {
  id?: string;
  maker_address?: string;
  market?: string;
  asset_id?: string;
  before?: string;
  after?: string;
  limit?: number;
}

export const polymarketBuilderApi = {
  // Health check to verify builder API connection
  async healthCheck(): Promise<HealthCheckResponse> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: { action: 'healthCheck' }
    });

    if (error) {
      console.error('Health check error:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Health check failed');
    }

    return data.data;
  },

  // Get all trades attributed to this builder
  async getBuilderTrades(params: TradeParams = {}): Promise<BuilderTradesPaginatedResponse> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getBuilderTrades',
        params
      }
    });

    if (error) {
      console.error('Error fetching builder trades:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch builder trades');
    }

    return data.data;
  },

  // Get aggregated builder statistics
  async getBuilderStats(): Promise<BuilderStats> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: { action: 'getBuilderStats' }
    });

    if (error) {
      console.error('Error fetching builder stats:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch builder stats');
    }

    return data.data;
  },

  // Get markets list
  async getMarkets(limit = 100, offset = 0): Promise<unknown[]> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getMarkets',
        params: { limit, offset }
      }
    });

    if (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch markets');
    }

    // Handle different response formats
    const markets = data.data;
    if (Array.isArray(markets)) return markets;
    if (markets?.data && Array.isArray(markets.data)) return markets.data;
    if (markets?.markets && Array.isArray(markets.markets)) return markets.markets;
    return [];
  },

  // Get order book for a token
  async getOrderBook(tokenId: string): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getOrderBook',
        params: { tokenId }
      }
    });

    if (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch order book');
    }

    return data.data;
  },

  // Get price history for a token
  async getPriceHistory(tokenId: string, interval = '1d'): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getPriceHistory',
        params: { tokenId, interval }
      }
    });

    if (error) {
      console.error('Error fetching price history:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch price history');
    }

    return data.data;
  },

  // Get last trade price
  async getLastTradePrice(tokenId: string): Promise<string | null> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getLastTradePrice',
        params: { tokenId }
      }
    });

    if (error) {
      console.error('Error fetching last trade price:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch last trade price');
    }

    return data.data?.price || null;
  },

  // Get tick size for a token
  async getTickSize(tokenId: string): Promise<string | null> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getTickSize',
        params: { tokenId }
      }
    });

    if (error) {
      console.error('Error fetching tick size:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch tick size');
    }

    return data.data;
  },

  // Get neg risk status
  async getNegRisk(tokenId: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: {
        action: 'getNegRisk',
        params: { tokenId }
      }
    });

    if (error) {
      console.error('Error fetching neg risk:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch neg risk');
    }

    return data.data?.neg_risk ?? false;
  },

  // Revoke builder API key (use with caution!)
  async revokeBuilderApiKey(): Promise<{ success: boolean }> {
    const { data, error } = await supabase.functions.invoke('polymarket-builder', {
      body: { action: 'revokeBuilderApiKey' }
    });

    if (error) {
      console.error('Error revoking builder API key:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to revoke builder API key');
    }

    return data.data;
  }
};
