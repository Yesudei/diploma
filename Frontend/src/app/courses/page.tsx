'use client';
import { Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { courses } from '@/lib/data';
import { fetchDbCourses } from '@/lib/db-courses';
import {
  buildCourseRealtimeChannelName,
  courseRealtimeTables,
  mergeCourses,
} from '@/lib/course-list';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/lib/types';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });
const CourseCard = dynamic(() => import('@/components/cards/CourseCard'), { ssr: false });

const categoryLabel: Record<string, string> = {
  all: 'Бүх ангилал',
  'music-production': 'Music Production',
  'mixing-mastering': 'Mixing & Mastering',
  'sound-design': 'Sound Design',
  'melody-voice': 'Melody & Voice',
  'audio-engineering': 'Audio Engineering',
  beats: 'Beat хийх',
  basics: 'Үндэс',
};

const levelLabel: Record<string, string> = {
  all: 'Бүх түвшин',
  beginner: 'Анхан шат',
  intermediate: 'Дунд шат',
  advanced: 'Ахисан шат',
};

const sortLabel: Record<string, string> = {
  featured: 'Онцлох',
  lessons_desc: 'Хамгийн олон хичээл',
  duration_desc: 'Урт хугацаатай',
  price_asc: 'Үнэ: бага → их',
  price_desc: 'Үнэ: их → бага',
};

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0A0A0F] px-4 py-28 text-center text-[#b8ad93]">
          Курсуудыг ачаалж байна...
        </main>
      }
    >
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [level, setLevel] = useState('all');
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState('featured');
  const [dbCourses, setDbCourses] = useState<Course[]>([]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategory(cat);
    }
  }, [searchParams]);

  const loadCourses = useCallback(async () => {
    try {
      const loadedCourses = await fetchDbCourses();
      setDbCourses(loadedCourses);
    } catch (error) {
      console.error('Could not load database courses:', error);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleCourseRefresh = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        void loadCourses();
      }, 300);
    };

    const channel = supabase.channel(buildCourseRealtimeChannelName('catalog'));
    courseRealtimeTables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleCourseRefresh
      );
    });
    channel.subscribe();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      void supabase.removeChannel(channel);
    };
  }, [loadCourses]);

  const allCourses = useMemo(() => mergeCourses(courses, dbCourses), [dbCourses]);
  const totalLessonsAll = useMemo(
    () =>
      allCourses.reduce(
        (sum, course) => sum + (course.curriculum?.length || course.lessonsCount),
        0
      ),
    [allCourses]
  );

  const totalMinutesAll = useMemo(
    () =>
      allCourses.reduce(
        (sum, course) =>
          sum +
          (course.curriculum?.reduce((lessonSum, l) => lessonSum + l.durationMinutes, 0) || 0),
        0
      ),
    [allCourses]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = allCourses.filter((course) => {
      const byQuery =
        q.length === 0 ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q);
      const byCategory = category === 'all' || course.category === category;
      const byLevel = level === 'all' || course.level === level;
      const byPrice =
        priceType === 'all' || (priceType === 'free' ? course.price === 0 : course.price > 0);

      return byQuery && byCategory && byLevel && byPrice;
    });

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'lessons_desc') {
        return (b.curriculum?.length || b.lessonsCount) - (a.curriculum?.length || a.lessonsCount);
      }
      if (sortBy === 'duration_desc') {
        const aMinutes = a.curriculum?.reduce((sum, l) => sum + l.durationMinutes, 0) || 0;
        const bMinutes = b.curriculum?.reduce((sum, l) => sum + l.durationMinutes, 0) || 0;
        return bMinutes - aMinutes;
      }
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });

    return sorted;
  }, [allCourses, category, level, priceType, query, sortBy]);

  const free = filtered.filter((c) => c.price === 0);
  const paid = filtered.filter((c) => c.price > 0);

  const activeFilterCount =
    Number(category !== 'all') + Number(level !== 'all') + Number(priceType !== 'all');

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#0A0A0F] pb-20 pt-28 sm:pt-32">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-14">
          <section className="studio-panel rounded-[32px] px-6 py-8 sm:px-8 sm:py-10">
            <p className="studio-kicker">Melodex course catalog</p>
            <h1 className="mt-4 font-display text-[clamp(34px,5vw,64px)] font-black leading-[1.02] text-[#F5F0E8]">
              Хичээлүүд
            </h1>
            <p className="mt-4 max-w-[580px] text-sm leading-7 text-[#b8ad93] sm:text-base">
              Одоогийн сургалтын сан rhythm, melody, harmony, arrangement, bass, mix clarity зэрэг
              суурь ур чадварт төвлөрсөн хичээлүүдээс бүрдэнэ. Ангилал, түвшин, хичээлийн тоогоор
              шүүж өөрт тохирох замналаа сонгоорой.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.04)] p-4">
                <p className="font-display text-3xl font-black text-[#F5F0E8]">
                  {allCourses.length}
                </p>
                <p className="mt-1 text-xs text-[#a49368]">Нийт курс</p>
              </div>
              <div className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.04)] p-4">
                <p className="font-display text-3xl font-black text-[#F5F0E8]">{totalLessonsAll}</p>
                <p className="mt-1 text-xs text-[#a49368]">Нийт хичээл</p>
              </div>
              <div className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.04)] p-4">
                <p className="font-display text-3xl font-black text-[#F5F0E8]">
                  {(totalMinutesAll / 60).toFixed(1)}ц
                </p>
                <p className="mt-1 text-xs text-[#a49368]">Нийт контент</p>
              </div>
            </div>
          </section>

          <section className="studio-panel mt-8 rounded-[24px] p-3 sm:mt-10 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-[360px]">
                  <input
                    type="text"
                    placeholder="Хичээл хайх..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="studio-input w-full rounded-xl py-3 pl-11 pr-4 text-sm"
                  />
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7570]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="m21 21-4.35-4.35m0 0a7 7 0 1 0-9.9 0 7 7 0 0 0 9.9 0Z"
                    />
                  </svg>
                </div>
                <p className="text-xs text-[#8e8778] sm:text-sm">
                  {filtered.length} курс олдлоо{' '}
                  {activeFilterCount > 0 ? `(${activeFilterCount} шүүлтүүр)` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="studio-select rounded-xl px-3 py-2.5 text-sm"
                >
                  {Object.entries(categoryLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="studio-select rounded-xl px-3 py-2.5 text-sm"
                >
                  {Object.entries(levelLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as 'all' | 'free' | 'paid')}
                  className="studio-select rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="all">Үнийн бүх төрөл</option>
                  <option value="free">Зөвхөн үнэгүй</option>
                  <option value="paid">Зөвхөн төлбөртэй</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="studio-select rounded-xl px-3 py-2.5 text-sm"
                >
                  {Object.entries(sortLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {filtered.length === 0 ? (
            <section className="studio-panel mt-8 rounded-[24px] p-8 text-center sm:mt-10">
              <p className="font-display text-2xl font-bold text-[#F5F0E8]">
                Хайлтад тохирох курс алга
              </p>
              <p className="mt-3 text-sm text-[#7A7570]">
                Хайлтын үг эсвэл шүүлтүүрээ өөрчлөөд дахин оролдоно уу.
              </p>
            </section>
          ) : priceType === 'all' ? (
            <>
              {free.length > 0 && (
                <section className="mt-10 sm:mt-12">
                  <h2 className="font-display text-2xl font-bold text-[#F5F0E8] sm:text-[28px]">
                    Үнэгүй
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {free.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </div>
                </section>
              )}

              {paid.length > 0 && (
                <section className="mt-12 sm:mt-14">
                  <h2 className="font-display text-2xl font-bold text-[#F5F0E8] sm:text-[28px]">
                    Төлбөртэй
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {paid.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="mt-10 sm:mt-12">
              <h2 className="font-display text-2xl font-bold text-[#F5F0E8] sm:text-[28px]">
                Каталог
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
