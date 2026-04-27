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
      className="fixed left-0 top-0 z-[100] flex h-[72px] w-full items-center justify-between px-[60px]"
      style={{
        background: 'linear-gradient(to bottom, rgba(12,12,11,0.95) 60%, transparent)',
        borderBottom: '0.5px solid rgba(201,169,78,0.08)',
      }}
    >
      <Link href="/" className="flex items-center gap-3">
        <span className="nav-logo-icon" aria-hidden />
        <span
          className="text-[22px] uppercase text-[var(--gold)]"
          style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.12em' }}
        >
          MELODEX
        </span>
      </Link>

      <ul className="flex items-center gap-8">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="transition-colors duration-200 hover:text-[var(--gold)]"
              style={{
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
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
          className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-medium"
          style={{ background: 'var(--gold)', color: '#0c0c0b', cursor: 'pointer' }}
        >
          {userInitial}
        </Link>
      ) : (
        <Link
          href="/auth/login"
          aria-label="Нэвтрэх"
          className="inline-flex items-center justify-center px-4 py-2 text-[13px] font-medium uppercase"
          style={{ background: 'var(--gold)', color: '#0c0c0b', letterSpacing: '0.08em' }}
        >
          Нэвтрэх
        </Link>
      )}
    </nav>
  );
}
