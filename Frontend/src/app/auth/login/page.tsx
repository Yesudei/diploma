'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Амжилттай нэвтэрлээ!');
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-[#C9A84C] rounded-lg mb-4">
            <span className="font-bold text-black text-lg">M</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Нэвтрэх</h1>
          <p className="text-[#7A7570]">melodex руу нэвтрэх</p>
        </div>

        <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[rgba(245,240,232,0.1)] rounded-lg px-4 py-2 text-white placeholder-[#7A7570] focus:border-[#C9A84C] focus:outline-none"
                placeholder="email@domain.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Нууц үг</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[rgba(245,240,232,0.1)] rounded-lg px-4 py-2 text-white placeholder-[#7A7570] focus:border-[#C9A84C] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C9A84C] text-black py-2 rounded-lg font-semibold hover:bg-[#E8C96D] transition disabled:opacity-50"
            >
              {isLoading ? 'Нэвтрэх...' : 'Нэвтрэх'}
            </button>
          </form>

          <div className="mt-6 text-center text-[#7A7570]">
            Эрх бүртгэлгүй юу?{' '}
            <Link href="/auth/register" className="text-[#C9A84C] hover:text-[#E8C96D] font-semibold transition">
              Бүртгүүлэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
