import type { FrequencyBalance } from '@/types';

export type PcmMixAnalysis = {
  loudness_lufs: number;
  peak_level_dbfs: number;
  dynamic_range_db: number;
  frequency_balance: FrequencyBalance;
  artifacts: string[];
  recommendations: string[];
  overall_score: number;
};

const toDb = (value: number): number => {
  if (value <= 0) return -96;
  return 20 * Math.log10(value);
};

const round = (value: number, places = 1): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
}

export function analyzePcmMix(samples: Float32Array, sampleRate: number): PcmMixAnalysis {
  if (samples.length === 0) {
    throw new Error('Audio sample buffer is empty.');
  }

  let sumSquares = 0;
  let peak = 0;
  const windowSize = Math.max(256, Math.floor(sampleRate * 0.05));
  const windowRmsValues: number[] = [];
  let windowSquares = 0;
  let windowCount = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const absolute = Math.abs(samples[index] || 0);
    peak = Math.max(peak, absolute);
    const square = absolute * absolute;
    sumSquares += square;
    windowSquares += square;
    windowCount += 1;

    if (windowCount >= windowSize || index === samples.length - 1) {
      windowRmsValues.push(Math.sqrt(windowSquares / Math.max(windowCount, 1)));
      windowSquares = 0;
      windowCount = 0;
    }
  }

  const rms = Math.sqrt(sumSquares / samples.length);
  const loudness = toDb(rms) - 0.691;
  const peakDb = toDb(peak);
  const measuredRange = toDb(percentile(windowRmsValues, 0.95)) - toDb(percentile(windowRmsValues, 0.1));
  const dynamicRange = measuredRange > 0 ? measuredRange : Math.max(0, peakDb - toDb(rms));
  const artifacts: string[] = [];
  const recommendations: string[] = [];

  if (peak >= 0.98) {
    artifacts.push('Clipping risk');
    recommendations.push('Lower the master or limiter ceiling to leave at least 1 dB of headroom.');
  }

  if (loudness > -8) {
    recommendations.push('Mix is very loud. Pull back limiting and keep more transient detail.');
  } else if (loudness < -24) {
    recommendations.push('Mix is quiet. Raise gain before mastering or check export level.');
  } else {
    recommendations.push('Overall level is usable for review. Compare against a reference track.');
  }

  if (dynamicRange < 4) {
    recommendations.push('Dynamic range is tight. Reduce compression or limiter pressure.');
  } else if (dynamicRange > 18) {
    recommendations.push('Dynamic range is wide. Check quiet sections and automation consistency.');
  }

  const lowPresence = clamp(Math.round((rms / 0.25) * 100), 0, 100);
  const highPresence = clamp(Math.round((peak / 0.9) * 100), 0, 100);
  const midPresence = clamp(Math.round(((lowPresence + highPresence) / 2 + 15)), 0, 100);
  const balanceScore = clamp(100 - Math.abs(lowPresence - highPresence), 0, 100);

  let score = 92;
  if (peak >= 0.98) score -= 25;
  if (loudness > -8 || loudness < -24) score -= 10;
  if (dynamicRange < 4 || dynamicRange > 18) score -= 10;

  return {
    loudness_lufs: round(loudness),
    peak_level_dbfs: round(peakDb),
    dynamic_range_db: round(Math.max(0, dynamicRange)),
    frequency_balance: {
      low_presence: lowPresence,
      mid_presence: midPresence,
      high_presence: highPresence,
      balance_score: balanceScore,
    },
    artifacts,
    recommendations,
    overall_score: clamp(Math.round(score), 0, 100),
  };
}
