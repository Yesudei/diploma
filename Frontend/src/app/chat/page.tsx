'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Source = {
  id: string;
  title: string;
  category: string;
  sourceName: string;
  sourceType: string;
  citationSafe: boolean;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Source[];
};

const suggestions = [
  'Kick болон bass muddy сонсогдоод байна',
  'FL Studio дээр beat яаж эхлэх вэ?',
  'Master дээр limiter dynamic range алдагдуулаад байна',
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Юу дээр туслах вэ?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const sendMessage = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    setMessages((current) => [
      ...current,
      {
        id: makeId(),
        role: 'user',
        text,
      },
    ]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Chat request failed.');
      }

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          text: data.answer,
          sources: data.sources ?? [],
        },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Хариу үүсгэж чадсангүй.';
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          text: `Алдаа: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-[#F5F0E8]">
      <header className="border-b border-white/10 bg-[#0A0A0F]/95">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C9A84C]/60 text-[#C9A84C]">
              M
            </span>
            <span className="font-display text-lg font-bold text-[#C9A84C]">melodex</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#A8A19A]">
            <Link href="/courses" className="hover:text-[#F5F0E8]">
              Хичээлүүд
            </Link>
            <Link href="/dashboard" className="hover:text-[#F5F0E8]">
              Самбар
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 px-4 py-5 sm:px-6 lg:border-b-0 lg:border-r">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#C9A84C]">AI Mentor</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Music Chat</h1>
            </div>

            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm leading-5 text-[#CFC7BD] transition hover:border-[#C9A84C]/40 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[min(760px,100%)] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#C9A84C] text-[#0A0A0F]'
                      : 'border border-white/10 bg-[#111118] text-[#F5F0E8]'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                </div>
              </article>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-[#A8A19A]">
                  Бодож байна...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 sm:p-6">
            {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
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
                rows={2}
                placeholder="Асуултаа бичнэ үү..."
                className="min-h-[52px] flex-1 resize-none rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#6F6862] focus:border-[#C9A84C]/60"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-lg bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition hover:bg-[#E8C96D] disabled:cursor-not-allowed disabled:opacity-50 sm:w-28"
              >
                Илгээх
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
