-- COMMUNITIES & AMBASSADORS. Run once (after referrals.sql).
-- Anyone can create up to 3 communities for free (more with premium) and share an invite link. The creator is the community's ambassador.
alter table public.groups add column if not exists owner_id uuid references public.profiles on delete set null;
alter table public.groups add column if not exists invite_code text unique;
update public.groups set invite_code = substr(md5(gen_random_uuid()::text), 1, 10) where invite_code is null;
alter table public.groups alter column invite_code set default substr(md5(gen_random_uuid()::text), 1, 10);
alter table public.profiles add column if not exists is_premium boolean not null default false;

alter table public.referrals drop constraint if exists referrals_kind_check;
alter table public.referrals add constraint referrals_kind_check check (kind in ('friend', 'supplier', 'community'));

-- only official groups are listed publicly; communities are visible to owner/members (everyone else uses the invite link)
drop policy if exists "groups read" on public.groups;
create policy "groups read" on public.groups for select
  using (owner_id is null or owner_id = auth.uid() or id in (select public.my_group_ids()));
drop policy if exists "groups owner update" on public.groups;
create policy "groups owner update" on public.groups for update using (owner_id = auth.uid());
drop policy if exists "groups owner delete" on public.groups;
create policy "groups owner delete" on public.groups for delete using (owner_id = auth.uid());

create or replace function public.create_community(cname text, cdesc text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; prem boolean; g groups; v_slug text;
begin
  if uid is null then return jsonb_build_object('error', 'Please sign in.'); end if;
  if length(trim(coalesce(cname, ''))) < 3 then return jsonb_build_object('error', 'Give your community a name (at least 3 characters).'); end if;
  select count(*) into n from groups where owner_id = uid;
  select coalesce(is_premium, false) into prem from profiles where id = uid;
  if not coalesce(prem, false) and n >= 3 then
    return jsonb_build_object('error', 'You''ve reached the free limit of 3 communities. Premium (coming soon) unlocks more — grow your network to earn free premium months.', 'limit', true);
  end if;
  v_slug := trim(both '-' from lower(regexp_replace(cname, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
  insert into groups (slug, name, description, owner_id) values (v_slug, trim(cname), nullif(trim(coalesce(cdesc, '')), ''), uid) returning * into g;
  insert into group_members (group_id, user_id) values (g.id, uid);
  return jsonb_build_object('id', g.id, 'invite_code', g.invite_code);
end $$;
grant execute on function public.create_community(text, text) to authenticated;

create or replace function public.community_preview(code text)
returns table (id uuid, name text, description text, owner_name text, members int, is_member boolean, slug text)
language sql security definer stable set search_path = public as $$
  select g.id, g.name, g.description, p.full_name,
         (select count(*)::int from group_members m where m.group_id = g.id),
         exists (select 1 from group_members m where m.group_id = g.id and m.user_id = auth.uid()),
         g.slug
  from groups g left join profiles p on p.id = g.owner_id
  where g.invite_code = code;
$$;
grant execute on function public.community_preview(text) to anon, authenticated;

create or replace function public.join_community(code text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare g groups; em text;
begin
  if auth.uid() is null then return 'Please sign in first.'; end if;
  select * into g from groups where invite_code = code;
  if g.id is null then return 'Community not found.'; end if;
  select email into em from auth.users where id = auth.uid();
  if g.email_domain is not null and lower(split_part(coalesce(em, ''), '@', 2)) <> lower(g.email_domain) then
    return 'You need a verified @' || g.email_domain || ' email to join this community.';
  end if;
  insert into group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return 'ok';
end $$;
grant execute on function public.join_community(text) to authenticated;

create or replace function public.regenerate_invite(gid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text := substr(md5(gen_random_uuid()::text), 1, 10);
begin
  update groups set invite_code = c where id = gid and owner_id = auth.uid();
  return case when found then c else null end;
end $$;
grant execute on function public.regenerate_invite(uuid) to authenticated;

-- signup trigger: + joining a community via invite link (metadata.community) and crediting its ambassador
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  prov boolean := coalesce((m->>'is_provider') = 'true', false);
  refid uuid;
  g groups;
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
  begin refid := (m->>'ref')::uuid; exception when others then refid := null; end;
  if refid is not null and refid <> new.id and exists (select 1 from profiles where id = refid) then
    if not prov then
      insert into connections values (refid, new.id), (new.id, refid) on conflict do nothing;
    end if;
    if now() < timestamptz '2026-12-01 00:00:00 America/Chicago' then
      insert into referrals (referrer_id, referred_id, kind, credits)
      values (refid, new.id, case when prov then 'supplier' else 'friend' end, case when prov then 3 else 1 end)
      on conflict do nothing;
    end if;
  end if;
  if coalesce(m->>'community', '') <> '' then
    select * into g from groups where invite_code = m->>'community';
    if g.id is not null and (g.email_domain is null or lower(split_part(coalesce(new.email, ''), '@', 2)) = lower(g.email_domain)) then
      insert into group_members (group_id, user_id) values (g.id, new.id) on conflict do nothing;
      if g.owner_id is not null and g.owner_id <> new.id then
        insert into referrals (referrer_id, referred_id, kind, credits) values (g.owner_id, new.id, 'community', 1) on conflict do nothing;
      end if;
    end if;
  end if;
  return new;
end $$;
