-- INTAKE / PROJECT REQUESTS / PROFILE ATTRIBUTES. Run once (after phone.sql).
alter table public.providers add column if not exists attributes jsonb not null default '{}'::jsonb;

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  category text not null,
  summary text,
  answers jsonb not null default '{}'::jsonb,
  city text,
  timeline text,
  contact text,
  provider_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.project_requests enable row level security;
drop policy if exists "req insert own" on public.project_requests;
drop policy if exists "req read own" on public.project_requests;
drop policy if exists "req read provider" on public.project_requests;
create policy "req insert own" on public.project_requests for insert with check (user_id = auth.uid());
create policy "req read own" on public.project_requests for select using (user_id = auth.uid());
create policy "req read provider" on public.project_requests for select
  using (exists (select 1 from public.providers p where p.owner_id = auth.uid() and p.id = any (provider_ids)));

-- rating distribution
drop view if exists public.provider_stats;
create view public.provider_stats as
  select provider_id, round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as n,
         count(*) filter (where rating = 5)::int as c5, count(*) filter (where rating = 4)::int as c4,
         count(*) filter (where rating = 3)::int as c3, count(*) filter (where rating = 2)::int as c2,
         count(*) filter (where rating = 1)::int as c1
  from public.reviews group by provider_id;
grant select on public.provider_stats to anon, authenticated;

-- signup trigger: keep phone support, add provider attributes
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  prov boolean := coalesce((m->>'is_provider') = 'true', false);
begin
  insert into profiles (id, full_name, instagram, is_provider)
  values (new.id, coalesce(nullif(m->>'full_name', ''), 'New member'), nullif(m->>'instagram', ''), prov)
  on conflict do nothing;
  if coalesce(new.phone, '') <> '' then
    insert into phone_numbers (user_id, phone) values (new.id, regexp_replace(new.phone, '\D', '', 'g')) on conflict do nothing;
  end if;
  if prov then
    insert into providers (owner_id, company, contact_name, category, city, regions, description, phone, email, attributes)
    values (new.id, coalesce(m->>'company', 'My business'), m->>'full_name', coalesce(m->>'category', 'cleaning'),
            coalesce(nullif(m->>'city', ''), 'Chicago'),
            coalesce(string_to_array(nullif(m->>'regions', ''), ','), '{}'),
            m->>'description', m->>'phone', new.email,
            case when jsonb_typeof(m->'attributes') = 'object' then m->'attributes' else '{}'::jsonb end);
  end if;
  return new;
end $$;

-- demo provider attributes
update public.providers set attributes = '{"clean_type": ["regular", "deep", "move"], "home_size": ["studio", "1-2br", "3br+"], "property": ["apartment", "house", "townhouse"], "frequency": ["once", "recurring"]}'::jsonb where id = '10000000-0000-0000-0000-000000000001';
update public.providers set attributes = '{"clean_type": ["deep", "move"], "home_size": ["studio", "1-2br"], "property": ["apartment"], "frequency": ["once"]}'::jsonb where id = '10000000-0000-0000-0000-000000000002';
update public.providers set attributes = '{"clean_type": ["regular", "deep"], "home_size": ["1-2br", "3br+"], "property": ["apartment", "house", "townhouse"], "frequency": ["recurring", "once"]}'::jsonb where id = '10000000-0000-0000-0000-000000000003';
update public.providers set attributes = '{"job": ["move", "packing"], "home_size": ["studio", "1-2br", "3br+"], "property": ["apartment", "house", "townhouse"]}'::jsonb where id = '10000000-0000-0000-0000-000000000004';
update public.providers set attributes = '{"job": ["assembly", "repairs"], "home_size": ["studio", "1-2br", "3br+"], "property": ["apartment", "house", "townhouse"]}'::jsonb where id = '10000000-0000-0000-0000-000000000005';
update public.providers set attributes = '{"job": ["move"], "home_size": ["studio", "1-2br"], "property": ["apartment"]}'::jsonb where id = '10000000-0000-0000-0000-000000000006';
update public.providers set attributes = '{"dog_service": ["walks", "dropin", "sitting"], "dogs": ["1", "2", "3+"], "frequency": ["once", "recurring"]}'::jsonb where id = '10000000-0000-0000-0000-000000000007';
update public.providers set attributes = '{"dog_service": ["walks", "dropin"], "dogs": ["1", "2"], "frequency": ["recurring"]}'::jsonb where id = '10000000-0000-0000-0000-000000000008';
update public.providers set attributes = '{"dog_service": ["walks", "sitting"], "dogs": ["1", "2", "3+"], "frequency": ["once", "recurring"]}'::jsonb where id = '10000000-0000-0000-0000-000000000009';
update public.providers set attributes = '{"care_type": ["nanny", "babysitter"], "kids": ["1", "2", "3+"], "ages": ["infant", "toddler", "preschool", "school"]}'::jsonb where id = '10000000-0000-0000-0000-000000000010';
update public.providers set attributes = '{"care_type": ["babysitter"], "kids": ["1", "2"], "ages": ["toddler", "preschool", "school"]}'::jsonb where id = '10000000-0000-0000-0000-000000000011';
update public.providers set attributes = '{"care_type": ["afterschool", "nanny"], "kids": ["1", "2", "3+"], "ages": ["preschool", "school"]}'::jsonb where id = '10000000-0000-0000-0000-000000000012';
