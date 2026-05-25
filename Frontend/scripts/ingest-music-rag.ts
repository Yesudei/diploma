import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { embedText } from '../src/lib/rag/ollama';
import { upsertDocuments } from '../src/lib/rag/qdrant';
import type { RagDocument } from '../src/lib/rag/types';

function pointIdFromDocumentId(id: string) {
  const hex = createHash('sha1').update(id).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex
    .slice(12, 16)
    .join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20, 32).join('')}`;
}

function validateDocument(document: RagDocument) {
  const requiredFields: Array<keyof RagDocument> = [
    'id',
    'title',
    'category',
    'level',
    'content',
    'tags',
    'source',
    'language',
    'createdAt',
  ];

  for (const field of requiredFields) {
    if (!document[field]) {
      throw new Error(`Invalid RAG document "${document.id ?? 'unknown'}": missing ${field}.`);
    }
  }

  if (!Array.isArray(document.tags)) {
    throw new Error(`Invalid RAG document "${document.id}": tags must be an array.`);
  }
}

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'rag', 'music-course-seed.json');
  const raw = await readFile(dataPath, 'utf-8');
  const documents = JSON.parse(raw) as RagDocument[];
  const generatedPath = path.join(process.cwd(), 'data', 'rag', 'generated-music-course.jsonl');

  try {
    const generatedRaw = await readFile(generatedPath, 'utf-8');
    const generatedDocuments = generatedRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RagDocument);

    documents.push(...generatedDocuments);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const gpuTipsPath = path.join(process.cwd(), 'data', 'rag', 'gpu-generated-tips.jsonl');

  try {
    const gpuTipsRaw = await readFile(gpuTipsPath, 'utf-8');
    const gpuTipsDocuments = gpuTipsRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RagDocument);

    documents.push(...gpuTipsDocuments);
    console.log(`Loaded ${gpuTipsDocuments.length} GPU-generated tips from ${gpuTipsPath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error('Seed data must be a non-empty JSON array.');
  }

  documents.forEach(validateDocument);

  const points = [];

  for (const document of documents) {
    const embeddingInput = [
      document.title,
      document.category,
      document.level,
      document.content,
      document.tags.join(' '),
    ].join('\n');

    const vector = await embedText(embeddingInput);
    points.push({
      pointId: pointIdFromDocumentId(document.id),
      vector,
      document,
    });

    console.log(`Embedded ${document.id}: ${document.title}`);
  }

  await upsertDocuments(points);
  console.log(`Inserted ${points.length} documents into Qdrant collection.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`RAG ingestion failed: ${message}`);
  process.exitCode = 1;
});
