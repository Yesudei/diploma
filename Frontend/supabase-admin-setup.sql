-- Melodex admin setup and existing-project migration
-- Run this in Supabase Dashboard -> SQL Editor after creating your owner account.

alter table public.profiles
  add column if not exists is_admin boolean default false;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

do $$
declare
  policy record;
begin
  for policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname like 'Admins can manage all %'
      and tablename in (
        'audio_files',
        'mixing_analysis',
        'melody_variations',
        'chat_messages',
        'purchased_courses',
        'completed_lessons',
        'course_progress',
        'marketplace_items',
        'payments'
      )
  loop
    execute format('drop policy %I on public.%I', policy.policyname, policy.tablename);
  end loop;
end $$;

create policy "Admins can manage all audio files"
  on public.audio_files
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all mixing analysis"
  on public.mixing_analysis
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all melody variations"
  on public.melody_variations
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all chat messages"
  on public.chat_messages
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all purchases"
  on public.purchased_courses
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all completed lessons"
  on public.completed_lessons
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all course progress"
  on public.course_progress
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all marketplace items"
  on public.marketplace_items
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage all payments"
  on public.payments
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Replace admin@example.com with the email you used in the app, then run it.
update public.profiles
set is_admin = true,
    updated_at = now()
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
