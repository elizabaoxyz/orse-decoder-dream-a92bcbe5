-- Create table to store whale transactions
CREATE TABLE public.whale_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_hash TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  market_id TEXT NOT NULL,
  market_title TEXT,
  side TEXT NOT NULL, -- 'buy' or 'sell'
  outcome TEXT NOT NULL, -- 'yes' or 'no'
  amount DECIMAL(20, 6) NOT NULL,
  price DECIMAL(10, 4) NOT NULL,
  total_value DECIMAL(20, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracked whale wallets
CREATE TABLE public.whale_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  label TEXT,
  total_volume DECIMAL(20, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2),
  last_active TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for market snapshots
CREATE TABLE public.market_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  title TEXT NOT NULL,
  yes_price DECIMAL(10, 4) NOT NULL,
  no_price DECIMAL(10, 4) NOT NULL,
  volume_24h DECIMAL(20, 2),
  liquidity DECIMAL(20, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whale_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public market data)
CREATE POLICY "Anyone can view whale transactions" 
ON public.whale_transactions FOR SELECT USING (true);

CREATE POLICY "Anyone can view whale wallets" 
ON public.whale_wallets FOR SELECT USING (true);

CREATE POLICY "Anyone can view market snapshots" 
ON public.market_snapshots FOR SELECT USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.whale_transactions;

-- Create index for faster queries
CREATE INDEX idx_whale_transactions_timestamp ON public.whale_transactions(timestamp DESC);
CREATE INDEX idx_whale_transactions_wallet ON public.whale_transactions(wallet_address);
CREATE INDEX idx_whale_transactions_amount ON public.whale_transactions(total_value DESC);