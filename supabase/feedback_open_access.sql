-- Run once: opens the feedback tracker to anyone with the link (no login).
drop policy if exists "feedback admin read" on public.feedback;
drop policy if exists "feedback admin update" on public.feedback;
drop policy if exists "feedback admin delete" on public.feedback;
create policy "feedback admin read" on public.feedback for select using (true);
create policy "feedback admin update" on public.feedback for update using (true);
create policy "feedback admin delete" on public.feedback for delete using (true);
