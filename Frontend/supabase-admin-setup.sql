-- 1) Register your owner account in the app first.
-- 2) Replace the email below with your real owner email.
-- 3) Run this after supabase-schema.sql.

insert into public.profiles (id, full_name, is_admin)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, ''), '@', 1)),
  true
from auth.users u
where lower(u.email) = lower('admin@example.com')
on conflict (id) do update
set is_admin = true,
    updated_at = timezone('utc', now());

select id, email
from auth.users
where lower(email) = lower('admin@example.com');

select id, full_name, is_admin
from public.profiles
where is_admin = true
order by updated_at desc nulls last;
