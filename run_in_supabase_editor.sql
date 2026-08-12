ALTER TABLE public.electricians ADD COLUMN IF NOT EXISTS status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active';
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT NOT NULL UNIQUE,
    order_man_id UUID REFERENCES public.order_men(id) ON DELETE CASCADE,
    order_man_name TEXT,
    customer_name TEXT NOT NULL,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items JSONB NOT NULL DEFAULT '[]',
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending','billed')) DEFAULT 'pending',
    remarks TEXT,
    billed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
CREATE INDEX IF NOT EXISTS idx_orders_order_man_id ON public.orders(order_man_id);
