-- UX: in-app notifications inbox + profile photo galleries. Run after push.sql and cities_universities.sql.
alter table public.notifications add column if not exists read_at timestamptz;

create or replace function public.unread_notifications() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from notifications where user_id = auth.uid() and read_at is null;
$$;

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.unread_notifications(), public.mark_notifications_read() to authenticated;

-- gallery: up to 8 extra photos per listing (first image after photo_url)
alter table public.providers add column if not exists photos text[] not null default '{}';
