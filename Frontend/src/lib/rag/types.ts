export type RagDocument = {
  id: string;
  title: string;
  category: string;
  level: string;
  content: string;
  tags: string[];
  source: string;
  language: string;
  createdAt: string;
};

export type RagSource = {
  title: string;
  category: string;
  score: number;
};

export type RagSearchResult = {
  document: RagDocument;
  score: number;
};

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiChatRequest = {
  message?: string;
  history?: ChatHistoryMessage[];
};
