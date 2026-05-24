'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getIsAdmin } from '@/lib/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    const inspectSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setCheckingSession(false);
        return;
      }

      try {
        const allowed = await getIsAdmin(session.user.id);

        if (!mounted) return;

        if (allowed) {
          router.replace('/admin');
          router.refresh();
          return;
        }

        setFormData((prev) => ({
          ...prev,
          email: session.user.email || prev.email,
        }));
        setSessionNotice('A student account is signed in right now. Use an admin account to continue.');
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Could not check admin access.';
        toast.error(message);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    inspectSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionNotice('');
    toast.success('Signed out. You can now use an admin account.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submittedForm = new FormData(event.currentTarget);
    const email = String(submittedForm.get('email') || '').trim();
    const password = String(submittedForm.get('password') || '');

    setFormData({ email, password });

    if (!email) {
      toast.error('Please enter your admin email.');
      return;
    }

    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    try {
      const userId = data.user?.id || data.session?.user.id;

      if (!userId) {
        throw new Error('Admin session could not be established.');
      }

      const allowed = await getIsAdmin(userId);

      if (!allowed) {
        await supabase.auth.signOut();
        toast.error('This account does not have admin access.');
        setIsLoading(false);
        return;
      }

      toast.success('Admin access granted.');
      router.replace('/admin');
      router.refresh();
    } catch (checkError) {
      const message =
        checkError instanceof Error ? checkError.message : 'Could not verify admin access.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-[#F5F0E8]">
        Checking admin access...
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090909] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute left-[-110px] top-[-40px] h-72 w-72 rounded-full bg-[rgba(201,168,76,0.16)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-80px] right-[-80px] h-80 w-80 rounded-full bg-[rgba(110,140,160,0.14)] blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[rgba(245,240,232,0.08)] bg-[#101015] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden border-r border-[rgba(245,240,232,0.06)] bg-[linear-gradient(180deg,rgba(201,168,76,0.12),rgba(16,16,21,0.98)_38%)] p-10 lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] text-[#C9A84C]">
              A
            </span>
            <span className="font-display text-2xl font-bold text-[#F5F0E8]">melodex</span>
          </Link>

          <p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-[#C9A84C]">
            Admin only
          </p>
          <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] text-[#F5F0E8]">
            Admin access
            <span className="block text-[#d9c38a]">for platform control</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#b8ad93]">
            Use this route only for platform management. Student accounts stay on the public sign-in,
            while admins use a dedicated admin entry point.
          </p>
        </aside>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:hidden">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9A84C] text-lg font-bold text-black">
              A
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A84C]">Admin access</p>
          <h2 className="mt-3 font-display text-3xl font-black text-[#F5F0E8] sm:text-4xl">
            Admin login
          </h2>
          <p className="mt-2 text-sm text-[#8c8578]">
            Sign in with an account that has `profiles.is_admin = true`.
          </p>

          {sessionNotice && (
            <div className="mt-6 rounded-xl border border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.08)] p-4 text-sm text-[#e7d8a9]">
              <p>{sessionNotice}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 rounded-lg border border-[rgba(201,168,76,0.28)] px-3 py-2 text-xs font-semibold text-[#F5F0E8] transition hover:bg-[rgba(201,168,76,0.1)]"
              >
                Sign out current account
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#F5F0E8]">Admin email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-3 text-white placeholder-[#7A7570] outline-none transition focus:border-[#C9A84C]"
                placeholder="admin@domain.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#F5F0E8]">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="w-full rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0A0A0A] px-4 py-3 text-white placeholder-[#7A7570] outline-none transition focus:border-[#C9A84C]"
                placeholder="********"
                autoComplete="current-password"
                required
              />
              <div className="mt-2 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-[#C9A84C] transition hover:text-[#E8C96D]"
                >
                  Нууц үгээ мартсан уу?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#C9A84C] py-3.5 font-semibold text-black transition hover:bg-[#E8C96D] disabled:opacity-50"
            >
              {isLoading ? 'Checking admin access...' : 'Sign in to admin'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#7A7570]">
            Student account?{' '}
            <Link href="/auth/login" className="font-semibold text-[#C9A84C] transition hover:text-[#E8C96D]">
              Use regular login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
