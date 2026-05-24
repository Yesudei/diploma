'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: 'Хичээлүүд', href: '/courses' },
  { label: 'Төлөвлөгөө', href: '/plans' },
  { label: 'Миний самбар', href: '/dashboard' },
];

export default function Nav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userInitial = useMemo(() => {
    if (!user) return '';
    const rawName =
      (typeof user.user_metadata?.username === 'string' && user.user_metadata.username) ||
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      user.email ||
      '';
    return rawName.trim().charAt(0).toUpperCase() || 'U';
  }, [user]);

  return (
    <nav
      className="fixed left-0 top-0 z-[100] flex h-[76px] w-full items-center justify-center px-4 sm:px-6 lg:px-10"
    >
      <div className="studio-panel flex h-14 w-full max-w-[1320px] items-center justify-between rounded-full px-3 pl-4 sm:px-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="nav-logo-icon transition-transform duration-200 group-hover:scale-105" aria-hidden />
          <span
            className="text-[22px] uppercase text-[var(--gold)]"
            style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.12em' }}
          >
            MELODEX
          </span>
        </Link>

        <ul className="hidden items-center rounded-full border border-[rgba(245,240,232,0.08)] bg-[rgba(8,9,12,0.48)] px-2 py-1 md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors duration-200 hover:bg-[rgba(201,169,78,0.08)] hover:text-[var(--gold-light)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {user ? (
          <Link
            href="/dashboard"
            aria-label="Миний самбар"
            className="studio-button grid h-10 w-10 place-items-center rounded-full text-[13px] font-bold"
          >
            {userInitial}
          </Link>
        ) : (
          <Link
            href="/auth/login"
            aria-label="Нэвтрэх"
            className="studio-button inline-flex items-center justify-center rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em]"
          >
            Нэвтрэх
          </Link>
        )}
      </div>
    </nav>
  );
}
