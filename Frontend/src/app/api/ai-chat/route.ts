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

function validHistory(history: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item): item is ChatHistoryMessage =>
        typeof item?.content === 'string' && (item.role === 'user' || item.role === 'assistant'),
    )
    .slice(-8);
}

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Unknown AI chat error.';

  if (error.message.toLowerCase().includes('fetch failed')) {
    return 'Local AI service unavailable. Start Ollama and Qdrant, then run ingestion.';
  }

  return error.message;
}

async function proxyToHomeRag(body: AiChatRequest) {
  const proxyUrl = getRagProxyUrl();
  const proxyApiKey = getRagProxyApiKey();

  if (!proxyUrl) return null;

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
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
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

    const proxiedResponse = await proxyToHomeRag({
      message,
      history: validHistory(body.history),
    });

    if (proxiedResponse) {
      return proxiedResponse;
    }

    const normalizedQuery = normalizeMongolianQuery(message);
    const embedding = await embedText(normalizedQuery);
    const results = await searchSimilarDocuments(embedding, getTopK());

    if (!hasEnoughContext(results)) {
      return NextResponse.json({
        answer: INSUFFICIENT_CONTEXT_ANSWER,
        sources: results.map(({ document, score }) => ({
          title: document.title,
          category: document.category,
          score,
        })),
      });
    }

    const answer = await generateChatAnswer(
      musicTeacherSystemPrompt,
      buildGroundedUserPrompt(message, results),
      validHistory(body.history),
    );

    return NextResponse.json(
      {
        answer,
        sources: results.map(({ document, score }) => ({
          title: document.title,
          category: document.category,
          score,
        })),
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}
