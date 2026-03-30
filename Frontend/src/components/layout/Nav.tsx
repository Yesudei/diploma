'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
        {[
          { href: '/courses', label: 'Хичээлүүд' },
          { href: '/pricing', label: 'Үнэ' },
          { href: '/teachers', label: 'Багш нар' },
          { href: '/contact', label: 'Холбоо барих' },
        ].map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[#7A7570] text-sm font-medium hover:text-cream transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3.5">
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
      </div>
    </nav>
  );
}
