-- =====================================================
-- BASIC TABLES - Run this first
-- Copy and paste into Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- PURCHASED_COURSES table
create table public.purchased_courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  purchased_at timestamp with time zone default now(),
  unique(user_id, course_id)
);

-- COMPLETED_LESSONS table
create table public.completed_lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id text not null,
  course_id text not null,
  completed_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

-- COURSE_PROGRESS table
create table public.course_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  progress_percent integer default 0,
  last_lesson_id text,
  updated_at timestamp with time zone default now(),
  unique(user_id, course_id)
);

-- PAYMENTS table
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text,
  marketplace_item_id uuid,
  amount integer not null,
  currency text default 'MNT',
  status text default 'pending',
  payment_method text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.purchased_courses enable row level security;
alter table public.completed_lessons enable row level security;
alter table public.course_progress enable row level security;
alter table public.payments enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own purchases" on public.purchased_courses for select using (auth.uid() = user_id);
create policy "Users can insert own purchases" on public.purchased_courses for insert with check (auth.uid() = user_id);

create policy "Users can view own completed lessons" on public.completed_lessons for select using (auth.uid() = user_id);
create policy "Users can insert own completed lessons" on public.completed_lessons for insert with check (auth.uid() = user_id);

create policy "Users can manage own progress" on public.course_progress for all using (auth.uid() = user_id);

create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on public.payments for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
