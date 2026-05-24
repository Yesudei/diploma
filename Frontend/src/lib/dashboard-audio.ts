import { supabase } from '@/lib/supabase';
import type { AudioFile, MixingAnalysisResult } from '@/types';
import { isMissingTableError } from '@/lib/supabase-errors';

const AUDIO_BUCKET = 'audio-files';

type AudioFileRow = {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  is_processed: boolean | null;
  created_at: string | null;
};

type MixingAnalysisRow = {
  id: string;
  user_id: string;
  audio_file_id: string;
  analysis_type: string | null;
  loudness_lufs: number | null;
  peak_level_dbfs: number | null;
  dynamic_range_db: number | null;
  frequency_balance: Record<string, number> | null;
  instrument_separation: Record<string, number> | null;
  artifacts: string[] | null;
  recommendations: string[] | null;
  overall_score: number | null;
  analyzed_at: string | null;
  processing_time_ms: number | null;
};

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
}

function getFormatLabel(filename: string, mimeType: string | null): string {
  const fileExtension = filename.split('.').pop()?.toUpperCase();

  if (fileExtension) {
    return fileExtension;
  }

  return mimeType?.split('/').pop()?.toUpperCase() || 'AUDIO';
}

function mapAudioFile(row: AudioFileRow): AudioFile {
  const publicUrl = row.storage_path
    ? supabase.storage.from(AUDIO_BUCKET).getPublicUrl(row.storage_path).data.publicUrl
    : undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    filename: row.filename,
    original_name: row.filename,
    file_size: row.file_size_bytes || 0,
    duration: 0,
    format: getFormatLabel(row.filename, row.mime_type),
    sample_rate: 0,
    channels: 0,
    bit_depth: 0,
    uploaded_at: row.created_at || new Date().toISOString(),
    updated_at: row.created_at || new Date().toISOString(),
    url: publicUrl,
  };
}

function mapAnalysisResult(row: MixingAnalysisRow): MixingAnalysisResult {
  const frequencyBalance = row.frequency_balance || {};
  const instrumentSeparation = row.instrument_separation || {};

  return {
    id: row.id,
    user_id: row.user_id,
    audio_file_id: row.audio_file_id,
    analysis_type: row.analysis_type || 'mix-review',
    loudness_lufs: row.loudness_lufs || 0,
    peak_level_dbfs: row.peak_level_dbfs || 0,
    dynamic_range_db: row.dynamic_range_db || 0,
    frequency_balance: {
      low_presence: frequencyBalance.low_presence || 0,
      mid_presence: frequencyBalance.mid_presence || 0,
      high_presence: frequencyBalance.high_presence || 0,
      balance_score: frequencyBalance.balance_score || 0,
    },
    instrument_separation: {
      vocals_level: instrumentSeparation.vocals_level || 0,
      drums_level: instrumentSeparation.drums_level || 0,
      bass_level: instrumentSeparation.bass_level || 0,
      guitars_level: instrumentSeparation.guitars_level || 0,
      other_level: instrumentSeparation.other_level || 0,
      separation_score: instrumentSeparation.separation_score || 0,
    },
    artifacts: row.artifacts || [],
    recommendations: row.recommendations || [],
    overall_score: row.overall_score || 0,
    analyzed_at: row.analyzed_at || new Date().toISOString(),
    processing_time_ms: row.processing_time_ms || 0,
  };
}

export async function listUserAudioFiles(userId: string): Promise<AudioFile[]> {
  const { data, error } = await supabase
    .from('audio_files')
    .select('id, user_id, filename, storage_path, file_size_bytes, mime_type, is_processed, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error, 'audio_files')) {
      return [];
    }

    throw error;
  }

  return ((data || []) as AudioFileRow[]).map(mapAudioFile);
}

export async function listUserAnalysisResults(userId: string): Promise<MixingAnalysisResult[]> {
  const { data, error } = await supabase
    .from('mixing_analysis')
    .select(
      'id, user_id, audio_file_id, analysis_type, loudness_lufs, peak_level_dbfs, dynamic_range_db, frequency_balance, instrument_separation, artifacts, recommendations, overall_score, analyzed_at, processing_time_ms'
    )
    .eq('user_id', userId)
    .order('analyzed_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error, 'mixing_analysis')) {
      return [];
    }

    throw error;
  }

  return ((data || []) as MixingAnalysisRow[]).map(mapAnalysisResult);
}

export async function uploadUserAudioFile(userId: string, file: File): Promise<void> {
  const safeFilename = sanitizeFilename(file.name);
  const storagePath = `${userId}/${Date.now()}-${safeFilename}`;

  const { error: storageError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (storageError) {
    throw storageError;
  }

  const { error: insertError } = await supabase.from('audio_files').insert({
    user_id: userId,
    filename: file.name,
    storage_path: storagePath,
    file_size_bytes: file.size,
    mime_type: file.type || null,
    is_processed: false,
  });

  if (!insertError) {
    return;
  }

  await supabase.storage.from(AUDIO_BUCKET).remove([storagePath]);

  if (isMissingTableError(insertError, 'audio_files')) {
    throw new Error(
      'Audio upload сангийн хүснэгт алга байна. Frontend/supabase-schema.sql файлыг Supabase SQL Editor дээр ажиллуулаарай.'
    );
  }

  throw insertError;
}
