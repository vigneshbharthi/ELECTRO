-- ELECTRO DATABASE SCHEMA FOR SUPABASE
-- Run this script in your Supabase SQL Editor: https://optvzsdieukdqsrcxdzm.supabase.co

-- 1. ELECTRICIANS TABLE
CREATE TABLE IF NOT EXISTS public.electricians (
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

-- Ensure password column exists if electricians table was created earlier without it
ALTER TABLE public.electricians ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';

-- 2. ORDER MEN TABLE (SALES PERSONNEL)
CREATE TABLE IF NOT EXISTS public.order_men (
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

-- Ensure password column exists if order_men table exists
ALTER TABLE public.order_men ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'order123';

-- 3. PRODUCTS TABLE (ORDER MAN CATALOG)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    uom TEXT NOT NULL DEFAULT 'Nos',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POINT TRANSACTIONS / LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electrician_id UUID NOT NULL REFERENCES public.electricians(id) ON DELETE CASCADE,
    electrician_name TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    particular TEXT NOT NULL,
    debit_points INTEGER NOT NULL DEFAULT 0,
    credit_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REDEMPTIONS TABLE (ADMIN SIDE)
CREATE TABLE IF NOT EXISTS public.redemptions (
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
CREATE TABLE IF NOT EXISTS public.electrician_claims (
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

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.electricians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_men ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrician_claims ENABLE ROW LEVEL SECURITY;

-- DROP POLICIES IF THEY ALREADY EXIST TO PREVENT 42710 DUPLICATE ERROR
DROP POLICY IF EXISTS "Allow all access to electricians" ON public.electricians;
DROP POLICY IF EXISTS "Allow all access to order_men" ON public.order_men;
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow all access to point_transactions" ON public.point_transactions;
DROP POLICY IF EXISTS "Allow all access to redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Allow all access to electrician_claims" ON public.electrician_claims;

-- RE-CREATE RLS POLICIES FOR FULL DEMO ACCESS
CREATE POLICY "Allow all access to electricians" ON public.electricians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to order_men" ON public.order_men FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to point_transactions" ON public.point_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to redemptions" ON public.redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to electrician_claims" ON public.electrician_claims FOR ALL USING (true) WITH CHECK (true);

-- INITIAL SEED DATA
INSERT INTO public.electricians (name, father_name, mobile, email, password, dob, address, pincode, experience, points_balance)
VALUES 
('Karthik Raja', 'Ramasamy', '9876543210', 'karthik.e@gmail.com', '123456', '1992-05-15', '12 Cross Street, Gandhinagar, Salem', '636008', 7, 450),
('Senthil Kumar', 'Murugan', '9842109876', 'senthil.spark@yahoo.com', '123456', '1988-11-20', '45 MTH Road, Ambattur, Chennai', '600053', 12, 1200),
('Vigneshwaran M', 'Manoharan', '9789012345', 'vignesh.dev@electro.in', '123456', '1995-03-08', '88 Main Bazaar, RS Puram, Coimbatore', '641002', 5, 800)
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO public.order_men (name, mobile, email, password, region, status)
VALUES
('Rajesh Kumar', '9812345678', 'rajesh.om@electro.in', 'order123', 'Salem & Namakkal Zone', 'active'),
('Suresh Babu', '9712345678', 'suresh.om@electro.in', 'order123', 'Chennai Ambattur Region', 'active')
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO public.products (name, group_name, uom, price, updated_at)
VALUES 
('32A Double Pole MCB', 'Switchgear', 'Nos', 480.00, NOW()),
('1.5 sqmm FR PVC Copper Wire (90m)', 'Wires & Cables', 'Roll', 1850.00, NOW()),
('10-Way Modular Metal Enclosure Box', 'Distribution Boards', 'Box', 1200.00, NOW()),
('Smart Modular Switch 16A 1-Way', 'Switches & Sockets', 'Nos', 195.00, NOW()),
('LED Panel Light 15W Round', 'Lighting Solutions', 'Nos', 320.00, NOW())
ON CONFLICT DO NOTHING;
