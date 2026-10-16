-- USER-ADDED ("recommended") PRO PROFILES. Run after moderation.sql.
alter table public.providers add column if not exists created_by uuid references public.profiles on delete set null;
alter table public.providers add column if not exists unclaimed boolean not null default false;

-- private data only the adder / admin / adder's circle can reach through RPCs
create table if not exists public.provider_private (
  provider_id uuid primary key references public.providers on delete cascade,
  phone text,
  claim_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_by uuid references public.profiles on delete set null
);
alter table public.provider_private enable row level security;   -- no policies: RPC only

create or replace function public.provider_review_count(pid uuid) returns int
language sql stable security definer set search_path = public as $$ select count(*)::int from reviews where provider_id = pid; $$;

-- unclaimed profiles: visible to the adder, their circle, admins, or everyone once they have 3+ ratings
drop policy if exists "providers read" on public.providers;
create policy "providers read" on public.providers for select using (
  not unclaimed or created_by = auth.uid() or public.is_admin()
  or (created_by is not null and public.in_my_circle(created_by))
  or public.provider_review_count(id) >= 3);

-- possible duplicates before creating
create or replace function public.find_similar_pros(nm text, ph text default null, cty text default null)
returns table (id uuid, company text, category text, city text)
language sql stable security definer set search_path = public as $$
  select p.id, p.company, p.category, p.city
  from providers p left join provider_private pp on pp.provider_id = p.id
  where auth.uid() is not null
    and (not p.unclaimed or p.created_by = auth.uid() or public.provider_review_count(p.id) >= 3 or (p.created_by is not null and public.in_my_circle(p.created_by)))
    and ((length(trim(coalesce(nm, ''))) >= 3 and lower(p.company) like '%' || lower(trim(nm)) || '%')
      or (length(regexp_replace(coalesce(ph, ''), '\D', '', 'g')) >= 7
          and regexp_replace(coalesce(pp.phone, p.phone, ''), '\D', '', 'g') like '%' || right(regexp_replace(ph, '\D', '', 'g'), 10)))
  limit 5;
$$;

create or replace function public.add_pro(p_name text, p_category text, p_city text, p_phone text, p_note text, p_rating int, p_comment text, p_attrs jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pid uuid; tok text; recent int;
begin
  if uid is null then return jsonb_build_object('error', 'Please sign in.'); end if;
  if public.is_blocked(uid) then return jsonb_build_object('error', 'Your account is restricted.'); end if;
  if length(trim(coalesce(p_name, ''))) < 2 then return jsonb_build_object('error', 'Enter the pro''s name or business name.'); end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then return jsonb_build_object('error', 'Add your rating — profiles start with a recommendation.'); end if;
  select count(*) into recent from providers where created_by = uid and created_at > now() - interval '24 hours';
  if recent >= 10 then return jsonb_build_object('error', 'Daily limit reached. Try again tomorrow.'); end if;
  insert into providers (owner_id, company, contact_name, category, city, regions, description, attributes, unclaimed, created_by)
  values (null, trim(p_name), trim(p_name), p_category, coalesce(nullif(trim(p_city), ''), 'Chicago'), array[coalesce(nullif(trim(p_city), ''), 'Chicago')],
          nullif(left(trim(coalesce(p_note, '')), 400), ''), coalesce(p_attrs, '{}'::jsonb), true, uid)
  returning id into pid;
  insert into provider_private (provider_id, phone, created_by) values (pid, nullif(trim(coalesce(p_phone, '')), ''), uid) returning claim_token into tok;
  insert into reviews (provider_id, user_id, rating, comment, share_with_friends) values (pid, uid, p_rating, nullif(left(trim(coalesce(p_comment, '')), 1000), ''), true);
  return jsonb_build_object('id', pid, 'token', tok);
end $$;

-- contact details: claimed pros as usual; unclaimed pros only for the adder, their circle and admins
create or replace function public.provider_contact(pid uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p providers; ph text;
begin
  select * into p from providers where id = pid;
  if p.id is null then return null; end if;
  if not p.unclaimed then return jsonb_build_object('phone', p.phone, 'email', p.email); end if;
  if auth.uid() is not null and (p.created_by = auth.uid() or public.is_admin() or (p.created_by is not null and public.in_my_circle(p.created_by))) then
    select phone into ph from provider_private where provider_id = pid;
    return jsonb_build_object('phone', ph, 'email', null);
  end if;
  return jsonb_build_object('phone', null, 'email', null);
end $$;

-- the adder's own list (with claim links)
create or replace function public.my_added_pros() returns table (id uuid, company text, category text, city text, unclaimed boolean, token text, ratings int)
language sql stable security definer set search_path = public as $$
  select p.id, p.company, p.category, p.city, p.unclaimed, case when p.unclaimed then pp.claim_token end, public.provider_review_count(p.id)
  from providers p join provider_private pp on pp.provider_id = p.id where p.created_by = auth.uid() order by p.created_at desc;
$$;

create or replace function public.claim_preview(tok text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', p.id, 'company', p.company, 'category', p.category, 'city', p.city, 'unclaimed', p.unclaimed,
    'adder', split_part(coalesce(nullif(a.full_name, ''), 'A friend'), ' ', 1), 'ratings', public.provider_review_count(p.id))
  from provider_private pp join providers p on p.id = pp.provider_id left join profiles a on a.id = p.created_by where pp.claim_token = tok;
$$;
grant execute on function public.claim_preview(text) to anon, authenticated;

create or replace function public.claim_pro(tok text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p providers; ph text; credit int := public.setting_num('credit_supplier', 3)::int;
  promo_end date := coalesce((select (value #>> '{}')::date from app_settings where key = 'promo_end'), date '2026-12-01');
begin
  if uid is null then return jsonb_build_object('error', 'Please sign in first.'); end if;
  select p0.* into p from provider_private pp join providers p0 on p0.id = pp.provider_id where pp.claim_token = tok;
  if p.id is null then return jsonb_build_object('error', 'This claim link is no longer valid.'); end if;
  if not p.unclaimed or p.owner_id is not null then return jsonb_build_object('error', 'This profile has already been claimed.'); end if;
  if p.created_by = uid then return jsonb_build_object('error', 'You added this profile — send the link to the pro so they can claim it.'); end if;
  if exists (select 1 from providers where owner_id = uid) then return jsonb_build_object('error', 'Your account already has a pro profile. Contact support to merge them.'); end if;
  select phone into ph from provider_private where provider_id = p.id;
  update providers set owner_id = uid, unclaimed = false, phone = ph, contact_name = coalesce(nullif(contact_name, ''), company) where id = p.id;
  update profiles set is_provider = true where id = uid;
  if p.created_by is not null and p.created_by <> uid and current_date < promo_end then
    insert into referrals (referrer_id, referred_id, kind, credits) values (p.created_by, uid, 'supplier', credit) on conflict do nothing;
  end if;
  return jsonb_build_object('id', p.id);
end $$;

create or replace function public.unclaim_remove(pid uuid) returns void   -- adder can withdraw an unclaimed profile
language plpgsql security definer set search_path = public as $$
begin
  delete from providers where id = pid and unclaimed and created_by = auth.uid();
end $$;

-- admin list now shows unclaimed profiles + who added them
drop function if exists public.admin_providers();
create or replace function public.admin_providers()
returns table (id uuid, company text, category text, city text, description text, owner_id uuid, owner text, avg_rating numeric, n int, views bigint, contacts bigint, created_at timestamptz, unclaimed boolean, added_by text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query select p.id, p.company, p.category, p.city, p.description, p.owner_id, o.full_name, s.avg_rating, s.n,
      (select count(*) from provider_events e where e.provider_id = p.id and e.type = 'view'),
      (select count(*) from provider_events e where e.provider_id = p.id and e.type = 'contact'), p.created_at, p.unclaimed, cb.full_name
    from providers p left join profiles o on o.id = p.owner_id left join profiles cb on cb.id = p.created_by left join provider_stats s on s.provider_id = p.id order by p.unclaimed desc, p.created_at desc;
end $$;
revoke execute on function public.admin_providers() from public, anon;

grant execute on function public.add_pro(text, text, text, text, text, int, text, jsonb), public.find_similar_pros(text, text, text), public.provider_contact(uuid),
  public.my_added_pros(), public.claim_pro(text), public.unclaim_remove(uuid), public.admin_providers() to authenticated;
grant execute on function public.provider_contact(uuid) to anon;
