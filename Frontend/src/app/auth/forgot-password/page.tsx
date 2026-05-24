'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Nav from '@/components/Nav';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setHasSent(true);
      toast.success('Нууц үг сэргээх холбоос илгээгдлээ.');
    }

    setIsLoading(false);
  };

  return (
    <>
      <Nav />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-10 pt-24 sm:px-6 sm:pt-28">
      <div className="pointer-events-none absolute left-[-120px] top-[-60px] h-72 w-72 rounded-full bg-[rgba(201,168,76,0.17)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-110px] right-[-80px] h-72 w-72 rounded-full bg-[rgba(145,95,35,0.15)] blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[rgba(245,240,232,0.08)] bg-[#111118] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-[rgba(245,240,232,0.06)] bg-[radial-gradient(circle_at_20%_10%,rgba(217,195,138,0.15),rgba(17,17,24,0.95)_60%)] p-10 lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] text-[#C9A84C]">
              M
            </span>
            <span className="font-display text-2xl font-bold text-[#C9A84C]">Melodex</span>
          </Link>

          <h1 className="mt-12 font-display text-5xl font-black leading-[0.95] text-[#F5F0E8]">
            Бүртгэлээ
            <span className="block text-[#d9c38a]">сэргээх</span>
          </h1>
          <p className="mt-6 max-w-xs text-sm leading-7 text-[#b8ad93]">
            Нууц үг сэргээх аюулгүй холбоос аваад хичээлээ үргэлжлүүлээрэй.
          </p>
        </aside>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:hidden">
            <Link
              href="/"
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9A84C]"
            >
              <span className="text-lg font-bold text-black">M</span>
            </Link>
          </div>

          <h2 className="font-display text-3xl font-black text-[#F5F0E8] sm:text-4xl">
            Нууц үг мартсан
          </h2>
          <p className="mt-2 text-sm text-[#7A7570]">
            Нууц үг сэргээх холбоос авахын тулд имэйл хаягаа оруулна уу.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#F5F0E8]">Имэйл</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-3 text-white placeholder-[#7A7570] outline-none transition focus:border-[#C9A84C]"
                placeholder="email@domain.com"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#C9A84C] py-3.5 font-semibold text-black transition hover:bg-[#E8C96D] disabled:opacity-50"
            >
              {isLoading ? 'Илгээж байна...' : 'Сэргээх холбоос илгээх'}
            </button>
          </form>

          {hasSent && (
            <div className="mt-5 rounded-xl border border-[rgba(201,168,76,0.28)] bg-[rgba(201,168,76,0.08)] px-4 py-3 text-sm leading-6 text-[#d9c38a]">
              Имэйлээ шалгана уу. Холбоос ирэхэд хэдэн хором шаардагдаж магадгүй.
            </div>
          )}

          <div className="mt-6 text-center text-sm text-[#7A7570]">
            Нууц үгээ санасан уу?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-[#C9A84C] transition hover:text-[#E8C96D]"
            >
              Нэвтрэх рүү буцах
            </Link>
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
