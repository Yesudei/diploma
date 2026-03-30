'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCompletedLessons } from '@/lib/database';
import { courses } from '@/lib/data';
import { Lesson } from '@/lib/types';
import LessonPlayer from '@/components/LessonPlayer';
import Nav from '@/components/layout/Nav';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function WatchPage({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id);
  const { user } = useAuth();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!course) return;
    setCurrentLesson(course.curriculum[0]);
  }, [course]);

  useEffect(() => {
    if (!user || !course) return;
    getCompletedLessons(user.id, course.id).then(({ data }) => {
      setCompletedLessonIds(data?.map((l: { lesson_id: string }) => l.lesson_id) ?? []);
    });
  }, [user, course]);

  if (!course) return notFound();
  if (!currentLesson)
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );

  return (
    <>
      <Nav />
      <main className="pt-[100px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-6">
          <Link
            href="/dashboard/courses"
            className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors"
          >
            ← Миний хичээлүүд
          </Link>
        </div>

        <div className="px-[60px]">
          <div className="mb-6">
            <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-1">
              {course.category}
            </div>
            <h1 className="font-display text-[28px] font-black">{course.title}</h1>
          </div>

          <LessonPlayer
            course={course}
            currentLesson={currentLesson}
            onLessonSelect={setCurrentLesson}
            completedLessonIds={completedLessonIds}
          />
        </div>
      </main>
    </>
  );
}
