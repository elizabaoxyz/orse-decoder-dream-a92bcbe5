-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to call polymarket-sync edge function every 6 hours
-- This ensures fresh data throughout the day
SELECT cron.schedule(
  'polymarket-sync-job',
  '0 */6 * * *',  -- Run every 6 hours (at 0:00, 6:00, 12:00, 18:00)
  $$
  SELECT net.http_post(
    url := 'https://vtddgoktkwqsvodbgrgt.supabase.co/functions/v1/polymarket-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZGRnb2t0a3dxc3ZvZGJncmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDA4NjksImV4cCI6MjA4MzMxNjg2OX0._h1OMLxFpPdk2aHHLZwLbZUA-kC1yzM8QaN0PzKZlxU'
    ),
    body := '{}'::jsonb
  );
  $$
);