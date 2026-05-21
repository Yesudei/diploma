import type { ChatHistoryMessage } from './types';

function getEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function ollamaBaseUrl() {
  return getEnv('OLLAMA_BASE_URL', 'http://localhost:11434').replace(/\/$/, '');
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function embedText(input: string): Promise<number[]> {
  const response = await fetch(`${ollamaBaseUrl()}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: getEnv('OLLAMA_EMBED_MODEL', 'bge-m3'),
      input,
    }),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      `Ollama embedding failed. Check Ollama is running and model is pulled. ${data?.error ?? ''}`.trim(),
    );
  }

  const embedding = data?.embeddings?.[0] ?? data?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Ollama embedding response was empty.');
  }

  return embedding;
}

export async function generateChatAnswer(
  systemPrompt: string,
  userPrompt: string,
  history: ChatHistoryMessage[] = [],
) {
  const recentHistory = history.slice(-6).map((message) => ({
    role: message.role,
    content: message.content.slice(0, 1200),
  }));

  const response = await fetch(`${ollamaBaseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: getEnv('OLLAMA_CHAT_MODEL', 'qwen3:8b'),
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: userPrompt },
      ],
      options: {
        temperature: 0.25,
        num_predict: 800,
      },
    }),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      `Ollama chat failed. Check Ollama is running and qwen3:8b is pulled. ${data?.error ?? ''}`.trim(),
    );
  }

  const content = data?.message?.content?.trim();

  if (!content) {
    throw new Error('Ollama chat response was empty.');
  }

  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}
