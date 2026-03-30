'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Нууц үг таарахгүй байна');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Нууц үг хамгийн багадаа 6 тэмдэгт');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Бүртгэл амжилттай! Нэвтрэх хуудас руу шилжих болно.');
      setTimeout(() => router.push('/auth/login'), 1500);
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
          <h1 className="text-3xl font-bold text-white mb-2">Бүртгүүлэх</h1>
          <p className="text-[#7A7570]">melodex руу бүртгүүлэх</p>
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
              <label className="block text-sm font-medium text-white mb-2">Нэр</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[rgba(245,240,232,0.1)] rounded-lg px-4 py-2 text-white placeholder-[#7A7570] focus:border-[#C9A84C] focus:outline-none"
                placeholder="Таны нэр"
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

            <div>
              <label className="block text-sm font-medium text-white mb-2">Нууц үг давтах</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              {isLoading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
            </button>
          </form>

          <div className="mt-6 text-center text-[#7A7570]">
            Бүртгэлтэй аль хэдийн?{' '}
            <Link href="/auth/login" className="text-[#C9A84C] hover:text-[#E8C96D] font-semibold transition">
              Нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
