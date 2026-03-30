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
              className="flex items-center gap-2 bg-[#C9A84C] text-black w-10 h-10 rounded-full font-bold hover:bg-[#E8C96D] transition"
            >
              {getInitial()}
            </button>
            
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#111118] border border-[rgba(245,240,232,0.1)] rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[rgba(245,240,232,0.06)]">
                    <p className="text-white text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-2.5 text-[#7A7570] hover:text-white hover:bg-[rgba(245,240,232,0.05)] transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Миний самбар
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-[rgba(245,240,232,0.05)] transition"
                  >
                    Гарах
                  </button>
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
