import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RagDocument } from '../src/lib/rag/types';

type TopicPlan = {
  category: string;
  topics: string[];
};

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const GENERATOR_MODEL = process.env.RAG_GENERATOR_MODEL || 'gemma3:12b';
const OUTPUT_PATH = path.join(process.cwd(), 'data', 'rag', 'generated-music-course.jsonl');
const CREATED_AT = '2026-05-24';

const plans: TopicPlan[] = [
  {
    category: 'FL Studio basics',
    topics: [
      'channel rack ашиглах',
      'piano roll дээр note бичих',
      'playlist arrangement хийх',
      'mixer routing хийх',
      'pattern болон playlist ялгаа',
      'automation clip хийх',
      'sample browser ашиглах',
      'tempo болон BPM тохируулах',
    ],
  },
  {
    category: 'Drums',
    topics: [
      'kick punchy болгох',
      'snare body томруулах',
      'clap layering хийх',
      'hi-hat bounce хийх',
      'open hat placement',
      'drum swing ашиглах',
      'ghost note хийх',
      'drum pattern эхлэгчдэд',
    ],
  },
  {
    category: '808 bass',
    topics: [
      '808 болон kick мөргөлдөх',
      '808 tuning хийх',
      '808 slide хийх',
      '808 distortion ашиглах',
      'sidechain compression хийх',
      'low frequency цэвэрлэх',
      'bassline бичих',
      '808 mono байлгах',
    ],
  },
  {
    category: 'Melody and theory',
    topics: [
      'melody бичих үндэс',
      'minor scale ашиглах',
      'chord progression хийх',
      'counter melody нэмэх',
      'topline санаа гаргах',
      'root note олох',
      'simple piano chord',
      'melody variation хийх',
    ],
  },
  {
    category: 'Mixing',
    topics: [
      'EQ cleanup хийх',
      'compression үндэс',
      'gain staging хийх',
      'reverb send ашиглах',
      'delay throw хийх',
      'vocal mixing эхлэл',
      'master channel clipping засах',
      'stereo width тохируулах',
    ],
  },
  {
    category: 'Arrangement and export',
    topics: [
      'intro хийх',
      'hook болон verse ялгах',
      'drop хүчтэй болгох',
      'transition effect хийх',
      'beat structure хийх',
      'export WAV MP3 хийх',
      'mastering loudness эхлэл',
      'song energy удирдах',
    ],
  },
  {
    category: 'Troubleshooting',
    topics: [
      'дуу шаварлаг сонсогдох',
      'snare жижиг сонсогдох',
      'kick алга болох',
      'melody уйтгартай болох',
      'mix чанга биш байх',
      '808 note буруу сонсогдох',
      'reverb ихдэх',
      'CPU ихдэх үед яах вэ',
    ],
  },
];

function getArg(name: string, fallback: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  const prefixed = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);

  return fallback;
}

function normalizeId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function readExistingDocuments(filePath: string) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RagDocument);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function pickTopic(index: number) {
  const plan = plans[index % plans.length];
  const topic = plan.topics[Math.floor(index / plans.length) % plan.topics.length];
  const variation = Math.floor(index / (plans.length * plan.topics.length)) + 1;
  return { category: plan.category, topic, variation };
}

function buildPrompt(batchSize: number, startIndex: number, existingTitles: string[]) {
  const items = Array.from({ length: batchSize }, (_, offset) => pickTopic(startIndex + offset));
  const topicLines = items
    .map(
      (item, offset) =>
        `${offset + 1}. category="${item.category}", topic="${item.topic}", angle variation=${item.variation}`,
    )
    .join('\n');

  return `You are a JSON API. Return ONLY raw JSON.
First character must be [
Last character must be ]
No markdown. No commentary. No explanation.

Create ${batchSize} high-quality RAG lesson chunks for a Mongolian beginner music production / beat-making / FL Studio website.

Fields required:
id, title, category, level, content, tags, source, language, createdAt

Hard rules:
- Write natural Mongolian Cyrillic for explanations.
- Keep producer terms in English where normal: kick, snare, clap, hi-hat, 808, bass, sidechain, EQ, compression, compressor, reverb, delay, FL Studio, playlist, mixer, piano roll.
- NEVER translate kick as "хөлчний", "хөлч", "өшиглөх", or any foot-related word.
- Always write kick as "kick" or "кик".
- Beginner friendly, practical, source-grounded style.
- content must be 120-180 words per item.
- Include practical FL Studio steps when relevant.
- tags must include Cyrillic, English, and Latin Mongolian search terms.
- level must be "beginner".
- source must be "local-gemma-generated".
- language must be "mn".
- createdAt must be "${CREATED_AT}".
- id must be unique and start with "gemma-music-".

Topics to generate:
${topicLines}

Avoid repeating these existing titles:
${existingTitles.slice(-25).join('\n')}`;
}

function extractJsonArray(text: string) {
  const cleaned = text
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end <= start) {
    const objectStart = cleaned.indexOf('{');
    const objectEnd = cleaned.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      return `[${cleaned.slice(objectStart, objectEnd + 1)}]`;
    }
    throw new Error(`Model did not return a JSON array. Preview: ${cleaned.slice(0, 160)}`);
  }
  return cleaned.slice(start, end + 1);
}

function stripTrailingCommas(text: string) {
  return text.replace(/,\s*([}\]])/g, '$1');
}

function parseGeneratedDocuments(text: string) {
  const json = extractJsonArray(text);

  try {
    return JSON.parse(stripTrailingCommas(json)) as Array<Partial<RagDocument>>;
  } catch (firstError) {
    const repaired = stripTrailingCommas(json)
      .replace(/"\s*\n\s*"/g, '",\n"')
      .replace(/}\s*{/g, '},{');

    try {
      return JSON.parse(repaired) as Array<Partial<RagDocument>>;
    } catch {
      const message = firstError instanceof Error ? firstError.message : String(firstError);
      throw new Error(`Model returned invalid JSON: ${message}`);
    }
  }
}

function hasMojibake(text: string) {
  return /[�ÐÑ]/.test(text);
}

function cleanProducerTerms(text: string) {
  return text
    .replace(/хөлчний/gi, 'kick-ийн')
    .replace(/хөлчинг/gi, 'kick-ийг')
    .replace(/хөлчийг/gi, 'kick-ийг')
    .replace(/хөлчид/gi, 'kick-д')
    .replace(/хөлчөөр/gi, 'kick-ээр')
    .replace(/хөлч/gi, 'kick')
    .replace(/өшиглөх/gi, 'kick');
}

function validateDocument(document: Partial<RagDocument>, fallbackId: string): RagDocument {
  const normalized: RagDocument = {
    id: typeof document.id === 'string' && document.id ? document.id : fallbackId,
    title: cleanProducerTerms(String(document.title || '').trim()),
    category: cleanProducerTerms(String(document.category || '').trim()),
    level: 'beginner',
    content: cleanProducerTerms(String(document.content || '').trim()),
    tags: Array.isArray(document.tags)
      ? document.tags.map(String).map((tag) => cleanProducerTerms(tag.trim())).filter(Boolean)
      : [],
    source: 'local-gemma-generated',
    language: 'mn',
    createdAt: CREATED_AT,
  };

  const combined = [normalized.title, normalized.category, normalized.content, normalized.tags.join(' ')].join('\n');

  if (!normalized.title || !normalized.category || !normalized.content) {
    throw new Error('Generated document is missing title/category/content.');
  }

  if (normalized.content.length < 350) {
    throw new Error(`Generated document "${normalized.title}" is too short.`);
  }

  if (/хөлч|өшиглөх/i.test(combined)) {
    throw new Error(`Generated document "${normalized.title}" translated kick badly.`);
  }

  if (hasMojibake(combined)) {
    throw new Error(`Generated document "${normalized.title}" contains mojibake.`);
  }

  if (!normalized.tags.length) {
    normalized.tags = ['music production', 'beatmaking', 'fl studio'];
  }

  return normalized;
}

async function generateBatch(batchSize: number, startIndex: number, existingTitles: string[]) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GENERATOR_MODEL,
      prompt: buildPrompt(batchSize, startIndex, existingTitles),
      stream: false,
      options: {
        temperature: 0.35,
        num_predict: 3200,
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Ollama generation failed: ${data?.error ?? response.statusText}`);
  }

  const text = String(data?.response || '');
  const parsed = parseGeneratedDocuments(text);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Model returned no documents.');
  }

  return parsed.map((document, offset) => {
    const topic = pickTopic(startIndex + offset);
    const hash = createHash('sha1')
      .update(`${topic.category}-${topic.topic}-${topic.variation}-${startIndex + offset}`)
      .digest('hex')
      .slice(0, 10);
    const fallbackId = `gemma-music-${String(startIndex + offset + 1).padStart(5, '0')}-${normalizeId(topic.topic)}-${hash}`;
    const validated = validateDocument(document, fallbackId);
    validated.id = fallbackId;
    return validated;
  });
}

async function main() {
  const targetCount = Number.parseInt(getArg('--count', '100'), 10);
  const batchSize = Number.parseInt(getArg('--batch', '5'), 10);

  if (!Number.isFinite(targetCount) || targetCount <= 0) {
    throw new Error('Use --count with a positive number.');
  }

  if (!Number.isFinite(batchSize) || batchSize <= 0 || batchSize > 10) {
    throw new Error('Use --batch from 1 to 10.');
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const existing = await readExistingDocuments(OUTPUT_PATH);
  const seenIds = new Set(existing.map((document) => document.id));
  const seenTitles = existing.map((document) => document.title);

  console.log(`Generator model: ${GENERATOR_MODEL}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Existing generated documents: ${existing.length}`);
  console.log(`Target generated documents: ${targetCount}`);

  let current = existing.length;
  let failures = 0;

  while (current < targetCount) {
    const needed = Math.min(batchSize, targetCount - current);

    try {
      const documents = await generateBatch(needed, current, seenTitles);
      const uniqueDocuments = documents.filter((document) => {
        if (seenIds.has(document.id)) return false;
        seenIds.add(document.id);
        seenTitles.push(document.title);
        return true;
      });

      if (!uniqueDocuments.length) {
        throw new Error('Batch produced only duplicate IDs.');
      }

      const chunk = uniqueDocuments.map((document) => JSON.stringify(document)).join('\n') + '\n';
      await writeFile(OUTPUT_PATH, chunk, { flag: 'a', encoding: 'utf-8' });
      current += uniqueDocuments.length;
      failures = 0;
      console.log(`Generated ${current}/${targetCount}`);
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Batch failed (${failures}/5): ${message}`);

      if (failures >= 5) {
        throw new Error('Too many generation failures. Tighten the prompt or lower --batch.');
      }
    }
  }

  console.log(`Done. Generated data saved to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`RAG generation failed: ${message}`);
  process.exitCode = 1;
});
