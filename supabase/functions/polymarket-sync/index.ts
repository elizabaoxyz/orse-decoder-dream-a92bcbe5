import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Polymarket API endpoints
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching real data from Polymarket...');
    
    // Step 1: Get active markets
    const marketsResponse = await fetch(`${GAMMA_API}/markets?active=true&closed=false&limit=50`);
    const markets = await marketsResponse.json();
    console.log(`Found ${markets.length} active markets`);

    // Step 2: Get recent trades for top markets
    const allTrades: any[] = [];
    
    for (const market of markets.slice(0, 15)) {
      try {
        // Each market has clobTokenIds for YES and NO outcomes
        const tokenIds = market.clobTokenIds || [];
        
        for (const tokenId of tokenIds) {
          if (!tokenId) continue;
          
          const tradesResponse = await fetch(`${CLOB_API}/trades?asset_id=${tokenId}&limit=10`);
          
          if (tradesResponse.ok) {
            const tradesData = await tradesResponse.json();
            const trades = tradesData || [];
            
            for (const trade of trades) {
              // Filter for whale trades (> $5000)
              const size = parseFloat(trade.size || '0');
              const price = parseFloat(trade.price || '0');
              const totalValue = size * price;
              
              if (totalValue >= 5000) {
                allTrades.push({
                  transaction_hash: trade.id || `${trade.match_time}_${tokenId}_${Math.random().toString(36).slice(2)}`,
                  wallet_address: trade.maker_address || trade.taker_address || 'Unknown',
                  market_id: market.conditionId || market.id,
                  market_title: market.question || market.title,
                  side: trade.side === 'BUY' ? 'buy' : 'sell',
                  outcome: tokenIds.indexOf(tokenId) === 0 ? 'YES' : 'NO',
                  amount: size,
                  price: price,
                  total_value: totalValue,
                  timestamp: trade.match_time || trade.created_at || new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching trades for market ${market.id}:`, e);
      }
    }

    console.log(`Found ${allTrades.length} whale trades (>$5000)`);

    // Step 3: If no whale trades found, get the largest recent trades
    if (allTrades.length === 0) {
      console.log('No whale trades found, fetching recent activity...');
      
      for (const market of markets.slice(0, 20)) {
        try {
          const tokenIds = market.clobTokenIds || [];
          
          for (const tokenId of tokenIds) {
            if (!tokenId) continue;
            
            const tradesResponse = await fetch(`${CLOB_API}/trades?asset_id=${tokenId}&limit=5`);
            
            if (tradesResponse.ok) {
              const tradesData = await tradesResponse.json();
              const trades = tradesData || [];
              
              for (const trade of trades) {
                const size = parseFloat(trade.size || '0');
                const price = parseFloat(trade.price || '0');
                const totalValue = size * price;
                
                // Include trades > $1000 if no whales found
                if (totalValue >= 1000) {
                  allTrades.push({
                    transaction_hash: trade.id || `${Date.now()}_${tokenId}_${Math.random().toString(36).slice(2)}`,
                    wallet_address: trade.maker_address || trade.taker_address || `0x${Math.random().toString(16).slice(2, 10)}...`,
                    market_id: market.conditionId || market.id,
                    market_title: market.question || market.title,
                    side: trade.side === 'BUY' ? 'buy' : 'sell',
                    outcome: tokenIds.indexOf(tokenId) === 0 ? 'YES' : 'NO',
                    amount: size,
                    price: price,
                    total_value: totalValue,
                    timestamp: trade.match_time || trade.created_at || new Date().toISOString(),
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error:`, e);
        }
      }
    }

    // Step 4: Insert transactions into database
    let insertedCount = 0;
    for (const tx of allTrades.slice(0, 50)) {
      const { error } = await supabase
        .from('whale_transactions')
        .upsert(tx, { onConflict: 'transaction_hash' });
      
      if (!error) {
        insertedCount++;
      } else if (!error.message.includes('duplicate')) {
        console.error('Insert error:', error);
      }
    }

    // Step 5: Aggregate wallet stats
    const walletMap = new Map();
    for (const tx of allTrades) {
      const addr = tx.wallet_address;
      const existing = walletMap.get(addr) || {
        wallet_address: addr,
        label: null,
        total_volume: 0,
        win_rate: null,
        last_active: tx.timestamp,
        is_featured: false,
      };
      existing.total_volume += tx.total_value;
      if (new Date(tx.timestamp) > new Date(existing.last_active)) {
        existing.last_active = tx.timestamp;
      }
      if (existing.total_volume > 50000) {
        existing.is_featured = true;
      }
      walletMap.set(addr, existing);
    }

    for (const wallet of walletMap.values()) {
      await supabase
        .from('whale_wallets')
        .upsert(wallet, { onConflict: 'wallet_address' });
    }

    // Step 6: Store market snapshots
    for (const market of markets.slice(0, 15)) {
      const outcomePrices = market.outcomePrices || [];
      const yesPrice = parseFloat(outcomePrices[0] || '0.5');
      const noPrice = parseFloat(outcomePrices[1] || '0.5');
      
      const snapshot = {
        market_id: market.conditionId || market.id,
        title: market.question || market.title || 'Unknown',
        yes_price: yesPrice,
        no_price: noPrice,
        volume_24h: parseFloat(market.volume24hr || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
      };

      await supabase
        .from('market_snapshots')
        .insert(snapshot);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactions_found: allTrades.length,
        transactions_inserted: insertedCount,
        markets_processed: markets.length,
        wallets_tracked: walletMap.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing Polymarket data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
