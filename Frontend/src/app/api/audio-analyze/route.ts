import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseClient(authToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    },
  );
}

function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
}

function getOllamaChatModel(): string {
  return process.env.OLLAMA_CHAT_MODEL ?? process.env.CHAT_MODEL ?? 'qwen3:8b';
}

function buildAnalysisPrompt(
  filename: string,
  fileSizeBytes: number | null,
  mimeType: string | null,
): string {
  const sizeMB = fileSizeBytes != null ? (fileSizeBytes / 1_048_576).toFixed(2) : 'unknown';

  // Derive a simple format label from filename extension or mime type
  const ext = filename.split('.').pop()?.toUpperCase() ?? '';
  const format = ext || (mimeType ?? 'unknown');

  return `You are an expert audio engineer and mixing consultant. A user has uploaded an audio file. Based on the file metadata below, estimate mixing quality metrics and provide actionable recommendations.

File information:
- Filename: ${filename}
- File size: ${sizeMB} MB
- Format: ${format}
- MIME type: ${mimeType ?? 'unknown'}

Using your knowledge of typical characteristics for this file type and size, estimate the following metrics. For example, a 320kbps MP3 of a typical pop mix might have loudness around -9 LUFS, while a WAV master may sit at -14 LUFS. Use realistic, plausible values.

Respond ONLY with a single valid JSON object — no prose, no markdown fences, no explanation. The JSON must have exactly these fields:

{
  "overall_score": <integer 0-100, overall mix quality>,
  "loudness_lufs": <number, estimated loudness in LUFS, e.g. -14.2>,
  "peak_level_dbfs": <number, estimated peak level in dBFS, e.g. -1.2>,
  "dynamic_range_db": <number, estimated dynamic range in dB, e.g. 8.5>,
  "frequency_balance": {
    "low_presence": <integer 0-100, sub/bass energy level>,
    "mid_presence": <integer 0-100, mid-range energy level>,
    "high_presence": <integer 0-100, high-frequency energy level>,
    "balance_score": <integer 0-100, overall frequency balance quality>
  },
  "instrument_separation": {
    "vocals_level": <integer 0-100>,
    "drums_level": <integer 0-100>,
    "bass_level": <integer 0-100>,
    "guitars_level": <integer 0-100>,
    "other_level": <integer 0-100>,
    "separation_score": <integer 0-100, clarity of individual elements>
  },
  "artifacts": [<string, potential issues detected, e.g. "clipping", "excessive compression">],
  "recommendations": [<string, 3-5 actionable tips written in Mongolian for a beginner/intermediate FL Studio producer. Keep English technical terms such as EQ, compressor, kick, 808, reverb, sidechain, limiter, master bus, transient, gain staging as-is — do NOT translate them.>]
}`;
}

/**
 * Strip <think>...</think> blocks that qwen3 emits before its final answer,
 * then extract the first JSON object from the remaining text.
 */
function extractJson(raw: string): string {
  // Remove thinking tags (including multiline content)
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Find the outermost JSON object
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response');
  }
  return stripped.slice(start, end + 1);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Authorization header required.' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let audio_file_id: string;
  try {
    const body = await request.json();
    audio_file_id = body?.audio_file_id;
    if (!audio_file_id || typeof audio_file_id !== 'string') {
      return NextResponse.json({ error: 'audio_file_id is required.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const supabase = getSupabaseClient(token);

  // ── Fetch file metadata ───────────────────────────────────────────────────
  const { data: fileData, error: fileError } = await supabase
    .from('audio_files')
    .select('id, user_id, filename, file_size_bytes, mime_type, is_processed')
    .eq('id', audio_file_id)
    .single();

  if (fileError || !fileData) {
    return NextResponse.json(
      { error: 'Audio file not found or access denied.' },
      { status: 404 },
    );
  }

  // ── Call Ollama ───────────────────────────────────────────────────────────
  const ollamaUrl = `${getOllamaBaseUrl()}/api/chat`;
  const model = getOllamaChatModel();
  const prompt = buildAnalysisPrompt(
    fileData.filename as string,
    fileData.file_size_bytes as number | null,
    fileData.mime_type as string | null,
  );

  let analysisJson: Record<string, unknown>;
  try {
    const ollamaResponse = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama responded with status ${ollamaResponse.status}`);
    }

    const ollamaData = (await ollamaResponse.json()) as {
      message?: { content?: string };
    };
    const rawContent = ollamaData?.message?.content ?? '';
    const jsonString = extractJson(rawContent);
    analysisJson = JSON.parse(jsonString) as Record<string, unknown>;
  } catch (err) {
    const isConnectError =
      err instanceof Error &&
      (err.message.toLowerCase().includes('fetch failed') ||
        err.message.toLowerCase().includes('econnrefused') ||
        err.message.toLowerCase().includes('connection refused') ||
        err.name === 'TimeoutError');

    if (isConnectError) {
      return NextResponse.json(
        {
          error:
            'Ollama холболт алдаатай байна. OLLAMA_BASE_URL тохиргоогоо шалгана уу.',
        },
        { status: 503 },
      );
    }

    console.error('[audio-analyze] Ollama/parse error:', err);
    return NextResponse.json(
      { error: 'Analysis failed. Could not parse model response.' },
      { status: 500 },
    );
  }

  // ── Helpers to safely extract typed values ────────────────────────────────
  function num(val: unknown, fallback: number): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }
  function strArr(val: unknown): string[] {
    if (Array.isArray(val)) return val.map(String);
    return [];
  }
  function objOrEmpty(val: unknown): Record<string, unknown> {
    return val && typeof val === 'object' && !Array.isArray(val)
      ? (val as Record<string, unknown>)
      : {};
  }

  const freqRaw = objOrEmpty(analysisJson.frequency_balance);
  const instrRaw = objOrEmpty(analysisJson.instrument_separation);

  const frequencyBalance = {
    low_presence: num(freqRaw.low_presence, 50),
    mid_presence: num(freqRaw.mid_presence, 50),
    high_presence: num(freqRaw.high_presence, 50),
    balance_score: num(freqRaw.balance_score, 50),
  };

  const instrumentSeparation = {
    vocals_level: num(instrRaw.vocals_level, 50),
    drums_level: num(instrRaw.drums_level, 50),
    bass_level: num(instrRaw.bass_level, 50),
    guitars_level: num(instrRaw.guitars_level, 50),
    other_level: num(instrRaw.other_level, 50),
    separation_score: num(instrRaw.separation_score, 50),
  };

  const processingTimeMs = Date.now() - startTime;

  // ── Insert into mixing_analysis ───────────────────────────────────────────
  const { data: savedAnalysis, error: insertError } = await supabase
    .from('mixing_analysis')
    .insert({
      user_id: fileData.user_id,
      audio_file_id,
      analysis_type: 'ai-mix-review',
      overall_score: num(analysisJson.overall_score, 50),
      loudness_lufs: num(analysisJson.loudness_lufs, -14),
      peak_level_dbfs: num(analysisJson.peak_level_dbfs, -1),
      dynamic_range_db: num(analysisJson.dynamic_range_db, 8),
      frequency_balance: frequencyBalance,
      instrument_separation: instrumentSeparation,
      artifacts: strArr(analysisJson.artifacts),
      recommendations: strArr(analysisJson.recommendations),
      analyzed_at: new Date().toISOString(),
      processing_time_ms: processingTimeMs,
    })
    .select()
    .single();

  if (insertError || !savedAnalysis) {
    console.error('[audio-analyze] Supabase insert error:', insertError);
    return NextResponse.json(
      { error: 'Failed to save analysis results.' },
      { status: 500 },
    );
  }

  // ── Mark file as processed ────────────────────────────────────────────────
  await supabase
    .from('audio_files')
    .update({ is_processed: true })
    .eq('id', audio_file_id);

  return NextResponse.json({ analysis: savedAnalysis });
}
