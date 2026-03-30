-- =====================================================
-- APP TABLES - Run this second
-- Copy and paste into Supabase SQL Editor
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

-- KNOWLEDGE_BASE table (for AI chatbot)
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

-- Enable RLS
alter table public.audio_files enable row level security;
alter table public.mixing_analysis enable row level security;
alter table public.melody_variations enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.chat_messages enable row level security;
alter table public.marketplace_items enable row level security;

-- RLS Policies
create policy "Users can view own audio files" on public.audio_files for select using (auth.uid() = user_id);
create policy "Users can insert own audio files" on public.audio_files for insert with check (auth.uid() = user_id);
create policy "Users can delete own audio files" on public.audio_files for delete using (auth.uid() = user_id);

create policy "Users can view own analysis" on public.mixing_analysis for select using (auth.uid() = user_id);
create policy "Users can insert own analysis" on public.mixing_analysis for insert with check (auth.uid() = user_id);

create policy "Users can view own variations" on public.melody_variations for select using (auth.uid() = user_id);
create policy "Users can insert own variations" on public.melody_variations for insert with check (auth.uid() = user_id);

create policy "Anyone can view knowledge base" on public.knowledge_base for select using (true);

create policy "Users can view own chat" on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users can insert own chat" on public.chat_messages for insert with check (auth.uid() = user_id);

create policy "Anyone can view active marketplace" on public.marketplace_items for select using (is_active = true);
create policy "Users can insert own items" on public.marketplace_items for insert with check (auth.uid() = seller_id);
create policy "Users can update own items" on public.marketplace_items for update using (auth.uid() = seller_id);

-- Sample data for Knowledge Base
insert into public.knowledge_base (category, question, answer, source) values
('mixing', 'EQ хэрхэн ашилах вэ?', 'EQ (Equalizer) нь давтамжийг засах хэрэгсэл юм. Bass-ийг 80Hz орчимд дээшлүүлж, high frequencies-ийг 10kHz орчимд тайрч болно. FL Studio дээр Power EQ эсвэл Fruity Parametric EQ 2 ашиглаж болно.', 'FL Studio Official Guide'),
('mixing', 'Компрессор хэрхэн тохируулах вэ?', 'Компрессорын үндсэн параметр: Threshold (-20dB орчим), Ratio (4:1), Attack (10ms), Release (100ms). Vocals-нд soft knee ашиглана. FL Studio дээр Fruity Compressor ашиглаж болно.', 'FL Studio Official Guide'),
('theory', 'Аккорд гурвалын хэмнэл ямар вэ?', 'Мажор аккорд: 1-3-5 (C-E-G), минор аккорд: 1-b3-5 (C-Eb-G). Босоооноо 3-р дуугаар нь ялгаатай.', 'Music Theory Basics'),
('fl_studio', 'Piano Roll хэрхэн нээх вэ?', 'Pattern-ээс нэгэн хоёройг сонгож, F7 товчийг дарана. Эсвэл прав талын товчлуурын Piano Roll товчийг дараарай.', 'FL Studio Hotkeys'),
('beats', 'Drum pattern хэрхэн хийх вэ?', 'Step Sequencer дээр + товчийг дараад Drum kit сонгож, хоолойгоор нь Pattern хийнэ. Kick, Snare, Hi-Hat хоолойнуудыг ашиглаарай.', 'Beat Making 101'),
('mixing', 'Mixing гэж юу вэ?', 'Mixing-ийн үндсэн алхам: 1. Dry/wet balance тохируулах, 2. EQ-р давтамжийн зөрүү заах, 3. Компрессор ашиглан динамик хянах, 4. Reverb/Delay-р space үүсгэх.', 'Mixing Basics'),
('fl_studio', 'FL Studio дээр хэрхэн экспорт хийх вэ?', 'File > Export > MP3 File (эсвэл WAV). Sample rate 44100Hz, Bit depth 16 эсвэл 24 ашиглаарай.', 'FL Studio Guide');

-- Sample data for Marketplace
insert into public.marketplace_items (title, description, price, category, download_count) values
('Free Drum Kit Vol.1', 'Professional drum samples for hip-hop production. Include kick, snare, hi-hats, and percussion.', 0, 'sample_pack', 1250),
('FL Studio Starter Template', 'Beginner-friendly FL Studio project file with basic setup and routing.', 0, 'template', 890),
('Ultimate Bass Presets', 'Massive bass presets for Sylenth1. 50+ presets for trap, dubstep, and more.', 5000, 'preset', 456),
('Trap Vocal Chops', 'Processed vocal chops for trap beats. Royalty free.', 3000, 'sample_pack', 234),
('Lo-Fi Piano VST', 'Free lo-fi piano plugin with warm sound character.', 0, 'vst', 567),
('Mixing Starter Pack', 'Essential mixing templates and channel presets for FL Studio.', 8000, 'template', 123);
