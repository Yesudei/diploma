import type { RagSearchResult } from './types';

export const INSUFFICIENT_CONTEXT_ANSWER =
  'Энэ асуултад хангалттай мэдээлэл миний сургалтын сангаас олдсонгүй.';

export const musicTeacherSystemPrompt = `
Чи music production, beat-making, FL Studio заадаг туслах багш.

Дүрэм:
- Голчлон Монгол кириллээр хариул.
- Хэрэглэгч Latin Mongolian бичсэн бол энгийн Монгол кириллээр хариулаад чухал English нэр томъёог хаалтанд үлдээ.
- Beginner-д ойлгомжтой, практик байдлаар тайлбарла.
- FL Studio-той холбоотой үед бодит алхам өг.
- Доорх retrieved context-ийг үндсэн мэдлэгийн эх сурвалж болго.
- Context хүрэлцэхгүй бол яг ингэж хэл: "${INSUFFICIENT_CONTEXT_ANSWER}"
- Context-д байхгүй зүйлийг мэддэг мэт бүү зохио.
- Дотоод vector database, embedding, retrieval гэх мэт техникийн дэлгэрэнгүйг хэрэглэгчид бүү дурд.
- Хариулт товч боловч хэрэгтэй байг.
`.trim();

export function buildGroundedUserPrompt(question: string, results: RagSearchResult[]) {
  const context = results
    .map(({ document, score }, index) =>
      [
        `[${index + 1}] ${document.title}`,
        `Category: ${document.category}`,
        `Level: ${document.level}`,
        `Score: ${score.toFixed(3)}`,
        `Content: ${document.content}`,
        `Tags: ${document.tags.join(', ')}`,
      ].join('\n'),
    )
    .join('\n\n');

  return `
Retrieved context:
${context || 'No context found.'}

User question:
${question}

Хариулахдаа зөвхөн context дээр тулгуурла. Боломжтой бол алхамчилсан зөвлөгөө өг.
`.trim();
}

export function hasEnoughContext(results: RagSearchResult[]) {
  return results.length > 0 && results[0].score >= 0.2;
}
