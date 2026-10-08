-- FEEDBACK SYSTEM. Run once in Supabase SQL editor (after schema.sql).
create table if not exists public.admins (user_id uuid primary key references auth.users on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  reporter text,
  category text not null default 'idea' check (category in ('idea','bug','design','copy')),
  comment text not null,
  path text,
  url text,
  target jsonb,            -- pointed-at element: selector, tag, text, html, rect
  selected_text text,
  screenshot text,         -- jpeg data URL of the selected area
  has_screenshot boolean generated always as (screenshot is not null) stored,
  viewport jsonb,
  user_agent text,
  status text not null default 'new' check (status in ('new','prompted','implemented','dismissed')),
  note text,
  implemented_at timestamptz
);
alter table public.feedback enable row level security;
drop policy if exists "feedback insert any" on public.feedback;
drop policy if exists "feedback admin read" on public.feedback;
drop policy if exists "feedback admin update" on public.feedback;
drop policy if exists "feedback admin delete" on public.feedback;
create policy "feedback insert any" on public.feedback for insert with check (true);
-- Open by design: the tracker is shared by link with the team (no login).
create policy "feedback admin read" on public.feedback for select using (true);
create policy "feedback admin update" on public.feedback for update using (true);
create policy "feedback admin delete" on public.feedback for delete using (true);

-- make yourself admin (change the email if needed)
insert into public.admins (user_id)
select id from auth.users where email = 'jscarcelen@gmail.com'
on conflict do nothing;
