-- ============================================
-- VIP / BOTTLE SERVICE MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VIP PACKAGES (What venues offer)
-- ============================================

CREATE TABLE IF NOT EXISTS public.vip_packages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- "VIP Table", "Bottle Service", "Private Booth"
  description text,
  min_spend numeric(10,2) NOT NULL, -- Minimum spend requirement
  deposit_amount numeric(10,2) NOT NULL, -- Upfront deposit
  max_guests int NOT NULL DEFAULT 6,
  includes text[], -- ["1 Premium Bottle", "Mixers", "Dedicated Server"]
  photos text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vip_packages_venue ON public.vip_packages(venue_id);

-- ============================================
-- 2. VIP INVENTORY (Available tables per night)
-- ============================================

CREATE TABLE IF NOT EXISTS public.vip_inventory (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  package_id uuid REFERENCES public.vip_packages(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE, -- null = any night
  date date NOT NULL,
  table_number text, -- "Table 1", "Booth A"
  total_available int NOT NULL DEFAULT 1,
  total_booked int NOT NULL DEFAULT 0,
  price_override numeric(10,2), -- Override package min_spend for special events
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(package_id, date, table_number)
);

CREATE INDEX IF NOT EXISTS idx_vip_inventory_package ON public.vip_inventory(package_id);
CREATE INDEX IF NOT EXISTS idx_vip_inventory_date ON public.vip_inventory(date);

-- ============================================
-- 3. VIP RESERVATIONS
-- ============================================

CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

CREATE TABLE IF NOT EXISTS public.vip_reservations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES public.vip_packages(id) ON DELETE SET NULL,
  inventory_id uuid REFERENCES public.vip_inventory(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,

  -- Reservation details
  date date NOT NULL,
  party_size int NOT NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  special_requests text,

  -- Pricing
  min_spend numeric(10,2) NOT NULL,
  deposit_amount numeric(10,2) NOT NULL,
  deposit_paid boolean DEFAULT false,

  -- Stripe
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,

  -- Status
  status reservation_status DEFAULT 'pending',
  confirmation_code text UNIQUE NOT NULL,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vip_reservations_user ON public.vip_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_reservations_venue ON public.vip_reservations(venue_id);
CREATE INDEX IF NOT EXISTS idx_vip_reservations_date ON public.vip_reservations(date);
CREATE INDEX IF NOT EXISTS idx_vip_reservations_code ON public.vip_reservations(confirmation_code);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.vip_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.vip_packages;
CREATE POLICY "Anyone can view active packages" ON public.vip_packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Venue owners can manage packages" ON public.vip_packages;
CREATE POLICY "Venue owners can manage packages" ON public.vip_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
  );

ALTER TABLE public.vip_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view inventory" ON public.vip_inventory;
CREATE POLICY "Anyone can view inventory" ON public.vip_inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Venue owners can manage inventory" ON public.vip_inventory;
CREATE POLICY "Venue owners can manage inventory" ON public.vip_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vip_packages p
      JOIN public.venues v ON v.id = p.venue_id
      WHERE p.id = package_id AND v.owner_id = auth.uid()
    )
  );

ALTER TABLE public.vip_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON public.vip_reservations;
CREATE POLICY "Users can view own reservations" ON public.vip_reservations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create reservations" ON public.vip_reservations;
CREATE POLICY "Users can create reservations" ON public.vip_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reservations" ON public.vip_reservations;
CREATE POLICY "Users can update own reservations" ON public.vip_reservations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Venue owners can view reservations" ON public.vip_reservations;
CREATE POLICY "Venue owners can view reservations" ON public.vip_reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Venue owners can update reservations" ON public.vip_reservations;
CREATE POLICY "Venue owners can update reservations" ON public.vip_reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
  );

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Generate confirmation code
CREATE OR REPLACE FUNCTION generate_vip_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
    NEW.confirmation_code := 'VIP-' || upper(substring(md5(random()::text || now()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_vip_code_trigger ON public.vip_reservations;
CREATE TRIGGER generate_vip_code_trigger
  BEFORE INSERT ON public.vip_reservations
  FOR EACH ROW EXECUTE FUNCTION generate_vip_confirmation_code();

-- Update inventory when reservation confirmed
CREATE OR REPLACE FUNCTION update_vip_inventory_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' AND NEW.inventory_id IS NOT NULL THEN
    UPDATE public.vip_inventory
    SET total_booked = total_booked + 1
    WHERE id = NEW.inventory_id;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' AND NEW.inventory_id IS NOT NULL THEN
    UPDATE public.vip_inventory
    SET total_booked = GREATEST(0, total_booked - 1)
    WHERE id = NEW.inventory_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_vip_inventory_trigger ON public.vip_reservations;
CREATE TRIGGER update_vip_inventory_trigger
  AFTER UPDATE ON public.vip_reservations
  FOR EACH ROW EXECUTE FUNCTION update_vip_inventory_on_confirm();

-- Get available VIP for a date
CREATE OR REPLACE FUNCTION get_available_vip(p_venue_id uuid, p_date date)
RETURNS TABLE (
  package_id uuid,
  package_name text,
  description text,
  min_spend numeric,
  deposit_amount numeric,
  max_guests int,
  includes text[],
  available_count int
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.description,
      COALESCE(i.price_override, p.min_spend),
      p.deposit_amount,
      p.max_guests,
      p.includes,
      COALESCE(SUM(i.total_available - i.total_booked), 0)::int
    FROM public.vip_packages p
    LEFT JOIN public.vip_inventory i ON i.package_id = p.id AND i.date = p_date
    WHERE p.venue_id = p_venue_id AND p.is_active = true
    GROUP BY p.id, p.name, p.description, p.min_spend, p.deposit_amount, p.max_guests, p.includes, i.price_override
    HAVING COALESCE(SUM(i.total_available - i.total_booked), 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
