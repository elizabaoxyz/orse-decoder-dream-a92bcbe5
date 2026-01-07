CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: market_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id text NOT NULL,
    title text NOT NULL,
    yes_price numeric(10,4) NOT NULL,
    no_price numeric(10,4) NOT NULL,
    volume_24h numeric(20,2),
    liquidity numeric(20,2),
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whale_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whale_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_hash text NOT NULL,
    wallet_address text NOT NULL,
    market_id text NOT NULL,
    market_title text,
    side text NOT NULL,
    outcome text NOT NULL,
    amount numeric(20,6) NOT NULL,
    price numeric(10,4) NOT NULL,
    total_value numeric(20,2) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whale_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whale_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_address text NOT NULL,
    label text,
    total_volume numeric(20,2) DEFAULT 0,
    win_rate numeric(5,2),
    last_active timestamp with time zone,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    username text,
    display_name text,
    positions_value numeric DEFAULT 0,
    total_pnl numeric DEFAULT 0,
    percent_pnl numeric DEFAULT 0,
    active_positions integer DEFAULT 0,
    profile_image text
);


--
-- Name: market_snapshots market_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_snapshots
    ADD CONSTRAINT market_snapshots_pkey PRIMARY KEY (id);


--
-- Name: whale_transactions whale_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whale_transactions
    ADD CONSTRAINT whale_transactions_pkey PRIMARY KEY (id);


--
-- Name: whale_transactions whale_transactions_transaction_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whale_transactions
    ADD CONSTRAINT whale_transactions_transaction_hash_key UNIQUE (transaction_hash);


--
-- Name: whale_wallets whale_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whale_wallets
    ADD CONSTRAINT whale_wallets_pkey PRIMARY KEY (id);


--
-- Name: whale_wallets whale_wallets_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whale_wallets
    ADD CONSTRAINT whale_wallets_wallet_address_key UNIQUE (wallet_address);


--
-- Name: idx_whale_transactions_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whale_transactions_amount ON public.whale_transactions USING btree (total_value DESC);


--
-- Name: idx_whale_transactions_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whale_transactions_timestamp ON public.whale_transactions USING btree ("timestamp" DESC);


--
-- Name: idx_whale_transactions_wallet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whale_transactions_wallet ON public.whale_transactions USING btree (wallet_address);


--
-- Name: idx_whale_wallets_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whale_wallets_username ON public.whale_wallets USING btree (username);


--
-- Name: market_snapshots Anyone can view market snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view market snapshots" ON public.market_snapshots FOR SELECT USING (true);


--
-- Name: whale_transactions Anyone can view whale transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view whale transactions" ON public.whale_transactions FOR SELECT USING (true);


--
-- Name: whale_wallets Anyone can view whale wallets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view whale wallets" ON public.whale_wallets FOR SELECT USING (true);


--
-- Name: market_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: whale_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whale_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: whale_wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whale_wallets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;