-- MASTER ADMIN CONSOLE: analytics events, app settings, blocking, moderation + statistics RPCs.
-- Run once (after settings.sql). Then make yourself admin:
--   insert into public.admins (user_id) select id from auth.users where email = 'YOU@EMAIL' on conflict do nothing;

alter table public.profiles add column if not exists blocked boolean not null default false;
alter table public.profiles add column if not exists blocked_reason text;

-- ---------- app settings (editable from /admin/editor) ----------
create table if not exists public.app_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
alter table public.app_settings enable row level security;
drop policy if exists "settings read" on public.app_settings;
create policy "settings read" on public.app_settings for select using (true);
insert into public.app_settings (key, value) values
  ('hero_headline', '"Whatever you need, ask the people you trust."'),
  ('hero_subtitle', '"Tell us what you need. WOM finds local pros your friends and communities already rate highly."'),
  ('announcement', '{"enabled": false, "text": "", "link": ""}'),
  ('free_community_limit', '3'), ('credit_friend', '1'), ('credit_supplier', '3'), ('credit_community', '1'),
  ('credits_per_month', '5'), ('premium_start', '"2027-01-01"')
on conflict (key) do nothing;

create or replace function public.setting_num(k text, d numeric) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::numeric from app_settings where key = k), d);
$$;

-- ---------- analytics events ----------
create table if not exists public.app_events (
  id bigserial primary key,
  user_id uuid,
  session_id text,
  type text not null,
  path text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists app_events_type_created on public.app_events (type, created_at desc);
create index if not exists app_events_user on public.app_events (user_id, created_at desc);
create index if not exists app_events_session on public.app_events (session_id);
alter table public.app_events enable row level security;
drop policy if exists "app events insert" on public.app_events;
create policy "app events insert" on public.app_events for insert with check (user_id is null or user_id = auth.uid());

-- ---------- blocking ----------
create or replace function public.is_blocked(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select blocked from profiles where id = uid), false);
$$;

drop policy if exists "reviews insert own" on public.reviews;
create policy "reviews insert own" on public.reviews for insert with check (user_id = auth.uid() and not public.is_blocked(auth.uid()));
drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews for update using (user_id = auth.uid() and not public.is_blocked(auth.uid()));
drop policy if exists "reviews read circle" on public.reviews;
create policy "reviews read circle" on public.reviews for select
  using (user_id = auth.uid() or public.is_admin() or (share_with_friends and public.in_my_circle(user_id) and not public.is_blocked(user_id)));

drop view if exists public.provider_stats;
create view public.provider_stats as
  select provider_id, round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as n,
         count(*) filter (where rating = 5)::int as c5, count(*) filter (where rating = 4)::int as c4,
         count(*) filter (where rating = 3)::int as c3, count(*) filter (where rating = 2)::int as c2,
         count(*) filter (where rating = 1)::int as c1
  from public.reviews where not public.is_blocked(user_id) group by provider_id;
grant select on public.provider_stats to anon, authenticated;

-- blocked users can't create communities; free limit comes from app_settings
create or replace function public.create_community(cname text, cdesc text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; prem boolean; g groups; v_slug text; lim int := public.setting_num('free_community_limit', 3)::int;
begin
  if uid is null then return jsonb_build_object('error', 'Please sign in.'); end if;
  if public.is_blocked(uid) then return jsonb_build_object('error', 'Your account is restricted.'); end if;
  if length(trim(coalesce(cname, ''))) < 3 then return jsonb_build_object('error', 'Give your community a name (at least 3 characters).'); end if;
  select count(*) into n from groups where owner_id = uid;
  select coalesce(is_premium, false) into prem from profiles where id = uid;
  if not coalesce(prem, false) and n >= lim then
    return jsonb_build_object('error', 'You''ve reached the free limit of ' || lim || ' communities. Premium (coming soon) unlocks more — grow your network to earn free premium months.', 'limit', true);
  end if;
  v_slug := trim(both '-' from lower(regexp_replace(cname, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
  insert into groups (slug, name, description, owner_id) values (v_slug, trim(cname), nullif(trim(coalesce(cdesc, '')), ''), uid) returning * into g;
  insert into group_members (group_id, user_id) values (g.id, uid);
  return jsonb_build_object('id', g.id, 'invite_code', g.invite_code);
end $$;
grant execute on function public.create_community(text, text) to authenticated;

-- ---------- internal: behavioural archetypes (rule-based clusters) ----------
create or replace function public.user_archetypes()
returns table (id uuid, archetype text, friends bigint, reviews bigint, owned bigint, joined bigint, refs bigint, searches bigint, recent bigint)
language sql stable security definer set search_path = public as $$
  select t.id,
    case when t.is_provider then 'Supplier'
         when t.owned > 0 then 'Ambassador'
         when t.friends >= 5 or t.refs >= 2 then 'Connector'
         when t.reviews >= 2 then 'Endorser'
         when t.created_at > now() - interval '3 days' then 'New (onboarding)'
         when t.recent = 0 then 'Dormant'
         when t.searches >= 2 then 'Explorer'
         else 'Casual' end,
    t.friends, t.reviews, t.owned, t.joined, t.refs, t.searches, t.recent
  from (
    select p.id, p.is_provider, p.created_at,
      (select count(*) from connections c where c.user_id = p.id) as friends,
      (select count(*) from reviews r where r.user_id = p.id) as reviews,
      (select count(*) from groups g where g.owner_id = p.id) as owned,
      (select count(*) from group_members m where m.user_id = p.id) as joined,
      (select count(*) from referrals f where f.referrer_id = p.id) as refs,
      (select count(*) from app_events e where e.user_id = p.id and e.type = 'search') as searches,
      (select count(*) from app_events e where e.user_id = p.id and e.created_at > now() - interval '14 days') as recent
    from profiles p
  ) t;
$$;
revoke execute on function public.user_archetypes() from public, anon, authenticated;

-- ---------- ADMIN: overview statistics ----------
create or replace function public.admin_overview(days int default 60) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare
  since timestamptz := now() - make_interval(days => days);
  totals jsonb; signups jsonb; methods jsonb; active jsonb; sess jsonb; installs jsonb; arche jsonb; cats jsonb; top jsonb;
  ratings jsonb; comm jsonb; prem jsonb; funnel jsonb; srch jsonb; reqs jsonb; fb jsonb; revbins jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;

  select jsonb_build_object(
    'users', (select count(*) from profiles),
    'customers', (select count(*) from profiles where not is_provider),
    'suppliers', (select count(*) from profiles where is_provider),
    'listings', (select count(*) from providers),
    'reviews', (select count(*) from reviews),
    'communities', (select count(*) from groups where owner_id is not null),
    'connections', (select count(*) / 2 from connections),
    'referrals', (select count(*) from referrals),
    'credits', (select coalesce(sum(credits), 0) from referrals),
    'requests', (select count(*) from project_requests),
    'blocked', (select count(*) from profiles where blocked),
    'premium', (select count(*) from profiles where is_premium)
  ) into totals;

  select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g.d, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0)) order by g.d), '[]'::jsonb) into signups
  from generate_series(since::date, current_date, interval '1 day') g(d)
  left join (select created_at::date as d, count(*) as n from profiles group by 1) c on c.d = g.d::date;

  select jsonb_build_object(
    'email_only', count(*) filter (where coalesce(u.email, '') <> '' and coalesce(u.phone, '') = ''),
    'phone_only', count(*) filter (where coalesce(u.email, '') = '' and coalesce(u.phone, '') <> ''),
    'both', count(*) filter (where coalesce(u.email, '') <> '' and coalesce(u.phone, '') <> '')
  ) into methods from auth.users u join profiles p on p.id = u.id;

  select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g.d, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0)) order by g.d), '[]'::jsonb) into active
  from generate_series(current_date - 29, current_date, interval '1 day') g(d)
  left join (select created_at::date as d, count(distinct coalesce(user_id::text, session_id)) as n from app_events
             where created_at >= current_date - 29 and type in ('page_view', 'heartbeat') group by 1) c on c.d = g.d::date;

  with s as (
    select session_id, least(extract(epoch from (max(created_at) - min(created_at))) + 30, 3600) as secs
    from app_events where created_at >= since and session_id is not null group by session_id
  )
  select jsonb_build_object('count', count(*), 'avg_min', round(coalesce(avg(secs), 0)::numeric / 60, 1),
    'median_min', round((coalesce(percentile_cont(0.5) within group (order by secs), 0) / 60)::numeric, 1),
    'bins', jsonb_build_array(
      jsonb_build_object('label', '<1 min', 'n', count(*) filter (where secs < 60)),
      jsonb_build_object('label', '1-3', 'n', count(*) filter (where secs >= 60 and secs < 180)),
      jsonb_build_object('label', '3-10', 'n', count(*) filter (where secs >= 180 and secs < 600)),
      jsonb_build_object('label', '10-30', 'n', count(*) filter (where secs >= 600 and secs < 1800)),
      jsonb_build_object('label', '30+', 'n', count(*) filter (where secs >= 1800)))) into sess from s;

  select jsonb_build_object(
    'pwa', count(*) filter (where type = 'pwa_install'), 'native', count(*) filter (where type = 'native_install'),
    'standalone_opens', count(*) filter (where type = 'pwa_open'), 'native_opens', count(*) filter (where type = 'native_open'),
    'web_visitors', count(distinct coalesce(user_id::text, session_id)),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g.d, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0)) order by g.d), '[]'::jsonb)
               from generate_series(since::date, current_date, interval '1 day') g(d)
               left join (select created_at::date as d, count(*) as n from app_events where type in ('pwa_install', 'native_install') and created_at >= since group by 1) c on c.d = g.d::date)
  ) into installs from app_events where created_at >= since;

  select coalesce(jsonb_agg(jsonb_build_object('name', archetype, 'n', n, 'friends', round(f, 1), 'reviews', round(r, 1), 'searches', round(s, 1)) order by n desc), '[]'::jsonb) into arche
  from (select a.archetype, count(*) as n, avg(a.friends) as f, avg(a.reviews) as r, avg(a.searches) as s
        from user_archetypes() a group by a.archetype) t;

  select coalesce(jsonb_agg(x order by (x->>'providers')::int desc), '[]'::jsonb) into cats from (
    select jsonb_build_object('category', p.category, 'providers', count(distinct p.id), 'avg_rating', round(avg(s.avg_rating), 2),
      'reviews', coalesce(sum(s.n), 0), 'views', coalesce(sum(ev.views), 0), 'contacts', coalesce(sum(ev.contacts), 0), 'impressions', coalesce(sum(ev.imps), 0)) as x
    from providers p
    left join provider_stats s on s.provider_id = p.id
    left join (select provider_id, count(*) filter (where type = 'view') as views, count(*) filter (where type = 'contact') as contacts,
                      count(*) filter (where type = 'impression') as imps from provider_events where created_at >= since group by 1) ev on ev.provider_id = p.id
    group by p.category) t;

  select coalesce(jsonb_agg(x order by sc desc), '[]'::jsonb) into top from (
    select jsonb_build_object('id', p.id, 'company', p.company, 'category', p.category, 'avg', s.avg_rating, 'n', s.n,
      'views', coalesce(ev.views, 0), 'contacts', coalesce(ev.contacts, 0)) as x, s.avg_rating * ln(s.n + 1) as sc
    from providers p join provider_stats s on s.provider_id = p.id
    left join (select provider_id, count(*) filter (where type = 'view') as views, count(*) filter (where type = 'contact') as contacts
               from provider_events where created_at >= since group by 1) ev on ev.provider_id = p.id
    order by sc desc limit 10) t;

  select jsonb_build_object('1', coalesce(sum(c1), 0), '2', coalesce(sum(c2), 0), '3', coalesce(sum(c3), 0), '4', coalesce(sum(c4), 0), '5', coalesce(sum(c5), 0)) into ratings from provider_stats;
  select jsonb_build_array(
    jsonb_build_object('label', '0', 'n', count(*) filter (where coalesce(s.n, 0) = 0)),
    jsonb_build_object('label', '1-2', 'n', count(*) filter (where s.n between 1 and 2)),
    jsonb_build_object('label', '3-5', 'n', count(*) filter (where s.n between 3 and 5)),
    jsonb_build_object('label', '6+', 'n', count(*) filter (where s.n >= 6))) into revbins
  from providers p left join provider_stats s on s.provider_id = p.id;

  with cm as (select g.id, g.name, p.full_name as owner, g.owner_id, (select count(*) from group_members gm where gm.group_id = g.id) as m
              from groups g left join profiles p on p.id = g.owner_id)
  select jsonb_build_object(
    'communities', (select count(*) from cm where owner_id is not null), 'owners', (select count(distinct owner_id) from cm where owner_id is not null),
    'avg_members', (select round(coalesce(avg(m), 0), 1) from cm where owner_id is not null),
    'official', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'members', m)), '[]'::jsonb) from cm where owner_id is null),
    'top', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'owner', owner, 'members', m) order by m desc), '[]'::jsonb)
            from (select * from cm where owner_id is not null order by m desc limit 10) z)) into comm;

  select jsonb_build_object(
    'by_feature', (select coalesce(jsonb_agg(jsonb_build_object('feature', feat, 'uses', uses, 'users', users, 'free', free_uses) order by uses desc), '[]'::jsonb)
                   from (select meta->>'feature' as feat, count(*) as uses, count(distinct coalesce(user_id::text, session_id)) as users,
                                count(*) filter (where coalesce((meta->>'free')::boolean, true)) as free_uses
                         from app_events where type = 'premium_feature' and created_at >= since group by 1) t),
    'limit_hits', (select count(*) from app_events where type = 'limit_hit' and created_at >= since),
    'premium_users', (select count(*) from profiles where is_premium)) into prem;

  select jsonb_build_object('signups', count(*), 'friends', count(*) filter (where a.friends > 0), 'searched', count(*) filter (where a.searches > 0),
    'reviewed', count(*) filter (where a.reviews > 0), 'community', count(*) filter (where a.owned > 0 or a.joined > 0), 'referred', count(*) filter (where a.refs > 0)) into funnel
  from user_archetypes() a join profiles p on p.id = a.id where not p.is_provider;

  select jsonb_build_object('total', count(*), 'zero', count(*) filter (where (meta->>'results')::int = 0),
    'by_service', (select coalesce(jsonb_agg(jsonb_build_object('service', sv, 'n', n, 'zero', z) order by n desc), '[]'::jsonb)
                   from (select coalesce(meta->>'service', 'all') as sv, count(*) as n, count(*) filter (where (meta->>'results')::int = 0) as z
                         from app_events where type = 'search' and created_at >= since group by 1) t)
  ) into srch from app_events where type = 'search' and created_at >= since;

  select coalesce(jsonb_agg(jsonb_build_object('category', category, 'n', n) order by n desc), '[]'::jsonb) into reqs from (select category, count(*) as n from project_requests group by 1) t;

  return jsonb_build_object('days', days, 'totals', totals, 'signups', signups, 'methods', methods, 'active', active, 'sessions', sess, 'installs', installs,
    'archetypes', arche, 'categories', cats, 'top', top, 'ratings', ratings, 'review_bins', revbins, 'communities', comm, 'premium', prem,
    'funnel', funnel, 'search', srch, 'requests', reqs);
end $$;

-- ---------- ADMIN: users ----------
create or replace function public.admin_users(q text default '', lim_n int default 50, off_n int default 0)
returns table (id uuid, full_name text, email text, phone text, created_at timestamptz, is_provider boolean, blocked boolean, blocked_reason text,
               is_admin boolean, archetype text, friends bigint, reviews bigint, owned bigint, joined bigint, refs bigint, searches bigint, credits bigint,
               last_seen timestamptz, total bigint)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select p.id, p.full_name, u.email::text, u.phone::text, p.created_at, p.is_provider, p.blocked, p.blocked_reason,
         exists (select 1 from admins ad where ad.user_id = p.id), a.archetype, a.friends, a.reviews, a.owned, a.joined, a.refs, a.searches,
         coalesce((select sum(r.credits) from referrals r where r.referrer_id = p.id), 0)::bigint,
         greatest(u.last_sign_in_at, (select max(e.created_at) from app_events e where e.user_id = p.id)),
         count(*) over ()
  from profiles p left join auth.users u on u.id = p.id left join user_archetypes() a on a.id = p.id
  where (q = '' or p.full_name ilike '%' || q || '%' or u.email ilike '%' || q || '%' or u.phone ilike '%' || q || '%')
  order by p.created_at desc limit lim_n offset off_n;
end $$;

create or replace function public.admin_set_blocked(uid uuid, flag boolean, reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update profiles set blocked = flag, blocked_reason = case when flag then reason else null end where id = uid;
end $$;

create or replace function public.admin_update_profile(uid uuid, new_name text, new_instagram text, new_city text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update profiles set full_name = new_name, instagram = nullif(new_instagram, ''), city = new_city where id = uid;
end $$;

create or replace function public.admin_delete_user(uid uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if uid = auth.uid() then raise exception 'You cannot delete your own admin account here.'; end if;
  delete from groups where owner_id = uid;
  delete from providers where owner_id = uid;
  delete from profiles where id = uid;
  delete from auth.users where id = uid;
end $$;

-- ---------- ADMIN: moderation ----------
create or replace function public.admin_reviews(lim_n int default 100)
returns table (id uuid, created_at timestamptz, rating int, comment text, shared boolean, reviewer_id uuid, reviewer text, provider_id uuid, provider text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query select r.id, r.created_at, r.rating, r.comment, r.share_with_friends, r.user_id, p.full_name, r.provider_id, pr.company
    from reviews r left join profiles p on p.id = r.user_id left join providers pr on pr.id = r.provider_id order by r.created_at desc limit lim_n;
end $$;
create or replace function public.admin_delete_review(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if; delete from reviews where id = rid; end $$;

create or replace function public.admin_providers()
returns table (id uuid, company text, category text, city text, description text, owner_id uuid, owner text, avg_rating numeric, n int, views bigint, contacts bigint, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query select p.id, p.company, p.category, p.city, p.description, p.owner_id, o.full_name, s.avg_rating, s.n,
      (select count(*) from provider_events e where e.provider_id = p.id and e.type = 'view'),
      (select count(*) from provider_events e where e.provider_id = p.id and e.type = 'contact'), p.created_at
    from providers p left join profiles o on o.id = p.owner_id left join provider_stats s on s.provider_id = p.id order by p.created_at desc;
end $$;
create or replace function public.admin_update_provider(pid uuid, new_company text, new_category text, new_city text, new_description text) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if;
  update providers set company = new_company, category = new_category, city = new_city, description = new_description where id = pid; end $$;
create or replace function public.admin_delete_provider(pid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if; delete from providers where id = pid; end $$;

create or replace function public.admin_communities()
returns table (id uuid, name text, description text, owner_id uuid, owner text, members bigint, official boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query select g.id, g.name, g.description, g.owner_id, o.full_name, (select count(*) from group_members m where m.group_id = g.id), g.owner_id is null, g.created_at
    from groups g left join profiles o on o.id = g.owner_id order by g.created_at desc;
end $$;
create or replace function public.admin_delete_community(gid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if; delete from groups where id = gid; end $$;

-- ---------- ADMIN: editor + team ----------
create or replace function public.admin_set_setting(k text, v jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if;
  insert into app_settings (key, value, updated_at) values (k, v, now()) on conflict (key) do update set value = excluded.value, updated_at = now(); end $$;

create or replace function public.admin_list_admins() returns table (user_id uuid, email text, full_name text)
language plpgsql stable security definer set search_path = public, auth as $$
begin if not public.is_admin() then raise exception 'not authorized'; end if;
  return query select a.user_id, u.email::text, p.full_name from admins a left join auth.users u on u.id = a.user_id left join profiles p on p.id = a.user_id; end $$;
create or replace function public.admin_set_admin(target_email text, flag boolean) returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then return 'No user with that email.'; end if;
  if flag then insert into admins (user_id) values (uid) on conflict do nothing;
  else
    if uid = auth.uid() then return 'You cannot remove yourself.'; end if;
    delete from admins where user_id = uid;
  end if;
  return 'ok';
end $$;

-- lock down: admin RPCs only for signed-in users (each also checks is_admin())
do $$ declare f text; begin
  foreach f in array array['admin_overview(int)','admin_users(text,int,int)','admin_set_blocked(uuid,boolean,text)','admin_update_profile(uuid,text,text,text)','admin_delete_user(uuid)','admin_reviews(int)','admin_delete_review(uuid)','admin_providers()','admin_update_provider(uuid,text,text,text,text)','admin_delete_provider(uuid)','admin_communities()','admin_delete_community(uuid)','admin_set_setting(text,jsonb)','admin_list_admins()','admin_set_admin(text,boolean)']
  loop execute format('revoke execute on function public.%s from public, anon', f); execute format('grant execute on function public.%s to authenticated', f); end loop;
end $$;
