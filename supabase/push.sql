-- PUSH NOTIFICATIONS (iOS). Run after moderation.sql.
create table if not exists public.device_tokens (
  token text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  platform text not null default 'ios',
  created_at timestamptz not null default now()
);
alter table public.device_tokens enable row level security;   -- RPC-only

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles on delete cascade,
  title text not null,
  body text not null,
  url text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists notifications_unsent on public.notifications (created_at) where sent_at is null;
alter table public.notifications enable row level security;
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications for select using (user_id = auth.uid());

create or replace function public.register_device(tok text, plat text default 'ios') returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into device_tokens (token, user_id, platform) values (tok, auth.uid(), plat)
  on conflict (token) do update set user_id = auth.uid(), created_at = now();
end $$;

create or replace function public.unregister_devices() returns void
language sql security definer set search_path = public as $$ delete from device_tokens where user_id = auth.uid(); $$;

create or replace function public.has_push() returns boolean
language sql stable security definer set search_path = public as $$ select exists (select 1 from device_tokens where user_id = auth.uid()); $$;
grant execute on function public.register_device(text, text), public.unregister_devices(), public.has_push() to authenticated;

-- ---- triggers that queue notifications ----
-- 1) a friend reviewed a pro
create or replace function public.notify_friend_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text; co text; cat text;
begin
  if not new.share_with_friends then return new; end if;
  select split_part(coalesce(nullif(full_name, ''), 'A friend'), ' ', 1) into who from profiles where id = new.user_id;
  select company, category into co, cat from providers where id = new.provider_id;
  insert into notifications (user_id, title, body, url)
  select c.user_id, who || ' reviewed ' || co, new.rating || '★ — see what your friend said', '/providers/' || new.provider_id
  from connections c where c.friend_id = new.user_id
    and not exists (select 1 from user_blocks b where (b.blocker_id = c.user_id and b.blocked_id = new.user_id) or (b.blocker_id = new.user_id and b.blocked_id = c.user_id));
  return new;
end $$;
drop trigger if exists trg_notify_friend_review on public.reviews;
create trigger trg_notify_friend_review after insert on public.reviews for each row execute function public.notify_friend_review();

-- 2) someone joined your community
create or replace function public.notify_community_join() returns trigger
language plpgsql security definer set search_path = public as $$
declare g groups; who text;
begin
  select * into g from groups where id = new.group_id;
  if g.owner_id is null or g.owner_id = new.user_id then return new; end if;
  select split_part(coalesce(nullif(full_name, ''), 'Someone'), ' ', 1) into who from profiles where id = new.user_id;
  insert into notifications (user_id, title, body, url) values (g.owner_id, who || ' joined ' || g.name, 'Your community is growing 🎉', '/network');
  return new;
end $$;
drop trigger if exists trg_notify_community_join on public.group_members;
create trigger trg_notify_community_join after insert on public.group_members for each row execute function public.notify_community_join();

-- 3) you earned referral credits
create or replace function public.notify_referral() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, title, body, url)
  values (new.referrer_id, 'You earned ' || new.credits || ' credit' || case when new.credits = 1 then '' else 's' end, 'Someone joined WOM through your link.', '/network');
  return new;
end $$;
drop trigger if exists trg_notify_referral on public.referrals;
create trigger trg_notify_referral after insert on public.referrals for each row execute function public.notify_referral();

-- ---- delivery: call the sender every minute (needs Supabase extensions pg_cron + pg_net) ----
-- Replace YOUR-SITE and PUSH_SECRET (same value as the PUSH_SECRET env var in Vercel), then run:
--   create extension if not exists pg_net; create extension if not exists pg_cron;
--   select cron.schedule('wom-push', '* * * * *', $$
--     select net.http_post(url := 'https://YOUR-SITE/api/push/send', headers := jsonb_build_object('Authorization', 'Bearer PUSH_SECRET')) $$);
