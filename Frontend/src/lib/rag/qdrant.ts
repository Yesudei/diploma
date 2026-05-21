import { QdrantClient } from '@qdrant/js-client-rest';
import type { RagDocument, RagSearchResult } from './types';

function getEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

export function getCollectionName() {
  return getEnv('QDRANT_COLLECTION', 'music_lessons_rag');
}

export function getQdrantClient() {
  return new QdrantClient({
    url: getEnv('QDRANT_URL', 'http://localhost:6333'),
    timeout: 30_000,
  });
}

export async function ensureCollection(vectorSize: number) {
  const client = getQdrantClient();
  const collectionName = getCollectionName();
  const exists = await client.collectionExists(collectionName);

  if (!exists.exists) {
    await client.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });
  }

  return collectionName;
}

export async function searchSimilarDocuments(vector: number[], limit: number): Promise<RagSearchResult[]> {
  const client = getQdrantClient();
  const collectionName = await ensureCollection(vector.length);
  const results = await client.search(collectionName, {
    vector,
    limit,
    with_payload: true,
  });

  return results.map((result) => ({
    document: result.payload as RagDocument,
    score: result.score ?? 0,
  }));
}

export async function upsertDocuments(
  points: Array<{ pointId: string; vector: number[]; document: RagDocument }>,
) {
  const client = getQdrantClient();
  const collectionName = await ensureCollection(points[0]?.vector.length ?? 1);

  await client.upsert(collectionName, {
    wait: true,
    points: points.map((point) => ({
      id: point.pointId,
      vector: point.vector,
      payload: point.document,
    })),
  });
}
