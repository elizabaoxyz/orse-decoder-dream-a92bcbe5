-- Add explicit profile fields so we can show BOTH @username and display name
ALTER TABLE public.whale_wallets
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS display_name text;

-- Backfill display_name from the existing label (which currently stores the visible pseudonym)
UPDATE public.whale_wallets
SET display_name = COALESCE(display_name, label)
WHERE display_name IS NULL;

-- Helpful index for lookups/ordering
CREATE INDEX IF NOT EXISTS idx_whale_wallets_username ON public.whale_wallets (username);
