-- Several services under one account: a pro can have more than one listing (e.g. Cleaning and Dog walking).
-- Each listing is a row in public.providers (own category, description, regions, offered services, photo and reviews),
-- all owned by the same account. No schema change is needed for that; owners just need to be able to remove a listing.
-- Run in the Supabase SQL editor.
drop policy if exists "providers delete own" on public.providers;
create policy "providers delete own" on public.providers for delete using (owner_id = auth.uid());
