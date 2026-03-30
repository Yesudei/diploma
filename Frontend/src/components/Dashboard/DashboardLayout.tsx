'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/audio', label: 'My Audio', icon: '🎵' },
    { href: '/dashboard/analysis', label: 'Analysis', icon: '📈' },
    { href: '/dashboard/melody', label: 'Melody', icon: '🎹' },
    { href: '/chat', label: 'AI Chat', icon: '💬' },
    { href: '/marketplace', label: 'Marketplace', icon: '🏪' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 w-full bg-[#111118]/95 backdrop-blur border-b border-[rgba(245,240,232,0.06)] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#C9A84C] rounded-lg flex items-center justify-center font-bold text-black text-sm">
              M
            </div>
            <span className="font-bold text-lg text-[#F5F0E8] hidden sm:inline">MusicAI</span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-[#7A7570] hover:text-[#C9A84C]"
          >
            ☰
          </button>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-[#111118] rounded-lg border border-[rgba(245,240,232,0.06)]">
              <div className="w-6 h-6 bg-[#C9A84C] rounded-full flex items-center justify-center text-black text-xs font-bold">
                {user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-sm text-[#F5F0E8]">{user.email}</span>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-[#18181F] text-[#F5F0E8] rounded-lg border border-[rgba(245,240,232,0.1)] hover:bg-[#22222D] transition text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-0">
        {/* Sidebar */}
        <aside
          className={`fixed md:relative w-64 h-[calc(100vh-70px)] bg-[#111118] border-r border-[rgba(245,240,232,0.06)] transition-all duration-300 z-30 overflow-y-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(245,240,232,0.06)] transition-colors text-[#7A7570] hover:text-[#C9A84C]"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 md:hidden">
            <button onClick={handleLogout} className="w-full py-2 bg-[#18181F] text-[#F5F0E8] rounded-lg border border-[rgba(245,240,232,0.1)] text-sm">
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
