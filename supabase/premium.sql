-- PREMIUM GATING. Run after admin.sql (needs app_settings.premium_start).
-- Before premium_start every signed-in user has Premium for free. After it, only profiles.is_premium (granted by admin / payment webhook).
create or replace function public.premium_start_date() returns date
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::date from app_settings where key = 'premium_start'), date '2027-01-01');
$$;

create or replace function public.has_premium(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select current_date < public.premium_start_date() or coalesce((select is_premium from profiles where id = uid), false);
$$;

create or replace function public.premium_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'start', public.premium_start_date(),
    'started', current_date >= public.premium_start_date(),
    'paid', coalesce((select is_premium from profiles where id = auth.uid()), false),
    'has_premium', auth.uid() is not null and public.has_premium(auth.uid()));
$$;
grant execute on function public.premium_start_date(), public.premium_status() to anon, authenticated;
grant execute on function public.has_premium(uuid) to authenticated;

-- communities: more than the free limit needs Premium
create or replace function public.create_community(cname text, cdesc text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; g groups; v_slug text; lim int := public.setting_num('free_community_limit', 3)::int;
begin
  if uid is null then return jsonb_build_object('error', 'Please sign in.'); end if;
  if public.is_blocked(uid) then return jsonb_build_object('error', 'Your account is restricted.'); end if;
  if length(trim(coalesce(cname, ''))) < 3 then return jsonb_build_object('error', 'Give your community a name (at least 3 characters).'); end if;
  select count(*) into n from groups where owner_id = uid;
  if n >= lim and not public.has_premium(uid) then
    return jsonb_build_object('error', 'You''ve reached the free limit of ' || lim || ' communities. Upgrade to Premium to create more.', 'limit', true);
  end if;
  v_slug := trim(both '-' from lower(regexp_replace(cname, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
  insert into groups (slug, name, description, owner_id) values (v_slug, trim(cname), nullif(trim(coalesce(cdesc, '')), ''), uid) returning * into g;
  insert into group_members (group_id, user_id) values (g.id, uid);
  return jsonb_build_object('id', g.id, 'invite_code', g.invite_code, 'premium_used', n >= lim);
end $$;
grant execute on function public.create_community(text, text) to authenticated;

-- saved filters ("make your own filters") — Premium
create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name text not null,
  qs text not null,
  created_at timestamptz not null default now()
);
alter table public.saved_filters enable row level security;
drop policy if exists "filters own read" on public.saved_filters;
create policy "filters own read" on public.saved_filters for select using (user_id = auth.uid());
drop policy if exists "filters own delete" on public.saved_filters;
create policy "filters own delete" on public.saved_filters for delete using (user_id = auth.uid());

create or replace function public.save_filter(fname text, fqs text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return jsonb_build_object('error', 'Please sign in.'); end if;
  if not public.has_premium(auth.uid()) then return jsonb_build_object('error', 'Saved filters are a Premium feature.', 'premium', true); end if;
  insert into saved_filters (user_id, name, qs) values (auth.uid(), left(trim(fname), 60), left(fqs, 600));
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.save_filter(text, text) to authenticated;

-- admin: grant / revoke Premium by hand (until the Paddle webhook exists)
create or replace function public.admin_set_premium(uid uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update profiles set is_premium = flag where id = uid;
end $$;
revoke execute on function public.admin_set_premium(uuid, boolean) from public, anon;
grant execute on function public.admin_set_premium(uuid, boolean) to authenticated;

-- admin_users now also reports is_premium
drop function if exists public.admin_users(text, int, int);
create or replace function public.admin_users(q text default '', lim_n int default 50, off_n int default 0)
returns table (id uuid, full_name text, email text, phone text, created_at timestamptz, is_provider boolean, blocked boolean, blocked_reason text,
               is_admin boolean, archetype text, friends bigint, reviews bigint, owned bigint, joined bigint, refs bigint, searches bigint, credits bigint,
               last_seen timestamptz, total bigint, is_premium boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select p.id, p.full_name, u.email::text, u.phone::text, p.created_at, p.is_provider, p.blocked, p.blocked_reason,
         exists (select 1 from admins ad where ad.user_id = p.id), a.archetype, a.friends, a.reviews, a.owned, a.joined, a.refs, a.searches,
         coalesce((select sum(r.credits) from referrals r where r.referrer_id = p.id), 0)::bigint,
         greatest(u.last_sign_in_at, (select max(e.created_at) from app_events e where e.user_id = p.id)),
         count(*) over (), coalesce(p.is_premium, false)
  from profiles p left join auth.users u on u.id = p.id left join user_archetypes() a on a.id = p.id
  where (q = '' or p.full_name ilike '%' || q || '%' or u.email ilike '%' || q || '%' or u.phone ilike '%' || q || '%')
  order by p.created_at desc limit lim_n offset off_n;
end $$;
revoke execute on function public.admin_users(text, int, int) from public, anon;
grant execute on function public.admin_users(text, int, int) to authenticated;
