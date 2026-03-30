'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const getInitial = () => {
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[60px] h-20 transition-all ${
        scrolled
          ? 'bg-[rgba(10,10,15,0.88)] backdrop-blur-[20px] border-b border-[rgba(201,168,76,0.10)]'
          : 'bg-transparent'
      }`}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" stroke="#C9A84C" strokeWidth="1.5" />
          <path d="M10 18V10l10 4-10 4z" fill="#C9A84C" />
        </svg>
        <span className="font-display font-bold text-gold text-[19px] tracking-wide">
          melodex
        </span>
      </Link>

      <ul className="flex gap-9 list-none">
        <li>
          <Link href="/courses" className="text-[#7A7570] text-sm font-medium hover:text-cream transition-colors">
            Хичээлүүд
          </Link>
        </li>
        {user && (
          <li>
            <Link href="/dashboard" className="text-[#7A7570] text-sm font-medium hover:text-cream transition-colors">
              Миний самбар
            </Link>
          </li>
        )}
      </ul>

      <div className="flex items-center gap-3.5">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-center bg-[#C9A84C] text-black w-9 h-9 rounded-full font-bold text-sm hover:bg-[#E8C96D] transition shadow-lg"
            >
              {getInitial()}
            </button>
            
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-3 w-56 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#111] border-b border-[#333]">
                    <p className="text-white text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#252525] hover:text-white transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Миний самбар
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-red-400 hover:bg-[#252525] transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Гарах
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-[#7A7570] text-sm font-medium hover:text-cream transition-colors"
            >
              Нэвтрэх
            </Link>
            <Link
              href="/auth/register"
              className="bg-[#C9A84C] text-[#0A0A0F] text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#E8C96D] transition-all hover:-translate-y-px"
            >
              Бүртгүүлэх
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
