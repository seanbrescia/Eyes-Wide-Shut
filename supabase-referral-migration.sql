-- ============================================
-- REFERRAL SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. NEW ENUM TYPE
-- ============================================
create type referral_action as enum ('signup', 'rsvp');

-- ============================================
-- 2. ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Users table: referral code, points, and who referred them
alter table public.users
  add column referral_code text unique,
  add column referral_points int default 0,
  add column referred_by uuid references public.users(id);

-- Tickets table: track which referral code was used
alter table public.tickets
  add column referred_by_code text;

-- ============================================
-- 3. NEW REFERRALS TABLE (CORE LEDGER)
-- ============================================
create table public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.users(id) on delete cascade not null,
  referred_id uuid references public.users(id) on delete cascade not null,
  action referral_action not null,
  event_id uuid references public.events(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  points_awarded int not null,
  created_at timestamptz default now() not null
);

-- Unique constraints to prevent double-crediting
create unique index idx_referrals_rsvp_unique
  on public.referrals (referred_id, event_id)
  where action = 'rsvp';

create unique index idx_referrals_signup_unique
  on public.referrals (referred_id)
  where action = 'signup';

-- Performance indexes
create index idx_referrals_referrer on public.referrals(referrer_id);
create index idx_referrals_event on public.referrals(event_id);
create index idx_referrals_venue on public.referrals(venue_id);

-- ============================================
-- 4. ROW LEVEL SECURITY FOR REFERRALS
-- ============================================
alter table public.referrals enable row level security;

-- Users can see referrals where they are the referrer
create policy "Users can view own referrals as referrer" on public.referrals
  for select using (auth.uid() = referrer_id);

-- Users can see referrals where they are the referred
create policy "Users can view own referrals as referred" on public.referrals
  for select using (auth.uid() = referred_id);

-- Venue owners can see referrals for their venues/events
create policy "Venue owners can view venue referrals" on public.referrals
  for select using (
    exists (
      select 1 from public.venues v
      where (v.id = venue_id or v.id in (
        select e.venue_id from public.events e where e.id = event_id
      ))
      and v.owner_id = auth.uid()
    )
  );

-- Admins can see all referrals
create policy "Admins can view all referrals" on public.referrals
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- Users can insert referrals (server actions handle validation)
create policy "Authenticated users can insert referrals" on public.referrals
  for insert with check (auth.uid() = referred_id);

-- ============================================
-- 5. UPDATE handle_new_user() TRIGGER
-- ============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, full_name, date_of_birth, referral_code)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'consumer'),
    new.raw_user_meta_data->>'full_name',
    case
      when new.raw_user_meta_data->>'date_of_birth' is not null
      then (new.raw_user_meta_data->>'date_of_birth')::date
      else null
    end,
    upper(substring(md5(new.id::text || random()::text) from 1 for 8))
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- 6. NEW TRIGGER: update_referral_points()
-- ============================================
create or replace function update_referral_points()
returns trigger as $$
begin
  update public.users
  set referral_points = referral_points + new.points_awarded
  where id = new.referrer_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger update_referral_points_trigger
  after insert on public.referrals
  for each row execute function update_referral_points();

-- ============================================
-- 7. RPC: get_venue_referral_leaderboard
-- ============================================
create or replace function get_venue_referral_leaderboard(
  p_venue_id uuid,
  p_limit int default 20
)
returns table (
  referrer_id uuid,
  full_name text,
  email text,
  rsvp_count bigint,
  signup_count bigint,
  total_points bigint
) as $$
begin
  return query
    select
      r.referrer_id,
      u.full_name,
      u.email,
      count(*) filter (where r.action = 'rsvp') as rsvp_count,
      count(*) filter (where r.action = 'signup') as signup_count,
      coalesce(sum(r.points_awarded), 0) as total_points
    from public.referrals r
    join public.users u on u.id = r.referrer_id
    where r.venue_id = p_venue_id
       or r.event_id in (select e.id from public.events e where e.venue_id = p_venue_id)
    group by r.referrer_id, u.full_name, u.email
    order by total_points desc
    limit p_limit;
end;
$$ language plpgsql security definer;

-- ============================================
-- 8. BACKFILL EXISTING USERS
-- ============================================
update public.users
set referral_code = upper(substring(md5(id::text || random()::text) from 1 for 8))
where referral_code is null;
