import { NextRequest, NextResponse } from 'next/server';
import { embedText, generateChatAnswer } from '@/lib/rag/ollama';
import { buildGroundedUserPrompt, hasEnoughContext, INSUFFICIENT_CONTEXT_ANSWER, musicTeacherSystemPrompt } from '@/lib/rag/prompt';
import { searchSimilarDocuments } from '@/lib/rag/qdrant';
import { normalizeMongolianQuery } from '@/lib/rag/normalize';
import { isRagRequestAuthorized, isTrustedTailnetOrLocalRequest } from '@/lib/rag/auth';
import type { AiChatRequest, ChatHistoryMessage } from '@/lib/rag/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-rag-api-key',
    },
  });
}

function getTopK() {
  const parsed = Number.parseInt(process.env.RAG_TOP_K ?? '5', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function getRagProxyUrl() {
  return process.env.RAG_PROXY_URL?.trim().replace(/\/$/, '') || '';
}

function getRagProxyApiKey() {
  return process.env.RAG_PROXY_API_KEY?.trim() || '';
}

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '').trim();
}

function validHistory(history: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item): item is ChatHistoryMessage =>
        typeof item?.content === 'string' && (item.role === 'user' || item.role === 'assistant'),
    )
    .slice(-8);
}

async function proxyToHomeRag(body: AiChatRequest) {
  const proxyUrl = getRagProxyUrl();
  const proxyApiKey = getRagProxyApiKey();

  if (!proxyUrl) return null;

  try {
    const response = await fetch(`${proxyUrl}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(proxyApiKey ? { 'x-rag-api-key': proxyApiKey } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data ?? { error: 'Home RAG gateway returned an empty response.' }, {
      status: response.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return null;
  }
}

async function localRagWithVector(message: string, history: ChatHistoryMessage[]) {
  const normalizedQuery = normalizeMongolianQuery(message);
  const embedding = await embedText(normalizedQuery);
  const results = await searchSimilarDocuments(embedding, getTopK());

  if (!hasEnoughContext(results)) {
    return {
      answer: INSUFFICIENT_CONTEXT_ANSWER,
      sources: results.map(({ document, score }) => ({
        title: document.title,
        category: document.category,
        score,
      })),
    };
  }

  const answer = await generateChatAnswer(
    musicTeacherSystemPrompt,
    buildGroundedUserPrompt(message, results),
    history,
  );

  return {
    answer,
    sources: results.map(({ document, score }) => ({
      title: document.title,
      category: document.category,
      score,
    })),
  };
}

async function localOllamaOnly(message: string, history: ChatHistoryMessage[]) {
  const answer = await generateChatAnswer(
    musicTeacherSystemPrompt,
    message,
    history,
  );
  return { answer, sources: [], provider: 'ollama' };
}

function getCloudConfig() {
  const groqKey = (process.env.GROQ_API_KEY ?? '').trim();
  if (groqKey) {
    return {
      apiKey: groqKey,
      baseUrl: 'https://api.groq.com/openai/v1',
      model: (process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant').trim(),
      provider: 'groq',
    };
  }

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    return { apiKey: geminiKey, baseUrl: '', model: (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').trim(), provider: 'gemini' };
  }

  return null;
}

async function cloudFallback(message: string, history: ChatHistoryMessage[]) {
  const config = getCloudConfig();
  if (!config) throw new Error('AI чат одоогоор зөвхөн локал орчинд ажиллана. Удахгүй бэлэн болно!');

  if (config.provider === 'gemini') {
    const historyMessages = history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, 1200) }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: musicTeacherSystemPrompt }] },
          contents: [...historyMessages, { role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 1500 },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? 'Gemini request failed.');

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    return { answer: text, sources: [], provider: 'gemini' };
  }

  const recentHistory = history.slice(-6).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 1200),
  }));

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: musicTeacherSystemPrompt },
        ...recentHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.35,
      max_tokens: 900,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? `${config.provider} request failed.`);

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${config.provider} returned an empty response.`);
  return { answer: text, sources: [], provider: config.provider };
}

export async function POST(request: NextRequest) {
  try {
    if (!isRagRequestAuthorized(request.headers) && !isTrustedTailnetOrLocalRequest(request.headers)) {
      return NextResponse.json({ error: 'Invalid or missing RAG API key.' }, { status: 401 });
    }

    const body = (await request.json()) as AiChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'message is required.' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'message must be 2000 characters or fewer.' }, { status: 400 });
    }

    const history = validHistory(body.history);

    if (getGeminiApiKey()) {
      const result = await cloudFallback(message, history);
      return NextResponse.json(result, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const proxiedResponse = await proxyToHomeRag({ message, history });
    if (proxiedResponse) return proxiedResponse;

    try {
      const result = await localRagWithVector(message, history);
      return NextResponse.json(result, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    } catch {
      try {
        const result = await localOllamaOnly(message, history);
        return NextResponse.json(result, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      } catch {
        const result = await cloudFallback(message, history);
        return NextResponse.json(result, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown AI chat error.';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
