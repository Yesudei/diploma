import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { getRequestApiKey, isTrustedTailnetOrLocalRequest } from './auth';

describe('getRequestApiKey', () => {
  test('reads bearer token', () => {
    const headers = new Headers({ authorization: 'Bearer local-secret' });

    assert.equal(getRequestApiKey(headers), 'local-secret');
  });

  test('reads x-rag-api-key fallback', () => {
    const headers = new Headers({ 'x-rag-api-key': 'local-secret' });

    assert.equal(getRequestApiKey(headers), 'local-secret');
  });

  test('trusts localhost and Tailscale 100.x hosts', () => {
    assert.equal(isTrustedTailnetOrLocalRequest(new Headers({ host: 'localhost:3000' })), true);
    assert.equal(isTrustedTailnetOrLocalRequest(new Headers({ host: '100.119.25.119:3000' })), true);
    assert.equal(isTrustedTailnetOrLocalRequest(new Headers({ host: 'example.com' })), false);
  });
});
