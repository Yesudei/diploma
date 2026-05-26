-- Production migration for the 2026-05-26 payment/progress/admin update.
-- Run this in the Supabase SQL Editor before deploying the matching frontend.

alter table public.payments
  add column if not exists payment_reference text,
  add column if not exists approved_at timestamp with time zone,
  add column if not exists refunded_at timestamp with time zone;

alter table public.course_progress
  add column if not exists passed_lesson_quiz_ids text[] default '{}',
  add column if not exists course_quiz_passed boolean default false,
  add column if not exists self_check_mode text;

create index if not exists idx_payments_payment_reference
  on public.payments(payment_reference);

create index if not exists idx_course_progress_course_user
  on public.course_progress(course_id, user_id);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'Admins can update payments'
  ) then
    create policy "Admins can update payments" on public.payments
      for update
      using (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'Admins can delete payments'
  ) then
    create policy "Admins can delete payments" on public.payments
      for delete
      using (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'purchased_courses'
      and policyname = 'Admins can delete purchases'
  ) then
    create policy "Admins can delete purchases" on public.purchased_courses
      for delete
      using (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
      );
  end if;
end
$$;
