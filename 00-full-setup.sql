-- =====================================================
-- FULL SETUP - Run this ONE file in Supabase SQL Editor
-- =====================================================

-- First, aggressively drop everything
drop table if exists payments CASCADE;
drop table if exists marketplace_items CASCADE;
drop table if exists chat_messages CASCADE;
drop table if exists knowledge_base CASCADE;
drop table if exists melody_variations CASCADE;
drop table if exists mixing_analysis CASCADE;
drop table if exists audio_files CASCADE;
drop table if exists course_progress CASCADE;
drop table if exists completed_lessons CASCADE;
drop table if exists purchased_courses CASCADE;
drop table if exists profiles CASCADE;
drop view if exists user_analytics CASCADE;

-- Also try to clean up any orphaned tables from old schema
drop table if exists audio_files CASCADE;
drop table if exists users CASCADE;
drop table if exists mixing_analysis CASCADE;
drop table if exists melody_generations CASCADE;
drop table if exists chat_messages CASCADE;
drop table if exists marketplace_listings CASCADE;

-- Drop trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user;

-- =====================================================
-- BASIC TABLES
-- =====================================================

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

-- =====================================================
-- APP TABLES
-- =====================================================

-- AUDIO_FILES table
create table public.audio_files (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  file_path text not null,
  duration_seconds float,
  file_size_bytes bigint,
  mime_type text,
  created_at timestamp with time zone default now()
);

-- MIXING_ANALYSIS table
create table public.mixing_analysis (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  audio_file_id uuid references public.audio_files(id) on delete cascade,
  quality_score integer,
  eq_recommendations jsonb,
  compression_settings jsonb,
  frequency_balance jsonb,
  issues_found text,
  spectrogram_url text,
  analyzed_at timestamp with time zone default now()
);

-- MELODY_VARIATIONS table
create table public.melody_variations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  original_audio_id uuid references public.audio_files(id) on delete set null,
  variation_index integer not null,
  midi_data text,
  audio_preview_url text,
  created_at timestamp with time zone default now()
);

-- KNOWLEDGE_BASE table
create table public.knowledge_base (
  id uuid default uuid_generate_v4() primary key,
  category text not null,
  question text not null,
  answer text not null,
  source text,
  created_at timestamp with time zone default now()
);

-- CHAT_MESSAGES table
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_message text not null,
  ai_response text,
  category text,
  sources_used jsonb,
  confidence_score float,
  is_helpful boolean,
  created_at timestamp with time zone default now()
);

-- MARKETPLACE_ITEMS table
create table public.marketplace_items (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  price integer not null default 0,
  category text not null,
  file_path text,
  thumbnail_url text,
  is_active boolean default true,
  download_count integer default 0,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

alter table public.profiles enable row level security;
alter table public.purchased_courses enable row level security;
alter table public.completed_lessons enable row level security;
alter table public.course_progress enable row level security;
alter table public.payments enable row level security;
alter table public.audio_files enable row level security;
alter table public.mixing_analysis enable row level security;
alter table public.melody_variations enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.chat_messages enable row level security;
alter table public.marketplace_items enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Purchased Courses
create policy "Users can view own purchases" on public.purchased_courses for select using (auth.uid() = user_id);
create policy "Users can insert own purchases" on public.purchased_courses for insert with check (auth.uid() = user_id);

-- Completed Lessons
create policy "Users can view own completed lessons" on public.completed_lessons for select using (auth.uid() = user_id);
create policy "Users can insert own completed lessons" on public.completed_lessons for insert with check (auth.uid() = user_id);

-- Course Progress
create policy "Users can manage own progress" on public.course_progress for all using (auth.uid() = user_id);

-- Payments
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on public.payments for insert with check (auth.uid() = user_id);

-- Audio Files
create policy "Users can view own audio files" on public.audio_files for select using (auth.uid() = user_id);
create policy "Users can insert own audio files" on public.audio_files for insert with check (auth.uid() = user_id);
create policy "Users can delete own audio files" on public.audio_files for delete using (auth.uid() = user_id);

-- Mixing Analysis
create policy "Users can view own analysis" on public.mixing_analysis for select using (auth.uid() = user_id);
create policy "Users can insert own analysis" on public.mixing_analysis for insert with check (auth.uid() = user_id);

-- Melody Variations
create policy "Users can view own variations" on public.melody_variations for select using (auth.uid() = user_id);
create policy "Users can insert own variations" on public.melody_variations for insert with check (auth.uid() = user_id);

-- Knowledge Base (read for all)
create policy "Anyone can view knowledge base" on public.knowledge_base for select using (true);

-- Chat Messages
create policy "Users can view own chat" on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users can insert own chat" on public.chat_messages for insert with check (auth.uid() = user_id);

-- Marketplace
create policy "Anyone can view active marketplace" on public.marketplace_items for select using (is_active = true);
create policy "Users can insert own items" on public.marketplace_items for insert with check (auth.uid() = seller_id);
create policy "Users can update own items" on public.marketplace_items for update using (auth.uid() = seller_id);

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

-- =====================================================
-- SAMPLE DATA (Knowledge Base only - no seller_id needed)
-- =====================================================

insert into public.knowledge_base (category, question, answer, source) values
('mixing', 'EQ хэрхэн ашилах вэ?', 'EQ (Equalizer) нь давтамжийг засах хэрэгсэл юм. Bass-ийг 80Hz орчимд дээшлүүлж, high frequencies-ийг 10kHz орчимд тайрч болно. FL Studio дээр Power EQ эсвэл Fruity Parametric EQ 2 ашиглаж болно.', 'FL Studio Official Guide'),
('mixing', 'Компрессор хэрхэн тохируулах вэ?', 'Компрессорын үндсэн параметр: Threshold (-20dB орчим), Ratio (4:1), Attack (10ms), Release (100ms). Vocals-нд soft knee ашиглана.', 'FL Studio Official Guide'),
('theory', 'Аккорд гурвалын хэмнэл ямар вэ?', 'Мажор аккорд: 1-3-5 (C-E-G), минор аккорд: 1-b3-5 (C-Eb-G).', 'Music Theory Basics'),
('fl_studio', 'Piano Roll хэрхэн нээх вэ?', 'Pattern-ээс нэгэн хоёройг сонгож, F7 товчийг дарана.', 'FL Studio Hotkeys'),
('beats', 'Drum pattern хэрхэн хийх вэ?', 'Step Sequencer дээр + товчийг дараад Drum kit сонгож, хоолойгоор нь Pattern хийнэ.', 'Beat Making 101');
