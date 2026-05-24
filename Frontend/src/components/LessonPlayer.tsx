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
  lessonDurations?: Record<string, number>;
}

export default function LessonPlayer({
  course,
  currentLesson,
  onLessonSelect,
  completedLessonIds,
  lessonDurations,
}: Props) {
  const { user } = useAuth();
  const { canWatch } = usePurchases();
  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    if (!user || completed) return;
    setCompleted(true);
    await markLessonComplete(user.id, currentLesson.id);
    await updateCourseProgress(user.id, course.id);
  };

  const isLocked = !currentLesson.free && !canWatch(course.id, course.price);
  const hasVideoLesson = Boolean(currentLesson.youtubeId);

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 h-full">
      <div>
        {isLocked ? (
          <div className="aspect-video bg-[#111118] rounded-xl flex flex-col items-center justify-center gap-4 border border-[rgba(201,168,76,0.15)]">
            <div className="w-16 h-16 rounded-full bg-[rgba(201,168,76,0.1)] flex items-center justify-center">
              <div className="w-6 h-8 border-2 border-[#C9A84C] rounded" />
            </div>
            <p className="text-[#F5F0E8] font-semibold">
              Энэ хичээлийг үзэхийн тулд худалдаж авна уу
            </p>
            <Link
              href={`/courses/${course.slug}`}
              className="bg-[#C9A84C] text-[#0A0A0F] font-bold px-8 py-3 rounded-xl hover:bg-[#E8C96D] transition-all"
            >
              ₮5,000 — Худалдаж авах
            </Link>
          </div>
        ) : !hasVideoLesson ? (
          <div className="aspect-video rounded-xl border border-[rgba(201,168,76,0.15)] bg-[linear-gradient(145deg,rgba(201,168,76,0.1),rgba(17,17,24,0.98)_52%)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
              Хичээлийн товч
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#F5F0E8]">
              {currentLesson.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#b8ad93]">
              {currentLesson.summary ||
                'Энэ хичээлийн гол санааг уншаад богино дадлага хийж, ахицаа тэмдэглэж болно.'}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.03)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[#8f8779]">Дадлага</p>
                <p className="mt-2 text-sm leading-6 text-[#F5F0E8]">
                  {currentLesson.exercise ||
                    'Өөрийн хувилбар, sketch, тэмдэглэлээ богино хугацаанд гарга.'}
                </p>
              </div>
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.03)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[#8f8779]">Гол санаа</p>
                <p className="mt-2 text-sm leading-6 text-[#F5F0E8]">
                  {currentLesson.takeaway || 'Энэ хичээлээс нэг тодорхой санаа авч үлдэнэ.'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {completed || completedLessonIds.includes(currentLesson.id) ? (
                <span className="inline-flex items-center rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.12)] px-4 py-3 text-sm font-semibold text-[#C9A84C]">
                  ✓ Дуусгасан
                </span>
              ) : (
                <button
                  onClick={handleComplete}
                  className="border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.13)] px-4 py-3 text-sm font-semibold text-[#C9A84C] rounded-lg hover:bg-[#C9A84C] hover:text-[#0A0A0F] transition-all"
                >
                  Дуусгасан гэж тэмдэглэх
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <VideoPlayer videoId={currentLesson.youtubeId || ''} onComplete={handleComplete} />
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
                {locked && <span className="text-[#7A7570] text-xs">Түгжээтэй</span>}
                <span className="text-[#7A7570] text-xs">
                  {lessonDurations?.[lesson.id] || lesson.durationMinutes} мин
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
