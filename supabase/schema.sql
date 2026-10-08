-- KIWI schema. Run once in Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text not null default '',
  instagram text,
  city text default 'Chicago',
  is_provider boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  email_domain text,          -- if set, joining requires an account email at this domain
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid references public.groups on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  visible boolean not null default true,   -- member chooses whether their reviews are visible to the group
  primary key (group_id, user_id)
);

create table if not exists public.connections (
  user_id uuid references public.profiles on delete cascade,
  friend_id uuid references public.profiles on delete cascade,
  primary key (user_id, friend_id)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles on delete set null,
  company text not null,
  contact_name text,
  category text not null,
  city text not null default 'Chicago',
  regions text[] not null default '{}',
  description text,
  phone text,
  email text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  share_with_friends boolean not null default true,
  created_at timestamptz not null default now(),
  unique (provider_id, user_id)
);

create table if not exists public.provider_events (
  id bigserial primary key,
  provider_id uuid not null references public.providers on delete cascade,
  type text not null check (type in ('view','impression','contact')),
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.addon_interest (
  user_id uuid references public.profiles on delete cascade,
  addon text not null,
  primary key (user_id, addon)
);

-- helper functions (security definer to avoid RLS recursion)
create or replace function public.my_group_ids() returns setof uuid
language sql security definer stable set search_path = public as $$
  select group_id from group_members where user_id = auth.uid();
$$;

create or replace function public.in_my_circle(target uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from connections c where c.user_id = auth.uid() and c.friend_id = target)
      or exists (select 1 from group_members a join group_members b on a.group_id = b.group_id
                 where a.user_id = auth.uid() and b.user_id = target and b.visible);
$$;

create or replace function public.add_friend(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or target = auth.uid() then return; end if;
  insert into connections values (auth.uid(), target) on conflict do nothing;
  insert into connections values (target, auth.uid()) on conflict do nothing;
end $$;

create or replace function public.remove_friend(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from connections where (user_id = auth.uid() and friend_id = target) or (user_id = target and friend_id = auth.uid());
end $$;

create or replace function public.join_group(gslug text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare g groups; em text;
begin
  select * into g from groups where slug = gslug;
  if g.id is null then return 'Group not found.'; end if;
  select email into em from auth.users where id = auth.uid();
  if g.email_domain is not null and lower(split_part(em, '@', 2)) <> lower(g.email_domain) then
    return 'You need a verified @' || g.email_domain || ' email on your account to join this group.';
  end if;
  insert into group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return 'ok';
end $$;

create or replace view public.provider_stats as
  select provider_id, round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as n
  from public.reviews group by provider_id;

-- new auth user -> profile (+ provider row if signing up as provider)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into profiles (id, full_name, instagram, is_provider)
  values (new.id, coalesce(m->>'full_name', ''), nullif(m->>'instagram', ''), (m->>'is_provider') = 'true')
  on conflict do nothing;
  if (m->>'is_provider') = 'true' then
    insert into providers (owner_id, company, contact_name, category, city, regions, description, phone, email)
    values (new.id, coalesce(m->>'company', 'My business'), m->>'full_name', coalesce(m->>'category', 'cleaning'),
            coalesce(nullif(m->>'city', ''), 'Chicago'),
            coalesce(string_to_array(nullif(m->>'regions', ''), ','), '{}'),
            m->>'description', m->>'phone', new.email);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table connections enable row level security;
alter table providers enable row level security;
alter table reviews enable row level security;
alter table provider_events enable row level security;
alter table addon_interest enable row level security;

create policy "profiles read" on profiles for select using (true);
create policy "profiles update own" on profiles for update using (id = auth.uid());
create policy "groups read" on groups for select using (true);
create policy "gm read" on group_members for select using (user_id = auth.uid() or group_id in (select my_group_ids()));
create policy "gm update own" on group_members for update using (user_id = auth.uid());
create policy "gm delete own" on group_members for delete using (user_id = auth.uid());
create policy "conn read own" on connections for select using (user_id = auth.uid());
create policy "providers read" on providers for select using (true);
create policy "providers insert own" on providers for insert with check (owner_id = auth.uid());
create policy "providers update own" on providers for update using (owner_id = auth.uid());
create policy "reviews read circle" on reviews for select using (user_id = auth.uid() or (share_with_friends and in_my_circle(user_id)));
create policy "reviews insert own" on reviews for insert with check (user_id = auth.uid());
create policy "reviews update own" on reviews for update using (user_id = auth.uid());
create policy "reviews delete own" on reviews for delete using (user_id = auth.uid());
create policy "events insert" on provider_events for insert with check (true);
create policy "events read owner" on provider_events for select using (exists (select 1 from providers p where p.id = provider_id and p.owner_id = auth.uid()));
create policy "addon own" on addon_interest for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.provider_stats to anon, authenticated;

-- storage for provider photos
insert into storage.buckets (id, name, public) values ('provider-photos', 'provider-photos', true) on conflict do nothing;
create policy "photos public read" on storage.objects for select using (bucket_id = 'provider-photos');
create policy "photos auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'provider-photos');
