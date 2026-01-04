-- Add P&L fields to whale_wallets for profit/loss tracking
ALTER TABLE public.whale_wallets
  ADD COLUMN IF NOT EXISTS positions_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pnl numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percent_pnl numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_positions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_image text;