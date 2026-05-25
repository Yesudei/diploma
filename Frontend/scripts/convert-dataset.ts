import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RagDocument } from '../src/lib/rag/types';

interface SourceItem {
  category: string;
  problem: string;
  solution: string;
  acoustic_keyword: string;
}

const ENGLISH_TERMS = [
  'EQ',
  'compressor',
  'kick',
  'snare',
  '808',
  'bass',
  'reverb',
  'delay',
  'limiter',
  'sidechain',
  'transient',
  'attack',
  'release',
  'gain',
];

function extractEnglishTerms(text: string): string[] {
  return ENGLISH_TERMS.filter((term) =>
    new RegExp(`\\b${term}\\b`, 'i').test(text)
  ).map((term) => term.toLowerCase());
}

function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
}

function buildId(item: SourceItem, index: number): string {
  const slugified = slugifyCategory(item.category);
  const hash = createHash('sha1')
    .update(`${item.category}-${item.problem}-${index}`)
    .digest('hex')
    .slice(0, 10);
  return `gpu-tip-${String(index + 1).padStart(5, '0')}-${slugified}-${hash}`;
}

function buildTags(item: SourceItem): string[] {
  const combined = `${item.problem} ${item.solution}`;
  const extracted = extractEnglishTerms(combined);

  const raw = [
    item.acoustic_keyword,
    item.category,
    ...extracted,
    'music production',
    'beatmaking',
    'fl studio',
    'mixing',
  ];

  // Deduplicate (case-insensitive key, preserve first occurrence)
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const tag of raw) {
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(tag);
    }
  }

  return deduped.slice(0, 12);
}

function convertItem(item: SourceItem, index: number): RagDocument {
  return {
    id: buildId(item, index),
    title: item.problem,
    category: item.category,
    level: 'intermediate',
    content: `Асуудал: ${item.problem}\n\nШийдэл: ${item.solution}`,
    tags: buildTags(item),
    source: 'local-gpu-generated',
    language: 'mn',
    createdAt: '2026-05-25',
  };
}

async function main() {
  const inputPath = path.join(
    process.cwd(),
    '..',
    'dataset',
    'fl_studio_tips_final_rewritten_mn_unique.json'
  );
  const outputPath = path.join(process.cwd(), 'data', 'rag', 'gpu-generated-tips.jsonl');

  console.log(`Reading source dataset from: ${inputPath}`);
  const raw = await readFile(inputPath, 'utf-8');
  const items = JSON.parse(raw) as SourceItem[];

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Source dataset must be a non-empty JSON array.');
  }

  console.log(`Loaded ${items.length} items from source dataset.`);

  const documents = items.map((item, index) => convertItem(item, index));

  await mkdir(path.dirname(outputPath), { recursive: true });

  const lines = documents.map((doc) => JSON.stringify(doc)).join('\n');
  await writeFile(outputPath, lines, 'utf-8');

  console.log(`Wrote ${documents.length} documents to: ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Dataset conversion failed: ${message}`);
  process.exitCode = 1;
});
