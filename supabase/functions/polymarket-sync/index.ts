import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Polymarket CLOB API endpoints
const POLYMARKET_API = 'https://clob.polymarket.com';
const GAMMA_API = 'https://gamma-api.polymarket.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch recent trades from Polymarket
    console.log('Fetching recent trades from Polymarket...');
    
    // Get active markets first
    const marketsResponse = await fetch(`${GAMMA_API}/markets?active=true&closed=false&limit=20`);
    const markets = await marketsResponse.json();
    
    console.log(`Found ${markets.length} active markets`);

    // Simulate whale transactions for demo (Polymarket API requires authentication for real trade data)
    const whaleTransactions = generateDemoWhaleTransactions(markets);
    
    // Insert transactions
    for (const tx of whaleTransactions) {
      const { error } = await supabase
        .from('whale_transactions')
        .upsert(tx, { onConflict: 'transaction_hash' });
      
      if (error) {
        console.error('Error inserting transaction:', error);
      }
    }

    // Update whale wallets
    const walletStats = aggregateWalletStats(whaleTransactions);
    for (const wallet of walletStats) {
      const { error } = await supabase
        .from('whale_wallets')
        .upsert(wallet, { onConflict: 'wallet_address' });
      
      if (error) {
        console.error('Error updating wallet:', error);
      }
    }

    // Store market snapshots
    for (const market of markets.slice(0, 10)) {
      const snapshot = {
        market_id: market.conditionId || market.id,
        title: market.question || market.title,
        yes_price: market.outcomePrices?.[0] || 0.5,
        no_price: market.outcomePrices?.[1] || 0.5,
        volume_24h: market.volume24hr || 0,
        liquidity: market.liquidity || 0,
      };

      const { error } = await supabase
        .from('market_snapshots')
        .insert(snapshot);
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting market snapshot:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactions: whaleTransactions.length,
        markets: markets.length 
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

// Generate demo whale transactions for showcase
function generateDemoWhaleTransactions(markets: any[]) {
  const whaleAddresses = [
    '0x1234...abcd',
    '0x5678...efgh',
    '0x9abc...ijkl',
    '0xdef0...mnop',
    '0x2468...qrst',
  ];

  const transactions: any[] = [];
  
  for (let i = 0; i < 15; i++) {
    const market = markets[Math.floor(Math.random() * Math.min(markets.length, 10))];
    if (!market) continue;

    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const outcome = Math.random() > 0.5 ? 'YES' : 'NO';
    const amount = Math.floor(Math.random() * 50000) + 10000; // $10k - $60k
    const price = Math.random() * 0.6 + 0.2; // 0.2 - 0.8
    
    transactions.push({
      transaction_hash: `0x${Date.now().toString(16)}${i.toString(16).padStart(4, '0')}`,
      wallet_address: whaleAddresses[Math.floor(Math.random() * whaleAddresses.length)],
      market_id: market.conditionId || market.id || `market_${i}`,
      market_title: market.question || market.title || 'Unknown Market',
      side,
      outcome,
      amount: amount / price,
      price,
      total_value: amount,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Last hour
    });
  }

  return transactions;
}

function aggregateWalletStats(transactions: any[]) {
  const walletMap = new Map();

  for (const tx of transactions) {
    const existing = walletMap.get(tx.wallet_address) || {
      wallet_address: tx.wallet_address,
      label: null,
      total_volume: 0,
      win_rate: Math.random() * 30 + 50, // 50-80% for demo
      last_active: tx.timestamp,
      is_featured: Math.random() > 0.7,
    };

    existing.total_volume += tx.total_value;
    if (new Date(tx.timestamp) > new Date(existing.last_active)) {
      existing.last_active = tx.timestamp;
    }

    walletMap.set(tx.wallet_address, existing);
  }

  return Array.from(walletMap.values());
}
