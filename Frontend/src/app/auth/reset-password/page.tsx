'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasRecoverySession(Boolean(session));
      setIsCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
      }

      setIsCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success('Password updated. Please log in again.');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute left-[-120px] top-[-60px] h-72 w-72 rounded-full bg-[rgba(201,168,76,0.17)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-110px] right-[-80px] h-72 w-72 rounded-full bg-[rgba(145,95,35,0.15)] blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[rgba(245,240,232,0.08)] bg-[#111118] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-[rgba(245,240,232,0.06)] bg-[radial-gradient(circle_at_20%_10%,rgba(217,195,138,0.15),rgba(17,17,24,0.95)_60%)] p-10 lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] text-[#C9A84C]">
              M
            </span>
            <span className="font-display text-2xl font-bold text-[#C9A84C]">melodex</span>
          </Link>

          <h1 className="mt-12 font-display text-5xl font-black leading-[0.95] text-[#F5F0E8]">
            Set a new
            <span className="block text-[#d9c38a]">password</span>
          </h1>
          <p className="mt-6 max-w-xs text-sm leading-7 text-[#b8ad93]">
            Choose a fresh password to keep your melodex account secure.
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
            Reset password
          </h2>
          <p className="mt-2 text-sm text-[#7A7570]">
            Enter your new password below.
          </p>

          {isCheckingSession ? (
            <div className="mt-8 rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-3 text-sm text-[#b8ad93]">
              Checking reset link...
            </div>
          ) : hasRecoverySession ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#F5F0E8]">
                  New password
                </label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-3 text-white placeholder-[#7A7570] outline-none transition focus:border-[#C9A84C]"
                  placeholder="********"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#F5F0E8]">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-3 text-white placeholder-[#7A7570] outline-none transition focus:border-[#C9A84C]"
                  placeholder="********"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#C9A84C] py-3.5 font-semibold text-black transition hover:bg-[#E8C96D] disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-4 text-sm leading-6 text-[#b8ad93]">
              This reset link is invalid or expired. Request a new password reset email.
            </div>
          )}

          <div className="mt-6 text-center text-sm text-[#7A7570]">
            <Link
              href="/auth/forgot-password"
              className="font-semibold text-[#C9A84C] transition hover:text-[#E8C96D]"
            >
              Request a new link
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
