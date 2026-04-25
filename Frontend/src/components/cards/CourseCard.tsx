import Link from 'next/link';
import { Course } from '@/lib/types';
import { teachers } from '@/lib/data';

const thumbColors: Record<string, string> = {
  'music-production': 'from-[#1a1208] to-[#0f0d06]',
  'mixing-mastering': 'from-[#1a0d10] to-[#100a0c]',
  'sound-design': 'from-[#100a1a] to-[#0a0810]',
  'melody-voice': 'from-[#0d1520] to-[#080c14]',
  'audio-engineering': 'from-[#132018] to-[#0a120d]',
};

const categoryLabel: Record<string, string> = {
  'music-production': 'Music Production',
  'mixing-mastering': 'Mixing & Mastering',
  'sound-design': 'Sound Design',
  'melody-voice': 'Melody & Voice',
  'audio-engineering': 'Audio Engineering',
};

const levelLabel: Record<string, string> = {
  beginner: 'Анхан шат',
  intermediate: 'Дунд',
  advanced: 'Ахисан',
};

export default function CourseCard({ course }: { course: Course }) {
  const teacher = teachers.find((t) => t.id === course.teacherId);
  const totalLessons = course.curriculum?.length || course.lessonsCount;
  const totalMinutes =
    course.curriculum?.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) || 0;
  const freeLessons = course.curriculum?.filter((lesson) => lesson.free).length || 0;
  const freeRatio = totalLessons > 0 ? (freeLessons / totalLessons) * 100 : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block overflow-hidden rounded-[17px] border border-[rgba(245,240,232,0.06)] bg-[#111118] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(201,168,76,0.20)] hover:shadow-[0_20px_56px_rgba(0,0,0,0.5)]"
    >
      <div
        className={`relative aspect-video flex items-center justify-center bg-gradient-to-br ${
          thumbColors[course.category] || 'from-[#1a1208] to-[#0f0d06]'
        }`}
      >
        <span className="text-2xl font-bold uppercase text-[rgba(255,255,255,0.3)]">
          {course.category.slice(0, 3)}
        </span>
        <span className="absolute left-2.5 top-2.5 rounded-full border border-[rgba(201,168,76,0.20)] bg-[rgba(10,10,15,0.85)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] backdrop-blur-sm">
          {levelLabel[course.level]}
        </span>
        {course.price === 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-[#C9A84C] px-2.5 py-0.5 text-[10px] font-bold text-[#0A0A0F]">
            Үнэгүй
          </span>
        )}
      </div>

      <div className="p-5 pb-6">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-[#C9A84C]">
          {categoryLabel[course.category] || course.category}
        </div>
        <h3 className="mb-2 font-display text-[17px] font-bold leading-snug transition-colors group-hover:text-[#E8C96D]">
          {course.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-[#7A7570]">
          {course.description}
        </p>

        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-lg border border-[rgba(245,240,232,0.06)] bg-[rgba(245,240,232,0.02)] p-2.5">
            <p className="font-semibold text-[#F5F0E8]">{totalLessons}</p>
            <p className="text-[#7A7570]">Lesson</p>
          </div>
          <div className="rounded-lg border border-[rgba(245,240,232,0.06)] bg-[rgba(245,240,232,0.02)] p-2.5">
            <p className="font-semibold text-[#F5F0E8]">{Math.round(totalMinutes / 60)}ц</p>
            <p className="text-[#7A7570]">Нийт цаг</p>
          </div>
          <div className="rounded-lg border border-[rgba(245,240,232,0.06)] bg-[rgba(245,240,232,0.02)] p-2.5">
            <p className="font-semibold text-[#F5F0E8]">{freeLessons}</p>
            <p className="text-[#7A7570]">Free</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#8f8779]">
            <span>Үнэгүй хичээл</span>
            <span>
              {freeLessons}/{totalLessons}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[rgba(245,240,232,0.08)]">
            <div
              className="h-full rounded-full bg-[#C9A84C]"
              style={{ width: `${Math.max(8, freeRatio)}%` }}
            />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-3 border-t border-[rgba(245,240,232,0.05)] pt-3 text-[11.5px] text-[#7A7570]">
          <span>{course.duration}</span>
          {teacher && <span>{teacher.name}</span>}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`font-bold text-[#C9A84C] ${
              course.price === 0 ? 'font-sans text-sm text-[#7A7570]' : 'font-display text-[19px]'
            }`}
          >
            {course.price === 0 ? 'Үнэгүй' : `₮${course.price.toLocaleString()}`}
          </span>
          <button className="rounded-lg border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.13)] px-3.5 py-1.5 text-xs font-bold text-[#C9A84C] transition-all hover:bg-[#C9A84C] hover:text-[#0A0A0F]">
            {course.price === 0 ? 'Судлах →' : 'Авах →'}
          </button>
        </div>
      </div>
    </Link>
  );
}
