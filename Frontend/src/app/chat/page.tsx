import Link from 'next/link';
import MusicAiChat from '@/components/ai/MusicAiChat';

export default function ChatPage() {
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

      <div className="mx-auto w-full max-w-6xl">
        <MusicAiChat variant="page" />
      </div>
    </main>
  );
}
