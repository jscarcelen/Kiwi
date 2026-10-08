-- PHONE SIGN-IN + CONTACT MATCHING. Run once in Supabase SQL editor (after schema.sql).
create table if not exists public.phone_numbers (
  user_id uuid primary key references public.profiles on delete cascade,
  phone text unique not null,              -- digits only, with country code (e.g. 13125551234)
  discoverable boolean not null default true
);
alter table public.phone_numbers enable row level security;
drop policy if exists "phone own" on public.phone_numbers;
create policy "phone own" on public.phone_numbers for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- copy the verified phone from auth.users into phone_numbers
create or replace function public.sync_my_phone() returns text
language plpgsql security definer set search_path = public, auth as $$
declare p text;
begin
  select regexp_replace(coalesce(phone, ''), '\D', '', 'g') into p from auth.users where id = auth.uid();
  if p is null or p = '' then return null; end if;
  insert into phone_numbers (user_id, phone) values (auth.uid(), p)
  on conflict (user_id) do update set phone = excluded.phone;
  return p;
end $$;

-- which of these phone numbers belong to Kiwi users who allow discovery? (nothing is stored)
create or replace function public.match_contacts(nums text[])
returns table (id uuid, full_name text, instagram text, phone text)
language sql security definer stable set search_path = public as $$
  select p.id, p.full_name, p.instagram, n.phone
  from phone_numbers n join profiles p on p.id = n.user_id
  where auth.uid() is not null and n.discoverable and n.user_id <> auth.uid()
    and n.phone = any (select regexp_replace(x, '\D', '', 'g') from unnest(nums[1:1000]) x);
$$;

-- people you may know: friends of friends, ranked by mutual friends
create or replace function public.suggested_friends()
returns table (id uuid, full_name text, instagram text, mutual int)
language sql security definer stable set search_path = public as $$
  select p.id, p.full_name, p.instagram, count(*)::int as mutual
  from connections a
  join connections b on b.user_id = a.friend_id
  join profiles p on p.id = b.friend_id
  where a.user_id = auth.uid() and b.friend_id <> auth.uid() and not p.is_provider
    and not exists (select 1 from connections c where c.user_id = auth.uid() and c.friend_id = b.friend_id)
  group by p.id, p.full_name, p.instagram
  order by mutual desc limit 10;
$$;

-- signup trigger: also handles phone-only users
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
    insert into providers (owner_id, company, contact_name, category, city, regions, description, phone, email)
    values (new.id, coalesce(m->>'company', 'My business'), m->>'full_name', coalesce(m->>'category', 'cleaning'),
            coalesce(nullif(m->>'city', ''), 'Chicago'),
            coalesce(string_to_array(nullif(m->>'regions', ''), ','), '{}'),
            m->>'description', m->>'phone', new.email);
  end if;
  return new;
end $$;
