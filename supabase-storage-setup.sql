-- =============================================
-- Supabase Storage Setup for Venue Photos
-- Run this in Supabase SQL Editor
-- =============================================

-- Create the storage bucket for venue photos
insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their venue's folder
create policy "Venue owners can upload photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'venue-photos' and
  exists (
    select 1 from venues
    where venues.owner_id = auth.uid()
    and venues.id = (storage.foldername(name))[1]::uuid
  )
);

-- Allow authenticated users to update their venue's photos
create policy "Venue owners can update photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'venue-photos' and
  exists (
    select 1 from venues
    where venues.owner_id = auth.uid()
    and venues.id = (storage.foldername(name))[1]::uuid
  )
);

-- Allow authenticated users to delete their venue's photos
create policy "Venue owners can delete photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'venue-photos' and
  exists (
    select 1 from venues
    where venues.owner_id = auth.uid()
    and venues.id = (storage.foldername(name))[1]::uuid
  )
);

-- Allow public read access to all venue photos
create policy "Public can view venue photos"
on storage.objects for select
to public
using (bucket_id = 'venue-photos');
