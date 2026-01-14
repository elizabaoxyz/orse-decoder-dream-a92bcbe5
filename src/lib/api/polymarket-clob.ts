import { supabase } from '@/integrations/supabase/client';

export interface ClobMarket {
  condition_id: string;
  question_id?: string;
  tokens: {
    token_id: string;
    outcome: string;
    price?: number;
    winner?: boolean;
  }[];
  rewards?: {
    min_size: number;
    max_spread: number;
  };
  minimum_order_size: string;
  minimum_tick_size: string;
  description?: string;
  category?: string;
  end_date_iso?: string;
  game_start_time?: string;
  question?: string;
  market_slug?: string;
  active?: boolean;
  closed?: boolean;
  accepting_orders?: boolean;
  accepting_order_timestamp?: string;
}

export interface SimplifiedMarket {
  condition_id: string;
  tokens: string[];
  rewards?: {
    min_size: number;
    max_spread: number;
  };
  min_incentive_size?: number;
  max_incentive_spread?: number;
  active: boolean;
  closed: boolean;
}

export interface PricePoint {
  t: number; // timestamp
  p: number; // price
}

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  hash: string;
  timestamp: string;
}

export interface LastTradePrice {
  price: string;
}

export const polymarketClobApi = {
  // Get all markets from CLOB API
  async getMarkets(limit = 100, offset = 0, active = true): Promise<ClobMarket[]> {
    const { data, error } = await supabase.functions.invoke('polymarket-clob', {
      body: {
        action: 'getMarkets',
        params: { limit, offset, active }
      }
    });

    if (error) {
      console.error('Error fetching CLOB markets:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch markets');
    }

    return data.data || [];
  },

  // Get simplified markets
  async getSimplifiedMarkets(limit = 100, offset = 0): Promise<SimplifiedMarket[]> {
    const { data, error } = await supabase.functions.invoke('polymarket-clob', {
      body: {
        action: 'getSimplifiedMarkets',
        params: { limit, offset }
      }
    });

    if (error) {
      console.error('Error fetching simplified markets:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch simplified markets');
    }

    return data.data || [];
  },

  // Get price history for a token
  async getPriceHistory(tokenId: string, interval = '1d'): Promise<PricePoint[]> {
    const { data, error } = await supabase.functions.invoke('polymarket-clob', {
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

    return data.data?.history || [];
  },

  // Get order book for a token
  async getOrderBook(tokenId: string): Promise<OrderBook | null> {
    const { data, error } = await supabase.functions.invoke('polymarket-clob', {
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

  // Get last trade price for a token
  async getLastTradePrice(tokenId: string): Promise<string | null> {
    const { data, error } = await supabase.functions.invoke('polymarket-clob', {
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
  }
};
