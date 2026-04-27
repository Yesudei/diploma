'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ChatDrawer = dynamic(() => import('@/components/chat/ChatDrawer'), { ssr: false });

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A84C] text-black shadow-xl hover:bg-[#E8C96D] transition-all hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 4px 20px rgba(201,168,76,0.4)' }}
        aria-label="Open chat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {open && <ChatDrawer onClose={() => setOpen(false)} />}
    </>
  );
}