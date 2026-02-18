-- Promoter Application System Migration
-- Run this in your Supabase SQL editor

-- 1. Add is_promoter column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_promoter BOOLEAN NOT NULL DEFAULT false;

-- 2. Create promoter_applications table
CREATE TABLE IF NOT EXISTS public.promoter_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  experience TEXT,
  why_join TEXT NOT NULL,
  audience_size TEXT NOT NULL CHECK (audience_size IN ('under_1k', '1k_5k', '5k_10k', '10k_50k', '50k_plus')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_promoter_application UNIQUE (user_id)
);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_promoter_app_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promoter_applications_updated_at
  BEFORE UPDATE ON public.promoter_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_promoter_app_updated_at();

-- 4. Enable RLS
ALTER TABLE public.promoter_applications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Users can view their own application
CREATE POLICY "Users can view own promoter application"
  ON public.promoter_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own application
CREATE POLICY "Users can insert own promoter application"
  ON public.promoter_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rejected application (re-apply)
CREATE POLICY "Users can update own rejected promoter application"
  ON public.promoter_applications
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'rejected');

-- Admins can view all applications
CREATE POLICY "Admins can view all promoter applications"
  ON public.promoter_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all applications (approve/reject)
CREATE POLICY "Admins can update all promoter applications"
  ON public.promoter_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_promoter_applications_status
  ON public.promoter_applications(status);

CREATE INDEX IF NOT EXISTS idx_promoter_applications_user_id
  ON public.promoter_applications(user_id);
