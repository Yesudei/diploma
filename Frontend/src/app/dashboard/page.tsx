'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { courses } from '@/lib/data';
import Link from 'next/link';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        router.push('/auth/login');
      }
      setLoading(false);
    });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0A0A0F] pt-24 px-[60px] pb-16">
        <div className="mb-10">
          <h1 className="font-display text-[clamp(32px,4vw,52px)] font-bold mb-2">
            Тавтай морил
          </h1>
          <p className="text-[#7A7570]">FL Studio-н хичээлүүд</p>
        </div>

        <h2 className="font-display text-2xl font-bold mb-6">Хичээлүүд</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Link 
              key={course.id} 
              href={`/courses/${course.slug}`}
              className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-5 hover:border-[rgba(201,168,76,0.20)] hover:-translate-y-1 transition-all"
            >
              <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
                {course.category}
              </div>
              <h3 className="font-display font-bold mb-3 text-[#F5F0E8]">{course.title}</h3>
              <div className="flex items-center justify-between text-xs text-[#7A7570]">
                <span>{course.price === 0 ? 'Үнэгүй' : `₮${course.price.toLocaleString()}`}</span>
                <span className="text-[#C9A84C] font-semibold">Үзэх →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
