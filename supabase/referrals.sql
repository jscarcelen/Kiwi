-- REFERRALS & CREDITS. Run once (after verticals.sql).
-- Promo: 1 credit per friend who joins via your link, 3 credits (triple) per supplier who signs up via your supplier link.
-- Only sign-ups before 2026-12-01 (Chicago time) earn credit. Credits become cashback on premium features when they launch.
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles on delete cascade,
  referred_id uuid not null unique references public.profiles on delete cascade,
  kind text not null check (kind in ('friend', 'supplier')),
  credits int not null,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
drop policy if exists "referrals read own" on public.referrals;
create policy "referrals read own" on public.referrals for select using (referrer_id = auth.uid());

-- signup trigger: profile, phone, provider, + referral attribution via metadata.ref
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  prov boolean := coalesce((m->>'is_provider') = 'true', false);
  refid uuid;
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
  return new;
end $$;
