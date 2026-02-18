-- ============================================
-- EYES WIDE SHUT Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
create type user_role as enum ('consumer', 'venue_owner', 'admin');
create type venue_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type application_status as enum ('pending', 'approved', 'rejected');
create type ticket_status as enum ('pending', 'confirmed', 'cancelled', 'refunded');

-- ============================================
-- USERS TABLE
-- ============================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  role user_role not null default 'consumer',
  full_name text,
  avatar_url text,
  date_of_birth date,
  phone text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);
create policy "Admins can view all users" on public.users
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================
-- VENUES TABLE
-- ============================================
create table public.venues (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  bio text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip_code text not null,
  latitude decimal(10, 7) not null,
  longitude decimal(10, 7) not null,
  phone text,
  website text,
  instagram text,

  cover_photo_url text,
  photos text[] default '{}',
  promo_video_url text,

  is_eighteen_plus boolean default false,
  is_twenty_one_plus boolean default true,
  capacity int,
  venue_type text,

  hours jsonb default '{}',

  status venue_status default 'pending' not null,
  approved_at timestamptz,
  approved_by uuid references public.users(id),

  current_crowd_level int default 1 check (current_crowd_level >= 1 and current_crowd_level <= 5),
  crowd_updated_at timestamptz default now(),

  subscription_tier text default 'free',
  subscription_expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_venues_status on public.venues(status) where status = 'approved';
create index idx_venues_owner on public.venues(owner_id);
create index idx_venues_city on public.venues(city, state);
create index idx_venues_slug on public.venues(slug);
create index idx_venues_location on public.venues(latitude, longitude);

alter table public.venues enable row level security;

create policy "Anyone can view approved venues" on public.venues
  for select using (status = 'approved');
create policy "Owners can view own venues" on public.venues
  for select using (auth.uid() = owner_id);
create policy "Owners can update own venues" on public.venues
  for update using (auth.uid() = owner_id and status = 'approved');
create policy "Admins can do anything with venues" on public.venues
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================
-- VENUE APPLICATIONS TABLE
-- ============================================
create table public.venue_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  venue_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  venue_type text,
  description text,
  website text,
  instagram text,
  status application_status default 'pending' not null,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_venue_id uuid references public.venues(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_venue_applications_status on public.venue_applications(status);

alter table public.venue_applications enable row level security;

create policy "Users can view own applications" on public.venue_applications
  for select using (auth.uid() = user_id);
create policy "Users can insert applications" on public.venue_applications
  for insert with check (auth.uid() = user_id);
create policy "Admins can manage applications" on public.venue_applications
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================
-- EVENTS TABLE
-- ============================================
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  venue_id uuid references public.venues(id) on delete cascade not null,
  name text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time,

  artists text[] default '{}',

  cover_charge decimal(8,2) default 0,
  ticket_price decimal(8,2),
  ticket_count int,
  tickets_sold int default 0,

  drink_specials text[] default '{}',

  flyer_url text,

  is_featured boolean default false,
  is_cancelled boolean default false,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_events_venue on public.events(venue_id);
create index idx_events_date on public.events(date);
create index idx_events_upcoming on public.events(date, venue_id) where is_cancelled = false;

alter table public.events enable row level security;

create policy "Anyone can view events of approved venues" on public.events
  for select using (
    exists (select 1 from public.venues v where v.id = venue_id and v.status = 'approved')
  );
create policy "Venue owners can manage own events" on public.events
  for all using (
    exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid())
  );
create policy "Admins can manage all events" on public.events
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================
-- TICKETS TABLE
-- ============================================
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  quantity int default 1 not null check (quantity >= 1),

  is_paid boolean default false,
  amount_paid decimal(8,2) default 0,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,

  status ticket_status default 'pending' not null,

  confirmation_code text unique not null,
  checked_in boolean default false,
  checked_in_at timestamptz,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_tickets_user on public.tickets(user_id);
create index idx_tickets_event on public.tickets(event_id);
create index idx_tickets_confirmation on public.tickets(confirmation_code);

alter table public.tickets enable row level security;

create policy "Users can view own tickets" on public.tickets
  for select using (auth.uid() = user_id);
create policy "Users can create tickets" on public.tickets
  for insert with check (auth.uid() = user_id);
create policy "Venue owners can view event tickets" on public.tickets
  for select using (
    exists (
      select 1 from public.events e
      join public.venues v on v.id = e.venue_id
      where e.id = event_id and v.owner_id = auth.uid()
    )
  );
create policy "Admins can view all tickets" on public.tickets
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================
-- CROWD METER HISTORY
-- ============================================
create table public.crowd_meter_history (
  id uuid default uuid_generate_v4() primary key,
  venue_id uuid references public.venues(id) on delete cascade not null,
  level int not null check (level >= 1 and level <= 5),
  recorded_by uuid references public.users(id),
  recorded_at timestamptz default now() not null
);

create index idx_crowd_history_venue on public.crowd_meter_history(venue_id, recorded_at desc);

alter table public.crowd_meter_history enable row level security;

create policy "Anyone can view crowd history" on public.crowd_meter_history
  for select using (true);
create policy "Venue owners can insert crowd data" on public.crowd_meter_history
  for insert with check (
    exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users for each row execute function update_updated_at();
create trigger update_venues_updated_at
  before update on public.venues for each row execute function update_updated_at();
create trigger update_events_updated_at
  before update on public.events for each row execute function update_updated_at();
create trigger update_tickets_updated_at
  before update on public.tickets for each row execute function update_updated_at();
create trigger update_venue_applications_updated_at
  before update on public.venue_applications for each row execute function update_updated_at();

-- Handle new user signup
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Update tickets_sold on ticket status change
create or replace function update_tickets_sold()
returns trigger as $$
begin
  if new.status = 'confirmed' and (old is null or old.status != 'confirmed') then
    update public.events
    set tickets_sold = tickets_sold + new.quantity
    where id = new.event_id;
  end if;
  if old is not null and old.status = 'confirmed' and new.status != 'confirmed' then
    update public.events
    set tickets_sold = greatest(tickets_sold - old.quantity, 0)
    where id = new.event_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_tickets_sold_trigger
  after insert or update of status on public.tickets
  for each row execute function update_tickets_sold();

-- Generate confirmation code for tickets
create or replace function generate_confirmation_code()
returns trigger as $$
begin
  if new.confirmation_code is null then
    new.confirmation_code = upper(substring(md5(random()::text || now()::text) from 1 for 8));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_confirmation_code
  before insert on public.tickets
  for each row execute function generate_confirmation_code();

-- Get nearby venues (using lat/lng distance calculation)
create or replace function get_nearby_venues(
  user_lat decimal,
  user_lng decimal,
  radius_miles decimal default 25
)
returns setof public.venues as $$
begin
  return query
    select v.*
    from public.venues v
    where v.status = 'approved'
      and (
        3959 * acos(
          cos(radians(user_lat)) * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(v.latitude))
        )
      ) <= radius_miles
    order by (
      3959 * acos(
        cos(radians(user_lat)) * cos(radians(v.latitude))
        * cos(radians(v.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(v.latitude))
      )
    );
end;
$$ language plpgsql;

-- ============================================
-- STORAGE BUCKET
-- Run these in Supabase dashboard
-- ============================================
-- insert into storage.buckets (id, name, public) values ('venue-media', 'venue-media', true);
