export function getConfiguredRagApiKey() {
  return process.env.RAG_API_KEY?.trim() || '';
}

export function getRequestApiKey(headers: Headers) {
  const authorization = headers.get('authorization')?.trim() ?? '';

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return headers.get('x-rag-api-key')?.trim() ?? '';
}

export function isRagRequestAuthorized(headers: Headers) {
  const configuredKey = getConfiguredRagApiKey();

  if (!configuredKey) {
    return true;
  }

  return getRequestApiKey(headers) === configuredKey;
}

export function isTrustedTailnetOrLocalRequest(headers: Headers) {
  const host = (headers.get('host') || headers.get('x-forwarded-host') || '').toLowerCase();
  const hostname = host.split(':')[0];

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^100\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}
