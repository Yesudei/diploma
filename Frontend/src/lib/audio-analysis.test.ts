import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { analyzePcmMix } from './audio-analysis';

describe('analyzePcmMix', () => {
  test('returns low scores and clipping warning for clipped audio', () => {
    const samples = new Float32Array([1, -1, 1, -1, 0.96, -0.96]);
    const result = analyzePcmMix(samples, 44100);

    assert.equal(result.peak_level_dbfs, 0);
    assert.ok(result.artifacts.includes('Clipping risk'));
    assert.ok(result.overall_score < 80);
  });

  test('returns balanced recommendations for healthy audio', () => {
    const samples = new Float32Array([0.15, -0.12, 0.08, -0.1, 0.05, -0.07]);
    const result = analyzePcmMix(samples, 44100);

    assert.ok(result.peak_level_dbfs < -10);
    assert.ok(result.dynamic_range_db > 0);
    assert.ok(result.overall_score >= 70);
    assert.ok(result.recommendations.length > 0);
  });
});
