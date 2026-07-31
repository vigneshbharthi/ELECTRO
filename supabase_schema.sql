-- ELECTRO DATABASE SCHEMA FOR SUPABASE
-- Run this script in your Supabase SQL Editor: https://optvzsdieukdqsrcxdzm.supabase.co

-- 1. ELECTRICIANS TABLE
CREATE TABLE IF NOT EXISTS public.electricians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    dob DATE NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    experience INTEGER NOT NULL DEFAULT 0,
    points_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    uom TEXT NOT NULL DEFAULT 'Nos',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POINT TRANSACTIONS / LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electrician_id UUID NOT NULL REFERENCES public.electricians(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    particular TEXT NOT NULL,
    debit_points INTEGER NOT NULL DEFAULT 0,
    credit_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REDEMPTIONS TABLE (ADMIN SIDE & FUTURE ELECTRICIAN SIDE)
CREATE TABLE IF NOT EXISTS public.redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electrician_id UUID NOT NULL REFERENCES public.electricians(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    gift_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    requested_date TIMESTAMPTZ DEFAULT NOW(),
    processed_date TIMESTAMPTZ,
    remarks TEXT
);

-- DISABLE RLS OR ALLOW PUBLIC ACCESS FOR DEMO/DEV PURPOSE
ALTER TABLE public.electricians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to electricians" ON public.electricians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to point_transactions" ON public.point_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to redemptions" ON public.redemptions FOR ALL USING (true) WITH CHECK (true);

-- SAMPLE INITIAL DATA FOR TESTING
INSERT INTO public.electricians (name, father_name, mobile, email, dob, address, pincode, experience, points_balance)
VALUES 
('Karthik Raja', 'Ramasamy', '9876543210', 'karthik.e@gmail.com', '1992-05-15', '12 Cross Street, Gandhinagar, Salem', '636008', 7, 450),
('Senthil Kumar', 'Murugan', '9842109876', 'senthil.spark@yahoo.com', '1988-11-20', '45 MTH Road, Ambattur, Chennai', '600053', 12, 1200),
('Vigneshwaran M', 'Manoharan', '9789012345', 'vignesh.dev@electro.in', '1995-03-08', '88 Main Bazaar, RS Puram, Coimbatore', '641002', 5, 800)
ON CONFLICT (mobile) DO NOTHING;

INSERT INTO public.products (name, group_name, uom, price, points, updated_at)
VALUES 
('32A Double Pole MCB', 'Switchgear', 'Nos', 480.00, 25, NOW()),
('1.5 sqmm FR PVC Copper Wire (90m)', 'Wires & Cables', 'Roll', 1850.00, 100, NOW()),
('10-Way Modular Metal Enclosure Box', 'Distribution Boards', 'Box', 1200.00, 60, NOW()),
('Smart Modular Switch 16A 1-Way', 'Switches & Sockets', 'Nos', 195.00, 10, NOW()),
('LED Panel Light 15W Round', 'Lighting Solutions', 'Nos', 320.00, 15, NOW())
ON CONFLICT DO NOTHING;

-- SAMPLE INITIAL TRANSACTIONS
DO $$
DECLARE
    e1_id UUID;
    e2_id UUID;
BEGIN
    SELECT id INTO e1_id FROM public.electricians WHERE mobile = '9876543210' LIMIT 1;
    SELECT id INTO e2_id FROM public.electricians WHERE mobile = '9842109876' LIMIT 1;

    IF e1_id IS NOT NULL THEN
        INSERT INTO public.point_transactions (electrician_id, date, particular, debit_points, credit_points)
        VALUES 
        (e1_id, NOW() - INTERVAL '10 days', 'Initial Joining Bonus', 0, 150),
        (e1_id, NOW() - INTERVAL '5 days', 'Product Scan: 3x Wire Rolls 1.5sqmm', 0, 300),
        (e1_id, NOW() - INTERVAL '2 days', 'Redemption: Rs.100 Fastrack Voucher', 100, 0);
    END IF;

    IF e2_id IS NOT NULL THEN
        INSERT INTO public.point_transactions (electrician_id, date, particular, debit_points, credit_points)
        VALUES 
        (e2_id, NOW() - INTERVAL '15 days', 'Initial Joining Bonus', 0, 200),
        (e2_id, NOW() - INTERVAL '8 days', 'Bulk Wiring Project Scan Reward', 0, 1000);
    END IF;
END $$;
