-- REPORT + BLOCK (App Store Guideline 1.2). Run after admin.sql.
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles on delete cascade,
  blocked_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists "blocks own read" on public.user_blocks;
create policy "blocks own read" on public.user_blocks for select using (blocker_id = auth.uid());

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles on delete set null,
  target_type text not null check (target_type in ('review', 'provider', 'user')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;   -- no policies: only RPCs touch it

-- circle excludes anyone blocked in either direction
create or replace function public.in_my_circle(target uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select not exists (select 1 from user_blocks b where (b.blocker_id = auth.uid() and b.blocked_id = target) or (b.blocker_id = target and b.blocked_id = auth.uid()))
     and (exists (select 1 from connections c where c.user_id = auth.uid() and c.friend_id = target)
       or exists (select 1 from group_members a join group_members b on a.group_id = b.group_id
                  where a.user_id = auth.uid() and b.user_id = target and b.visible));
$$;

create or replace function public.block_user(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or target = auth.uid() then return; end if;
  insert into user_blocks (blocker_id, blocked_id) values (auth.uid(), target) on conflict do nothing;
  delete from connections where (user_id = auth.uid() and friend_id = target) or (user_id = target and friend_id = auth.uid());
end $$;

create or replace function public.unblock_user(target uuid) returns void
language sql security definer set search_path = public as $$
  delete from user_blocks where blocker_id = auth.uid() and blocked_id = target;
$$;

create or replace function public.my_blocked() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name from user_blocks b join profiles p on p.id = b.blocked_id where b.blocker_id = auth.uid();
$$;

create or replace function public.report_content(ttype text, tid uuid, why text, more text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in to report.'; end if;
  insert into reports (reporter_id, target_type, target_id, reason, details) values (auth.uid(), ttype, tid, why, nullif(trim(coalesce(more, '')), ''));
end $$;

-- admin side
create or replace function public.admin_reports(only_open boolean default true)
returns table (id uuid, created_at timestamptz, status text, target_type text, target_id uuid, reason text, details text, reporter text, summary text, author_id uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select r.id, r.created_at, r.status, r.target_type, r.target_id, r.reason, r.details, rp.full_name,
    case r.target_type
      when 'review' then (select coalesce(rv.rating::text || '★ ', '') || coalesce(rv.comment, '(no comment)') from reviews rv where rv.id = r.target_id)
      when 'provider' then (select pr.company from providers pr where pr.id = r.target_id)
      else (select pf.full_name from profiles pf where pf.id = r.target_id) end,
    case r.target_type
      when 'review' then (select rv.user_id from reviews rv where rv.id = r.target_id)
      when 'provider' then (select pr.owner_id from providers pr where pr.id = r.target_id)
      else r.target_id end
  from reports r left join profiles rp on rp.id = r.reporter_id
  where (not only_open or r.status = 'open') order by r.created_at desc limit 200;
end $$;

create or replace function public.admin_resolve_report(rid uuid, new_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update reports set status = new_status where id = rid;
end $$;

grant execute on function public.block_user(uuid), public.unblock_user(uuid), public.my_blocked(), public.report_content(text, uuid, text, text),
  public.admin_reports(boolean), public.admin_resolve_report(uuid, text) to authenticated;
revoke execute on function public.admin_reports(boolean), public.admin_resolve_report(uuid, text) from public, anon;
