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
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
CREATE POLICY "Allow all access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
CREATE INDEX IF NOT EXISTS idx_orders_order_man_id ON public.orders(order_man_id);

-- Convert electrician child-table FKs from ON DELETE CASCADE to ON DELETE SET NULL
-- so "Delete Profile Only" preserves the audit trail in the cloud (name is denormalized).
ALTER TABLE public.point_transactions DROP CONSTRAINT IF EXISTS point_transactions_electrician_id_fkey;
ALTER TABLE public.redemptions DROP CONSTRAINT IF EXISTS redemptions_electrician_id_fkey;
ALTER TABLE public.electrician_claims DROP CONSTRAINT IF EXISTS electrician_claims_electrician_id_fkey;

ALTER TABLE public.point_transactions ALTER COLUMN electrician_id DROP NOT NULL;
ALTER TABLE public.redemptions ALTER COLUMN electrician_id DROP NOT NULL;
ALTER TABLE public.electrician_claims ALTER COLUMN electrician_id DROP NOT NULL;

ALTER TABLE public.point_transactions ADD CONSTRAINT point_transactions_electrician_id_fkey FOREIGN KEY (electrician_id) REFERENCES public.electricians(id) ON DELETE SET NULL;
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_electrician_id_fkey FOREIGN KEY (electrician_id) REFERENCES public.electricians(id) ON DELETE SET NULL;
ALTER TABLE public.electrician_claims ADD CONSTRAINT electrician_claims_electrician_id_fkey FOREIGN KEY (electrician_id) REFERENCES public.electricians(id) ON DELETE SET NULL;
