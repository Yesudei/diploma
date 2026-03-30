'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // No auto-redirect - let user click

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔑 Logging in with:', formData.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    console.log('📬 Login response:', { data, error });

    if (error) {
      console.error('❌ Login error:', error.message);
      toast.error(error.message);
    } else {
      console.log('✅ Login success, user:', data.user);
      toast.success('Login successful!');
      // Direct page navigation
      window.location.href = '/dashboard';
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FFD700] rounded-lg mb-4">
            <span className="font-bold text-black text-lg">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Нэвтрэх</h1>
          <p className="text-[#B3B3B3]">Хөгжмийн үйл ажиллагаа эхлүүлэхийн тулд нэвтрэ</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:border-[#FFD700] focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:border-[#FFD700] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFD700] text-black py-2 rounded-lg font-semibold hover:bg-[#FFC700] transition disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-[#B3B3B3]">
            Эрх бүртгэлгүй юу?{' '}
            <Link href="/auth/register" className="text-[#FFD700] hover:text-[#FFE033] font-semibold transition">
              Бүртгүүлэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
