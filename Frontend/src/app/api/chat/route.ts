import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RagEntry = {
  id: string;
  title: string;
  question: string;
  category: string;
  content: string;
  keywords: string[];
  source_name: string;
  source_type: string;
  citation_safe: boolean;
  rag_text: string;
};

type IndexedEntry = RagEntry & {
  searchable: string;
  tokens: Set<string>;
};

type ChatProvider = 'gemini' | 'openai-compatible' | 'ollama';

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'what',
  'how',
  'why',
  'is',
  'are',
  'to',
  'in',
  'on',
  'би',
  'энэ',
  'яаж',
  'юу',
  'вэ',
  'нь',
  'дээр',
  'бол',
  'болон',
  'хийх',
]);

let datasetCache: Promise<IndexedEntry[]> | null = null;

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = envValue(name);
    if (value) return value;
  }

  return undefined;
}

function tokenize(value: string): string[] {
  const matches = value
    .toLowerCase()
    .match(/[a-z0-9а-яёөү#.+-]+/giu);

  return (matches ?? []).filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function getDatasetPath() {
  return (
    envValue('RAG_DATASET_PATH') ??
    path.join(process.cwd(), '..', 'rag-dataset-builder', 'data', 'ready', 'rag_ready_mn.jsonl')
  );
}

async function loadDataset(): Promise<IndexedEntry[]> {
  if (!datasetCache) {
    datasetCache = readFile(getDatasetPath(), 'utf-8').then((file) =>
      file
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as RagEntry)
        .map((entry) => {
          const searchable = [
            entry.title,
            entry.question,
            entry.category,
            entry.content,
            entry.keywords.join(' '),
          ].join(' ');

          return {
            ...entry,
            searchable: searchable.toLowerCase(),
            tokens: new Set(tokenize(searchable)),
          };
        }),
    );
  }

  return datasetCache;
}

function retrieve(entries: IndexedEntry[], message: string, limit = 6) {
  const queryTokens = tokenize(message);
  const query = message.toLowerCase().trim();

  return entries
    .map((entry) => {
      let score = 0;

      for (const token of queryTokens) {
        if (entry.tokens.has(token)) {
          score += token.length > 4 ? 4 : 2;
        }

        if (entry.searchable.includes(token)) {
          score += 1;
        }
      }

      if (query && entry.searchable.includes(query)) {
        score += 12;
      }

      if (entry.category && query.includes(entry.category.toLowerCase())) {
        score += 4;
      }

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

function buildPrompt(message: string, contexts: RagEntry[]) {
  const contextText = contexts
    .map((entry, index) => {
      const sourceNote = entry.citation_safe
        ? `citation-safe source: ${entry.source_name}`
        : `internal generated guidance: ${entry.source_name}`;

      return [
        `[${index + 1}] ${entry.title}`,
        `Category: ${entry.category}`,
        `Source type: ${entry.source_type}; ${sourceNote}`,
        `Context: ${entry.content}`,
      ].join('\n');
    })
    .join('\n\n');

  return `
You are Melodex Mentor — a warm, practical AI tutor for music production students learning FL Studio.

Personality: You are encouraging and patient. You speak like a senior producer who remembers what it was like to be a beginner. You give specific, actionable advice — not vague theory. When showing how to do something in FL Studio, name the exact menus, buttons, or hotkeys.

Tone: Mixed Mongolian and English. Keep technical terms in English when they're standard (EQ, compressor, piano roll, limiter, mixer, channel rack, step sequencer, etc.). Be conversational — not a textbook.

Rules:
- Answer in a few focused paragraphs. Not bullet points unless listing hotkeys or steps.
- When giving steps, keep them to 2-4 concrete actions.
- If the context doesn't cover the question well, say what info is missing and suggest where to look.
- Never claim generated tip content is an official FL Studio manual.
- Use FL Studio hotkey names (F1–F12, Ctrl+S, etc.) when relevant.

Retrieved context:
${contextText || 'No matching local context was found.'}

User question:
${message}
`.trim();
}

async function callGemini(prompt: string) {
  const apiKey = firstEnv('GEMINI_API_KEY', 'GOOGLE_API_KEY');
  const model = envValue('GEMINI_MODEL') ?? 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 900,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message ?? 'Gemini request failed.';
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

function getChatProvider(): ChatProvider {
  const provider = (firstEnv('CHAT_PROVIDER', 'LLM_PROVIDER') ?? 'gemini').toLowerCase();

  if (provider === 'openai' || provider === 'openrouter' || provider === 'groq') {
    return 'openai-compatible';
  }

  if (provider === 'openai-compatible' || provider === 'ollama' || provider === 'gemini') {
    return provider;
  }

  throw new Error(`Unsupported CHAT_PROVIDER: ${provider}`);
}

function getOpenAICompatibleConfig() {
  const apiKey = firstEnv(
    'OPENAI_COMPATIBLE_API_KEY',
    'OPENAI_API_KEY',
    'OPENROUTER_API_KEY',
    'GROQ_API_KEY',
  );

  const baseUrl =
    firstEnv('OPENAI_COMPATIBLE_BASE_URL', 'OPENAI_BASE_URL') ??
    (envValue('OPENROUTER_API_KEY')
      ? 'https://openrouter.ai/api/v1'
      : envValue('GROQ_API_KEY')
        ? 'https://api.groq.com/openai/v1'
        : 'https://api.openai.com/v1');

  const model =
    firstEnv(
      'CHAT_MODEL',
      'OPENAI_COMPATIBLE_MODEL',
      'OPENAI_MODEL',
      'OPENROUTER_MODEL',
      'GROQ_MODEL',
    );

  if (!apiKey) {
    throw new Error('OPENAI_COMPATIBLE_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY is required.');
  }

  if (!model) {
    throw new Error('CHAT_MODEL is required for openai-compatible providers.');
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    model,
  };
}

async function callOpenAICompatible(prompt: string) {
  const { apiKey, baseUrl, model } = getOpenAICompatibleConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(envValue('OPENROUTER_API_KEY')
        ? {
            'HTTP-Referer': envValue('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000',
            'X-Title': 'Melodex RAG Chatbot',
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are Melodex Mentor — a warm, practical AI tutor for music production students learning FL Studio. Personality: encouraging, patient, conversational. Speak like a senior producer. Give specific, actionable advice. Keep technical terms in English. Answer in focused paragraphs. Use FL Studio hotkey names when relevant. Never claim generated tip content is an official manual.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.35,
      max_tokens: 900,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message ?? data?.message ?? 'OpenAI-compatible request failed.';
    throw new Error(message);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('OpenAI-compatible provider returned an empty response.');
  }

  return text;
}

async function callOllama(prompt: string) {
  const baseUrl = (envValue('OLLAMA_BASE_URL') ?? 'http://localhost:11434').replace(/\/$/, '');
  const model = firstEnv('CHAT_MODEL', 'OLLAMA_MODEL') ?? 'llama3.1:8b';

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'You are Melodex Mentor — a warm, practical AI tutor for music production students learning FL Studio. Personality: encouraging, patient, conversational. Speak like a senior producer. Give specific, actionable advice. Keep technical terms in English. Answer in focused paragraphs. Use FL Studio hotkey names when relevant. Never claim generated tip content is an official manual.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      options: {
        temperature: 0.35,
        num_predict: 900,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error ?? 'Ollama request failed.';
    throw new Error(message);
  }

  const text = data?.message?.content?.trim();

  if (!text) {
    throw new Error('Ollama returned an empty response.');
  }

  return text;
}

async function callChatModel(prompt: string) {
  const provider = getChatProvider();

  if (provider === 'gemini') {
    return {
      answer: await callGemini(prompt),
      provider,
      model: envValue('GEMINI_MODEL') ?? 'gemini-2.5-flash',
    };
  }

  if (provider === 'openai-compatible') {
    const config = getOpenAICompatibleConfig();

    return {
      answer: await callOpenAICompatible(prompt),
      provider,
      model: config.model,
    };
  }

  return {
    answer: await callOllama(prompt),
    provider,
    model: firstEnv('CHAT_MODEL', 'OLLAMA_MODEL') ?? 'llama3.1:8b',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const dataset = await loadDataset();
    const contexts = retrieve(dataset, message);
    const result = await callChatModel(buildPrompt(message, contexts));

    return NextResponse.json({
      answer: result.answer,
      provider: result.provider,
      model: result.model,
      sources: contexts.map((entry) => ({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        sourceName: entry.source_name,
        sourceType: entry.source_type,
        citationSafe: entry.citation_safe,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown chat error.';
    const status =
      message.includes('API_KEY') || message.includes('CHAT_MODEL') || message.includes('Unsupported')
        ? 500
        : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
