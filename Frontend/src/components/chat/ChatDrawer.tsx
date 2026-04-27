'use client';

import { FormEvent, useRef, useState } from 'react';

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

export default function ChatDrawer({ onClose }: { onClose: () => void }) {
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const sendMessage = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    setMessages((current) => [
      ...current,
      { id: makeId(), role: 'user', text },
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
        { id: makeId(), role: 'assistant', text: `Алдаа: ${message}` },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end pointer-events-none">
      <div
        className="relative flex h-[580px] w-[min(400px,calc(100vw-32px))] flex-col rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[#0A0A0F] shadow-2xl mb-6 mr-6 pointer-events-auto"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[rgba(245,240,232,0.08)] px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C] text-xs font-bold text-black">
              M
            </span>
            <p className="text-sm font-semibold text-[#F5F0E8]">AI Mentor</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#7A7570] hover:bg-[#1a1a1a] hover:text-[#F5F0E8] transition"
            aria-label="Close chat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-[#C9A84C] text-[#0A0A0F]'
                    : 'border border-[rgba(245,240,232,0.08)] bg-[#111118] text-[#F5F0E8]'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-5">{message.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] px-3 py-2.5 text-xs text-[#7A7570]">
                Бодож байна...
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="mb-2 space-y-2">
              <p className="text-xs text-[#7A7570]">Түргэн асуултууд:</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-[rgba(245,240,232,0.06)] px-3 py-2 text-left text-xs text-[#a9a091] transition hover:border-[rgba(201,168,76,0.3)] hover:bg-[rgba(201,168,76,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-[rgba(245,240,232,0.08)] p-3"
        >
          {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Асуулт бичнэ үү..."
              className="flex-1 resize-none rounded-lg border border-[rgba(245,240,232,0.1)] bg-[#111118] px-3 py-2.5 text-sm text-[#F5F0E8] outline-none transition placeholder:text-[#6F6862] focus:border-[rgba(201,168,76,0.35)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] text-black transition hover:bg-[#E8C96D] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}