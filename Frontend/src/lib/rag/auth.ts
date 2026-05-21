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
