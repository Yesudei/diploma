import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { getRequestApiKey } from './auth';

describe('getRequestApiKey', () => {
  test('reads bearer token', () => {
    const headers = new Headers({ authorization: 'Bearer local-secret' });

    assert.equal(getRequestApiKey(headers), 'local-secret');
  });

  test('reads x-rag-api-key fallback', () => {
    const headers = new Headers({ 'x-rag-api-key': 'local-secret' });

    assert.equal(getRequestApiKey(headers), 'local-secret');
  });
});
