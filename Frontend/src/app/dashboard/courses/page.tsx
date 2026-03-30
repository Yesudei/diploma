'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPurchasedCourses } from '@/lib/database';
import { courses } from '@/lib/data';
import Link from 'next/link';

export default function DashboardCoursesPage() {
  const { user } = useAuth();
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    getPurchasedCourses(user.id).then(({ data }) => {
      setPurchasedIds(data?.map((p: { course_id: string }) => p.course_id) ?? []);
    });
  }, [user]);

  const myCourses = courses.filter((c) => c.price === 0 || purchasedIds.includes(c.id));

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0F] pt-[120px] pb-20">
        <div className="px-[60px] mb-10">
          <h1 className="font-display text-[clamp(32px,4vw,48px)] font-black leading-[1.1] mb-1.5">
            Миний хичээлүүд
          </h1>
          <p className="text-[#7A7570] text-base">Авсан болон сурсан хичээлүүд</p>
        </div>

        <div className="px-[60px]">
          <div className="grid grid-cols-3 gap-5">
            {myCourses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/watch/${course.id}`}
                className="group bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] overflow-hidden hover:border-[rgba(201,168,76,0.20)] hover:-translate-y-1 transition-all"
              >
                <div className="aspect-video bg-gradient-to-br from-[#1a1208] to-[#0f0d06] flex items-center justify-center text-4xl">
                  {course.category === 'beats' ? '🥁' : course.category === 'mixing' ? '🎚️' : '🎛️'}
                </div>
                <div className="p-5">
                  <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-1">
                    {course.category}
                  </div>
                  <h3 className="font-display text-[16px] font-bold mb-2 group-hover:text-[#E8C96D] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-[#7A7570] text-xs">
                    {course.durationMinutes} мин • {course.curriculum.length} хичээл
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
