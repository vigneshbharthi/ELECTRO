-- JBS Electro Fresh Production Database Schema FOR SUPABASE
-- Run this script in your Supabase SQL Editor: https://optvzsdieukdqsrcxdzm.supabase.co

-- DROP EXISTING TABLES AND POLICIES FOR CLEAN RESET
DROP TABLE IF EXISTS public.electrician_claims CASCADE;
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.point_transactions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.order_men CASCADE;
DROP TABLE IF EXISTS public.electricians CASCADE;

-- 1. ELECTRICIANS TABLE (NO SAMPLE DATA)
CREATE TABLE public.electricians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    password TEXT NOT NULL DEFAULT '123456',
    dob DATE NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    experience INTEGER NOT NULL DEFAULT 0,
    points_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDER MEN TABLE (SALES PERSONNEL - NO SAMPLE DATA)
CREATE TABLE public.order_men (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    password TEXT NOT NULL DEFAULT 'order123',
    region TEXT NOT NULL DEFAULT 'Salem Zone',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE (ORDER MAN CATALOG - NO SAMPLE DATA)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    uom TEXT NOT NULL DEFAULT 'Nos',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POINT TRANSACTIONS / LEDGER TABLE
CREATE TABLE public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electrician_id UUID NOT NULL REFERENCES public.electricians(id) ON DELETE CASCADE,
    electrician_name TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    particular TEXT NOT NULL,
    debit_points INTEGER NOT NULL DEFAULT 0,
    credit_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REDEMPTIONS TABLE
CREATE TABLE public.redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electrician_id UUID NOT NULL REFERENCES public.electricians(id) ON DELETE CASCADE,
    electrician_name TEXT,
    electrician_mobile TEXT,
    points INTEGER NOT NULL,
    gift_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    requested_date TIMESTAMPTZ DEFAULT NOW(),
    processed_date TIMESTAMPTZ,
    remarks TEXT
);

-- 6. ELECTRICIAN POINT CLAIMS APPROVAL TABLE
CREATE TABLE public.electrician_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electrician_id UUID NOT NULL REFERENCES public.electricians(id) ON DELETE CASCADE,
    electrician_name TEXT,
    electrician_mobile TEXT,
    bill_no TEXT NOT NULL,
    bill_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    claimed_points INTEGER NOT NULL DEFAULT 0,
    invoice_image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    submitted_date TIMESTAMPTZ DEFAULT NOW(),
    processed_date TIMESTAMPTZ,
    remarks TEXT
);

-- 7. GLOBAL APPLICATION SETTINGS TABLE (single-row, cross-device sync)
CREATE TABLE public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    points_percent NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    min_bill_amount INTEGER NOT NULL DEFAULT 100,
    app_name TEXT NOT NULL DEFAULT 'JBS Electro',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INSERT THE DEFAULT SETTINGS ROW IF IT DOES NOT EXIST
INSERT INTO public.app_settings (id, points_percent, min_bill_amount, app_name)
VALUES (1, 1.00, 100, 'JBS Electro')
ON CONFLICT (id) DO NOTHING;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.electricians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_men ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrician_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- CREATE INDEXES ON FOREIGN KEYS FOR QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_point_transactions_electrician_id ON public.point_transactions(electrician_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_electrician_id ON public.redemptions(electrician_id);
CREATE INDEX IF NOT EXISTS idx_electrician_claims_electrician_id ON public.electrician_claims(electrician_id);

-- CREATE RLS POLICIES FOR FULL APP ACCESS
CREATE POLICY "Allow all access to electricians" ON public.electricians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to order_men" ON public.order_men FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to point_transactions" ON public.point_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to redemptions" ON public.redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to electrician_claims" ON public.electrician_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- GRANT PRIVILEGES TO ANON ROLE (REQUIRED - RLS policies alone are not enough)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.electricians TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_men TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redemptions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.electrician_claims TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon;
