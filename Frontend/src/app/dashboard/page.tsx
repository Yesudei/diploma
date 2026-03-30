'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { courses } from '@/lib/data';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session) {
          setUser(session.user);
        } else {
          window.location.href = '/auth/login';
        }
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const [purchases, setPurchases] = useState<{ course_id: string }[]>([]);
  const [progress, setProgress] = useState<{ course_id: string; progress_percent: number }[]>([]);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => setProfile(data));

    supabase.from('purchased_courses').select('course_id').eq('user_id', user.id)
      .then(({ data }) => setPurchases(data ?? []));

    supabase.from('course_progress').select('*').eq('user_id', user.id)
      .then(({ data }) => setProgress(data ?? []));
  }, [user]);

  const myCourses = courses.filter(
    (c) => c.price === 0 || purchases.some((p) => p.course_id === c.id)
  );

  const getProgress = (courseId: string) =>
    progress.find((p) => p.course_id === courseId)?.progress_percent ?? 0;

  if (loading || !user)
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0F] pt-24 px-[60px] pb-16">
        <div className="mb-10">
          <h1 className="font-display text-[clamp(32px,4vw,52px)] font-bold mb-2">
            Тавтай морил,{' '}
            <span className="text-[#C9A84C]">{profile?.full_name ?? user?.email}</span>
          </h1>
          <p className="text-[#7A7570]">FL Studio-н аяллаа үргэлжлүүлэх</p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-12">
          {[
            { label: 'Авсан хичээл', value: purchases.length + courses.filter((c) => c.price === 0).length },
            { label: 'Дуусгасан', value: progress.filter((p) => p.progress_percent === 100).length },
            { label: 'Нийт хичээл', value: courses.length },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6">
              <div className="font-display text-3xl font-bold text-[#C9A84C] mb-1">{s.value}</div>
              <div className="text-[#7A7570] text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl font-bold mb-6">Миний хичээлүүд</h2>
        <div className="grid grid-cols-3 gap-5">
          {myCourses.map((course) => {
            const pct = getProgress(course.id);
            return (
              <Link key={course.id} href={`/dashboard/watch/${course.id}`}
                className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl overflow-hidden hover:border-[rgba(201,168,76,0.20)] hover:-translate-y-1 transition-all">
                <div className="h-1.5 bg-[#18181F]">
                  <div className="h-full bg-[#C9A84C] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="p-5">
                  <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">{course.category}</div>
                  <h3 className="font-display font-bold mb-3 text-[#F5F0E8]">{course.title}</h3>
                  <div className="flex items-center justify-between text-xs text-[#7A7570]">
                    <span>{pct}% дууссан</span>
                    <span className="text-[#C9A84C] font-semibold">Үргэлжлүүлэх →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
