import { supabase } from '@/lib/supabase';
import type { AudioFile, MixingAnalysisResult } from '@/types';
import { isMissingTableError } from '@/lib/supabase-errors';
import { analyzePcmMix } from '@/lib/audio-analysis';

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
    storage_path: row.storage_path || undefined,
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

async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();

  try {
    return await context.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await context.close();
  }
}

function mixDownToMono(audioBuffer: AudioBuffer): Float32Array {
  const output = new Float32Array(audioBuffer.length);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const input = audioBuffer.getChannelData(channel);
    for (let index = 0; index < input.length; index += 1) {
      output[index] += input[index] / audioBuffer.numberOfChannels;
    }
  }

  return output;
}

export async function analyzeUserAudioFile(
  userId: string,
  audioFile: AudioFile,
): Promise<MixingAnalysisResult> {
  if (!audioFile.storage_path) {
    throw new Error('Audio storage path is missing.');
  }

  const startedAt = performance.now();
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).download(audioFile.storage_path);

  if (error) throw error;
  if (!data) throw new Error('Could not download audio file.');

  const audioBuffer = await decodeAudioBlob(data);
  const analysis = analyzePcmMix(mixDownToMono(audioBuffer), audioBuffer.sampleRate);
  const processingTime = Math.round(performance.now() - startedAt);

  const { data: inserted, error: insertError } = await supabase
    .from('mixing_analysis')
    .insert({
      user_id: userId,
      audio_file_id: audioFile.id,
      analysis_type: 'browser-mix-review',
      loudness_lufs: analysis.loudness_lufs,
      peak_level_dbfs: analysis.peak_level_dbfs,
      dynamic_range_db: analysis.dynamic_range_db,
      frequency_balance: analysis.frequency_balance,
      instrument_separation: {
        vocals_level: 0,
        drums_level: 0,
        bass_level: 0,
        guitars_level: 0,
        other_level: 0,
        separation_score: analysis.frequency_balance.balance_score,
      },
      artifacts: analysis.artifacts,
      recommendations: analysis.recommendations,
      overall_score: analysis.overall_score,
      processing_time_ms: processingTime,
    })
    .select(
      'id, user_id, audio_file_id, analysis_type, loudness_lufs, peak_level_dbfs, dynamic_range_db, frequency_balance, instrument_separation, artifacts, recommendations, overall_score, analyzed_at, processing_time_ms'
    )
    .single();

  if (insertError) throw insertError;

  await supabase.from('audio_files').update({ is_processed: true }).eq('id', audioFile.id);

  return mapAnalysisResult(inserted as MixingAnalysisRow);
}
