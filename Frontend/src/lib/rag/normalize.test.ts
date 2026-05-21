import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { normalizeMongolianQuery } from './normalize';

describe('normalizeMongolianQuery', () => {
  test('expands common Latin Mongolian kick wording into useful search terms', () => {
    assert.match(
      normalizeMongolianQuery('  kick ee yaj punchy bolgoh ve?  '),
      /kick кик цохилт/,
    );
  });

  test('maps 808 conflict phrasing to kick sidechain and low frequency terms', () => {
    const normalized = normalizeMongolianQuery('808 murulduud bn');

    assert.match(normalized, /808 bass kick sidechain low frequency/);
  });

  test('keeps Cyrillic Mongolian and normalizes whitespace', () => {
    assert.match(normalizeMongolianQuery('дууны   BPM гэж юу вэ?'), /дууны bpm гэж юу вэ\?/);
  });
});
