create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.profiles
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists is_admin boolean not null default false,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.courses (
  course_id text primary key,
  title text not null,
  description text,
  thumbnail text,
  price integer not null default 0,
  teacher_id text,
  teacher_name text,
  category text not null,
  level text not null,
  slug text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.courses
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists thumbnail text,
  add column if not exists price integer not null default 0,
  add column if not exists teacher_id text,
  add column if not exists teacher_name text,
  add column if not exists category text,
  add column if not exists level text,
  add column if not exists slug text,
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.lessons (
  lesson_id text primary key,
  course_id text not null references public.courses (course_id) on delete cascade,
  title text not null,
  youtube_id text,
  duration_minutes integer not null default 0,
  summary text,
  exercise text,
  takeaway text,
  content_type text not null default 'brief',
  free boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.lessons
  add column if not exists course_id text,
  add column if not exists title text,
  add column if not exists youtube_id text,
  add column if not exists duration_minutes integer not null default 0,
  add column if not exists summary text,
  add column if not exists exercise text,
  add column if not exists takeaway text,
  add column if not exists content_type text not null default 'brief',
  add column if not exists free boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  source text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.knowledge_base
  add column if not exists category text,
  add column if not exists question text,
  add column if not exists answer text,
  add column if not exists source text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_message text not null,
  ai_response text,
  category text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.chat_messages
  add column if not exists user_id uuid,
  add column if not exists user_message text,
  add column if not exists ai_response text,
  add column if not exists category text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.audio_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  storage_path text,
  file_size_bytes bigint,
  mime_type text,
  is_processed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.audio_files
  add column if not exists user_id uuid,
  add column if not exists filename text,
  add column if not exists storage_path text,
  add column if not exists file_size_bytes bigint,
  add column if not exists mime_type text,
  add column if not exists is_processed boolean not null default false,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.mixing_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  audio_file_id uuid references public.audio_files (id) on delete cascade,
  analysis_type text,
  loudness_lufs numeric,
  peak_level_dbfs numeric,
  dynamic_range_db numeric,
  frequency_balance jsonb not null default '{}'::jsonb,
  instrument_separation jsonb not null default '{}'::jsonb,
  artifacts text[] not null default '{}'::text[],
  recommendations text[] not null default '{}'::text[],
  overall_score numeric,
  analyzed_at timestamptz not null default timezone('utc', now()),
  processing_time_ms integer
);

alter table if exists public.mixing_analysis
  add column if not exists user_id uuid,
  add column if not exists audio_file_id uuid,
  add column if not exists analysis_type text,
  add column if not exists loudness_lufs numeric,
  add column if not exists peak_level_dbfs numeric,
  add column if not exists dynamic_range_db numeric,
  add column if not exists frequency_balance jsonb not null default '{}'::jsonb,
  add column if not exists instrument_separation jsonb not null default '{}'::jsonb,
  add column if not exists artifacts text[] not null default '{}'::text[],
  add column if not exists recommendations text[] not null default '{}'::text[],
  add column if not exists overall_score numeric,
  add column if not exists analyzed_at timestamptz not null default timezone('utc', now()),
  add column if not exists processing_time_ms integer;

create table if not exists public.purchased_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, course_id)
);

alter table if exists public.purchased_courses
  add column if not exists user_id uuid,
  add column if not exists course_id text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.completed_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, lesson_id)
);

alter table if exists public.completed_lessons
  add column if not exists user_id uuid,
  add column if not exists course_id text,
  add column if not exists lesson_id text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null,
  progress_percent numeric not null default 0,
  last_lesson_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, course_id)
);

alter table if exists public.course_progress
  add column if not exists user_id uuid,
  add column if not exists course_id text,
  add column if not exists progress_percent numeric not null default 0,
  add column if not exists last_lesson_id text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text,
  amount numeric(12, 2) not null default 0,
  currency text default 'MNT',
  status text default 'pending',
  payment_method text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.payments
  add column if not exists user_id uuid,
  add column if not exists course_id text,
  add column if not exists amount numeric(12, 2) not null default 0,
  add column if not exists currency text default 'MNT',
  add column if not exists status text default 'pending',
  add column if not exists payment_method text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null,
  price numeric(12, 2) not null default 0,
  rating numeric(3, 2) not null default 0,
  download_count integer not null default 0,
  creator text not null,
  creator_url text,
  preview_url text,
  download_url text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.marketplace_items
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists price numeric(12, 2) not null default 0,
  add column if not exists rating numeric(3, 2) not null default 0,
  add column if not exists download_count integer not null default 0,
  add column if not exists creator text,
  add column if not exists creator_url text,
  add column if not exists preview_url text,
  add column if not exists download_url text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists lessons_course_id_idx on public.lessons (course_id, sort_order);
create index if not exists courses_slug_idx on public.courses (slug);
create index if not exists audio_files_user_id_idx on public.audio_files (user_id, created_at desc);
create index if not exists mixing_analysis_user_id_idx on public.mixing_analysis (user_id, analyzed_at desc);
create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id, created_at desc);
create index if not exists purchased_courses_user_id_idx on public.purchased_courses (user_id, created_at desc);
create index if not exists completed_lessons_user_id_idx on public.completed_lessons (user_id, created_at desc);
create index if not exists course_progress_user_id_idx on public.course_progress (user_id, updated_at desc);
create index if not exists payments_user_id_idx on public.payments (user_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row execute procedure public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
before update on public.lessons
for each row execute procedure public.set_updated_at();

drop trigger if exists course_progress_set_updated_at on public.course_progress;
create trigger course_progress_set_updated_at
before update on public.course_progress
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and is_admin = true
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.chat_messages enable row level security;
alter table public.audio_files enable row level security;
alter table public.mixing_analysis enable row level security;
alter table public.purchased_courses enable row level security;
alter table public.completed_lessons enable row level security;
alter table public.course_progress enable row level security;
alter table public.payments enable row level security;
alter table public.marketplace_items enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "courses_public_select" on public.courses;
create policy "courses_public_select"
on public.courses
for select
using (true);

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write"
on public.courses
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "lessons_public_select" on public.lessons;
create policy "lessons_public_select"
on public.lessons
for select
using (true);

drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write"
on public.lessons
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "knowledge_public_select" on public.knowledge_base;
create policy "knowledge_public_select"
on public.knowledge_base
for select
using (true);

drop policy if exists "knowledge_admin_write" on public.knowledge_base;
create policy "knowledge_admin_write"
on public.knowledge_base
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "chat_messages_select_own_or_admin" on public.chat_messages;
create policy "chat_messages_select_own_or_admin"
on public.chat_messages
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "chat_messages_insert_own_or_admin" on public.chat_messages;
create policy "chat_messages_insert_own_or_admin"
on public.chat_messages
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "audio_files_select_own_or_admin" on public.audio_files;
create policy "audio_files_select_own_or_admin"
on public.audio_files
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "audio_files_insert_own_or_admin" on public.audio_files;
create policy "audio_files_insert_own_or_admin"
on public.audio_files
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "audio_files_update_own_or_admin" on public.audio_files;
create policy "audio_files_update_own_or_admin"
on public.audio_files
for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "audio_files_delete_own_or_admin" on public.audio_files;
create policy "audio_files_delete_own_or_admin"
on public.audio_files
for delete
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "mixing_analysis_select_own_or_admin" on public.mixing_analysis;
create policy "mixing_analysis_select_own_or_admin"
on public.mixing_analysis
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "mixing_analysis_insert_own_or_admin" on public.mixing_analysis;
create policy "mixing_analysis_insert_own_or_admin"
on public.mixing_analysis
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "mixing_analysis_update_admin" on public.mixing_analysis;
create policy "mixing_analysis_update_admin"
on public.mixing_analysis
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "purchased_courses_select_own_or_admin" on public.purchased_courses;
create policy "purchased_courses_select_own_or_admin"
on public.purchased_courses
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "purchased_courses_insert_own_or_admin" on public.purchased_courses;
create policy "purchased_courses_insert_own_or_admin"
on public.purchased_courses
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "completed_lessons_select_own_or_admin" on public.completed_lessons;
create policy "completed_lessons_select_own_or_admin"
on public.completed_lessons
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "completed_lessons_insert_own_or_admin" on public.completed_lessons;
create policy "completed_lessons_insert_own_or_admin"
on public.completed_lessons
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "course_progress_select_own_or_admin" on public.course_progress;
create policy "course_progress_select_own_or_admin"
on public.course_progress
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "course_progress_insert_own_or_admin" on public.course_progress;
create policy "course_progress_insert_own_or_admin"
on public.course_progress
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "course_progress_update_own_or_admin" on public.course_progress;
create policy "course_progress_update_own_or_admin"
on public.course_progress
for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin"
on public.payments
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "payments_insert_own_or_admin" on public.payments;
create policy "payments_insert_own_or_admin"
on public.payments
for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "marketplace_public_select" on public.marketplace_items;
create policy "marketplace_public_select"
on public.marketplace_items
for select
using (true);

drop policy if exists "marketplace_admin_write" on public.marketplace_items;
create policy "marketplace_admin_write"
on public.marketplace_items
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio-files',
  'audio-files',
  false,
  52428800,
  array[
    'audio/wav',
    'audio/x-wav',
    'audio/mpeg',
    'audio/flac',
    'audio/ogg',
    'audio/x-midi',
    'audio/midi'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "audio_bucket_select_own_or_admin" on storage.objects;
create policy "audio_bucket_select_own_or_admin"
on storage.objects
for select
using (
  bucket_id = 'audio-files'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "audio_bucket_insert_own_or_admin" on storage.objects;
create policy "audio_bucket_insert_own_or_admin"
on storage.objects
for insert
with check (
  bucket_id = 'audio-files'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "audio_bucket_update_own_or_admin" on storage.objects;
create policy "audio_bucket_update_own_or_admin"
on storage.objects
for update
using (
  bucket_id = 'audio-files'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin(auth.uid())
  )
)
with check (
  bucket_id = 'audio-files'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "audio_bucket_delete_own_or_admin" on storage.objects;
create policy "audio_bucket_delete_own_or_admin"
on storage.objects
for delete
using (
  bucket_id = 'audio-files'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin(auth.uid())
  )
);
