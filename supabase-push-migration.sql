-- Push Notifications Migration
-- Run this in Supabase SQL editor

-- ============================================
-- FAVORITE VENUES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS favorite_venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_favorite_venues_user_id ON favorite_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_venues_venue_id ON favorite_venues(venue_id);

-- RLS policies for favorite_venues
ALTER TABLE favorite_venues ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON favorite_venues
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add own favorites" ON favorite_venues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites" ON favorite_venues
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add their own subscriptions
CREATE POLICY "Users can add own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can remove their own subscriptions
CREATE POLICY "Users can remove own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();
