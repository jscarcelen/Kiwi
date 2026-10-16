-- EDITABLE CITIES + VERIFIED UNIVERSITY COMMUNITIES. Run after recommend_pro.sql.
create table if not exists public.cities (
  name text primary key,
  lat double precision not null,
  lng double precision not null,
  active boolean not null default true,
  sort int not null default 100
);
alter table public.cities enable row level security;
drop policy if exists "cities read" on public.cities;
create policy "cities read" on public.cities for select using (true);
insert into public.cities (name, lat, lng, sort) values ('Chicago', 41.8781, -87.6298, 1), ('Evanston', 42.0451, -87.6877, 2), ('Oak Park', 41.8850, -87.7845, 3)
on conflict (name) do nothing;

alter table public.groups add column if not exists city text;
update public.groups set city = 'Chicago' where city is null and owner_id is null;

create or replace function public.admin_upsert_city(nm text, la double precision, ln double precision, act boolean default true, srt int default 100) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if nm !~ '^[A-Za-z0-9 .''-]{2,60}$' then raise exception 'City names may only use letters, numbers, spaces, . '' and -'; end if;
  insert into cities (name, lat, lng, active, sort) values (trim(nm), la, ln, act, srt)
  on conflict (name) do update set lat = excluded.lat, lng = excluded.lng, active = excluded.active, sort = excluded.sort;
end $$;

create or replace function public.admin_delete_city(nm text) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if; delete from cities where name = nm; end $$;

-- launch readiness per city: members, pros, reviews, communities
create or replace function public.admin_city_stats()
returns table (city text, active boolean, users bigint, pros bigint, reviews bigint, communities bigint, live boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select c.name, c.active,
    (select count(*) from profiles p where p.city = c.name),
    (select count(*) from providers v where v.city = c.name or c.name = any (v.regions)),
    (select count(*) from reviews r join providers v on v.id = r.provider_id where v.city = c.name),
    (select count(*) from groups g where g.city = c.name and g.owner_id is not null),
    ((select count(*) from profiles p where p.city = c.name) >= 100 and (select count(*) from providers v where v.city = c.name or c.name = any (v.regions)) >= 10
      and (select count(*) from reviews r join providers v on v.id = r.provider_id where v.city = c.name) >= 5)
  from cities c order by c.sort, c.name;
end $$;

-- official / verified communities (admin)
create or replace function public.admin_upsert_community(gid uuid, nm text, descr text, domain text, cty text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid := gid; slug_ text;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if length(trim(coalesce(nm, ''))) < 3 then raise exception 'Name is too short'; end if;
  if coalesce(domain, '') <> '' and domain !~* '^[a-z0-9.-]+\.[a-z]{2,}$' then raise exception 'Enter a domain like uchicago.edu'; end if;
  if v is null then
    slug_ := trim(both '-' from lower(regexp_replace(nm, '[^a-zA-Z0-9]+', '-', 'g')));
    insert into groups (slug, name, description, email_domain, city) values (slug_, trim(nm), nullif(trim(coalesce(descr, '')), ''), nullif(lower(trim(domain)), ''), nullif(trim(coalesce(cty, '')), ''))
    on conflict (slug) do update set name = excluded.name, description = excluded.description, email_domain = excluded.email_domain, city = excluded.city
    returning id into v;
  else
    update groups set name = trim(nm), description = nullif(trim(coalesce(descr, '')), ''), email_domain = nullif(lower(trim(domain)), ''), city = nullif(trim(coalesce(cty, '')), '') where id = v;
  end if;
  return v;
end $$;

-- joining a domain-verified community requires a CONFIRMED email on that domain
create or replace function public.join_group(gslug text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare g groups; em text; conf timestamptz;
begin
  select * into g from groups where slug = gslug;
  if g.id is null then return 'Group not found.'; end if;
  select email, email_confirmed_at into em, conf from auth.users where id = auth.uid();
  if g.email_domain is not null and (conf is null or lower(split_part(coalesce(em, ''), '@', 2)) <> lower(g.email_domain)) then
    return 'You need a confirmed @' || g.email_domain || ' email on your account to join this community.';
  end if;
  insert into group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return 'ok';
end $$;

-- communities this user is eligible to join through their email domain, but hasn't joined yet
create or replace function public.my_domain_communities() returns table (id uuid, slug text, name text, city text, email_domain text)
language sql stable security definer set search_path = public, auth as $$
  select g.id, g.slug, g.name, g.city, g.email_domain
  from groups g join auth.users u on u.id = auth.uid()
  where g.email_domain is not null and u.email_confirmed_at is not null
    and lower(split_part(coalesce(u.email, ''), '@', 2)) = lower(g.email_domain)
    and not exists (select 1 from group_members m where m.group_id = g.id and m.user_id = auth.uid());
$$;

create or replace function public.join_verified_community(gid uuid) returns text
language plpgsql security definer set search_path = public, auth as $$
declare g groups; r text;
begin
  select * into g from groups where id = gid;
  if g.id is null then return 'Community not found.'; end if;
  r := public.join_group(g.slug);
  if r = 'ok' and g.city is not null then
    update profiles set city = g.city where id = auth.uid() and (city is null or city = 'Chicago') and g.city <> 'Chicago';
  end if;
  return r;
end $$;

grant execute on function public.my_domain_communities(), public.join_verified_community(uuid), public.join_group(text),
  public.admin_upsert_city(text, double precision, double precision, boolean, int), public.admin_delete_city(text), public.admin_city_stats(),
  public.admin_upsert_community(uuid, text, text, text, text) to authenticated;
revoke execute on function public.admin_upsert_city(text, double precision, double precision, boolean, int), public.admin_delete_city(text), public.admin_city_stats(),
  public.admin_upsert_community(uuid, text, text, text, text) from public, anon;
