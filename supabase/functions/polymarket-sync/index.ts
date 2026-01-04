import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Polymarket APIs
const GAMMA_API = 'https://gamma-api.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';

// Whale threshold - minimum trade value in USD
const WHALE_THRESHOLD = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting Polymarket whale data sync (REAL DATA)...');

    // Step 1: Fetch REAL trades from Polymarket Data API
    // Filter by CASH >= $5000 to get whale trades only
    console.log('📊 Fetching real whale trades from Data API...');
    
    const tradesUrl = `${DATA_API}/trades?limit=100&takerOnly=true&filterType=CASH&filterAmount=${WHALE_THRESHOLD}`;
    console.log('Fetching from:', tradesUrl);
    
    const tradesResponse = await fetch(tradesUrl);
    
    if (!tradesResponse.ok) {
      console.error('Data API error:', tradesResponse.status, await tradesResponse.text());
      throw new Error(`Data API returned ${tradesResponse.status}`);
    }
    
    const realTrades = await tradesResponse.json();
    console.log(`✅ Fetched ${realTrades.length} real whale trades from Data API`);

    if (realTrades.length > 0) {
      console.log('Sample trade:', JSON.stringify(realTrades[0]).slice(0, 500));
    }

    // Step 2: Transform and insert real trades
    const allTrades: any[] = [];
    const walletMap = new Map();

    for (const trade of realTrades) {
      // Calculate total value (size * price)
      const size = parseFloat(trade.size || '0');
      const price = parseFloat(trade.price || '0');
      const totalValue = size * price;
      
      // Skip if below threshold (extra safety check)
      if (totalValue < WHALE_THRESHOLD) {
        continue;
      }

      const walletAddr = (trade.proxyWallet || '').toLowerCase();
      if (!walletAddr || !walletAddr.startsWith('0x')) {
        continue;
      }

      // Use transaction hash if available, or generate unique ID
      const txHash = trade.transactionHash || `real_${trade.timestamp}_${walletAddr.slice(2, 10)}`;
      
      const transformedTrade = {
        transaction_hash: txHash,
        wallet_address: walletAddr,
        market_id: trade.conditionId || trade.asset || '',
        market_title: (trade.title || 'Unknown Market').slice(0, 200),
        side: (trade.side || 'BUY').toLowerCase(),
        outcome: trade.outcome || (trade.outcomeIndex === 0 ? 'YES' : 'NO'),
        amount: size,
        price: price,
        total_value: totalValue,
        timestamp: trade.timestamp ? new Date(trade.timestamp * 1000).toISOString() : new Date().toISOString(),
      };

      allTrades.push(transformedTrade);

      // Track wallet info
      const label = trade.pseudonym || trade.name || null;
      const existing = walletMap.get(walletAddr) || {
        wallet_address: walletAddr,
        label: label,
        total_volume: 0,
        win_rate: null,
        last_active: null,
        is_featured: !!label,
      };
      
      existing.total_volume += totalValue;
      if (label && !existing.label) {
        existing.label = label;
        existing.is_featured = true;
      }
      walletMap.set(walletAddr, existing);
    }

    console.log(`🐋 Processed ${allTrades.length} valid whale trades`);

    // Insert transactions
    let insertedCount = 0;
    for (const tx of allTrades) {
      const { error } = await supabase
        .from('whale_transactions')
        .upsert(tx, { onConflict: 'transaction_hash' });
      
      if (error) {
        console.log('Insert error:', error.message);
      } else {
        insertedCount++;
      }
    }
    
    console.log(`💾 Inserted ${insertedCount} transactions`);

    // Update wallet profiles
    let walletsUpdated = 0;
    for (const wallet of walletMap.values()) {
      const { error } = await supabase
        .from('whale_wallets')
        .upsert(wallet, { onConflict: 'wallet_address' });
      if (!error) walletsUpdated++;
    }
    
    console.log(`👛 Updated ${walletsUpdated} wallet profiles`);

    // Step 3: Fetch market data from Gamma API for snapshots
    console.log('📊 Fetching market data from Gamma API...');
    const marketsResponse = await fetch(`${GAMMA_API}/markets?active=true&closed=false&limit=50`);
    const markets = await marketsResponse.json();
    
    const activeMarkets = markets
      .filter((m: any) => parseFloat(m.volume24hr || '0') > 5000)
      .sort((a: any, b: any) => parseFloat(b.volume24hr || '0') - parseFloat(a.volume24hr || '0'));

    console.log(`✅ Found ${activeMarkets.length} active trading markets`);

    // Store market snapshots
    let snapshotsStored = 0;
    for (const market of activeMarkets.slice(0, 20)) {
      const outcomePrices = market.outcomePrices || ['0.5', '0.5'];
      
      const snapshot = {
        market_id: market.conditionId || market.id,
        title: (market.question || market.title || 'Unknown').slice(0, 500),
        yes_price: parseFloat(outcomePrices[0]) || 0.5,
        no_price: parseFloat(outcomePrices[1]) || 0.5,
        volume_24h: parseFloat(market.volume24hr || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
      };

      const { error } = await supabase.from('market_snapshots').insert(snapshot);
      if (!error) snapshotsStored++;
    }
    
    console.log(`📈 Stored ${snapshotsStored} market snapshots`);

    const result = {
      success: true,
      sync_time: new Date().toISOString(),
      data_source: 'Polymarket Data API (REAL TRADES)',
      whale_trades_fetched: realTrades.length,
      trades_inserted: insertedCount,
      wallets_tracked: walletMap.size,
      snapshots_stored: snapshotsStored,
    };
    
    console.log('✅ Sync complete:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
