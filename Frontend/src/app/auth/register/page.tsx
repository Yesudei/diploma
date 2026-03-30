'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        toast.success('Account created! Please check your email to verify.');
      } else {
        toast.success('Account created successfully!');
      }
      
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FFD700] rounded-lg mb-4">
            <span className="font-bold text-black text-lg">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Бүртгүүлэх</h1>
          <p className="text-[#B3B3B3]">Хөгжмийн нийгэмлэгт нэгдэх</p>
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
              <label className="block text-sm font-medium text-white mb-2">Full Name (Optional)</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:border-[#FFD700] focus:outline-none"
                placeholder="John Doe"
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

            <div>
              <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-[#B3B3B3]">
            Бүртгэлтэй аль хэдийн?{' '}
            <Link href="/auth/login" className="text-[#FFD700] hover:text-[#FFE033] font-semibold transition">
              Нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
