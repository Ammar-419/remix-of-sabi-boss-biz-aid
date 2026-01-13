CREATE EXTENSION IF NOT EXISTS "pg_graphql";
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



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    total_purchases numeric(15,2) DEFAULT 0,
    last_visit timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text NOT NULL,
    expense_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    unit_price numeric(15,2) DEFAULT 0 NOT NULL,
    reorder_level integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: loans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    loan_type text NOT NULL,
    borrower_lender text NOT NULL,
    amount numeric(15,2) NOT NULL,
    due_date date,
    repayment_status text DEFAULT 'pending'::text NOT NULL,
    amount_repaid numeric(15,2) DEFAULT 0,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loans_loan_type_check CHECK ((loan_type = ANY (ARRAY['given'::text, 'taken'::text]))),
    CONSTRAINT loans_repayment_status_check CHECK ((repayment_status = ANY (ARRAY['pending'::text, 'partial'::text, 'paid'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    business_name text,
    phone text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product text NOT NULL,
    quantity integer NOT NULL,
    price numeric(15,2) NOT NULL,
    customer text,
    sale_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscription_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tier text DEFAULT 'free'::text NOT NULL,
    expires_at timestamp with time zone,
    sponsor_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscription_tiers_tier_check CHECK ((tier = ANY (ARRAY['free'::text, 'premium'::text, 'sponsored'::text])))
);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: subscription_tiers subscription_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_tiers
    ADD CONSTRAINT subscription_tiers_pkey PRIMARY KEY (id);


--
-- Name: subscription_tiers subscription_tiers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_tiers
    ADD CONSTRAINT subscription_tiers_user_id_key UNIQUE (user_id);


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inventory update_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loans update_loans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription_tiers update_subscription_tiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON public.subscription_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers Users can delete own customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: expenses Users can delete own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: inventory Users can delete own inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own inventory" ON public.inventory FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: loans Users can delete own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own loans" ON public.loans FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: sales Users can delete own sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own sales" ON public.sales FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: customers Users can insert own customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: expenses Users can insert own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: inventory Users can insert own inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own inventory" ON public.inventory FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: loans Users can insert own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: sales Users can insert own sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own sales" ON public.sales FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscription_tiers Users can insert own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own subscription" ON public.subscription_tiers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: customers Users can update own customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: inventory Users can update own inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own inventory" ON public.inventory FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: loans Users can update own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: subscription_tiers Users can update own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own subscription" ON public.subscription_tiers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: customers Users can view own customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: expenses Users can view own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: inventory Users can view own inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loans Users can view own loans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sales Users can view own sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sales" ON public.sales FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscription_tiers Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.subscription_tiers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: loans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;