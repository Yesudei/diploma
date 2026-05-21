'use client';

import MusicAiChat from '@/components/ai/MusicAiChat';

export default function ChatDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end pointer-events-none">
      <div className="pointer-events-auto mb-6 mr-6">
        <MusicAiChat variant="drawer" onClose={onClose} />
      </div>
    </div>
  );
}
