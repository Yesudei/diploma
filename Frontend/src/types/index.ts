// User & Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

// Audio File Types
export interface AudioFile {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  duration: number;
  format: string;
  sample_rate: number;
  channels: number;
  bit_depth: number;
  uploaded_at: string;
  updated_at: string;
  url?: string;
}

export interface AudioUploadRequest {
  file: File;
  description?: string;
}

export interface AudioUploadResponse {
  id: string;
  filename: string;
  file_size: number;
  message: string;
}

// CNN Analysis Types
export interface MixingAnalysisResult {
  id: string;
  user_id: string;
  audio_file_id: string;
  analysis_type: string;
  loudness_lufs: number;
  peak_level_dbfs: number;
  dynamic_range_db: number;
  frequency_balance: FrequencyBalance;
  instrument_separation: InstrumentSeparation;
  artifacts: string[];
  recommendations: string[];
  overall_score: number;
  analyzed_at: string;
  processing_time_ms: number;
}

export interface FrequencyBalance {
  low_presence: number;
  mid_presence: number;
  high_presence: number;
  balance_score: number;
}

export interface InstrumentSeparation {
  vocals_level: number;
  drums_level: number;
  bass_level: number;
  guitars_level: number;
  other_level: number;
  separation_score: number;
}

// Melody Generation Types
export interface MelodyGenerationRequest {
  audio_file_id: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  key?: string;
  bars?: number;
}

export interface MelodyGeneration {
  id: string;
  user_id: string;
  audio_file_id: string;
  melody_data: MelodyNoteSequence[];
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  bars: number;
  generated_at: string;
  score: number;
}

// Alias for compatibility
export type MelodyGenerationResult = MelodyGeneration;

export interface MelodyNoteSequence {
  pitch: number;
  duration: number;
  velocity: number;
  start_time: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources?: ChatMessageSource[];
}

export interface ChatMessageSource {
  title: string;
  url?: string;
  relevance_score: number;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  id: string;
  message: string;
  sources: ChatMessageSource[];
  timestamp: string;
}

// Marketplace Types
export interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  category: 'plugin' | 'sample' | 'preset' | 'asset';
  price: number;
  rating: number;
  download_count: number;
  creator: string;
  creator_url?: string;
  preview_url?: string;
  download_url?: string;
  tags: string[];
  created_at: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: string;
  description: string;
  item_count: number;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

// API Error Response
export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  details?: Record<string, unknown>;
}

// Profile Update Types
export interface ProfileUpdateRequest {
  username?: string;
  bio?: string;
  profile_picture?: File;
}

export interface ProfileUpdateResponse {
  message: string;
  user: User;
}

// Generic API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}
