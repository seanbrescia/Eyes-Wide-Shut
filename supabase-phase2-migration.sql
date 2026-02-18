-- ============================================
-- PHASE 2 MIGRATION: Analytics, Social, Tiers, Loyalty
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROMOTED LISTINGS / ADS
-- ============================================

-- Add promotion fields to venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_tier text DEFAULT null,
  ADD COLUMN IF NOT EXISTS promotion_expires_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS promotion_priority int DEFAULT 0;

-- Promotion purchases log
CREATE TABLE IF NOT EXISTS public.promotion_purchases (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL, -- 'hot_spot', 'featured', 'premium'
  amount_paid numeric(10,2) NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotion_purchases_venue ON public.promotion_purchases(venue_id);

-- ============================================
-- 2. SOCIAL FEATURES - FOLLOWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- ============================================
-- 3. SOCIAL FEATURES - SQUADS (Groups)
-- ============================================

CREATE TABLE IF NOT EXISTS public.squads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  creator_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.squad_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  squad_id uuid REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member', -- 'admin', 'member'
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON public.squad_members(user_id);

-- ============================================
-- 4. PROMOTER TIERS
-- ============================================

CREATE TYPE IF NOT EXISTS promoter_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Handle case where type already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promoter_tier') THEN
    CREATE TYPE promoter_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
  END IF;
END $$;

-- Add tier to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS promoter_tier text DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS promoter_commission_rate numeric(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS total_earnings numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_payout numeric(10,2) DEFAULT 0;

-- Tier thresholds config (admin can adjust)
CREATE TABLE IF NOT EXISTS public.promoter_tier_config (
  tier text PRIMARY KEY,
  min_points int NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  perks text[] DEFAULT '{}'
);

-- Insert default tier configs
INSERT INTO public.promoter_tier_config (tier, min_points, commission_rate, perks)
VALUES
  ('bronze', 0, 5.00, ARRAY['Basic referral tracking']),
  ('silver', 500, 7.50, ARRAY['Basic referral tracking', 'Priority support', 'Monthly stats email']),
  ('gold', 2000, 10.00, ARRAY['Basic referral tracking', 'Priority support', 'Monthly stats email', 'Exclusive events access', 'Custom referral page']),
  ('platinum', 5000, 15.00, ARRAY['Basic referral tracking', 'Priority support', 'Monthly stats email', 'Exclusive events access', 'Custom referral page', 'Direct venue connections', 'VIP at partner venues'])
ON CONFLICT (tier) DO NOTHING;

-- ============================================
-- 5. LOYALTY PROGRAM - REWARDS
-- ============================================

CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE, -- null = platform-wide reward
  name text NOT NULL,
  description text,
  points_cost int NOT NULL,
  reward_type text NOT NULL, -- 'free_cover', 'drink_ticket', 'vip_upgrade', 'merch', 'custom'
  quantity_available int, -- null = unlimited
  quantity_redeemed int DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rewards_venue ON public.rewards(venue_id);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON public.rewards(is_active);

-- Redemptions log
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  points_spent int NOT NULL,
  redemption_code text UNIQUE NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'used', 'expired'
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON public.reward_redemptions(redemption_code);

-- ============================================
-- 6. MULTI-CITY STRUCTURE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'US',
  latitude numeric(10,7),
  longitude numeric(10,7),
  timezone text DEFAULT 'America/New_York',
  is_active boolean DEFAULT true,
  ambassador_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(name, state)
);

-- Add city reference to venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id);

-- ============================================
-- 7. ANALYTICS TRACKING
-- ============================================

-- Venue page views
CREATE TABLE IF NOT EXISTS public.venue_views (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_venue_views_venue ON public.venue_views(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_views_date ON public.venue_views(viewed_at);

-- Event page views
CREATE TABLE IF NOT EXISTS public.event_views (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_views_event ON public.event_views(event_id);
CREATE INDEX IF NOT EXISTS idx_event_views_date ON public.event_views(viewed_at);

-- Check-in history (for crowd patterns)
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  checked_in_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_check_ins_venue ON public.check_ins(venue_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins(checked_in_at);

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

-- User follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Squads
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view squads" ON public.squads
  FOR SELECT USING (true);

CREATE POLICY "Users can create squads" ON public.squads
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update squads" ON public.squads
  FOR UPDATE USING (auth.uid() = creator_id);

-- Squad members
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view squad members" ON public.squad_members
  FOR SELECT USING (true);

CREATE POLICY "Squad admins can manage members" ON public.squad_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_members.squad_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_members.squad_id
      AND s.creator_id = auth.uid()
    )
  );

-- Rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards" ON public.rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Venue owners can manage rewards" ON public.rewards
  FOR ALL USING (
    venue_id IS NULL AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
  );

-- Redemptions
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem rewards" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Views (insert only, no read for privacy)
ALTER TABLE public.venue_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log venue views" ON public.venue_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can log event views" ON public.event_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Venue owners can see their views" ON public.venue_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
  );

CREATE POLICY "Venue owners can see event views" ON public.event_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.venues v ON v.id = e.venue_id
      WHERE e.id = event_id AND v.owner_id = auth.uid()
    )
  );

-- Check-ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can check in" ON public.check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can see check-ins" ON public.check_ins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
  );

-- Cities
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage cities" ON public.cities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Auto-update promoter tier based on points
CREATE OR REPLACE FUNCTION update_promoter_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier text;
  new_rate numeric;
BEGIN
  SELECT tier, commission_rate INTO new_tier, new_rate
  FROM public.promoter_tier_config
  WHERE min_points <= NEW.referral_points
  ORDER BY min_points DESC
  LIMIT 1;

  IF new_tier IS NOT NULL AND new_tier != OLD.promoter_tier THEN
    NEW.promoter_tier := new_tier;
    NEW.promoter_commission_rate := new_rate;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_promoter_tier_trigger ON public.users;
CREATE TRIGGER update_promoter_tier_trigger
  BEFORE UPDATE OF referral_points ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_promoter_tier();

-- Generate redemption code
CREATE OR REPLACE FUNCTION generate_redemption_code()
RETURNS text AS $$
BEGIN
  RETURN upper(substring(md5(random()::text || now()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Get friends going to event
CREATE OR REPLACE FUNCTION get_friends_going(p_event_id uuid, p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
    SELECT u.id, u.full_name, u.avatar_url
    FROM public.tickets t
    JOIN public.users u ON u.id = t.user_id
    JOIN public.user_follows f ON f.following_id = t.user_id
    WHERE t.event_id = p_event_id
    AND t.status = 'confirmed'
    AND f.follower_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get venue analytics summary
CREATE OR REPLACE FUNCTION get_venue_analytics(p_venue_id uuid, p_days int DEFAULT 30)
RETURNS TABLE (
  total_views bigint,
  total_rsvps bigint,
  total_check_ins bigint,
  conversion_rate numeric,
  avg_crowd_level numeric
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      (SELECT count(*) FROM public.venue_views WHERE venue_id = p_venue_id AND viewed_at > now() - (p_days || ' days')::interval),
      (SELECT count(*) FROM public.tickets t JOIN public.events e ON e.id = t.event_id WHERE e.venue_id = p_venue_id AND t.created_at > now() - (p_days || ' days')::interval),
      (SELECT count(*) FROM public.check_ins WHERE venue_id = p_venue_id AND checked_in_at > now() - (p_days || ' days')::interval),
      CASE
        WHEN (SELECT count(*) FROM public.venue_views WHERE venue_id = p_venue_id AND viewed_at > now() - (p_days || ' days')::interval) > 0
        THEN round(
          (SELECT count(*) FROM public.tickets t JOIN public.events e ON e.id = t.event_id WHERE e.venue_id = p_venue_id AND t.created_at > now() - (p_days || ' days')::interval)::numeric /
          (SELECT count(*) FROM public.venue_views WHERE venue_id = p_venue_id AND viewed_at > now() - (p_days || ' days')::interval)::numeric * 100, 2
        )
        ELSE 0
      END,
      (SELECT avg(level) FROM public.crowd_meter_history WHERE venue_id = p_venue_id AND recorded_at > now() - (p_days || ' days')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
