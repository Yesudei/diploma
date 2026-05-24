'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ChatDrawer = dynamic(() => import('@/components/chat/ChatDrawer'), { ssr: false });

export default function ChatButton() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        className="studio-button chat-pulse fixed bottom-8 right-8 z-[110] grid h-[52px] w-[52px] place-items-center rounded-full p-3"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#0c0c0b" aria-hidden>
          <path d="M12 3C6.9 3 3 6.58 3 11c0 2.19.99 4.17 2.65 5.61L4.5 21l4.72-1.43c.87.2 1.8.31 2.78.31 5.1 0 9-3.58 9-8s-3.9-8.88-9-8.88Zm-4 7.75a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Zm4 0a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Zm4 0a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Z" />
        </svg>
      </button>

      {open && <ChatDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
