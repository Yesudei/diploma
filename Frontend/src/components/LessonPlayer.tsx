'use client';
import { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '@/hooks/useAuth';
import { markLessonComplete, updateCourseProgress } from '@/lib/database';
import { Course, Lesson } from '@/lib/types';
import { usePurchases } from '@/hooks/usePurchases';
import Link from 'next/link';

interface Props {
  course: Course;
  currentLesson: Lesson;
  onLessonSelect: (lesson: Lesson) => void;
  completedLessonIds: string[];
}

export default function LessonPlayer({
  course,
  currentLesson,
  onLessonSelect,
  completedLessonIds,
}: Props) {
  const { user } = useAuth();
  const { canWatch } = usePurchases();
  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    if (!user || completed) return;
    setCompleted(true);
    await markLessonComplete(user.id, currentLesson.id, course.id);
    const doneCount = completedLessonIds.length + 1;
    const totalCount = course.curriculum.length;
    const pct = Math.round((doneCount / totalCount) * 100);
    await updateCourseProgress(user.id, course.id, pct, currentLesson.id);
  };

  const isLocked = !currentLesson.free && !canWatch(course.id, course.price);

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 h-full">
      <div>
        {isLocked ? (
          <div className="aspect-video bg-[#111118] rounded-xl flex flex-col items-center justify-center gap-4 border border-[rgba(201,168,76,0.15)]">
            <div className="text-4xl">🔒</div>
            <p className="text-[#F5F0E8] font-semibold">
              Энэ хичээлийг үзэхийн тулд худалдаж авна уу
            </p>
            <Link
              href={`/courses/${course.slug}`}
              className="bg-[#C9A84C] text-[#0A0A0F] font-bold px-8 py-3 rounded-xl hover:bg-[#E8C96D] transition-all"
            >
              ₮5,000 — Авах
            </Link>
          </div>
        ) : (
          <>
            <VideoPlayer
              videoId={currentLesson.youtubeVideoId || course.youtubeVideoId}
              onComplete={handleComplete}
            />
            <div className="mt-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{currentLesson.title}</h2>
              {completed || completedLessonIds.includes(currentLesson.id) ? (
                <span className="text-[#C9A84C] text-sm font-semibold flex items-center gap-1">
                  ✓ Дуусгасан
                </span>
              ) : (
                <button
                  onClick={handleComplete}
                  className="bg-[rgba(201,168,76,0.13)] border border-[rgba(201,168,76,0.25)] text-[#C9A84C] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#C9A84C] hover:text-[#0A0A0F] transition-all"
                >
                  Дуусгасан гэж тэмдэглэх
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-4 overflow-y-auto max-h-[600px]">
        <h3 className="font-semibold text-sm text-[#7A7570] uppercase tracking-wider mb-4">
          Хичээлүүд
        </h3>
        <div className="space-y-1">
          {course.curriculum.map((lesson, i) => {
            const isDone = completedLessonIds.includes(lesson.id);
            const locked = !lesson.free && !canWatch(course.id, course.price);
            const isCurrent = lesson.id === currentLesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => onLessonSelect(lesson)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all text-sm
                  ${isCurrent ? 'bg-[rgba(201,168,76,0.13)] border border-[rgba(201,168,76,0.25)]' : 'hover:bg-[rgba(245,240,232,0.04)]'}
                  ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                  ${isDone ? 'bg-[#C9A84C] text-[#0A0A0F]' : 'bg-[rgba(245,240,232,0.08)] text-[#7A7570]'}`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span
                  className={`flex-1 ${isCurrent ? 'text-[#F5F0E8] font-semibold' : 'text-[#7A7570]'}`}
                >
                  {lesson.title}
                </span>
                {locked && <span className="text-[#7A7570] text-xs">🔒</span>}
                <span className="text-[#7A7570] text-xs">{lesson.durationMinutes}мін</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
