'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';

type Source = {
  title: string;
  category: string;
  score: number;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
};

type MusicAiChatProps = {
  variant?: 'page' | 'drawer';
  onClose?: () => void;
};

const suggestions = [
  'kick bolon 808 hoorondoo murulduud bn yaj zasah ve?',
  'FL Studio deer melody yaj hiih ve?',
  'дууны BPM гэж юу вэ?',
  'EQ гэж юу вэ?',
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function MusicAiChat({ variant = 'page', onClose }: MusicAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Сайн уу. Beat making, FL Studio, mixing, mastering гээд хөгжмийн асуултаа асуугаарай.',
    },
  ]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const isDrawer = variant === 'drawer';

  const sendMessage = async (messageText: string) => {
    const content = messageText.trim();
    if (!content || isLoading) return;

    const history = messages
      .filter((message) => message.id !== 'welcome')
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((current) => [...current, { id: makeId(), role: 'user', content }]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const storedApiKey =
        apiKey.trim() ||
        (typeof window !== 'undefined' ? window.localStorage.getItem('music-rag-api-key') ?? '' : '');
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedApiKey ? { 'x-rag-api-key': storedApiKey } : {}),
        },
        body: JSON.stringify({ message: content, history }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setNeedsApiKey(true);
        }

        throw new Error(data.error ?? 'AI chat request failed.');
      }

      if (storedApiKey && typeof window !== 'undefined') {
        window.localStorage.setItem('music-rag-api-key', storedApiKey);
      }

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources ?? [],
        },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Хариу үүсгэх үед алдаа гарлаа.';
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: `Алдаа: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <section
      className={
        isDrawer
          ? 'flex h-[580px] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl'
          : 'flex min-h-[calc(100vh-4rem)] flex-col bg-[#0A0A0F]'
      }
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[rgba(245,240,232,0.02)] px-4">
        <div className="flex items-center gap-2">
          <span className="studio-button flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold">
            M
          </span>
          <div>
            <p className="text-sm font-semibold text-[#F5F0E8]">Studio mentor</p>
            <p className="text-xs text-[#7A7570]">Сургалтын сангаас хариулна</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#7A7570] transition hover:bg-white/10 hover:text-[#F5F0E8]"
            aria-label="Close chat"
          >
            <span aria-hidden="true">x</span>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[min(760px,88%)] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#C9A84C] text-[#0A0A0F]'
                  : 'border border-white/10 bg-[#111118] text-[#F5F0E8] shadow-[0_14px_40px_rgba(0,0,0,0.18)]'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="text-[11px] uppercase tracking-wide text-[#7A7570]">Эх сурвалж</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {message.sources.map((source) => (
                      <span
                        key={`${source.title}-${source.score}`}
                        className="rounded-full border border-[#C9A84C]/20 px-2 py-1 text-[11px] text-[#CFC7BD]"
                      >
                        {source.title} · {source.category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-[#A8A19A]">
              Бодож байна...
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-[#7A7570]">Туршиж үзэх асуултууд</p>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void sendMessage(suggestion)}
                disabled={isLoading}
                className="studio-ghost-button w-full rounded-xl px-3 py-2 text-left text-xs leading-5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 sm:p-4">
        {error && <p className="mb-2 text-xs text-red-300">{error}</p>}
        {needsApiKey && (
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            type="password"
            placeholder="RAG API key"
            className="studio-input mb-2 w-full rounded-xl px-3 py-2 text-sm placeholder:text-[#6F6862]"
          />
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
            rows={isDrawer ? 1 : 2}
            maxLength={2000}
            placeholder="Асуултаа бичнэ үү..."
            className="studio-input min-h-11 flex-1 resize-none rounded-xl px-3 py-2.5 text-sm leading-6 placeholder:text-[#6F6862]"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="studio-button h-11 shrink-0 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Илгээх
          </button>
        </div>
      </form>
    </section>
  );
}
